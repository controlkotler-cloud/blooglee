// TEMPORAL — sonda de modelos del gateway (3-10-2026) para migrar la serie gemini 2.5
// antes de su retirada. Reenvía una petición chat/completions al gateway y devuelve la
// respuesta cruda y la latencia. Borrar esta función al terminar la migración.

const PROBE_TOKEN = "378c8f37d70b66bce3ecfacee6243c5d";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  if (body.token !== PROBE_TOKEN) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }
  if (!body.payload || typeof body.payload !== "object" || !body.payload.model) {
    return new Response(JSON.stringify({ error: "payload con model es obligatorio" }), { status: 400, headers: corsHeaders });
  }

  const started = Date.now();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body.payload),
  });
  const text = await res.text();
  return new Response(
    JSON.stringify({ status: res.status, ms: Date.now() - started, body: text.substring(0, 60000) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
