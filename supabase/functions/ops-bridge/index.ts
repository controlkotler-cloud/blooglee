import { createClient } from "npm:@supabase/supabase-js@2";
import {
  ACCIONES_FALLO,
  moldearSitio,
  validarCambios,
} from "../_shared/ops-bridge-logic.ts";

declare const EdgeRuntime: { waitUntil?: (p: Promise<unknown>) => void } | undefined;

const SITE_COLS =
  "id, user_id, name, blog_url, auto_generate, publish_frequency, publish_day_of_month, publish_hour_utc, tone, avoid_topics";
const ART_COLS = "site_id, topic, title:content_spanish->>title, wp_post_url, generated_at, generation_source, month, year";
const DIA_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function igualesConstante(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

// deno-lint-ignore no-explicit-any
async function cargarSitios(supabase: any, now: Date, siteId?: string) {
  let q = supabase.from("sites").select(SITE_COLS).order("name");
  if (siteId) q = q.eq("id", siteId);
  const { data: sites, error } = await q;
  if (error) throw new Error(`sites: ${error.message}`);
  if (!sites?.length) return [];
  const ids = sites.map((s: { id: string }) => s.id);
  const desde = new Date(now.getTime() - 60 * DIA_MS).toISOString();

  const [arts, logs] = await Promise.all([
    supabase.from("articles").select(ART_COLS).in("site_id", ids).gte("generated_at", desde)
      .order("generated_at", { ascending: false }).limit(1000),
    supabase.from("site_activity_log").select("site_id, action_type, description, created_at").in("site_id", ids)
      .in("action_type", ACCIONES_FALLO).gte("created_at", desde)
      .order("created_at", { ascending: false }).limit(1000),
  ]);
  if (arts.error) throw new Error(`articles: ${arts.error.message}`);
  if (logs.error) throw new Error(`site_activity_log: ${logs.error.message}`);

  // deno-lint-ignore no-explicit-any
  const porSitioArt = new Map<string, any[]>();
  // deno-lint-ignore no-explicit-any
  for (const a of arts.data ?? []) {
    const l = porSitioArt.get(a.site_id) ?? [];
    l.push(a);
    porSitioArt.set(a.site_id, l);
  }
  // Sitios sin artículos en la ventana: su último post puede ser anterior.
  const sinRecientes = ids.filter((id: string) => !porSitioArt.has(id));
  await Promise.all(sinRecientes.map(async (id: string) => {
    const { data } = await supabase.from("articles").select(ART_COLS).eq("site_id", id)
      .order("generated_at", { ascending: false }).limit(1);
    if (data?.length) porSitioArt.set(id, data);
  }));
  // deno-lint-ignore no-explicit-any
  const porSitioLog = new Map<string, any[]>();
  // deno-lint-ignore no-explicit-any
  for (const l of logs.data ?? []) {
    const x = porSitioLog.get(l.site_id) ?? [];
    x.push(l);
    porSitioLog.set(l.site_id, x);
  }
  // deno-lint-ignore no-explicit-any
  return sites.map((s: any) => moldearSitio(s, porSitioArt.get(s.id) ?? [], porSitioLog.get(s.id) ?? [], now));
}

// deno-lint-ignore no-explicit-any
async function estadoProgramador(supabase: any, now: Date) {
  const hace24h = new Date(now.getTime() - DIA_MS).toISOString();
  const hace1h = now.getTime() - 60 * 60 * 1000;
  const [ultima, ultimoOk, recientes] = await Promise.all([
    supabase.from("scheduler_runs").select("started_at").order("started_at", { ascending: false }).limit(1),
    supabase.from("scheduler_runs").select("started_at").eq("success", true)
      .order("started_at", { ascending: false }).limit(1),
    supabase.from("scheduler_runs").select("started_at, success, error").gte("started_at", hace24h)
      .order("started_at", { ascending: false }).limit(1000),
  ]);
  for (const r of [ultima, ultimoOk, recientes]) if (r.error) throw new Error(`scheduler_runs: ${r.error.message}`);
  // deno-lint-ignore no-explicit-any
  const filas: any[] = recientes.data ?? [];
  const fallidas = filas.filter((r) => r.success === false);
  return {
    ultima_pasada: ultima.data?.[0]?.started_at ?? null,
    ultimo_ok: ultimoOk.data?.[0]?.started_at ?? null,
    fallos_1h: fallidas.filter((r) => Date.parse(r.started_at) >= hace1h).length,
    ultimo_error: fallidas[0]?.error ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const token = req.headers.get("x-ops-bridge-token") ?? "";
    const { data: fila, error: errTok } = await supabase.from("scheduler_auth_tokens").select("secret")
      .eq("name", "ops-bridge").maybeSingle();
    if (errTok) throw new Error("no se pudo comprobar el acceso");
    if (!token || !fila?.secret || !igualesConstante(await sha256Hex(token), String(fila.secret))) {
      return json({ error: "no autorizado" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "el cuerpo debe ser JSON" }, 400);
    }
    if (!body || typeof body !== "object") return json({ error: "el cuerpo debe ser un objeto JSON" }, 400);
    const now = new Date();

    if (body.action === "estado") {
      const [programador, sitios] = await Promise.all([estadoProgramador(supabase, now), cargarSitios(supabase, now)]);
      return json({ generado_en: now.toISOString(), programador, sitios });
    }

    if (body.action === "ajustes" || body.action === "generar") {
      const siteId = body.site_id;
      if (typeof siteId !== "string" || !siteId) return json({ error: "falta site_id" }, 400);

      if (body.action === "ajustes") {
        const v = validarCambios(body.cambios);
        if (!v.ok) return json({ error: v.error }, 400);
        const { data: actual, error: e1 } = await supabase.from("sites").select(SITE_COLS).eq("id", siteId)
          .maybeSingle();
        if (e1) throw new Error(`sites: ${e1.message}`);
        if (!actual) return json({ error: "sitio no encontrado" }, 404);
        const antes: Record<string, unknown> = {};
        for (const k of Object.keys(v.valores)) antes[k] = actual[k];
        const { error: e2 } = await supabase.from("sites").update(v.valores).eq("id", siteId);
        if (e2) throw new Error(`no se pudo guardar: ${e2.message}`);
        await supabase.from("site_activity_log").insert({
          site_id: siteId,
          action_type: "ops_ajustes",
          description: `Ajustes cambiados desde ops: ${Object.keys(v.valores).join(", ")}`,
          metadata: { antes, despues: v.valores },
        });
        const [sitio] = await cargarSitios(supabase, now, siteId);
        return json({ ok: true, sitio });
      }

      // generar
      const { data: site, error: e3 } = await supabase.from("sites").select("id, user_id").eq("id", siteId)
        .maybeSingle();
      if (e3) throw new Error(`sites: ${e3.message}`);
      if (!site) return json({ error: "sitio no encontrado" }, 404);
      const hace15 = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
      const { data: recientes, error: e4 } = await supabase.from("articles").select("id").eq("site_id", siteId)
        .gte("generated_at", hace15).limit(1);
      if (e4) throw new Error(`articles: ${e4.message}`);
      if (recientes?.length) return json({ error: "ya se está generando" }, 409);
      // El artículo se inserta al final de la generación (minutos): el doble clic se frena por el registro.
      const { data: lanzadas, error: e5 } = await supabase.from("site_activity_log").select("id")
        .eq("site_id", siteId).eq("action_type", "ops_generar").gte("created_at", hace15).limit(1);
      if (e5) throw new Error(`site_activity_log: ${e5.message}`);
      if (lanzadas?.length) return json({ error: "ya se está generando" }, 409);

      // Mes y año en UTC, como generate-scheduler (hasSiteArticleForPeriod): así el programador lo ve.
      const month = now.getUTCMonth() + 1;
      const year = now.getUTCFullYear();
      const generationKey = `ops-${siteId}-${Math.floor(now.getTime() / 1000)}`;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const envio = fetch(`${supabaseUrl}/functions/v1/generate-article-saas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ siteId, month, year, isScheduled: true, userId: site.user_id, generationKey }),
      })
        .then((r) => console.log(`[ops-bridge] generate-article-saas status ${r.status}`))
        .catch((err) => console.error("[ops-bridge] dispatch error:", err?.message ?? "desconocido"));
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(envio);

      await supabase.from("site_activity_log").insert({
        site_id: siteId,
        action_type: "ops_generar",
        description: "Generación lanzada desde ops",
        metadata: { generation_key: generationKey },
      });
      return json({ ok: true, generation_key: generationKey }, 202);
    }

    return json({ error: "acción desconocida" }, 400);
  } catch (err) {
    console.error("[ops-bridge] error:", err instanceof Error ? err.message : "desconocido");
    return json({ error: "error interno" }, 500);
  }
});
