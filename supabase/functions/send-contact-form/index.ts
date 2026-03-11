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

type ContactRateRecord = { count: number; resetAt: number };
const contactRateMap = new Map<string, ContactRateRecord>();
const CONTACT_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CONTACT_RATE_MAX_REQUESTS = 8;

function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("X-Forwarded-For") || "";
  const firstIp = forwardedFor.split(",")[0]?.trim();
  if (firstIp) return `ip:${firstIp}`;

  const realIp = req.headers.get("x-real-ip") || req.headers.get("X-Real-IP") || "";
  if (realIp) return `ip:${realIp}`;

  return "ip:unknown";
}

function checkContactRateLimit(identifier: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const existing = contactRateMap.get(identifier);

  if (contactRateMap.size > 1000) {
    for (const [key, value] of contactRateMap.entries()) {
      if (now > value.resetAt) contactRateMap.delete(key);
    }
  }

  if (!existing || now > existing.resetAt) {
    contactRateMap.set(identifier, {
      count: 1,
      resetAt: now + CONTACT_RATE_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (existing.count >= CONTACT_RATE_MAX_REQUESTS) {
    return { allowed: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeOneLineInput(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function normalizeMultilineInput(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().slice(0, maxLen);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { gdprConsent, marketingConsent } = payload || {};
    const name = normalizeOneLineInput(payload?.name, 120);
    const email = normalizeOneLineInput(payload?.email, 190);
    const subject = normalizeOneLineInput(payload?.subject, 80);
    const message = normalizeMultilineInput(payload?.message, 4000);

    const clientIdentifier = getClientIdentifier(req);
    const rateLimit = checkContactRateLimit(clientIdentifier);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.",
          retry_after: rateLimit.retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfterSec || 60),
          },
        },
      );
    }

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ success: false, error: "Faltan campos obligatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, error: "Email no válido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!gdprConsent) {
      return new Response(JSON.stringify({ success: false, error: "Se requiere consentimiento GDPR" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "Error de configuración del servidor" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subjectLabel = SUBJECT_LABELS[subject] || subject;
    const now = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubjectLabel = escapeHtml(subjectLabel);
    const safeMessage = escapeHtml(message);

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
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${safeEmail}" style="color: #8B5CF6;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #6b7280;">Asunto</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${safeSubjectLabel}</td>
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
            <p style="color: #1f2937; line-height: 1.6; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <div style="margin-top: 24px; text-align: center;">
            <a href="mailto:${safeEmail}?subject=Re: ${safeSubjectLabel} - Blooglee" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #D946EF); color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Responder</a>
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
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6;">Hola <strong>${safeName}</strong>,</p>
          <p style="color: #4b5563; line-height: 1.6;">Gracias por ponerte en contacto con nosotros. Hemos recibido tu consulta sobre <strong>"${safeSubjectLabel}"</strong> y te responderemos lo antes posible.</p>
          <p style="color: #4b5563; line-height: 1.6;">Nuestro horario de atención es de <strong>lunes a viernes de 9:00 a 18:00 CET</strong>. Normalmente respondemos en menos de 24 horas laborables.</p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Tu mensaje</p>
            <p style="color: #1f2937; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 14px;">${safeMessage}</p>
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

    return new Response(JSON.stringify({ success: true, message: "Mensaje enviado correctamente" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Contact form error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
