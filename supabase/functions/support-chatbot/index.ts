import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Expose-Headers": "x-conversation-id, x-bloobot-model",
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const CHAT_MODEL_CANDIDATES = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"];
const UPSTREAM_TIMEOUT_MS = 45_000;

const promptCache: Map<string, string> = new Map();
let cachedPromptVersion = 0;

const STOPWORDS = new Set([
  "de",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "y",
  "o",
  "u",
  "en",
  "con",
  "sin",
  "por",
  "para",
  "que",
  "como",
  "del",
  "al",
  "mi",
  "tu",
  "su",
  "es",
  "se",
  "me",
  "te",
  "lo",
  "no",
  "si",
  "ya",
  "muy",
  "mas",
  "más",
  "sobre",
  "desde",
  "hasta",
  "entre",
  "tengo",
  "tener",
  "error",
  "problema",
  "wordpress",
  "blooglee",
]);

const FALLBACK_SYSTEM_PROMPT = `Eres Bloobot, asistente técnico de Blooglee especializado en WordPress.

Tu trabajo es resolver incidencias reales de integración y publicación.

Reglas de respuesta:
1. Responde en español, claro y directo.
2. Si faltan datos para diagnosticar, pide SOLO 1-2 datos críticos.
3. Da pasos accionables numerados y específicos del panel de WordPress.
4. Si hay código de error (401/403/404/500...), prioriza la causa más probable y su prueba de verificación.
5. Si detectas plugins de seguridad (Wordfence, iThemes, Sucuri), prioriza whitelist/firewall.
6. Si detectas Polylang/WPML, prioriza configuración multiidioma REST.
7. Nunca inventes rutas ni funcionalidades no incluidas en el contexto.
8. Si no hay solución fiable, deriva a soporte@blooglee.com con qué datos enviar.

Formato:
- Usa markdown
- Usa listas numeradas para pasos
- Usa **negrita** en acciones clave
- Termina con "Comprobación final" (1-2 checks)

Usa este contexto de forma estricta:
{{articlesContext}}
{{errorContext}}
{{diagnosticsContext}}
{{userContext}}`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ErrorContext {
  code?: number | string;
  action?: string;
  message?: string;
  siteId?: string;
}

interface UserMetadata {
  userId?: string;
  plan?: string;
  sitesCount?: number;
  email?: string;
  registeredAt?: string;
}

interface RequestBody {
  messages: ChatMessage[];
  error_context?: ErrorContext;
  user_metadata?: UserMetadata;
  conversation_id?: string;
}

interface KnowledgeArticle {
  id: string;
  slug: string;
  category: string;
  priority: "alta" | "media" | "baja";
  error_code: string | null;
  title: string;
  symptoms: string[] | null;
  cause: string | null;
  solution: string;
  snippet_code: string | null;
  related_plugins: string[] | null;
  keywords: string[] | null;
  help_url: string | null;
}

function extractTextFromContentNode(node: unknown): string {
  if (typeof node === "string") return node;
  if (!node) return "";

  if (Array.isArray(node)) {
    return node
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          if (typeof rec.text === "string") return rec.text;
          if (typeof rec.content === "string") return rec.content;
        }
        return "";
      })
      .filter(Boolean)
      .join("");
  }

  if (node && typeof node === "object") {
    const rec = node as Record<string, unknown>;
    if (typeof rec.text === "string") return rec.text;
    if (typeof rec.content === "string") return rec.content;
  }

  return "";
}

function extractAssistantTextFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;

  const directContent = extractTextFromContentNode(root.content);
  if (directContent) return directContent;

  const outputText = extractTextFromContentNode(root.output_text);
  if (outputText) return outputText;

  const choices = root.choices;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      if (!choice || typeof choice !== "object") continue;
      const rec = choice as Record<string, unknown>;

      const deltaText = extractTextFromContentNode((rec.delta as Record<string, unknown> | undefined)?.content);
      if (deltaText) return deltaText;

      const messageText = extractTextFromContentNode((rec.message as Record<string, unknown> | undefined)?.content);
      if (messageText) return messageText;

      const text = extractTextFromContentNode(rec.text);
      if (text) return text;
    }
  }

  return "";
}

function buildSyntheticSsePayload(content: string): string {
  const safeContent = content.trim() || "No se pudo generar una respuesta en este intento.";
  return `data: ${JSON.stringify({ choices: [{ delta: { content: safeContent } }] })}\n\ndata: [DONE]\n\n`;
}

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (rateLimitMap.size > 2000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  const parts = normalized.split(/[^a-z0-9]+/g).filter(Boolean);
  return [...new Set(parts.filter((p) => p.length >= 3 && !STOPWORDS.has(p)))];
}

function extractErrorCode(text: string): string | undefined {
  const patterns = [
    /error\s*(\d{3})/i,
    /(\d{3})\s*error/i,
    /status\s*(\d{3})/i,
    /codigo\s*(\d{3})/i,
    /código\s*(\d{3})/i,
    /\b(401|403|404|405|409|422|429|500|502|503)\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function extractPluginHints(text: string): string[] {
  const t = normalizeText(text);
  const hints: string[] = [];
  if (t.includes("wordfence")) hints.push("wordfence");
  if (t.includes("ithemes")) hints.push("ithemes");
  if (t.includes("sucuri")) hints.push("sucuri");
  if (t.includes("polylang")) hints.push("polylang");
  if (t.includes("wpml")) hints.push("wpml");
  return hints;
}

function interpolateTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const safe = value ?? "";
    out = out.replaceAll(`{{${key}}}`, safe);
  }
  return out;
}

async function getPromptVersion(supabase: ReturnType<typeof createClient>): Promise<number> {
  try {
    const { data } = await supabase.from("prompt_cache_version").select("version").eq("id", 1).single();
    return data?.version ?? 1;
  } catch {
    return 1;
  }
}

async function getSystemPrompt(supabase: ReturnType<typeof createClient>): Promise<string> {
  const currentVersion = await getPromptVersion(supabase);
  if (currentVersion !== cachedPromptVersion) {
    promptCache.clear();
    cachedPromptVersion = currentVersion;
  }

  const cacheKey = "support-chatbot.system";
  const fromCache = promptCache.get(cacheKey);
  if (fromCache) return fromCache;

  try {
    const { data } = await supabase
      .from("prompts")
      .select("content")
      .eq("key", cacheKey)
      .eq("is_active", true)
      .single();

    const content = data?.content?.trim() || FALLBACK_SYSTEM_PROMPT;
    promptCache.set(cacheKey, content);
    return content;
  } catch {
    return FALLBACK_SYSTEM_PROMPT;
  }
}

function scoreArticle(article: KnowledgeArticle, tokens: string[], errorCode?: string, pluginHints?: string[]): number {
  let score = 0;
  const title = normalizeText(article.title || "");
  const cause = normalizeText(article.cause || "");
  const solution = normalizeText(article.solution || "");
  const symptoms = normalizeText((article.symptoms || []).join(" "));
  const keywords = normalizeText((article.keywords || []).join(" "));
  const plugins = normalizeText((article.related_plugins || []).join(" "));

  if (errorCode && article.error_code === errorCode) score += 12;

  for (const token of tokens) {
    if (title.includes(token)) score += 5;
    if (keywords.includes(token)) score += 4;
    if (symptoms.includes(token)) score += 3;
    if (cause.includes(token)) score += 2;
    if (solution.includes(token)) score += 2;
  }

  for (const hint of pluginHints || []) {
    if (plugins.includes(hint) || title.includes(hint) || solution.includes(hint)) {
      score += 5;
    }
  }

  if (article.priority === "alta") score += 2;
  if (article.priority === "media") score += 1;

  return score;
}

async function searchKnowledgeBase(
  supabase: ReturnType<typeof createClient>,
  query: string,
  errorCode?: string,
  pluginHints: string[] = [],
): Promise<KnowledgeArticle[]> {
  const tokens = tokenize(query);

  const { data: articles, error } = await supabase
    .from("knowledge_base")
    .select(
      "id, slug, category, priority, error_code, title, symptoms, cause, solution, snippet_code, related_plugins, keywords, help_url",
    )
    .limit(400);

  if (error || !articles) {
    console.error("Error searching knowledge base:", error);
    return [];
  }

  const scored = (articles as KnowledgeArticle[])
    .map((article) => ({
      article,
      score: scoreArticle(article, tokens, errorCode, pluginHints),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.article);

  return scored;
}

function buildArticlesContext(articles: KnowledgeArticle[]): string {
  if (!articles.length) {
    return "ARTÍCULOS RELEVANTES DE LA BASE DE CONOCIMIENTO: no se encontraron coincidencias directas.";
  }

  let out = "ARTÍCULOS RELEVANTES DE LA BASE DE CONOCIMIENTO:\n";
  for (const article of articles) {
    out += `\n- Título: ${article.title}`;
    out += `\n  Categoría: ${article.category} | Prioridad: ${article.priority}`;
    if (article.error_code) out += ` | Error: ${article.error_code}`;
    out += `\n  Solución: ${article.solution}`;
    if (article.snippet_code) out += `\n  Incluye snippet PHP disponible`;
    out += `\n  Link ayuda: /help/article/${article.slug}`;
    if (article.help_url) out += `\n  Link externo: ${article.help_url}`;
    out += "\n";
  }
  return out;
}

async function buildDiagnosticsContext(supabase: ReturnType<typeof createClient>, siteId?: string): Promise<string> {
  if (!siteId) return "";

  try {
    const { data, error } = await supabase
      .from("wordpress_diagnostics")
      .select("check_type, status, message, checked_at, raw_response")
      .eq("site_id", siteId)
      .order("checked_at", { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      return "";
    }

    let context = "DIAGNÓSTICOS RECIENTES DE WORDPRESS:\n";

    for (const row of data) {
      context += `\n- Tipo: ${row.check_type} | Estado: ${row.status} | Fecha: ${row.checked_at || "n/d"}`;
      if (row.message) context += `\n  Mensaje: ${row.message}`;

      const raw = row.raw_response as Record<string, unknown> | null;
      if (raw && typeof raw === "object") {
        const errors = Array.isArray(raw.errors) ? raw.errors.slice(0, 3).join(" | ") : "";
        if (errors) context += `\n  Errores detectados: ${errors}`;
      }
      context += "\n";
    }

    return context;
  } catch (e) {
    console.error("Error building diagnostics context:", e);
    return "";
  }
}

async function resolveAuthUser(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null,
  _userMetadata?: UserMetadata,
  _errorContext?: ErrorContext,
): Promise<{ id: string; verified: boolean } | null> {
  const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  if (token && token.split(".").length === 3) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        return { id: data.user.id, verified: true };
      }
    } catch {
      // no valid JWT
    }
  }

  // No unverified fallbacks — return null for unauthenticated users
  return null;
}

async function upsertConversation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  providedConversationId?: string,
  errorContext?: ErrorContext,
): Promise<string | null> {
  try {
    if (providedConversationId) {
      const { data: existing } = await supabase
        .from("support_conversations")
        .select("id, user_id")
        .eq("id", providedConversationId)
        .maybeSingle();

      if (existing?.id && existing.user_id === userId) {
        return existing.id;
      }
    }

    const { data, error } = await supabase
      .from("support_conversations")
      .insert({
        user_id: userId,
        site_id: errorContext?.siteId || null,
        status: "active",
        error_context: errorContext || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating support conversation:", error);
      return null;
    }

    return data?.id || null;
  } catch (e) {
    console.error("Exception upserting conversation:", e);
    return null;
  }
}

async function insertSupportMessage(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  suggestedArticles?: string[],
): Promise<void> {
  try {
    if (!content?.trim()) return;
    await supabase.from("support_messages").insert({
      conversation_id: conversationId,
      role,
      content,
      suggested_articles: suggestedArticles ?? [],
    });
  } catch (e) {
    console.error("Error inserting support message:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { messages, error_context, user_metadata, conversation_id } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 30) {
      return new Response(JSON.stringify({ error: "Demasiados mensajes en la conversación" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userQuery = lastUserMessage?.content?.trim() || "";

    if (!userQuery) {
      return new Response(JSON.stringify({ error: "Mensaje vacío" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userQuery.length > 3000) {
      return new Response(JSON.stringify({ error: "Mensaje demasiado largo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authUser = await resolveAuthUser(supabase, req.headers.get("Authorization"), user_metadata, error_context);
    const effectiveUserId = authUser?.id || null;
    const isVerified = authUser?.verified === true;

    const rateLimitIdentifier =
      effectiveUserId ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimit = checkRateLimit(rateLimitIdentifier);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again in a moment.",
          retry_after: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter ?? 60),
          },
        },
      );
    }

    const errorCodeFromContext = error_context?.code ? String(error_context.code) : undefined;
    const inferredErrorCode = extractErrorCode(
      [userQuery, error_context?.message, error_context?.action].filter(Boolean).join(" "),
    );
    const errorCode = errorCodeFromContext || inferredErrorCode;
    const pluginHints = extractPluginHints(
      [userQuery, error_context?.message, error_context?.action].filter(Boolean).join(" "),
    );

    const relevantArticles = await searchKnowledgeBase(supabase, userQuery, errorCode, pluginHints);
    const articlesContext = buildArticlesContext(relevantArticles);

    const diagnosticsContext = isVerified ? await buildDiagnosticsContext(supabase, error_context?.siteId) : "";
    const errorContextLines = error_context
      ? [
          error_context.code ? `- Código: ${error_context.code}` : "",
          error_context.action ? `- Acción: ${error_context.action}` : "",
          error_context.message ? `- Mensaje: ${error_context.message}` : "",
          error_context.siteId ? `- Site ID: ${error_context.siteId}` : "",
        ].filter(Boolean)
      : [];
    const errorContextBlock = errorContextLines.length > 0
      ? ["CONTEXTO DE ERROR RECIENTE:", ...errorContextLines].join("\n")
      : "";
    const userContextBlock = user_metadata
      ? [
          "CONTEXTO DE USUARIO:",
          user_metadata.plan ? `- Plan: ${user_metadata.plan}` : "",
          Number.isFinite(user_metadata.sitesCount) ? `- Sitios: ${user_metadata.sitesCount}` : "",
          user_metadata.registeredAt ? `- Alta: ${user_metadata.registeredAt}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    const systemPromptTemplate = await getSystemPrompt(supabase);
    const enhancedSystemPrompt = interpolateTemplate(systemPromptTemplate, {
      articlesContext,
      errorContext: errorContextBlock,
      diagnosticsContext,
      userContext: userContextBlock,
    });

    const activeConversationId = effectiveUserId
      ? await upsertConversation(supabase, effectiveUserId, conversation_id, error_context)
      : null;

    if (activeConversationId) {
      await insertSupportMessage(
        supabase,
        activeConversationId,
        "user",
        userQuery,
        relevantArticles.map((a) => a.id),
      );
    }

    let upstream: Response | null = null;
    let selectedModel = CHAT_MODEL_CANDIDATES[0];
    let lastUpstreamStatus: number | null = null;
    let lastUpstreamErrorBody = "";

    for (const modelCandidate of CHAT_MODEL_CANDIDATES) {
      selectedModel = modelCandidate;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

      try {
        const candidateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelCandidate,
            messages: [{ role: "system", content: enhancedSystemPrompt }, ...messages],
            stream: true,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (candidateResponse.ok) {
          upstream = candidateResponse;
          break;
        }

        lastUpstreamStatus = candidateResponse.status;
        lastUpstreamErrorBody = await candidateResponse.text().catch(() => "");
        console.error(
          `[support-chatbot] AI gateway model "${modelCandidate}" failed: ${candidateResponse.status} ${lastUpstreamErrorBody}`,
        );

        if (candidateResponse.status === 429 || candidateResponse.status === 402) {
          // Provider/global limits won't be solved by switching model.
          break;
        }
      } catch (upstreamErr) {
        clearTimeout(timeout);
        const msg = upstreamErr instanceof Error ? upstreamErr.message : String(upstreamErr);
        lastUpstreamStatus = null;
        lastUpstreamErrorBody = msg;
        console.error(`[support-chatbot] AI gateway model "${modelCandidate}" exception:`, msg);
      }
    }

    if (!upstream) {
      if (lastUpstreamStatus === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Por favor, inténtalo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (lastUpstreamStatus === 402) {
        return new Response(JSON.stringify({ error: "Límite de servicio alcanzado. Contacta con soporte@blooglee.com." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(
        `AI gateway error${lastUpstreamStatus ? ` ${lastUpstreamStatus}` : ""}: ${lastUpstreamErrorBody || "unknown"}`,
      );
    }

    const upstreamContentType = (upstream.headers.get("content-type") || "").toLowerCase();

    if (!upstream.body || !upstreamContentType.includes("text/event-stream")) {
      const rawUpstream = await upstream.text().catch(() => "");
      let assistantText = "";
      if (rawUpstream) {
        try {
          assistantText = extractAssistantTextFromPayload(JSON.parse(rawUpstream));
        } catch {
          assistantText = rawUpstream.trim();
        }
      }

      if (activeConversationId && assistantText.trim()) {
        await insertSupportMessage(
          supabase,
          activeConversationId,
          "assistant",
          assistantText,
          relevantArticles.map((a) => a.id),
        );
      }

      return new Response(buildSyntheticSsePayload(assistantText), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "x-conversation-id": activeConversationId || "",
          "x-bloobot-model": selectedModel,
        },
      });
    }

    const transform = new TransformStream<Uint8Array, Uint8Array>();
    const reader = upstream.body.getReader();
    const writer = transform.writable.getWriter();

    let assistantContent = "";
    let buffer = "";
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;

          await writer.write(value);

          buffer += decoder.decode(value, { stream: true });
          let newlineIdx = buffer.indexOf("\n");

          while (newlineIdx !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) {
              newlineIdx = buffer.indexOf("\n");
              continue;
            }

            const payload = line.slice(6).trim();
            if (payload && payload !== "[DONE]") {
              try {
                const parsed = JSON.parse(payload);
                const delta = extractAssistantTextFromPayload(parsed);
                if (delta) assistantContent += delta;
              } catch {
                // ignore partial/incompatible chunks
              }
            }

            newlineIdx = buffer.indexOf("\n");
          }
        }

        await writer.close();

        if (activeConversationId && assistantContent.trim()) {
          await insertSupportMessage(
            supabase,
            activeConversationId,
            "assistant",
            assistantContent,
            relevantArticles.map((a) => a.id),
          );
        }
      } catch (streamErr) {
        console.error("Streaming transform error:", streamErr);
        try {
          await writer.abort(streamErr);
        } catch {
          // no-op
        }
      }
    })();

    return new Response(transform.readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "x-conversation-id": activeConversationId || "",
        "x-bloobot-model": selectedModel,
      },
    });
  } catch (error) {
    console.error("Support chatbot error:", error);
    return new Response(
      JSON.stringify({
        error: "Ha ocurrido un error interno. Inténtalo de nuevo.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
