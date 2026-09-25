// TEMPORAL — A/B del modelo que redacta el artículo (25-09-2026).
// Lanza la misma generación con varios modelos sobre el sitio de pruebas y
// devuelve al momento; los artículos quedan en `articles` con la clave
// `ab-<modelo>-<ts>`. Borrar esta función al terminar la prueba.

const AB_TOKEN = "ab38a3055b39d68299004d776980175d";
const AB_TEST_SITE_ID = "611bc2ee-57e4-4c7f-bc12-8806b69f0f28";
const AB_TEST_OWNER_ID = "2840b1e0-0dcc-4c8f-969c-f086f4db0c90";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  if (body.token !== AB_TOKEN) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  const topic: string = body.topic;
  const models: string[] = Array.isArray(body.models) ? body.models.slice(0, 4) : [];
  if (!topic || models.length === 0) {
    return new Response(JSON.stringify({ error: "topic y models son obligatorios" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-article-saas`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const now = new Date();
  const ts = Date.now();

  const runs = models.map((model) => {
    const generationKey = `ab-${model.replace(/^google\//, "")}-${ts}`;
    const started = Date.now();
    const task = fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: AB_TEST_SITE_ID,
        userId: AB_TEST_OWNER_ID,
        isScheduled: true,
        topic,
        month: now.getUTCMonth() + 1,
        year: now.getUTCFullYear(),
        generationKey,
        articleModel: model,
      }),
    })
      .then(async (r) => {
        const text = await r.text();
        console.log(`[ab] ${model} → ${r.status} en ${Math.round((Date.now() - started) / 1000)} s: ${text.slice(0, 300)}`);
      })
      .catch((e) => console.error(`[ab] ${model} → error: ${e}`));
    return { model, generationKey, task };
  });

  // @ts-ignore EdgeRuntime existe en Supabase Edge Functions
  EdgeRuntime.waitUntil(Promise.all(runs.map((r) => r.task)));

  return new Response(
    JSON.stringify({ started: runs.map(({ model, generationKey }) => ({ model, generationKey })) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
