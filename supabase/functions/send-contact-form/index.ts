import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBJECT_LABELS: Record<string, string> = {
  general: "Información general",
  support: "Soporte técnico",
  billing: "Facturación",
  partnership: "Colaboraciones",
  other: "Otro",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, gdprConsent, marketingConsent } =
      await req.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!gdprConsent) {
      return new Response(
        JSON.stringify({ success: false, error: "Se requiere consentimiento GDPR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Error de configuración del servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subjectLabel = SUBJECT_LABELS[subject] || subject;
    const now = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });

    // 1. Send notification to Blooglee team
    const teamEmailHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Nuevo mensaje de contacto</h1>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280; width: 120px;">Nombre</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email}" style="color: #8B5CF6;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280;">Asunto</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${subjectLabel}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280;">Fecha</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${now}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280;">GDPR</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">✅ Aceptado</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280;">Marketing</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${marketingConsent ? "✅ Aceptado" : "❌ No aceptado"}</td>
            </tr>
          </table>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Mensaje</p>
            <p style="color: #1f2937; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="margin-top: 24px; text-align: center;">
            <a href="mailto:${email}?subject=Re: ${subjectLabel} - Blooglee" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #D946EF); color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Responder</a>
          </div>
        </div>
      </div>
    `;

    const teamRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Blooglee Contacto <noreply@blooglee.com>",
        to: ["info@blooglee.com"],
        reply_to: email,
        subject: `[Contacto] ${subjectLabel} — ${name}`,
        html: teamEmailHtml,
      }),
    });

    if (!teamRes.ok) {
      const err = await teamRes.text();
      console.error("Failed to send team email:", err);
      throw new Error("Error al enviar el email al equipo");
    }

    // 2. Send confirmation to the user
    const userEmailHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">¡Hemos recibido tu mensaje!</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">Hola <strong>${name}</strong>,</p>
          <p style="color: #4b5563; line-height: 1.6;">Gracias por ponerte en contacto con nosotros. Hemos recibido tu consulta sobre <strong>"${subjectLabel}"</strong> y te responderemos lo antes posible.</p>
          <p style="color: #4b5563; line-height: 1.6;">Nuestro horario de atención es de <strong>lunes a viernes de 9:00 a 18:00 CET</strong>. Normalmente respondemos en menos de 24 horas laborables.</p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Tu mensaje</p>
            <p style="color: #1f2937; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 14px;">${message}</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">Si necesitas añadir información, simplemente responde a este email.</p>
          <p style="color: #4b5563; line-height: 1.6;">Un saludo,<br/><strong>El equipo de Blooglee</strong></p>
        </div>
        <div style="padding: 24px 32px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            <a href="https://blooglee.com" style="color: #8B5CF6; text-decoration: none;">blooglee.com</a> · 
            <a href="https://instagram.com/blooglee_" style="color: #8B5CF6; text-decoration: none;">Instagram</a>
          </p>
        </div>
      </div>
    `;

    const userRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Blooglee <noreply@blooglee.com>",
        to: [email],
        reply_to: "info@blooglee.com",
        subject: "Hemos recibido tu mensaje — Blooglee",
        html: userEmailHtml,
      }),
    });

    if (!userRes.ok) {
      const err = await userRes.text();
      console.error("Failed to send user confirmation:", err);
      // Don't fail — team email was already sent
    }

    return new Response(
      JSON.stringify({ success: true, message: "Mensaje enviado correctamente" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
