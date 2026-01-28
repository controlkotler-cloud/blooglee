import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, source = "blog", audience = "both" } = await req.json();

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

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return new Response(
          JSON.stringify({ success: true, message: "Ya estás suscrito a nuestra newsletter" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Reactivate subscription
        await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true, unsubscribed_at: null })
          .eq('id', existing.id);
        
        return new Response(
          JSON.stringify({ success: true, message: "¡Bienvenido de nuevo! Tu suscripción ha sido reactivada" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Insert new subscriber with audience preference
    const validAudience = ['empresas', 'agencias', 'both'].includes(audience) ? audience : 'both';
    
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        source,
        audience: validAudience,
        is_active: true,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("No se pudo registrar la suscripción");
    }

    // Send welcome email
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: "Blooglee <onboarding@resend.dev>",
          to: [email],
          subject: "¡Bienvenido a la newsletter de Blooglee! 🎉",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed; margin-bottom: 10px;">¡Bienvenido a Blooglee!</h1>
                <p style="color: #666; font-size: 18px;">Gracias por suscribirte a nuestra newsletter</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <h2 style="color: #7c3aed; margin-top: 0;">¿Qué recibirás?</h2>
                <ul style="color: #555;">
                  <li><strong>Artículos sobre SEO y marketing de contenidos</strong></li>
                  <li><strong>Tips para automatizar tu blog</strong></li>
                  <li><strong>Novedades de Blooglee</strong></li>
                  <li><strong>Guías y tutoriales exclusivos</strong></li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://blooglee.com/blog" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                  Visitar el blog
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                <p>Blooglee - Automatiza tu blog con IA</p>
                <p>
                  <a href="https://blooglee.com" style="color: #7c3aed;">blooglee.com</a>
                </p>
              </div>
            </body>
            </html>
          `,
        });
        
        console.log(`Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the subscription if email fails
      }
    }

    console.log(`New subscriber: ${email} from ${source}`);

    return new Response(
      JSON.stringify({ success: true, message: "¡Gracias por suscribirte! Revisa tu email para la confirmación." }),
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
