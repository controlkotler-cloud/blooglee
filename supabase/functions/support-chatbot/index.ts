import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiting
// Note: This resets on function cold starts, but provides basic protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15; // 15 requests per minute

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

const SYSTEM_PROMPT = `Eres Bloobot, el asistente de soporte de Blooglee. Tu objetivo es ayudar a los usuarios a resolver problemas de integración con WordPress y responder preguntas sobre planes y precios.

REGLAS IMPORTANTES:
1. Sé amable, profesional y conciso
2. Si detectas un código de error (401, 403, 404, 500, etc.), da soluciones específicas basadas en la base de conocimiento
3. Ofrece pasos numerados y claros
4. Si el problema requiere cambios en WordPress, indica exactamente dónde ir en el panel de administración
5. Si el usuario menciona un plugin de seguridad (Wordfence, iThemes, Sucuri), prioriza soluciones relacionadas con ese plugin
6. Si el usuario menciona un plugin multiidioma (Polylang, WPML), guíalo hacia la configuración correcta
7. Si no puedes resolver el problema, sugiere contactar a soporte@blooglee.com
8. NUNCA inventes soluciones - basa tus respuestas únicamente en la información proporcionada

CONTEXTO DE BLOOGLEE:
- Blooglee es una plataforma que genera artículos SEO automáticamente y los publica en WordPress
- Usamos la API REST de WordPress con contraseñas de aplicación para autenticarnos
- Los problemas más comunes son: firewalls bloqueando la API, permisos insuficientes, plugins multiidioma mal configurados

PLANES DE BLOOGLEE:
- Free: 1 mes gratis de prueba con hasta 4 artículos/mes, 1 sitio web. Sin tarjeta de crédito.
- Starter (19€/mes o 15€/mes anual): 1 sitio, 4 artículos/mes, SEO avanzado, publicación automática, soporte por email
- Pro (29€/mes oferta lanzamiento o 39€/mes anual): Hasta 3 sitios, 30 artículos/mes, todo lo de Starter, soporte prioritario
- Agencia (149€/mes o 119€/mes anual): Hasta 10 sitios, artículos ilimitados, white-label, soporte prioritario

REGLAS SOBRE PLANES:
- Todos los usuarios empiezan con el plan Free de 1 mes gratis
- Después del mes gratuito, deben actualizar al plan que prefieran (Starter, Pro o Agencia)
- Si quieren Pro o Agencia antes de que termine el mes gratis, pueden actualizar anticipadamente
- Para más de 10 sitios, deben contactar ventas en hola@blooglee.com para un plan personalizado
- El Pro tiene oferta de lanzamiento: 29€/mes en lugar de 49€/mes

FORMATO DE RESPUESTA:
- Usa markdown para formatear
- Usa listas numeradas para pasos
- Usa **negrita** para destacar acciones importantes
- Incluye links a artículos de ayuda cuando sea relevante`;

async function searchKnowledgeBase(supabase: any, query: string, errorCode?: string): Promise<any[]> {
  // Extract keywords from query
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(w => w.length > 3);
  
  // Map common error codes to search terms
  const errorMappings: Record<string, string[]> = {
    "401": ["autenticación", "credenciales", "unauthorized", "contraseña"],
    "403": ["forbidden", "firewall", "bloqueado", "wordfence", "seguridad"],
    "404": ["not found", "api rest", "permalinks"],
    "500": ["servidor", "error interno", "hosting"],
  };

  if (errorCode && errorMappings[errorCode]) {
    keywords.push(...errorMappings[errorCode]);
  }

  // Search by keywords overlap
  const { data: articles, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .order("priority", { ascending: true }); // alta first

  if (error || !articles) {
    console.error("Error searching knowledge base:", error);
    return [];
  }

  // Score articles by keyword match
  const scoredArticles = articles.map((article: any) => {
    let score = 0;
    const articleText = [
      article.title,
      article.cause,
      article.solution,
      ...(article.symptoms || []),
      ...(article.keywords || []),
      ...(article.related_plugins || []),
    ].join(" ").toLowerCase();

    for (const keyword of keywords) {
      if (articleText.includes(keyword)) {
        score += 1;
      }
    }

    // Boost score for error code match
    if (errorCode && article.error_code === errorCode) {
      score += 5;
    }

    // Boost for high priority
    if (article.priority === "alta") {
      score += 2;
    } else if (article.priority === "media") {
      score += 1;
    }

    return { ...article, score };
  });

  // Return top 3 matching articles
  return scoredArticles
    .filter((a: any) => a.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3);
}

function extractErrorCode(text: string): string | undefined {
  // Common error patterns
  const patterns = [
    /error\s*(\d{3})/i,
    /(\d{3})\s*error/i,
    /status\s*(\d{3})/i,
    /código\s*(\d{3})/i,
    /\b(401|403|404|500|502|503)\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "anonymous";
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Demasiadas peticiones. Por favor, espera un momento." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60)
          } 
        }
      );
    }

    const { messages, error_context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate message count to prevent abuse
    if (messages.length > 20) {
      return new Response(
        JSON.stringify({ error: "Demasiados mensajes en la conversación" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the last user message for context
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
    const userQuery = lastUserMessage?.content || "";

    // Validate message content length
    if (userQuery.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Mensaje demasiado largo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract error code from context or message
    const errorCode = error_context?.code?.toString() || extractErrorCode(userQuery);

    // Search knowledge base for relevant articles
    const relevantArticles = await searchKnowledgeBase(supabase, userQuery, errorCode);
    console.log(`Found ${relevantArticles.length} relevant articles for query`);

    // Build context from articles
    let articlesContext = "";
    if (relevantArticles.length > 0) {
      articlesContext = "\n\nARTÍCULOS RELEVANTES DE LA BASE DE CONOCIMIENTO:\n";
      for (const article of relevantArticles) {
        articlesContext += `\n---\nTítulo: ${article.title}\n`;
        articlesContext += `Categoría: ${article.category}\n`;
        articlesContext += `Prioridad: ${article.priority}\n`;
        if (article.symptoms?.length > 0) {
          articlesContext += `Síntomas: ${article.symptoms.join(", ")}\n`;
        }
        if (article.cause) {
          articlesContext += `Causa: ${article.cause}\n`;
        }
        articlesContext += `Solución: ${article.solution}\n`;
        if (article.snippet_code) {
          articlesContext += `Código: \n\`\`\`php\n${article.snippet_code}\n\`\`\`\n`;
        }
        articlesContext += `Slug para link: /help/article/${article.slug}\n`;
      }
    }

    // Add error context if available
    let errorContextStr = "";
    if (error_context) {
      errorContextStr = `\n\nCONTEXTO DEL ERROR:\n- Código: ${error_context.code || "No especificado"}\n- Acción: ${error_context.action || "No especificada"}\n- Mensaje: ${error_context.message || "No especificado"}`;
    }

    // Build final system prompt with context
    const enhancedSystemPrompt = SYSTEM_PROMPT + articlesContext + errorContextStr;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service limit reached. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });

  } catch (error) {
    console.error("Support chatbot error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
