import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLOG_URL = "https://blooglee.lovable.app/blog";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      name,
      email, 
      audience,
      gdprConsent,
      marketingConsent,
      source = "footer" 
    } = await req.json();

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "El nombre es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Email es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate audience - only empresas or agencias allowed
    if (!audience || !['empresas', 'agencias'].includes(audience)) {
      return new Response(
        JSON.stringify({ success: false, error: "Selecciona si eres Empresa o Agencia" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate consents
    if (!gdprConsent) {
      return new Response(
        JSON.stringify({ success: false, error: "Debes aceptar la política de privacidad" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!marketingConsent) {
      return new Response(
        JSON.stringify({ success: false, error: "Debes aceptar recibir comunicaciones" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const consentDate = new Date().toISOString();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active, name')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return new Response(
          JSON.stringify({ success: true, message: "Ya estás suscrito a nuestra newsletter" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Reactivate subscription with new data
        await supabase
          .from('newsletter_subscribers')
          .update({ 
            is_active: true, 
            unsubscribed_at: null,
            name: cleanName,
            audience,
            gdpr_consent: gdprConsent,
            marketing_consent: marketingConsent,
            consent_date: consentDate
          })
          .eq('id', existing.id);
        
        return new Response(
          JSON.stringify({ success: true, message: `¡Bienvenido de nuevo, ${cleanName}! Tu suscripción ha sido reactivada` }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Insert new subscriber with all fields
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: cleanEmail,
        name: cleanName,
        source,
        audience,
        is_active: true,
        gdpr_consent: gdprConsent,
        marketing_consent: marketingConsent,
        consent_date: consentDate,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("No se pudo registrar la suscripción");
    }

    // Send personalized welcome email
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const audienceLabel = audience === 'empresas' ? 'para Empresas' : 'para Agencias';
        const audienceContent = audience === 'empresas'
          ? 'estrategias de marketing, SEO y crecimiento digital para tu negocio'
          : 'escalabilidad, automatización y gestión de clientes para tu agencia';
        
        await resend.emails.send({
          from: "Blooglee <onboarding@resend.dev>",
          to: [cleanEmail],
          subject: `¡Bienvenido/a ${cleanName}! Tu newsletter de Blooglee está lista 🎉`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f3ff; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
                    ¡Bienvenido/a, ${cleanName}!
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                    Newsletter de Blooglee ${audienceLabel}
                  </p>
                </div>
                
                <!-- Content -->
                <div style="background: #ffffff; border-radius: 0 0 16px 16px; padding: 30px;">
                  <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
                    Gracias por unirte a la newsletter de Blooglee. A partir de ahora recibirás:
                  </p>
                  
                  <ul style="color: #555; font-size: 15px; padding-left: 20px; margin-bottom: 25px;">
                    <li style="margin-bottom: 10px;">
                      <strong>Artículos diarios</strong> adaptados a ${audienceContent}
                    </li>
                    <li style="margin-bottom: 10px;">
                      <strong>Tips exclusivos</strong> para mejorar tu presencia online
                    </li>
                    <li style="margin-bottom: 10px;">
                      <strong>Novedades de Blooglee</strong> antes que nadie
                    </li>
                  </ul>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${BLOG_URL}" 
                       style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Ver últimos artículos →
                    </a>
                  </div>
                  
                  <p style="color: #777; font-size: 14px; margin-top: 30px;">
                    Saludos,<br>
                    <strong>El equipo de Blooglee</strong>
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding: 25px 20px;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    Blooglee - Automatiza tu blog con IA
                    <br><br>
                    Puedes darte de baja en cualquier momento desde el link en nuestros emails.
                  </p>
                </div>
                
              </div>
            </body>
            </html>
          `,
        });
        
        console.log(`Welcome email sent to ${cleanEmail}`);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the subscription if email fails
      }
    }

    console.log(`New subscriber: ${cleanName} (${cleanEmail}) - ${audience} from ${source}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `¡Gracias ${cleanName}! Revisa tu email para la confirmación.` 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Newsletter subscription error:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
