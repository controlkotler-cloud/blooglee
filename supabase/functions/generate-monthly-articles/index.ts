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

interface SeasonalTopic {
  tema: string;
  keywords: string[];
  pexels_query: string;
}

// Seasonal topics por mes (copia de src/lib/seasonalTopics.ts)
const SEASONAL_TOPICS: Record<number, SeasonalTopic[]> = {
  1: [
    { tema: "Propósitos saludables de año nuevo", keywords: ["hábitos saludables", "vitaminas", "detox", "ejercicio"], pexels_query: "morning wellness nature fresh start" },
    { tema: "Combatir la gripe y resfriados de invierno", keywords: ["sistema inmune", "vitamina C", "propóleo"], pexels_query: "herbal tea warm cozy winter comfort" },
    { tema: "Cuidado de la piel en invierno", keywords: ["hidratación", "cremas", "labios agrietados"], pexels_query: "spa beauty natural skincare woman face" },
    { tema: "Blue Monday: cuidar la salud mental", keywords: ["ánimo", "vitamina D", "bienestar emocional"], pexels_query: "calm meditation peaceful mindfulness nature" },
    { tema: "Recuperarse de los excesos navideños", keywords: ["digestión", "hígado", "probióticos"], pexels_query: "healthy food vegetables salad nutrition" },
  ],
  2: [
    { tema: "Alergias de invierno y calefacción", keywords: ["humidificadores", "piel seca", "alergias ácaros"], pexels_query: "cozy home wellness comfortable living room" },
    { tema: "San Valentín: cosmética y cuidado personal", keywords: ["perfumes", "cosmética", "regalo pareja"], pexels_query: "beauty spa romantic self care woman" },
    { tema: "Preparar el cuerpo para la primavera", keywords: ["depuración", "energía", "complementos"], pexels_query: "spring nature fresh flowers wellness" },
    { tema: "Salud cardiovascular", keywords: ["colesterol", "omega 3", "corazón sano"], pexels_query: "heart healthy walking nature outdoor" },
    { tema: "Bienestar digestivo en invierno", keywords: ["probióticos", "fibra", "digestión"], pexels_query: "healthy breakfast yogurt fruit nutrition" },
  ],
  3: [
    { tema: "Alergias primaverales: preparación y prevención", keywords: ["antihistamínicos", "polen", "conjuntivitis"], pexels_query: "spring garden flowers peaceful nature" },
    { tema: "Cambio de hora y su efecto en el sueño", keywords: ["melatonina", "insomnio", "ritmo circadiano"], pexels_query: "peaceful sleep bedroom rest calm cozy" },
    { tema: "Detox primaveral", keywords: ["depurativo", "hígado", "drenante"], pexels_query: "green smoothie healthy detox natural" },
    { tema: "Astenia primaveral: combatir el cansancio", keywords: ["jalea real", "ginseng", "energía"], pexels_query: "morning energy vitality outdoor nature" },
    { tema: "Cuidado de la piel al aire libre", keywords: ["protección solar", "hidratación", "exposición"], pexels_query: "outdoor nature spring woman wellness" },
  ],
  4: [
    { tema: "Alergias en plena primavera", keywords: ["polen", "rinitis", "colirios"], pexels_query: "spring nature outdoor peaceful garden" },
    { tema: "Preparar la piel para el sol", keywords: ["protección solar", "vitamina E", "antioxidantes"], pexels_query: "sunlight nature beauty woman outdoor" },
    { tema: "Semana Santa: botiquín de viaje", keywords: ["primeros auxilios", "medicamentos viaje"], pexels_query: "travel nature adventure wellness outdoor" },
    { tema: "Salud digestiva y probióticos", keywords: ["flora intestinal", "digestión", "prebióticos"], pexels_query: "healthy food yogurt nutrition breakfast" },
    { tema: "Fitness y tonificación primaveral", keywords: ["ejercicio", "músculos", "definición"], pexels_query: "fitness outdoor spring exercise nature" },
  ],
  5: [
    { tema: "Día de la madre: belleza y bienestar", keywords: ["cosmética", "regalo", "antiedad"], pexels_query: "beauty spa wellness relaxation woman care" },
    { tema: "Operación bikini saludable", keywords: ["nutrición", "complementos", "ejercicio"], pexels_query: "healthy lifestyle walking beach wellness" },
    { tema: "Protección solar: guía completa", keywords: ["SPF", "fotoprotección", "melanoma"], pexels_query: "sunlight beach summer protection nature" },
    { tema: "Piernas cansadas con el calor", keywords: ["circulación", "varices", "medias compresión"], pexels_query: "legs wellness massage relaxation woman" },
    { tema: "Exámenes: concentración y memoria", keywords: ["omega 3", "vitaminas B", "estrés estudiantes"], pexels_query: "study focus calm concentration desk" },
  ],
  6: [
    { tema: "Protección solar para toda la familia", keywords: ["niños sol", "after sun", "quemaduras"], pexels_query: "family outdoor summer beach happy" },
    { tema: "Botiquín de verano", keywords: ["picaduras", "diarrea viajero", "mareo"], pexels_query: "summer travel beach vacation wellness" },
    { tema: "Hidratación en verano", keywords: ["sales minerales", "agua", "electrolitos"], pexels_query: "water hydration fresh summer healthy" },
    { tema: "Cuidado del cabello en verano", keywords: ["cloro", "sal", "mascarillas capilares"], pexels_query: "hair care summer beach woman beauty" },
    { tema: "Hongos y piscinas: prevención", keywords: ["pie de atleta", "antifúngicos"], pexels_query: "swimming pool summer wellness healthy" },
  ],
  7: [
    { tema: "Viajes y salud: preparación completa", keywords: ["vacunas", "botiquín viaje", "jet lag"], pexels_query: "travel vacation adventure nature beautiful" },
    { tema: "Golpes de calor: prevención y actuación", keywords: ["hidratación", "ancianos", "niños"], pexels_query: "summer cool water hydration refresh" },
    { tema: "Cuidado de la piel tras el sol", keywords: ["after sun", "aloe vera", "hidratación"], pexels_query: "aloe vera skincare natural plant care" },
    { tema: "Alimentación saludable en verano", keywords: ["frutas", "ensaladas", "digestiones"], pexels_query: "summer fruits salad healthy colorful" },
    { tema: "Piernas ligeras en verano", keywords: ["retención líquidos", "calor", "circulación"], pexels_query: "legs wellness summer beach woman" },
  ],
  8: [
    { tema: "Mantener la rutina saludable en vacaciones", keywords: ["ejercicio verano", "alimentación"], pexels_query: "vacation wellness healthy lifestyle outdoor" },
    { tema: "Picaduras de insectos: prevención y tratamiento", keywords: ["mosquitos", "medusas", "repelentes"], pexels_query: "summer outdoor nature peaceful garden" },
    { tema: "Preparar la vuelta al cole", keywords: ["vitaminas niños", "piojos", "revisiones"], pexels_query: "children happy school books backpack" },
    { tema: "Recuperar la piel tras vacaciones", keywords: ["hidratación", "reparación", "manchas"], pexels_query: "skincare beauty spa facial treatment" },
    { tema: "Retomar hábitos saludables post-vacaciones", keywords: ["rutinas", "alimentación", "ejercicio"], pexels_query: "morning routine healthy lifestyle wellness" },
  ],
  9: [
    { tema: "Vuelta al cole saludable", keywords: ["vitaminas", "sistema inmune", "meriendas"], pexels_query: "school children happy backpack outdoor" },
    { tema: "Estrés de la vuelta a la rutina", keywords: ["adaptógenos", "sueño", "ansiedad"], pexels_query: "calm relaxation nature peaceful morning" },
    { tema: "Caída del cabello otoñal", keywords: ["biotina", "champús fortalecedores"], pexels_query: "hair beauty autumn woman natural" },
    { tema: "Preparar las defensas para el otoño", keywords: ["propóleo", "equinácea", "vitamina C"], pexels_query: "autumn nature wellness healthy outdoor" },
    { tema: "Cuidado de la piel tras el verano", keywords: ["reparación", "manchas", "hidratación"], pexels_query: "skincare beauty autumn woman face" },
  ],
  10: [
    { tema: "Prevención de resfriados", keywords: ["vitamina C", "equinácea", "zinc"], pexels_query: "autumn cozy tea warm wellness" },
    { tema: "Cambio de hora otoñal y sueño", keywords: ["melatonina", "ritmo circadiano", "descanso"], pexels_query: "cozy bedroom sleep autumn peaceful" },
    { tema: "Cuidado de la piel en otoño", keywords: ["hidratación", "antioxidantes", "vitaminas"], pexels_query: "autumn beauty skincare woman nature" },
    { tema: "Fortalecimiento del sistema inmune", keywords: ["defensas", "propóleo", "hongos medicinales"], pexels_query: "healthy food autumn vegetables nutrition" },
    { tema: "Halloween y maquillaje seguro", keywords: ["desmaquillantes", "piel sensible", "alergias"], pexels_query: "makeup beauty creative woman face" },
  ],
  11: [
    { tema: "Preparación para el invierno", keywords: ["vitaminas", "defensas", "nutrición"], pexels_query: "autumn winter transition nature cozy" },
    { tema: "Día del hombre: cuidado masculino", keywords: ["afeitado", "cosmética masculina"], pexels_query: "man grooming wellness care handsome" },
    { tema: "Alergia a ácaros en otoño", keywords: ["humedad", "purificadores", "antialérgicos"], pexels_query: "cozy home clean wellness living" },
    { tema: "Black Friday: cuidado con las compras impulsivas", keywords: ["cosmética", "ofertas", "calidad"], pexels_query: "shopping beauty products wellness care" },
    { tema: "Cuidado articular con el frío", keywords: ["colágeno", "glucosamina", "movilidad"], pexels_query: "walking nature autumn wellness outdoor" },
  ],
  12: [
    { tema: "Cuidados de la piel en invierno", keywords: ["hidratación", "labios", "manos"], pexels_query: "winter skincare cozy woman beauty" },
    { tema: "Navidad saludable: evitar excesos", keywords: ["digestión", "probióticos", "moderación"], pexels_query: "healthy food christmas festive nutrition" },
    { tema: "Regalos de salud y bienestar", keywords: ["cosmética natural", "sets regalo", "bienestar"], pexels_query: "gift christmas wellness beauty care" },
    { tema: "Sistema inmune en Navidades", keywords: ["vitaminas", "resfriados", "defensas"], pexels_query: "winter wellness cozy healthy indoor" },
    { tema: "Fin de año: propósitos de salud", keywords: ["hábitos", "planificación", "bienestar"], pexels_query: "new year wellness healthy lifestyle" },
  ],
};

// Función para obtener un tema aleatorio del mes
function getRandomTopic(month: number, usedTopics: string[]): SeasonalTopic | null {
  const monthTopics = SEASONAL_TOPICS[month] || SEASONAL_TOPICS[1];
  const availableTopics = monthTopics.filter(t => !usedTopics.includes(t.tema));
  
  if (availableTopics.length === 0) {
    // Si ya se usaron todos, seleccionar cualquiera aleatorio
    return monthTopics[Math.floor(Math.random() * monthTopics.length)];
  }
  
  return availableTopics[Math.floor(Math.random() * availableTopics.length)];
}

interface WordPressPublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}

interface GenerationResult {
  farmaciaName: string;
  success: boolean;
  error?: string;
  wpSpanish?: WordPressPublishResult;
  wpCatalan?: WordPressPublishResult;
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
    const usedTopics: string[] = [];

    for (let i = 0; i < farmaciasToProcess.length; i++) {
      const farmacia = farmaciasToProcess[i];
      
      // Seleccionar un tema aleatorio del mes que no se haya usado aún
      const topic = getRandomTopic(currentMonth, usedTopics);
      if (!topic) {
        console.error(`No topic found for month ${currentMonth}`);
        continue;
      }
      usedTopics.push(topic.tema);
      
      console.log(`[${i + 1}/${farmaciasToProcess.length}] Generating article for ${farmacia.name} - Topic: ${topic.tema}`);

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
            topic: {
              tema: topic.tema,
              keywords: topic.keywords,
              pexels_query: topic.pexels_query,
            },
            month: currentMonth,
            year: currentYear,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const generatedData = await response.json();
        console.log(`✓ Generated article content for ${farmacia.name}`);
        
        // Guardar el artículo en la base de datos
        const { error: insertError } = await supabase
          .from("articulos")
          .insert({
            farmacia_id: farmacia.id,
            month: currentMonth,
            year: currentYear,
            topic: topic.tema,
            content_spanish: generatedData.content?.spanish || null,
            content_catalan: generatedData.content?.catalan || null,
            image_url: generatedData.image?.url || null,
            image_photographer: generatedData.image?.photographer || null,
            image_photographer_url: generatedData.image?.photographer_url || null,
            pexels_query: generatedData.pexels_query || topic.pexels_query,
          });

        if (insertError) {
          throw new Error(`Error saving article: ${insertError.message}`);
        }

        console.log(`✓ Saved article for ${farmacia.name}: ${topic.tema}`);
        
        // ========== PUBLICACIÓN AUTOMÁTICA A WORDPRESS ==========
        let wpSpanish: WordPressPublishResult | undefined;
        let wpCatalan: WordPressPublishResult | undefined;
        
        // Verificar si la farmacia tiene WordPress configurado
        const { data: wpSite } = await supabase
          .from("wordpress_sites")
          .select("*")
          .eq("farmacia_id", farmacia.id)
          .maybeSingle();

        if (wpSite) {
          console.log(`WordPress configured for ${farmacia.name}, publishing...`);
          const publishUrl = `${supabaseUrl}/functions/v1/publish-to-wordpress`;
          
          // Publicar versión ESPAÑOL
          if (generatedData.content?.spanish) {
            try {
              console.log(`Publishing Spanish version for ${farmacia.name}...`);
              const spanishPublishResponse = await fetch(publishUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  farmacia_id: farmacia.id,
                  title: generatedData.content.spanish.title,
                  content: generatedData.content.spanish.content,
                  slug: generatedData.content.spanish.slug,
                  status: "publish",
                  image_url: generatedData.image?.url,
                  image_alt: generatedData.content.spanish.title,
                  meta_description: generatedData.content.spanish.meta_description,
                }),
              });
              
              const spanishResult = await spanishPublishResponse.json();
              if (spanishResult.success) {
                wpSpanish = { success: true, postUrl: spanishResult.post_url };
                console.log(`✓ Published Spanish to WordPress: ${spanishResult.post_url}`);
              } else {
                wpSpanish = { success: false, error: spanishResult.error || "Unknown error" };
                console.error(`✗ Failed to publish Spanish:`, spanishResult.error);
              }
            } catch (wpError) {
              const wpErrorMsg = wpError instanceof Error ? wpError.message : String(wpError);
              wpSpanish = { success: false, error: wpErrorMsg };
              console.error(`✗ Error publishing Spanish to WordPress:`, wpError);
            }
          }
          
          // Publicar versión CATALÁN (con sufijo -ca en slug)
          if (generatedData.content?.catalan) {
            try {
              console.log(`Publishing Catalan version for ${farmacia.name}...`);
              const catalanPublishResponse = await fetch(publishUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  farmacia_id: farmacia.id,
                  title: generatedData.content.catalan.title,
                  content: generatedData.content.catalan.content,
                  slug: `${generatedData.content.catalan.slug}-ca`, // Sufijo para identificar catalán
                  status: "publish",
                  image_url: generatedData.image?.url,
                  image_alt: generatedData.content.catalan.title,
                  meta_description: generatedData.content.catalan.meta_description,
                }),
              });
              
              const catalanResult = await catalanPublishResponse.json();
              if (catalanResult.success) {
                wpCatalan = { success: true, postUrl: catalanResult.post_url };
                console.log(`✓ Published Catalan to WordPress: ${catalanResult.post_url}`);
              } else {
                wpCatalan = { success: false, error: catalanResult.error || "Unknown error" };
                console.error(`✗ Failed to publish Catalan:`, catalanResult.error);
              }
            } catch (wpError) {
              const wpErrorMsg = wpError instanceof Error ? wpError.message : String(wpError);
              wpCatalan = { success: false, error: wpErrorMsg };
              console.error(`✗ Error publishing Catalan to WordPress:`, wpError);
            }
          }
        } else {
          console.log(`No WordPress configured for ${farmacia.name}, skipping auto-publish`);
        }
        
        results.push({
          farmaciaName: farmacia.name,
          success: true,
          wpSpanish,
          wpCatalan,
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

    // WordPress publish summary
    const wpResults = results.filter(r => r.wpSpanish || r.wpCatalan);
    const wpSpanishSuccess = results.filter(r => r.wpSpanish?.success).length;
    const wpCatalanSuccess = results.filter(r => r.wpCatalan?.success).length;
    
    const wpPublishDetails = wpResults.map(r => {
      const esLink = r.wpSpanish?.success && r.wpSpanish.postUrl 
        ? `<a href="${r.wpSpanish.postUrl}" style="color: #4F46E5;">ES ✓</a>` 
        : (r.wpSpanish ? `<span style="color: #DC2626;">ES ✗</span>` : '');
      const caLink = r.wpCatalan?.success && r.wpCatalan.postUrl 
        ? `<a href="${r.wpCatalan.postUrl}" style="color: #4F46E5;">CA ✓</a>` 
        : (r.wpCatalan ? `<span style="color: #DC2626;">CA ✗</span>` : '');
      return `<li><strong>${r.farmaciaName}:</strong> ${[esLink, caLink].filter(Boolean).join(' | ')}</li>`;
    }).join("");

    console.log(`Generation complete: ${successCount} success, ${errorCount} errors`);
    console.log(`WordPress publish: ${wpSpanishSuccess} Spanish, ${wpCatalanSuccess} Catalan`);

    // Send notification email
    const emailResult = await resend.emails.send({
      from: "PharmaBlog Manager <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject: `Posts de ${MONTH_NAMES[currentMonth - 1]} ${currentYear} generados${errorCount > 0 ? ` (${errorCount} errores)` : ""}`,
      html: `
        <h1>PharmaBlog Manager</h1>
        <p>Hola,</p>
        <p>Se han generado automáticamente los artículos de blog para el mes de <strong>${MONTH_NAMES[currentMonth - 1]} ${currentYear}</strong>.</p>
        
        <h2>Resumen de generación</h2>
        <ul>
          <li><strong>Farmacias procesadas:</strong> ${farmaciasToProcess.length}</li>
          <li><strong>Artículos generados correctamente:</strong> ${successCount}</li>
          <li><strong>Errores:</strong> ${errorCount}</li>
        </ul>
        
        ${wpResults.length > 0 ? `
        <h2>Publicaciones a WordPress</h2>
        <ul>
          <li><strong>Posts en Español publicados:</strong> ${wpSpanishSuccess}</li>
          <li><strong>Posts en Catalán publicados:</strong> ${wpCatalanSuccess}</li>
        </ul>
        <h3>Detalle por farmacia</h3>
        <ul>${wpPublishDetails}</ul>
        ` : ""}
        
        ${errorCount > 0 ? `
        <h2>Detalle de errores</h2>
        <ul>${errorDetails}</ul>
        ` : ""}
        
        <p>Accede al portal para revisar los artículos:</p>
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
