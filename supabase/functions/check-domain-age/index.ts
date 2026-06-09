// Edge function: check-domain-age
// Obtiene la fecha de registro de un dominio vía RDAP (sucesor de WHOIS)
// y la guarda en sites.domain_registered_at.
// Se llama desde extract-color-palette (fire-and-forget) y se puede
// invocar también desde un backfill masivo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  site_id?: string;
  domain?: string; // opcional: si no viene, se extrae del site.url
}

// Extrae el dominio registrable de una URL (quita subdominios)
function extractRegistrableDomain(urlOrHost: string): string | null {
  try {
    let host = urlOrHost.trim().toLowerCase();
    if (!host.startsWith("http")) host = "https://" + host;
    const u = new URL(host);
    const parts = u.hostname.split(".").filter(Boolean);
    if (parts.length < 2) return null;
    // Heurística simple: tomar los dos últimos labels.
    // Para TLDs compuestos (.co.uk, .com.ar) funciona peor, pero para
    // los casos habituales de clientes de Blooglee (.es, .com, .net) es suficiente.
    const compoundTlds = new Set([
      "co.uk", "com.ar", "com.mx", "com.br", "com.co", "com.pe",
    ]);
    const last2 = parts.slice(-2).join(".");
    const last3 = parts.slice(-3).join(".");
    if (parts.length >= 3 && compoundTlds.has(last2)) return last3;
    return last2;
  } catch {
    return null;
  }
}

// Consulta RDAP usando rdap.org (bootstrap público, gratis, sin API key).
// Devuelve ISO date string o null.
async function fetchDomainRegistrationDate(
  domain: string,
): Promise<string | null> {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.log(`[check-domain-age] RDAP ${domain} status=${res.status}`);
      return null;
    }
    const data = await res.json();
    // RDAP devuelve un array "events" con eventos tipo "registration", "last changed", etc.
    const events: Array<{ eventAction?: string; eventDate?: string }> =
      data?.events ?? [];
    const reg = events.find(
      (e) => e.eventAction?.toLowerCase() === "registration",
    );
    if (!reg?.eventDate) return null;
    // Normaliza a ISO
    const d = new Date(reg.eventDate);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (err) {
    console.log(`[check-domain-age] RDAP error for ${domain}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require service-role bearer token (function is internal, called fire-and-forget
  // from extract-color-palette with the service role key).
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";
  const apiKeyHeader = req.headers.get("apikey") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!serviceRoleKey || (bearer !== serviceRoleKey && apiKeyHeader !== serviceRoleKey)) {
    return new Response(
      JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey,
    );

    const payload: Payload = await req.json().catch(() => ({}));
    const { site_id, domain: providedDomain } = payload;

    if (!site_id && !providedDomain) {
      return new Response(
        JSON.stringify({ error: "site_id or domain required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let domain = providedDomain ?? null;
    let siteUrl: string | null = null;

    if (site_id) {
      const { data: site, error } = await supabase
        .from("sites")
        .select("id, url, domain_registered_at, domain_age_checked_at")
        .eq("id", site_id)
        .maybeSingle();
      if (error || !site) {
        return new Response(
          JSON.stringify({ error: "site not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      siteUrl = site.url;
      if (!domain && site.url) {
        domain = extractRegistrableDomain(site.url);
      }
      // Si ya lo chequeamos en los últimos 30 días, no repetimos
      if (site.domain_age_checked_at) {
        const checkedAt = new Date(site.domain_age_checked_at).getTime();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - checkedAt < THIRTY_DAYS) {
          return new Response(
            JSON.stringify({
              ok: true,
              cached: true,
              domain_registered_at: site.domain_registered_at,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "could not extract domain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const registeredAt = await fetchDomainRegistrationDate(domain);
    const nowIso = new Date().toISOString();

    if (site_id) {
      const update: Record<string, unknown> = {
        domain_age_checked_at: nowIso,
      };
      if (registeredAt) update.domain_registered_at = registeredAt;
      await supabase.from("sites").update(update).eq("id", site_id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        domain,
        domain_registered_at: registeredAt,
        found: !!registeredAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[check-domain-age] fatal:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
