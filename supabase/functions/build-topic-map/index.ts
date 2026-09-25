// =====================================================================
// BLOOGLEE · supabase/functions/build-topic-map/index.ts
//
// Genera (o amplía) el mapa temático de un sitio: el territorio de temas
// que ese negocio concreto puede cubrir. No hay catálogos por sector en
// el código: el mapa sale del propio negocio, así que funciona igual para
// una farmacia, un despacho de abogados o un gimnasio.
//
// Invocación:
//   POST { site_id: "uuid", mode: "create" | "extend", axes?: number }
//   Auth: JWT del dueño del sitio o service_role.
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { callGateway } from "../_shared/topic-selection.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

interface RawNode {
  axis: string;
  subtopic: string;
  search_intent?: string;
  audience_segment?: string;
  season?: string;
  month_hint?: number;
  priority?: number;
}

const VALID_INTENTS = ["informational", "comparative", "transactional", "alert"];
const VALID_SEASONS = ["any", "primavera", "verano", "otono", "invierno"];

const normalizeSeason = (s?: string) => {
  const v = (s || "any").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return VALID_SEASONS.includes(v) ? v : "any";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const body = await req.json().catch(() => ({}));
    const siteId: string | undefined = body.site_id;
    const mode: "create" | "extend" = body.mode === "extend" ? "extend" : "create";
    const axesWanted: number = Math.min(Math.max(Number(body.axes) || 10, 6), 14);

    if (!siteId) return json({ error: "site_id es obligatorio" }, 400);

    const service = createClient(SUPABASE_URL, SERVICE_KEY);

    // ---- Autorización: service_role o dueño/miembro del equipo ---------
    const authHeader = req.headers.get("Authorization") || "";
    const isServiceRole = authHeader.replace(/^Bearer\s+/i, "") === SERVICE_KEY;

    const { data: site, error: siteErr } = await service
      .from("sites")
      .select(
        "id, user_id, name, sector, description, location, geographic_scope, target_audience, custom_topic, priority_topics, avoid_topics, content_goal, business_type, tone, wordpress_context",
      )
      .eq("id", siteId)
      .maybeSingle();

    if (siteErr || !site) return json({ error: "sitio no encontrado" }, 404);

    if (!isServiceRole) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(SUPABASE_URL, anonKey, { global: { headers: { Authorization: authHeader } } });
      const {
        data: { user },
      } = await authClient.auth.getUser();
      if (!user) return json({ error: "Unauthorized" }, 401);

      const { data: visible } = await authClient.from("sites").select("id").eq("id", siteId).maybeSingle();
      if (!visible) return json({ error: "Forbidden" }, 403);
    }

    // ---- Contexto del sector (opcional, solo para dar color) ----------
    const { data: sectorCtx } = await service
      .from("sector_contexts")
      .select("prohibited_terms")
      .eq("sector_key", site.sector || "general")
      .maybeSingle();

    // ---- Qué ya cubre su blog real ------------------------------------
    const wpTopics: string[] = site.wordpress_context?.lastTopics?.slice(0, 20) || [];

    // ---- Si es 'extend', no repetir los ejes que ya tiene --------------
    let existingAxes: string[] = [];
    let activeMapId: string | null = null;
    if (mode === "extend") {
      const { data: activeMap } = await service
        .from("topic_maps")
        .select("id")
        .eq("site_id", siteId)
        .eq("status", "active")
        .maybeSingle();
      activeMapId = activeMap?.id || null;
      if (activeMapId) {
        const { data: nodes } = await service.from("topic_nodes").select("axis, subtopic").eq("map_id", activeMapId);
        existingAxes = [...new Set((nodes || []).map((n: any) => n.axis))];
      }
    }

    // ---- Prompt del mapa ----------------------------------------------
    const prompt = `Eres un estratega de contenidos. Tu tarea NO es proponer titulares: es cartografiar el TERRITORIO TEMATICO completo de un negocio concreto, para que durante anios se pueda publicar sobre el sin repetirse.

NEGOCIO
- Nombre: ${site.name}
- Sector (etiqueta amplia, no manda): ${site.sector || "no especificado"}
- Actividad real: ${site.description || "no especificada"}
- Enfoque declarado por el cliente: ${site.custom_topic || "no especificado"}
- Publico objetivo: ${site.target_audience || "no especificado"}
- Objetivo del contenido: ${site.content_goal || "captar clientes"}
- Ambito: ${site.geographic_scope === "national" ? "nacional" : site.location || "local"}
${site.priority_topics?.length ? `- Temas prioritarios del cliente: ${site.priority_topics.join(", ")}` : ""}
${site.avoid_topics?.length ? `- Temas que el cliente NO quiere tratar: ${site.avoid_topics.join(", ")}` : ""}
${wpTopics.length ? `\nYA HA PUBLICADO SOBRE (no lo repitas, pero sirve para entender su linea):\n${wpTopics.map((t) => `- ${t}`).join("\n")}` : ""}
${existingAxes.length ? `\nEJES QUE YA TIENE MAPEADOS (dame ejes DISTINTOS a estos):\n${existingAxes.map((a) => `- ${a}`).join("\n")}` : ""}
${sectorCtx?.prohibited_terms?.length ? `\nTERMINOS PROHIBIDOS EN ESTE SECTOR: ${sectorCtx.prohibited_terms.slice(0, 15).join(", ")}` : ""}

QUE TIENES QUE DEVOLVER
${axesWanted} ejes tematicos, cada uno con 5 subtemas concretos. Total ${axesWanted * 5} entradas.

REGLAS DEL MAPA
1. Un EJE es un area estable del negocio (dura anios). Un SUBTEMA es una pregunta o decision concreta dentro de ese eje.
2. Cubre TODO el espectro: lo que el cliente busca por urgencia, por duda, por comparacion, por precio, por miedo, por curiosidad y por decision de compra. Incluye tambien las zonas que un redactor generico nunca tocaria.
3. Cada subtema debe distinguirse de los demas por algo real: un publico distinto, una situacion distinta o una decision distinta. No vale el mismo subtema reformulado.
4. Prohibido que un subtema sirva igual para cualquier otro negocio del mismo sector: tiene que encajar con la actividad real descrita arriba.
5. Reparte la estacionalidad: la mayoria de subtemas deben valer todo el anio ("any"). Marca estacion o mes SOLO cuando el subtema lo exija de verdad.
6. No escribas titulares con gancho. Escribe el subtema en seco: se convertira en articulo mas adelante.
7. Nada de anios ni fechas concretas.

FORMATO — responde SOLO este JSON, sin markdown:
{"axes":[{"axis":"nombre del eje","subtopics":[{"subtopic":"...","search_intent":"informational|comparative|transactional|alert","audience_segment":"...","season":"any|primavera|verano|otono|invierno","month_hint":null,"priority":3}]}]}`;

    // ---- Llamada al modelo (salida grande: presupuesto amplio) ---------
    const callModel = async (maxTokens: number) => {
      // callGateway reintenta sin `response_format` si el gateway lo rechaza
      // con 400. Sin esa red, un mapa nunca llegaría a crearse y el sitio se
      // quedaría sin territorio que recorrer.
      const res = await callGateway(
        {
          model: "google/gemini-3.6-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: maxTokens,
        },
        LOVABLE_API_KEY,
        (m) => console.log(m),
      );
      if (!res) throw new Error("gateway: sin respuesta");
      if (!res.ok) throw new Error(`gateway ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return {
        raw: (data.choices?.[0]?.message?.content || "").trim(),
        finish: data.choices?.[0]?.finish_reason,
      };
    };

    let parsed: any = null;
    let lastError = "";
    for (const budget of [12000, 20000]) {
      try {
        const { raw, finish } = await callModel(budget);
        try {
          parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
        } catch {
          lastError = `JSON invalido (finish_reason=${finish}) con max_tokens=${budget}`;
          console.warn(`[build-topic-map] ${lastError}`);
          continue;
        }
        if (Array.isArray(parsed?.axes) && parsed.axes.length > 0) break;
        lastError = "respuesta sin ejes";
        parsed = null;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error(`[build-topic-map] ${lastError}`);
      }
    }

    if (!parsed) return json({ error: `no se pudo generar el mapa: ${lastError}` }, 502);

    // ---- Normalización ------------------------------------------------
    const nodes: RawNode[] = [];
    for (const axis of parsed.axes) {
      const axisName = String(axis.axis || "").trim();
      if (!axisName) continue;
      for (const st of axis.subtopics || []) {
        const subtopic = String(st.subtopic || "").trim();
        if (subtopic.length < 10) continue;
        nodes.push({
          axis: axisName,
          subtopic,
          search_intent: VALID_INTENTS.includes(st.search_intent) ? st.search_intent : "informational",
          audience_segment: st.audience_segment ? String(st.audience_segment).slice(0, 120) : undefined,
          season: normalizeSeason(st.season),
          month_hint: Number.isInteger(st.month_hint) && st.month_hint >= 1 && st.month_hint <= 12 ? st.month_hint : undefined,
          priority: Number.isInteger(st.priority) && st.priority >= 1 && st.priority <= 5 ? st.priority : 3,
        });
      }
    }

    if (nodes.length < 15) return json({ error: `mapa demasiado pequeno (${nodes.length} nodos)` }, 502);

    // ---- Persistencia --------------------------------------------------
    let mapId = activeMapId;
    let previousMapId: string | null = null;

    if (mode === "create" || !mapId) {
      const { data: prev } = await service
        .from("topic_maps")
        .select("id, version")
        .eq("site_id", siteId)
        .eq("status", "active")
        .maybeSingle();

      previousMapId = prev?.id || null;

      // El mapa anterior se retira DESPUÉS de que el nuevo esté completo (ver
      // más abajo). Si se retirase aquí y fallara el insert de nodos, el sitio
      // se quedaría sin mapa activo y dejaría de generar temas.
      // El índice único idx_topic_maps_one_active impide dos activos a la vez,
      // así que el nuevo entra como 'superseded' y se promociona al final.
      const { data: created, error: mapErr } = await service
        .from("topic_maps")
        .insert({
          site_id: siteId,
          user_id: site.user_id,
          version: (prev?.version || 0) + 1,
          status: previousMapId ? "superseded" : "active",
          source: wpTopics.length ? "ai_web_analysis" : "ai_business_profile",
          model: "google/gemini-3.6-flash",
          raw: parsed,
        })
        .select()
        .single();

      if (mapErr) throw new Error(`no se pudo guardar el mapa: ${mapErr.message}`);
      mapId = created.id;
    }

    const rows = nodes.map((n) => ({
      map_id: mapId,
      site_id: siteId,
      axis: n.axis,
      subtopic: n.subtopic,
      search_intent: n.search_intent,
      audience_segment: n.audience_segment || null,
      season: n.season,
      month_hint: n.month_hint || null,
      priority: n.priority,
    }));

    const { data: insertedNodes, error: nodesErr } = await service.from("topic_nodes").insert(rows).select("id, subtopic");
    if (nodesErr) throw new Error(`no se pudieron guardar los nodos: ${nodesErr.message}`);

    // Relevo del mapa anterior, ya con el nuevo completo. Se desactivan
    // también sus nodos: si se quedaran 'active' seguirían siendo candidatos
    // para siempre y el territorio se acumularía en vez de sustituirse.
    if (previousMapId) {
      await service.from("topic_nodes").update({ status: "disabled" }).eq("map_id", previousMapId);
      await service.from("topic_maps").update({ status: "superseded" }).eq("id", previousMapId);
      const { error: promoteErr } = await service.from("topic_maps").update({ status: "active" }).eq("id", mapId);
      if (promoteErr) throw new Error(`no se pudo activar el mapa nuevo: ${promoteErr.message}`);
      console.log(`[build-topic-map] mapa ${previousMapId} retirado, ${mapId} activo`);
    }

    // ---- Marcar como cubiertos los nodos que su blog ya toca -----------
    // Evita que el primer artículo repita algo que el cliente ya publicó.
    if (wpTopics.length) {
      // Solo los nodos reci\u00e9n insertados. En modo 'extend' el mapa contiene
      // tambi\u00e9n los nodos previos, y forzarles coverage_count = 1 pisar\u00eda el
      // contador real de un nodo que ya se us\u00f3 varias veces.
      const inserted = insertedNodes || [];
      const flat = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const already = (inserted || []).filter((n: any) =>
        wpTopics.some((t) => {
          const a = new Set(flat(n.subtopic).split(/\s+/).filter((w) => w.length > 4));
          const b = new Set(flat(t).split(/\s+/).filter((w) => w.length > 4));
          const shared = [...a].filter((w) => b.has(w));
          return shared.length >= 2;
        }),
      );
      if (already.length) {
        await service
          .from("topic_nodes")
          .update({ coverage_count: 1, last_used_at: new Date().toISOString() })
          .in("id", already.map((n: any) => n.id));
      }
    }

    console.log(`[build-topic-map] site=${siteId} mode=${mode} nodos=${rows.length}`);

    return json({
      success: true,
      map_id: mapId,
      mode,
      axes: [...new Set(nodes.map((n) => n.axis))].length,
      nodes: rows.length,
    });
  } catch (err) {
    console.error("[build-topic-map] error:", err);
    return json({ error: err instanceof Error ? err.message : "error desconocido" }, 500);
  }
});
