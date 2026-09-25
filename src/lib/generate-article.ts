import { supabase } from "@/integrations/supabase/client";

// La generación de un artículo puede superar los 150 s que el cliente espera
// a una edge function. La función sigue trabajando y guarda el artículo, pero
// la llamada vuelve con error. Para no dar por fallido algo que ha salido
// bien, se manda una generationKey propia y, si la llamada muere por tiempo,
// se busca el artículo por esa clave hasta que aparece.

interface GenerateArticleBody {
  siteId: string;
  topic: string | null;
  month: number;
  year: number;
}

const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_MS = 7 * 60 * 1000;
const TIMEOUT_STATUSES = new Set([502, 504, 546]);

function buildGenerationKey(month: number, year: number): string {
  const m = String(month).padStart(2, "0");
  return `manual-${year}-${m}-${Date.now()}-${crypto.randomUUID()}`;
}

async function waitForArticle(siteId: string, generationKey: string, startedAt: number) {
  while (Date.now() - startedAt < MAX_WAIT_MS) {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("site_id", siteId)
      .eq("generation_key", generationKey)
      .maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function generateArticle(body: GenerateArticleBody) {
  const startedAt = Date.now();
  const generationKey = buildGenerationKey(body.month, body.year);

  const { data, error } = await supabase.functions.invoke("generate-article-saas", {
    body: { ...body, generationKey },
  });

  if (!error) {
    if (data?.error) throw new Error(data.error);
    return data;
  }

  const context = (error as { context?: unknown }).context;
  const status = context instanceof Response ? context.status : undefined;

  // Error de negocio (límite del plan, validación...): la función respondió.
  if (status !== undefined && !TIMEOUT_STATUSES.has(status)) {
    let message = error.message;
    try {
      const payload = await (context as Response).clone().json();
      if (payload?.error) message = payload.error;
    } catch {
      // cuerpo no JSON: se queda el mensaje genérico
    }
    throw new Error(message);
  }

  // Corte por tiempo o de red: la función puede seguir generando.
  console.warn("[generateArticle] la llamada no terminó, esperando al artículo", { status, generationKey });
  const article = await waitForArticle(body.siteId, generationKey, startedAt);
  if (article) return { success: true, article };

  throw new Error(error.message || "Error al generar el artículo");
}
