import { createClient } from "npm:@supabase/supabase-js@2";

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
    const { sector, location, audience, tone } = await req.json();

    if (!sector) {
      return new Response(
        JSON.stringify({ error: "sector is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
        model: "google/gemini-2.5-flash",
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
