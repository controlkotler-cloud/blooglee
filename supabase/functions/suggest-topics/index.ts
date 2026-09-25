import { createClient } from "npm:@supabase/supabase-js@2";
import {
  callGateway,
  composeTopicFromNode,
  getTemporalContext,
  pickCandidateNodes,
  type TopicNode,
} from "../_shared/topic-selection.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth guard: require a valid Supabase user JWT to prevent credit abuse.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supaUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await authClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { site_id, sector, location, audience, tone } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Con site_id, las propuestas salen del mapa temático del sitio: los tres
    // nodos menos cubiertos. Así el primer artículo pasa por el mismo control
    // que el resto. Sin site_id, o si el mapa no está disponible, se usa la
    // ruta antigua como respaldo.
    if (site_id) {
      const fromMap = await suggestFromMap(authClient, supaUrl, site_id, LOVABLE_API_KEY);
      if (fromMap) {
        return new Response(
          JSON.stringify({ topics: fromMap }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("[suggest-topics] sin mapa disponible, se usa la ruta antigua");
    }

    if (!sector) {
      return new Response(
        JSON.stringify({ error: "sector is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toneMap: Record<string, string> = {
      friendly: "cercano y amigable, con tuteo",
      professional: "profesional y formal",
      expert: "técnico y especializado",
      educational: "divulgativo, explicando conceptos de forma sencilla",
    };

    const toneDesc = toneMap[tone] || tone || "neutro";
    const locationStr = location ? ` ubicado en ${location}` : "";
    const audienceStr = audience ? ` La audiencia objetivo es: ${audience}.` : "";

    const prompt = `Genera exactamente 3 propuestas de títulos de artículo de blog para un negocio de tipo "${sector}"${locationStr}. El tono debe ser ${toneDesc}.${audienceStr}

Los títulos deben ser:
- Específicos y relevantes para el sector
- Con gancho para atraer clics
- Optimizados para SEO${location ? " local" : ""}
- En español
- NO incluir nombres de ciudades, pueblos ni localidades en los títulos

Para cada título incluye una descripción de 1 línea explicando qué cubrirá el artículo.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks), con este formato exacto:
[{"title": "...", "description": "..."}, {"title": "...", "description": "..."}, {"title": "...", "description": "..."}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: "Eres un experto en marketing de contenidos y SEO para pequeños negocios. Responde siempre en JSON válido sin markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Inténtalo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response, stripping markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let topics: Array<{ title: string; description: string }>;
    try {
      topics = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      // Fallback: generate generic topics
      topics = [
        { title: `Guía completa sobre ${sector}: todo lo que necesitas saber`, description: "Un artículo introductorio que cubre los aspectos más importantes del sector." },
        { title: `5 consejos prácticos para elegir el mejor servicio de ${sector}`, description: "Consejos útiles para tus clientes potenciales." },
        { title: `Tendencias en ${sector} para este año`, description: "Las novedades y tendencias más relevantes del sector." },
      ];
    }

    // Ensure exactly 3
    if (!Array.isArray(topics)) topics = [];
    topics = topics.slice(0, 3);
    while (topics.length < 3) {
      topics.push({ title: `Artículo sobre ${sector}`, description: "Tema genérico para tu blog." });
    }

    return new Response(
      JSON.stringify({ topics }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("suggest-topics error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ---------------------------------------------------------------------
// PROPUESTAS DESDE EL MAPA TEMÁTICO
// Devuelve null si el sitio no es del usuario o no hay nodos: el llamador
// cae entonces a la ruta antigua.
// ---------------------------------------------------------------------
async function suggestFromMap(
  authClient: ReturnType<typeof createClient>,
  supaUrl: string,
  siteId: string,
  apiKey: string,
): Promise<Array<{ title: string; description: string; node_id: string }> | null> {
  // Propiedad: el cliente con el JWT del usuario solo ve sus sitios (RLS).
  const { data: site } = await authClient
    .from("sites")
    .select("id, name, sector, description")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) return null;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const service = createClient(supaUrl, serviceKey);

  const { data: activeMap } = await service
    .from("topic_maps")
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "active")
    .maybeSingle();

  if (!activeMap) {
    const buildRes = await fetch(`${supaUrl}/functions/v1/build-topic-map`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId, mode: "create" }),
    });
    console.log("[suggest-topics] build-topic-map:", buildRes.status);
  }

  const temporal = getTemporalContext(new Date(), "ES");
  const nodes = await pickCandidateNodes(service, siteId, temporal, 3);
  if (nodes.length === 0) return null;

  const titles = await formulateTitles(nodes, site, temporal.today, apiKey);

  return nodes.map((n, i) => ({
    title: titles[i] || composeTopicFromNode(n),
    description: n.audience_segment ? `${n.axis}. Para ${n.audience_segment}.` : `${n.axis}.`,
    node_id: n.id,
  }));
}

// Un enunciado por nodo. Si el modelo falla o devuelve algo inválido, ese
// hueco queda vacío y se compone desde el nodo.
async function formulateTitles(
  nodes: TopicNode[],
  site: { name: string; sector: string | null; description: string | null },
  today: string,
  apiKey: string,
): Promise<string[]> {
  const list = nodes
    .map((n, i) => `${i + 1}. Eje: ${n.axis} | Subtema: ${n.subtopic}${n.audience_segment ? ` | Publico: ${n.audience_segment}` : ""}`)
    .join("\n");

  const prompt = [
    `Negocio: ${site.name}. Sector: ${site.sector || "general"}.`,
    site.description ? `Actividad: ${site.description}` : "",
    `Fecha de hoy: ${today}.`,
    `Convierte cada subtema en el titulo de UN articulo de blog, en espanol correcto con tildes, como respuesta a una busqueda real y concreta:\n${list}`,
    "Reglas: entre 30 y 85 caracteres; frase completa; sin comillas, emojis ni exclamaciones; sin el nombre de la empresa ni anios ni ciudades; solo mayuscula inicial y nombres propios; nada de 'guia definitiva', 'todo lo que necesitas saber', 'N claves/trucos'; no inventes datos.",
    'Responde UNICAMENTE con este JSON: {"titles": ["titulo 1", "titulo 2", "titulo 3"]}, en el mismo orden.',
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await callGateway(
    {
      model: "google/gemini-3.6-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    },
    apiKey,
    (m) => console.log(m),
  );
  if (!res || !res.ok) {
    console.warn("[suggest-topics] gateway", res?.status ?? "sin respuesta");
    return [];
  }

  try {
    const data = await res.json();
    let content = String(data.choices?.[0]?.message?.content || "").trim();
    content = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(content);
    const titles = Array.isArray(parsed?.titles) ? parsed.titles : [];
    return titles.map((t: unknown) => {
      const s = typeof t === "string" ? t.trim() : "";
      return s.length >= 20 && s.length <= 100 ? s : "";
    });
  } catch (e) {
    console.warn("[suggest-topics] respuesta no valida:", e);
    return [];
  }
}
