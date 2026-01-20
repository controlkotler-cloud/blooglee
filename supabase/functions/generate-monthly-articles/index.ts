import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PORTAL_URL = "https://id-preview--7642327a-37a5-4883-a473-7870867f7567.lovable.app";
const NOTIFICATION_EMAIL = "control@mkpro.es";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

interface GenerationResult {
  farmaciaName: string;
  success: boolean;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== GENERATE MONTHLY ARTICLES STARTED ===");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Calculate current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    console.log(`Processing articles for ${MONTH_NAMES[currentMonth - 1]} ${currentYear}`);

    // Get all farmacias
    const { data: farmacias, error: farmaciasError } = await supabase
      .from("farmacias")
      .select("*")
      .order("created_at", { ascending: true });

    if (farmaciasError) {
      throw new Error(`Error fetching farmacias: ${farmaciasError.message}`);
    }

    console.log(`Found ${farmacias?.length || 0} farmacias`);

    // Get existing articles for this month
    const { data: existingArticles, error: articlesError } = await supabase
      .from("articulos")
      .select("farmacia_id")
      .eq("month", currentMonth)
      .eq("year", currentYear);

    if (articlesError) {
      throw new Error(`Error fetching existing articles: ${articlesError.message}`);
    }

    const existingFarmaciaIds = new Set(existingArticles?.map(a => a.farmacia_id) || []);
    const farmaciasToProcess = farmacias?.filter(f => !existingFarmaciaIds.has(f.id)) || [];

    console.log(`${existingFarmaciaIds.size} articles already exist, ${farmaciasToProcess.length} to generate`);

    if (farmaciasToProcess.length === 0) {
      console.log("No articles to generate, sending notification email");
      
      await resend.emails.send({
        from: "PharmaBlog Manager <onboarding@resend.dev>",
        to: [NOTIFICATION_EMAIL],
        subject: `Posts de ${MONTH_NAMES[currentMonth - 1]} ${currentYear} - Sin cambios`,
        html: `
          <h1>PharmaBlog Manager</h1>
          <p>Hola,</p>
          <p>Se ha ejecutado la generación automática de artículos para <strong>${MONTH_NAMES[currentMonth - 1]} ${currentYear}</strong>.</p>
          <h2>Resumen</h2>
          <ul>
            <li><strong>Farmacias totales:</strong> ${farmacias?.length || 0}</li>
            <li><strong>Artículos ya existentes:</strong> ${existingFarmaciaIds.size}</li>
            <li><strong>Artículos generados:</strong> 0</li>
          </ul>
          <p>Todos los artículos ya estaban generados. No se requiere acción.</p>
          <p><a href="${PORTAL_URL}">Acceder al portal</a></p>
          <p>Saludos,<br>PharmaBlog Manager</p>
        `,
      });

      return new Response(
        JSON.stringify({ 
          message: "No articles to generate", 
          existing: existingFarmaciaIds.size 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate articles for each farmacia
    const results: GenerationResult[] = [];
    const generateArticleUrl = `${supabaseUrl}/functions/v1/generate-article`;

    for (let i = 0; i < farmaciasToProcess.length; i++) {
      const farmacia = farmaciasToProcess[i];
      console.log(`[${i + 1}/${farmaciasToProcess.length}] Generating article for ${farmacia.name}`);

      try {
        const response = await fetch(generateArticleUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            pharmacy: {
              id: farmacia.id,
              name: farmacia.name,
              location: farmacia.location,
              languages: farmacia.languages,
            },
            month: currentMonth,
            year: currentYear,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`✓ Generated article for ${farmacia.name}: ${result.topic}`);
        
        results.push({
          farmaciaName: farmacia.name,
          success: true,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Error generating article for ${farmacia.name}:`, error);
        results.push({
          farmaciaName: farmacia.name,
          success: false,
          error: errorMessage,
        });
      }

      // Delay between requests to avoid rate limiting (3 seconds)
      if (i < farmaciasToProcess.length - 1) {
        console.log("Waiting 3 seconds before next generation...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Calculate summary
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const errorDetails = results
      .filter(r => !r.success)
      .map(r => `<li><strong>${r.farmaciaName}:</strong> ${r.error}</li>`)
      .join("");

    console.log(`Generation complete: ${successCount} success, ${errorCount} errors`);

    // Send notification email
    const emailResult = await resend.emails.send({
      from: "PharmaBlog Manager <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject: `Posts de ${MONTH_NAMES[currentMonth - 1]} ${currentYear} generados${errorCount > 0 ? ` (${errorCount} errores)` : ""}`,
      html: `
        <h1>PharmaBlog Manager</h1>
        <p>Hola,</p>
        <p>Se han generado automáticamente los artículos de blog para el mes de <strong>${MONTH_NAMES[currentMonth - 1]} ${currentYear}</strong>.</p>
        
        <h2>Resumen</h2>
        <ul>
          <li><strong>Farmacias procesadas:</strong> ${farmaciasToProcess.length}</li>
          <li><strong>Artículos generados correctamente:</strong> ${successCount}</li>
          <li><strong>Errores:</strong> ${errorCount}</li>
        </ul>
        
        ${errorCount > 0 ? `
        <h2>Detalle de errores</h2>
        <ul>${errorDetails}</ul>
        ` : ""}
        
        <p>Accede al portal para revisar y publicar los artículos:</p>
        <p><a href="${PORTAL_URL}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Acceder al portal</a></p>
        
        <p>Saludos,<br>PharmaBlog Manager</p>
      `,
    });

    console.log("Notification email sent:", emailResult);
    console.log("=== GENERATE MONTHLY ARTICLES COMPLETED ===");

    return new Response(
      JSON.stringify({
        message: "Generation complete",
        month: currentMonth,
        year: currentYear,
        processed: farmaciasToProcess.length,
        success: successCount,
        errors: errorCount,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Fatal error in generate-monthly-articles:", error);
    
    // Try to send error notification
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "PharmaBlog Manager <onboarding@resend.dev>",
          to: [NOTIFICATION_EMAIL],
          subject: "ERROR en generación automática de posts",
          html: `
            <h1>PharmaBlog Manager - Error</h1>
            <p>Ha ocurrido un error durante la generación automática de artículos:</p>
            <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px;">${errorMessage}</pre>
            <p>Por favor, revisa el portal y genera los artículos manualmente si es necesario:</p>
            <p><a href="${PORTAL_URL}">Acceder al portal</a></p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send error notification:", emailError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
