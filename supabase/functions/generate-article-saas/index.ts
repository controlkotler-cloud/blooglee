import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// ==========================================
// PROMPT CACHE SYSTEM
// ==========================================
// Global cache that persists between executions on the same worker
const promptCache: Map<string, string> = new Map();
let cacheVersion: number = 0;

// Substitute {{variable}} placeholders with actual values
function substituteVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }
  return result;
}

// Get prompt from cache or database, with fallback to hardcoded
async function getPrompt(
  supabase: any,
  key: string,
  variables: Record<string, string>,
  fallback: string,
): Promise<string> {
  try {
    // 1. Check cache version from database
    const { data: versionData, error: versionError } = await supabase
      .from("prompt_cache_version")
      .select("version")
      .eq("id", 1)
      .single();

    if (versionError) {
      console.log("Cache version check failed, using fallback:", versionError.message);
      return substituteVariables(fallback, variables);
    }

    const currentVersion = versionData?.version || 0;

    // 2. If version changed, clear cache
    if (currentVersion !== cacheVersion) {
      promptCache.clear();
      cacheVersion = currentVersion;
      console.log(`Prompt cache invalidated, new version: ${cacheVersion}`);
    }

    // 3. If in cache, use it
    if (promptCache.has(key)) {
      console.log(`Using cached prompt: ${key}`);
      return substituteVariables(promptCache.get(key)!, variables);
    }

    // 4. Load from database
    const { data, error } = await supabase
      .from("prompts")
      .select("content")
      .eq("key", key)
      .eq("is_active", true)
      .single();

    if (error || !data?.content) {
      console.log(`Prompt not found in DB (${key}), using fallback`);
      return substituteVariables(fallback, variables);
    }

    // 5. Store in cache and return
    promptCache.set(key, data.content);
    console.log(`Loaded prompt from DB: ${key}`);
    return substituteVariables(data.content, variables);
  } catch (e) {
    console.error(`Error loading prompt ${key}:`, e);
    return substituteVariables(fallback, variables);
  }
}

// ==========================================
// META DESCRIPTION FIXER - Uses AI to rewrite instead of truncating
// ==========================================
async function fixMetaDescription(metaDesc: string, focusKeyword: string, apiKey: string): Promise<string> {
  // Step 1: Always clean punctuation
  let cleaned = metaDesc
    .replace(/[!¡?¿]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Step 2: If already valid (≤145 chars, looks complete), return as-is
  if (cleaned.length <= 145 && cleaned.length >= 50 && /[a-záéíóúàèòç]$/i.test(cleaned)) {
    return cleaned;
  }

  // Step 3: If too long or looks cut off, regenerate with AI
  console.log(`Meta description needs fix: ${cleaned.length} chars, regenerating with AI...`);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: `Reescribe esta meta description para que tenga EXACTAMENTE entre 120 y 140 caracteres. 
La frase debe ser COMPLETA, con sentido, sin cortes ni puntos suspensivos.
Incluye la keyword "${focusKeyword}" de forma natural.
PROHIBIDO usar signos de exclamación (!) o interrogación (?).
Tono directo y profesional.

Meta description original: "${cleaned}"

Responde SOLO con la nueva meta description, sin comillas ni explicaciones.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      let newMeta = (data.choices?.[0]?.message?.content || "")
        .replace(/^["']|["']$/g, "")
        .replace(/[!¡?¿]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (newMeta.length >= 50 && newMeta.length <= 145) {
        console.log(`Meta description regenerated: ${newMeta.length} chars`);
        return newMeta;
      }
      console.log(`Regenerated meta still bad (${newMeta.length} chars), using smart truncation`);
    }
  } catch (e) {
    console.error("Meta description AI fix failed:", e);
  }

  // Step 4: Last resort - smart truncation that ends at a natural break
  if (cleaned.length > 145) {
    // Try to cut at last period before 145
    const sub = cleaned.substring(0, 145);
    const lastPeriod = sub.lastIndexOf(".");
    if (lastPeriod > 80) {
      return cleaned.substring(0, lastPeriod + 1);
    }
    // Try comma
    const lastComma = sub.lastIndexOf(",");
    if (lastComma > 80) {
      return cleaned.substring(0, lastComma);
    }
    // Last word boundary
    const lastSpace = sub.lastIndexOf(" ");
    return lastSpace > 100 ? cleaned.substring(0, lastSpace) : sub;
  }

  return cleaned;
}

// ==========================================
// MARKDOWN CLEANUP - Remove markdown syntax that slipped into HTML
// ==========================================
function cleanMarkdownFromHtml(content: string): string {
  if (!content) return content;

  // Step 1: Protect HTML tags from markdown processing
  // Extract all HTML tags and replace with placeholders
  const tags: string[] = [];
  let protected_content = content.replace(/<[^>]+>/g, (match) => {
    tags.push(match);
    return `%%HTMLTAG-${tags.length - 1}%%`;
  });

  // Step 2: Apply markdown cleanup ONLY on text content (not inside HTML tags)
  protected_content = protected_content
    // **texto** or __texto__ → <strong>texto</strong>
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    // *texto* or _texto_ → <em>texto</em>
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>")
    // ~~texto~~ → <del>texto</del>
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    // `codigo` → <code>codigo</code>
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  // Step 3: Restore original HTML tags
  protected_content = protected_content.replace(/%%HTMLTAG-(\d+)%%/g, (_, index) => {
    return tags[parseInt(index)];
  });

  return protected_content;
}

// ==========================================
// FALLBACK PROMPTS (used if DB prompt not found)
// ==========================================
const FALLBACK_PROMPTS = {
  topic: `Eres el mejor estratega de contenido editorial del mundo, especializado en el sector "{{sector}}".

EMPRESA: {{siteName}}
SECTOR: {{sector}}
{{description}}
ÁMBITO GEOGRÁFICO: {{scope}}
{{targetAudience}}
⚠️ La audiencia es CONTEXTO INTERNO: adapta el tema para que sea relevante e interesante para ese perfil, pero NUNCA menciones la audiencia en el tema.

PILAR DE CONTENIDO REQUERIDO: {{pillarType}}
{{pillarDescription}}

TONO DE VOZ: {{toneType}}
{{toneDescription}}

{{customTopicDirective}}

{{wpStyleNotes}}
{{wpRecentTopics}}

CONTEXTO TEMPORAL: Hoy es {{dayOfMonth}} de {{month}} de {{year}}.
⚠️ RESTRICCIÓN TEMPORAL: Solo mencionar eventos que AÚN NO hayan ocurrido. Si un evento ya pasó este mes, está PROHIBIDO.

{{usedTopics}}

⛔ TEMAS PROHIBIDOS (NUNCA generar temas que contengan estas palabras o conceptos):
{{avoidTopicsList}}

⛔ TÉRMINOS PROHIBIDOS DEL SECTOR (NUNCA usar estas palabras en el tema):
{{prohibitedTerms}}

Genera UN tema de blog que:
1. Encaje PERFECTAMENTE con el pilar de contenido "{{pillarType}}"
2. Sea relevante para el sector {{sector}}{{descriptionContext}}
3. Tenga potencial SEO real (algo que la gente busca en Google)
4. Si el pilar es "seasonal", adáptalo al periodo POSTERIOR al {{dayOfMonth}} de {{month}} {{year}}
5. NO mencione el nombre de la empresa
6. Sea COMPLETAMENTE DIFERENTE a los temas ya usados
7. NO incluyas el año en el tema (ej: "2026", "este año")
8. Usa capitalización española (solo inicial mayúscula, no Title Case)
9. Respeta el tono indicado
10. NO contenga NINGUNO de los términos prohibidos listados arriba

Responde SOLO con el tema (máx 80 caracteres), sin explicaciones ni comillas.`,

  articleSystem: `Eres un redactor especializado en marketing de contenidos para el sector {{sector}}. Tu objetivo es producir artículos que posicionen en Google, generen confianza en la marca y sean leídos hasta el final por la audiencia objetivo. Escribes con rigor, sin inventar datos ni URLs, y adaptas el tono y el enfoque al perfil del lector en cada artículo.

⚠️ REGLA FUNDAMENTAL: Toda la información de configuración (empresa, audiencia, tono, directriz temática, descripción) es CONTEXTO INTERNO para ti como redactor. NUNCA copies ni parafrasees estos datos en el artículo. El lector NUNCA debe percibir que hay un briefing detrás. Simplemente escribe contenido natural que RESUENE con el contexto dado.

═══════════════════════════════════════
1. EMPRESA (contexto interno)
═══════════════════════════════════════
Nombre: {{siteName}}
Sector: {{sector}}
{{description}}

═══════════════════════════════════════
2. CONTEXTO GEOGRÁFICO
═══════════════════════════════════════
{{geoContext}}

═══════════════════════════════════════
3. AUDIENCIA (CONTEXTO INTERNO - NO MENCIONAR EN EL TEXTO)
═══════════════════════════════════════
{{targetAudience}}
⚠️ REGLA CRÍTICA: La audiencia es CONTEXTO INTERNO para adaptar el tono, vocabulario, ejemplos y enfoque del artículo. NUNCA menciones la audiencia explícitamente en el texto (no escribas "nuestro público objetivo", "las mujeres de X edad", "los profesionales de Y"). El lector NUNCA debe sentir que el artículo describe a quién va dirigido. Simplemente escribe contenido que RESUENE con esa audiencia de forma natural.

═══════════════════════════════════════
4. TONO DE VOZ
═══════════════════════════════════════
Tipo: {{toneType}}
{{toneDescription}}

═══════════════════════════════════════
5. PILAR DE CONTENIDO
═══════════════════════════════════════
Tipo: {{pillarType}}
{{pillarDescription}}

═══════════════════════════════════════
6. DIRECTRIZ TEMÁTICA (contexto interno - NO copiar en el texto)
═══════════════════════════════════════
{{customTopicDirective}}

═══════════════════════════════════════
7. ESTILO DEL BLOG EXISTENTE
═══════════════════════════════════════
{{wpStyleNotes}}

═══════════════════════════════════════
8. TEMA DEL ARTÍCULO (OBLIGATORIO)
═══════════════════════════════════════
{{topic}}
⚠️ REGLA CRÍTICA: El artículo DEBE tratar EXACTAMENTE sobre este tema. El título (title) debe ser este tema tal cual o una variación MUY cercana (puedes ajustar ligeramente la redacción para SEO, pero el significado debe ser idéntico). NUNCA generes un artículo sobre un tema diferente al indicado aquí.

═══════════════════════════════════════
9. LONGITUD
═══════════════════════════════════════
{{lengthDescription}} (~{{lengthWords}} palabras)

═══════════════════════════════════════
10. REGLAS SEO (Yoast verde OBLIGATORIO)
═══════════════════════════════════════

FOCUS KEYWORD (2-4 palabras):
- La focus_keyword debe aparecer entre 5 y 7 veces en el artículo. No superes ese número para evitar keyword stuffing.
- Si no se proporciona una focus_keyword, elige tú una de 2-4 palabras con búsqueda real en Google España para el sector y el tema del artículo. Prioriza keywords informacionales o transaccionales con intención clara. Evita keywords demasiado genéricas (ej: 'farmacia sabadell') o demasiado largas.
- DEBE aparecer AL INICIO del seo_title
- DEBE aparecer en meta_description
- DEBE aparecer en el primer párrafo (primeras 100 palabras)
- DEBE aparecer en AL MENOS 2 subtítulos H2 o H3
- Usa SINÓNIMOS en otras secciones

ESTRUCTURA HTML:
- ⚠️ NO incluyas <h1> - WordPress lo añade automáticamente
- Empieza con un <h2> introductorio DIFERENTE al título (gancho/resumen)
- Párrafos de 2-4 oraciones con transiciones
- INCLUYE 1-2 subtítulos H2 en FORMATO PREGUNTA (¿Por qué...?, ¿Cómo...?)
- Si enumeras con dos puntos (:), usa lista HTML (<ul><li>)

META DESCRIPTION:
- MÁXIMO 145 caracteres
- Incluir focus_keyword naturalmente
- ⚠️ PROHIBIDO usar ! ¡ ? ¿
- Tono directo y profesional, sin frases vacías ("Descubre", "No te pierdas")

CAPITALIZACIÓN ESPAÑOLA:
- Solo primera letra en mayúscula + nombres propios

═══════════════════════════════════════
11. REGLAS DE ENLACES
═══════════════════════════════════════

ENLACE INTERNO (OBLIGATORIO):
- Incluye UN enlace a {{homeUrl}} en el artículo, de forma NATURAL
- Puedes mencionar "{{siteName}}" si encaja de forma orgánica en una frase. Si no encaja, usa un texto ancla genérico como "nuestra web", "nuestro sitio" o "esta guía"
- ⚠️ REGLA CRÍTICA SOBRE EL NOMBRE DE MARCA: "{{siteName}}" es una MARCA COMERCIAL registrada. Úsala SOLO como nombre propio de la empresa. NUNCA la uses como sustantivo común, genérico o sustituto de palabras del sector. NO escribas frases como "contar con un {{siteName}}", "tener {{siteName}} cerca", "la atención a la {{siteName}}" o "acudir a la {{siteName}}". Si necesitas un sustantivo genérico, usa la palabra real del sector (farmacia, clínica, tienda, etc.)
- Formato: <a href="{{homeUrl}}" target="_blank" rel="noopener">texto ancla natural</a>

ENLACES EXTERNOS (2 OBLIGATORIOS):
- Incluye 2 enlaces a fuentes de autoridad relevantes para el sector
- Enlaza SIEMPRE al dominio raíz o sección principal del sitio, NUNCA a artículos o URLs específicas que no puedas verificar con certeza
- Prioriza: asociaciones profesionales del sector, organismos oficiales, medios especializados de referencia
- PROHIBIDO: Wikipedia genérica, competidores directos, URLs inventadas
- El sistema verificará los enlaces y reemplazará los rotos
- Formato: <a href='URL' target='_blank' rel='noopener'>texto ancla descriptivo</a>

FRASE FINAL (OBLIGATORIA Y VARIADA):
- El artículo debe terminar con una frase final que invite al lector a seguir conectado
- VARÍA la fórmula de cierre: a veces invita al blog, a veces a las redes, a veces a ambos
- NO uses siempre la misma frase. Ejemplos de variaciones:
  * "Si te ha gustado este artículo, síguenos en {{instagramUrl}} para más contenido"
  * "Encuentra más guías como esta en {{blogUrl}}"
  * "Descubre más en {{blogUrl}} y no te pierdas nuestras novedades en {{instagramUrl}}"
  * "Para más consejos de {{sector}}, visita {{blogUrl}}"
- Incluye los enlaces reales proporcionados arriba
- Si solo hay blog_url o solo instagram_url, usa solo el que exista

═══════════════════════════════════════
12. TEMAS Y TÉRMINOS PROHIBIDOS
═══════════════════════════════════════
{{avoidTopicsList}}
{{prohibitedTerms}}

═══════════════════════════════════════
13. CONTEXTO TEMPORAL
═══════════════════════════════════════
Hoy es {{dateContext}}.
Cuando el tema sea estacional o ligado a una fecha concreta, especifica en el artículo cuándo ocurre ese evento para que el lector entienda el horizonte temporal (ej: 'el Día del Padre, que este año cae el 19 de marzo...').

═══════════════════════════════════════
14. FORMATO DE RESPUESTA
═══════════════════════════════════════
RESPONDE ÚNICAMENTE con un JSON válido con TODOS estos campos:
{
  "title": "DEBE ser el tema indicado en la sección 8 (o variación mínima, máx 70 chars, SIN nombre empresa, SIN año)",
  "seo_title": "SEO title que EMPIEZA con focus_keyword (máx 60 chars)",
  "meta_description": "Descripción directa (max 145 chars) con keyword, sin ! ni ?",
  "excerpt": "Resumen en tono conversacional del contenido del artículo, como si le contaras a alguien de qué va el post. Diferente a la meta_description. Máx 160 chars.",
  "focus_keyword": "keyword principal de 2-4 palabras",
  "slug": "url-con-focus-keyword-sin-espacios",
  "content": "<h2>Subtítulo gancho con keyword</h2><p>Primer párrafo con keyword...</p>...<h2>¿Pregunta PAA?</h2><p>Respuesta...</p>...<p>Frase final variada con enlaces</p>"
}`,

  articleUser: `Escribe el artículo sobre EXACTAMENTE este tema: "{{topic}}"

⚠️ El título (title) del JSON DEBE ser este tema o una variación mínima. NO inventes otro tema diferente.

Recuerda:
- Pilar de contenido: {{pillarType}} → {{pillarDescription}}
- Longitud: ~{{lengthWords}} palabras
- Incluye un enlace a {{homeUrl}} de forma natural (puedes usar "{{siteName}}" como ancla solo si encaja gramaticalmente; si no, usa "nuestra web" o similar)
- 2 enlaces externos a fuentes de autoridad
- Frase final variada con enlaces a {{blogUrl}} y/o {{instagramUrl}}
- Focus keyword mínimo 5 veces, en seo_title al inicio, meta_description, primer párrafo y 2+ subtítulos
- 1-2 H2 en formato pregunta (PAA)
- NO <h1>, empieza con <h2> gancho diferente al título
- Meta description: máx 145 chars, sin ! ni ?

RESPONDE SOLO CON JSON VÁLIDO.`,

  nativeCatalan: `Ets el millor redactor de blogs en català del món. Has de generar un article NATIU en català, NO una traducció.

REFERÈNCIA (article en castellà sobre el mateix tema - usa'l com a guia de contingut, NO el tradueixis literalment):
Títol: {{title}}
SEO Title: {{seoTitle}}
Meta: {{meta}}
Excerpt: {{excerpt}}
Focus Keyword: {{focusKeyword}}
Slug: {{slug}}
Contingut: {{content}}

INSTRUCCIONS:
- Escriu com un redactor NATIU català: amb expressions, girs i estil propis del català
- Mantén la mateixa estructura i les mateixes dades/informació que l'article de referència
- Adapta exemples i expressions al context català si escau
- NO facis una traducció literal: reescriu cada frase amb naturalitat
- El focus_keyword ha de ser l'equivalent natural en català
- La meta_description: màxim 145 caràcters, PROHIBIT usar ! o ?, to directe
- L'excerpt ha de ser diferent de la meta_description
- Mantén els enllaços externs iguals
- Adapta la frase final al català de forma natural

RESPON EN JSON (TOTS els camps obligatoris):
{
  "title": "Títol en català natiu",
  "seo_title": "SEO title en català (màx 60 chars)",
  "meta_description": "Meta descripció directa (max 145 chars), sense ! ni ?",
  "excerpt": "Resum en català (màx 160 chars, diferent de meta)",
  "focus_keyword": "keyword natural en català",
  "slug": "url-en-catala",
  "content": "Contingut HTML en català natiu"
}`,

  image: `Generate a professional blog header image for a {{sector}} business.

TOPIC: "{{topic}}"
{{description}}

COMPOSITION: {{composition_style}}

MOOD: {{mood}}

COLOR PALETTE: Use {{color_palette}} tones throughout the image.

VISUAL STYLE GUIDELINES:
- Editorial photography style, high quality
- The composition must feel intentional and varied, not generic
- Lighting should match the mood specified above
- Colors must align with the palette specified above

STRICT REQUIREMENTS:
- NO text of any kind
- NO logos, NO watermarks
- NO human faces
- All products must be completely generic and unbranded
- No visible text, labels or packaging on any product
- Suitable for blog header, 16:9 ratio`,
};

// ==========================================
// RATE LIMITING
// ==========================================
const userRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkUserRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = userRateLimitMap.get(userId);

  if (userRateLimitMap.size > 500) {
    for (const [key, value] of userRateLimitMap.entries()) {
      if (now > value.resetTime) {
        userRateLimitMap.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    userRateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// ==========================================
// TEAM EMAIL HELPERS
// ==========================================
async function getTeamMemberEmails(supabase: any, ownerId: string): Promise<string[]> {
  try {
    const { data: teamMembers } = await supabase.from("team_members").select("member_id").eq("owner_id", ownerId);

    if (!teamMembers || teamMembers.length === 0) return [];

    const memberIds = teamMembers.map((m: { member_id: string }) => m.member_id);
    const { data: profiles } = await supabase.from("profiles").select("email").in("user_id", memberIds);

    return profiles?.map((p: { email: string }) => p.email).filter(Boolean) || [];
  } catch (e) {
    console.error("Error fetching team member emails:", e);
    return [];
  }
}

// ==========================================
// EMAIL NOTIFICATION
// ==========================================
async function sendArticleNotification(
  userEmail: string,
  siteName: string,
  articleTitle: string,
  articleExcerpt: string,
  siteId: string,
  extraEmails: string[] = [],
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const siteUrl = "https://blooglee.lovable.app";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f3ff;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <header style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">📝 Tu artículo está listo</h1>
    </header>
    
    <main style="padding: 40px 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hola,</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Se ha generado un nuevo artículo para <strong style="color: #8B5CF6;">${siteName}</strong>:</p>
      
      <div style="background: linear-gradient(to right, #faf5ff, #fdf4ff); padding: 24px; border-radius: 12px; border-left: 4px solid #8B5CF6; margin: 24px 0;">
        <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">${articleTitle}</h2>
        <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">${articleExcerpt}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${siteUrl}/site/${siteId}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
          Ver artículo en tu panel
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        Si tienes WordPress configurado, puedes publicar el artículo directamente desde tu panel.
      </p>
    </main>
    
    <footer style="background-color: #faf5ff; padding: 24px 30px; text-align: center; border-top: 1px solid #e9d5ff;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Blooglee - Automatiza tu blog con IA
      </p>
      <p style="margin: 8px 0 0 0;">
        <a href="https://www.instagram.com/blooglee_/" style="color: #8B5CF6; text-decoration: none; font-size: 12px;">Síguenos en Instagram</a>
      </p>
    </footer>
  </div>
</body>
</html>`;

    const allRecipients = [userEmail, ...extraEmails.filter((e) => e !== userEmail)];
    console.log(`Sending article notification to: ${allRecipients.join(", ")}`);

    const { error } = await resend.emails.send({
      from: "Blooglee <noreply@blooglee.com>",
      to: allRecipients,
      subject: `📝 Nuevo artículo generado para ${siteName}`,
      html,
    });

    if (error) {
      console.error("Error sending notification email:", error);
    } else {
      console.log("Notification email sent to:", userEmail);
    }
  } catch (error) {
    console.error("Exception sending notification email:", error);
  }
}

// ==========================================
// PUBLISHED NOTIFICATION EMAIL
// ==========================================
async function sendPublishedNotification(
  userEmail: string,
  siteName: string,
  articleTitle: string,
  postUrl: string,
  siteId: string,
  extraEmails: string[] = [],
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    throw new Error("missing_resend_api_key");
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const siteUrl = "https://blooglee.lovable.app";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f3ff;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <header style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🚀 Artículo publicado</h1>
    </header>
    
    <main style="padding: 40px 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">¡Buenas noticias!</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Tu artículo para <strong style="color: #8B5CF6;">${siteName}</strong> se ha publicado automáticamente en WordPress:</p>
      
      <div style="background: linear-gradient(to right, #f0fdf4, #ecfdf5); padding: 24px; border-radius: 12px; border-left: 4px solid #22c55e; margin: 24px 0;">
        <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">${articleTitle}</h2>
        <a href="${postUrl}" style="color: #8B5CF6; font-size: 14px; word-break: break-all;">${postUrl}</a>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${postUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(34, 197, 94, 0.4); margin-bottom: 12px;">
          Ver artículo en tu blog
        </a>
      </div>
      
      <div style="text-align: center;">
        <a href="${siteUrl}/site/${siteId}" style="color: #8B5CF6; text-decoration: none; font-size: 14px;">
          Ver en tu panel de Blooglee →
        </a>
      </div>
    </main>
    
    <footer style="background-color: #faf5ff; padding: 24px 30px; text-align: center; border-top: 1px solid #e9d5ff;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Blooglee - Automatiza tu blog con IA
      </p>
      <p style="margin: 8px 0 0 0;">
        <a href="https://www.instagram.com/blooglee_/" style="color: #8B5CF6; text-decoration: none; font-size: 12px;">Síguenos en Instagram</a>
      </p>
    </footer>
  </div>
</body>
</html>`;

    const allRecipients = [userEmail, ...extraEmails.filter((e) => e !== userEmail)];
    console.log(`Sending published notification to: ${allRecipients.join(", ")}`);

    const { error } = await resend.emails.send({
      from: "Blooglee <noreply@blooglee.com>",
      to: allRecipients,
      subject: `🚀 Artículo publicado en ${siteName}`,
      html,
    });

    if (error) {
      console.error("Error sending published notification:", error);
    } else {
      console.log("Published notification sent to:", userEmail);
    }
  } catch (error) {
    console.error("Exception sending published notification:", error);
  }
}

// ==========================================
// TYPES
// ==========================================
interface WordPressContext {
  avgLength?: number;
  commonCategories?: Array<{ name: string; count: number }>;
  lastTopics?: string[];
  detected_tone?: string;
  main_themes?: string[];
  style_notes?: string;
  analyzed_at?: string;
}

interface SiteData {
  id: string;
  name: string;
  location?: string | null;
  sector?: string | null;
  description?: string | null;
  languages?: string[];
  blog_url?: string | null;
  instagram_url?: string | null;
  geographic_scope?: string;
  include_featured_image?: boolean;
  user_id: string;
  publish_frequency?: string;
  // Enriched context fields
  tone?: string | null;
  target_audience?: string | null;
  content_pillars?: string[];
  avoid_topics?: string[];
  preferred_length?: string | null;
  wordpress_context?: WordPressContext | null;
  last_pillar_index?: number;
}

interface RequestBody {
  siteId: string;
  topic?: string | null;
  month: number;
  year: number;
  isScheduled?: boolean;
  userId?: string;
  generationKey?: string;
}

/**
 * Builds a deterministic generation key for deduplication.
 * Must match the logic in generate-scheduler.
 */
function buildGenerationKey(frequency: string, month: number, year: number, now: Date): string {
  const normalizedFreq = normalizeFrequency(frequency);
  const m = String(month).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const weekOfMonth = Math.ceil(now.getUTCDate() / 7);

  switch (normalizedFreq) {
    case "daily":
    case "daily_weekdays":
      return `${year}-${m}-${day}`;
    case "weekly":
    case "biweekly":
      return `${year}-${m}-w${weekOfMonth}`;
    case "monthly":
    default:
      return `${year}-${m}`;
  }
}

interface SectorContext {
  examples: string[];
  prohibitedTerms: string[];
  fallbackQuery: string;
  toneDescription?: string;
}

// ==========================================
// PILLAR DESCRIPTIONS
// ==========================================
const PILLAR_DESCRIPTIONS: Record<string, string> = {
  educational:
    "Contenido EDUCATIVO: guías prácticas, tutoriales paso a paso, how-to, consejos aplicables inmediatamente. Enseña algo útil al lector.",
  trends:
    "Contenido de TENDENCIAS: novedades del sector, innovación, cambios recientes, lo que viene. Mantén al lector actualizado.",
  cases:
    "Contenido de CASOS PRÁCTICOS: ejemplos reales, testimonios, historias de éxito, antes/después. Muestra resultados concretos.",
  seasonal:
    "Contenido ESTACIONAL: adaptado a la época del año, fechas señaladas, temporadas comerciales, eventos relevantes.",
  opinion:
    "Contenido de OPINIÓN/ANÁLISIS: perspectivas del sector, reflexiones profesionales, análisis de situaciones, visión experta.",
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  formal: "Tono FORMAL y profesional: lenguaje institucional, serio pero no frío, evita coloquialismos.",
  casual: "Tono CERCANO pero experto: accesible sin perder autoridad, tutea al lector, conversacional.",
  technical: "Tono TÉCNICO y especializado: usa terminología del sector, para audiencia experta.",
  educational: "Tono DIVULGATIVO y accesible: explica conceptos complejos de forma simple, pedagógico.",
};

const LENGTH_TARGETS: Record<string, { words: number; description: string; maxTokens: number }> = {
  short: { words: 800, description: "~800 palabras, lectura rápida de 3 minutos", maxTokens: 6000 },
  medium: { words: 1500, description: "~1500 palabras, lectura de 6-7 minutos", maxTokens: 10000 },
  long: { words: 2500, description: "~2500 palabras, guía completa de 10+ minutos", maxTokens: 16000 },
};

type PreferredLength = "short" | "medium" | "long";

function normalizePreferredLength(value: string | null | undefined): PreferredLength {
  if (value === "short" || value === "medium" || value === "long") return value;
  return "medium";
}

function getMaxPreferredLengthForPlan(plan: string, isSuperAdmin: boolean): PreferredLength {
  if (isSuperAdmin) return "long";
  if (plan === "free") return "short";
  if (plan === "starter") return "medium";
  return "long";
}

function clampPreferredLength(preferred: PreferredLength, maxAllowed: PreferredLength): PreferredLength {
  const rank: Record<PreferredLength, number> = { short: 1, medium: 2, long: 3 };
  return rank[preferred] <= rank[maxAllowed] ? preferred : maxAllowed;
}

// ==========================================
// SECTOR CONTEXTS
// ==========================================
const SECTOR_IMAGE_CONTEXTS: Record<string, SectorContext> = {
  marketing: {
    examples: [
      "business team meeting modern office laptop",
      "digital marketing analytics dashboard screen",
      "creative workspace minimal design desk",
    ],
    prohibitedTerms: ["facebook logo", "instagram icon", "twitter", "tiktok"],
    fallbackQuery: "professional business workspace modern office",
  },
  tecnologia: {
    examples: [
      "programmer coding laptop dark modern office",
      "technology innovation abstract blue lights",
      "startup team collaboration whiteboard",
    ],
    prohibitedTerms: ["apple logo", "microsoft", "google"],
    fallbackQuery: "technology innovation abstract professional",
  },
  salud: {
    examples: [
      "wellness lifestyle healthy living nature",
      "medical professional consultation friendly",
      "healthcare innovation modern clinic",
    ],
    prohibitedTerms: ["pills", "medicine bottles", "hospital bed", "surgery", "blood"],
    fallbackQuery: "wellness health professional modern",
  },
  farmacia: {
    examples: [
      "pharmacy shelves products wellness",
      "natural health supplements herbs",
      "wellness lifestyle healthy products",
    ],
    prohibitedTerms: ["pills closeup", "medicine bottles", "hospital", "surgery", "syringes", "blood"],
    fallbackQuery: "pharmacy wellness natural health products",
  },
  belleza: {
    examples: [
      "beautiful hairstyle woman portrait natural light",
      "elegant haircut woman closeup professional photo",
      "hair color highlights natural",
    ],
    prohibitedTerms: ["barber", "barbershop", "beard", "men haircut", "shaving"],
    fallbackQuery: "beautiful hairstyle woman portrait elegant",
  },
  hosteleria: {
    examples: [
      "restaurant interior modern elegant dining tables",
      "chef cooking kitchen professional gourmet",
      "hotel lobby luxury modern reception",
    ],
    prohibitedTerms: ["fast food", "dirty kitchen", "drunk", "messy"],
    fallbackQuery: "restaurant elegant dining professional interior",
  },
  default: {
    examples: [
      "professional team collaboration office",
      "business success growth abstract",
      "modern workspace minimal clean",
    ],
    prohibitedTerms: [],
    fallbackQuery: "professional business success modern",
  },
};

const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MONTH_NAMES_CA = [
  "Gener",
  "Febrer",
  "Març",
  "Abril",
  "Maig",
  "Juny",
  "Juliol",
  "Agost",
  "Setembre",
  "Octubre",
  "Novembre",
  "Desembre",
];

// ==========================================
// JSON REPAIR: Escape control chars ONLY inside string literals
// ==========================================
function escapeControlCharsInsideStrings(input: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const code = input.charCodeAt(i);

    if (escaped) {
      // Previous char was backslash inside string, just add this char
      result += char;
      escaped = false;
      continue;
    }

    if (char === '"' && !escaped) {
      // Toggle string state
      inString = !inString;
      result += char;
      continue;
    }

    if (char === "\\" && inString) {
      // Next char is escaped
      escaped = true;
      result += char;
      continue;
    }

    if (inString) {
      // Inside a string - escape control characters
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else if (code >= 0x00 && code <= 0x1f) {
        // Other control chars - convert to unicode escape
        result += "\\u" + code.toString(16).padStart(4, "0");
      } else {
        result += char;
      }
    } else {
      // Outside string - keep as-is (whitespace is valid JSON structure)
      result += char;
    }
  }

  return result;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Fetch attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError || new Error("All retry attempts failed");
}

function detectSectorCategory(sector: string | null | undefined): string {
  if (!sector) return "default";
  const s = sector.toLowerCase();

  // IMPORTANT: Check specific sectors BEFORE generic ones
  // "farmacia" must be checked before "digital" (a pharmacy site might mention "digital")
  if (s.includes("farmacia") || s.includes("parafarm") || s.includes("dermofarm") || s.includes("botica"))
    return "farmacia";
  if (s.includes("peluqu") || s.includes("cabello") || s.includes("estétic") || s.includes("beauty")) return "belleza";
  if (
    s.includes("restaur") ||
    s.includes("hotel") ||
    s.includes("hostel") ||
    s.includes("bar ") ||
    s.includes("cafeter")
  )
    return "hosteleria";
  if (s.includes("marketing") || s.includes("seo") || s.includes("publicidad") || s.includes("agencia"))
    return "marketing";
  if (s.includes("tecnolog") || s.includes("software") || s.includes("informát") || s.includes("saas"))
    return "tecnologia";
  if (s.includes("salud") || s.includes("médic") || s.includes("clínic") || s.includes("wellness")) return "salud";

  return "default";
}

function buildGeoContext(site: SiteData): { geoContext: string; locationInfo: string } {
  const scope = site.geographic_scope || "local";

  switch (scope) {
    case "local":
      if (!site.location || site.location.trim() === "") {
        return {
          geoContext: `- El contenido es de ámbito general, sin referencias a ubicaciones específicas.`,
          locationInfo: "Ámbito: General",
        };
      }
      return {
        geoContext: `- Menciona la población "${site.location}" 1-2 veces para potenciar el SEO local.`,
        locationInfo: `Localidad: ${site.location}`,
      };

    case "regional":
      if (!site.location || site.location.trim() === "") {
        return {
          geoContext: `- El contenido es de ámbito regional, pero sin región específica.`,
          locationInfo: "Ámbito: Regional",
        };
      }
      return {
        geoContext: `- Menciona la región "${site.location}" 1-2 veces para SEO regional.`,
        locationInfo: `Región: ${site.location}`,
      };

    case "national":
    default:
      return {
        geoContext: `- PROHIBIDO mencionar cualquier ubicación geográfica específica. El contenido es para toda España.`,
        locationInfo: "Ámbito: Nacional (toda España)",
      };
  }
}

async function getUserProfile(
  supabaseClient: any,
  userId: string,
): Promise<{ posts_limit: number; plan: string } | null> {
  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("posts_limit, plan")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  } catch (e) {
    console.error("Exception fetching profile:", e);
    return null;
  }
}

async function isUserSuperAdmin(supabaseClient: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "superadmin")
      .maybeSingle();

    if (error) {
      console.error("Error checking superadmin role:", error);
      return false;
    }

    return Boolean(data);
  } catch (e) {
    console.error("Exception checking superadmin role:", e);
    return false;
  }
}

// Count ALL articles ever generated by this user (for Free plan lifetime limit)
async function countTotalArticles(supabaseClient: any, userId: string): Promise<number> {
  try {
    const { count, error } = await supabaseClient
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error counting total articles:", error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error("Exception counting total articles:", e);
    return 0;
  }
}

async function countArticlesThisMonth(
  supabaseClient: any,
  userId: string,
  month: number,
  year: number,
): Promise<number> {
  try {
    const { count, error } = await supabaseClient
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year);

    if (error) {
      console.error("Error counting articles:", error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error("Exception counting articles:", e);
    return 0;
  }
}

function normalizeFrequency(rawFrequency: string | null | undefined): string {
  if (!rawFrequency) return "monthly";
  if (rawFrequency === "fortnightly") return "biweekly";
  return rawFrequency;
}

// Get dynamic topics limit based on publish frequency
function getTopicsLimitForFrequency(publishFrequency: string): number {
  const normalizedFrequency = normalizeFrequency(publishFrequency);

  switch (normalizedFrequency) {
    case "daily":
    case "daily_weekdays":
      return 60; // ~2 months of memory for daily
    case "weekly":
    case "biweekly":
      return 30; // ~6-7 months for weekly
    case "monthly":
    default:
      return 20; // ~20 months for monthly
  }
}

async function logSiteActivity(
  supabaseClient: any,
  siteId: string,
  userId: string,
  actionType: string,
  description: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { error } = await supabaseClient.from("site_activity_log").insert({
      site_id: siteId,
      user_id: userId,
      action_type: actionType,
      description,
      metadata,
    });

    if (error) {
      console.error(`[site-activity] Failed to log ${actionType}:`, error);
    }
  } catch (error) {
    console.error(`[site-activity] Exception logging ${actionType}:`, error);
  }
}

async function getUsedTopicsForSite(supabaseClient: any, siteId: string, limit: number = 50): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from("articles")
      .select("topic")
      .eq("site_id", siteId)
      .order("generated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching used topics:", error);
      return [];
    }

    return data?.map((a: { topic: string }) => a.topic) || [];
  } catch (e) {
    console.error("Exception fetching used topics:", e);
    return [];
  }
}
// ==========================================
// SPANISH CAPITALIZATION ENFORCEMENT
// ==========================================

// Words that should stay lowercase in Spanish titles (unless first word)
const SPANISH_LOWERCASE_WORDS = new Set([
  "a",
  "al",
  "ante",
  "bajo",
  "con",
  "contra",
  "de",
  "del",
  "desde",
  "durante",
  "e",
  "el",
  "en",
  "entre",
  "hacia",
  "hasta",
  "la",
  "las",
  "lo",
  "los",
  "mediante",
  "ni",
  "o",
  "para",
  "pero",
  "por",
  "que",
  "se",
  "según",
  "sin",
  "sobre",
  "su",
  "sus",
  "tan",
  "tu",
  "tus",
  "u",
  "un",
  "una",
  "uno",
  "unos",
  "unas",
  "y",
  "ya",
  "como",
  "más",
  "muy",
  "nos",
  "es",
  "son",
  "no",
  "si",
  "te",
  "mi",
  "me",
]);

// Words/patterns that should keep their original casing (brands, acronyms, etc.)
const PRESERVE_CASE_PATTERNS =
  /^(SEO|HTML|CSS|API|URL|FAQ|CRM|SaaS|WordPress|Google|Instagram|Facebook|TikTok|LinkedIn|YouTube|iOS|AI|IA|B2B|B2C|KPI|ROI|CMS|PHP|UX|UI|RGPD|LOPD|IVA|DNI|NIF|CBD|SPF|LED|OK|etc|vs)$/i;

function enforceSpanishCapitalizationText(text: string): string {
  if (!text || text.length < 2) return text;

  // Split into words, preserving whitespace and punctuation
  const words = text.split(/(\s+)/);
  let isFirstWord = true;

  const result = words.map((word) => {
    // Skip whitespace tokens
    if (/^\s+$/.test(word)) return word;

    // Skip empty
    if (!word) return word;

    // Preserve brands/acronyms
    if (PRESERVE_CASE_PATTERNS.test(word.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/g, ""))) {
      isFirstWord = false;
      return word;
    }

    // Extract leading punctuation (¿, ¡, ", etc.)
    const leadingPunct = word.match(/^([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)/)?.[1] || "";
    const trailingPunct = word.match(/([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)$/)?.[1] || "";
    const core =
      word.slice(leadingPunct.length, word.length - (trailingPunct.length || 0)) || word.slice(leadingPunct.length);

    if (!core) {
      return word;
    }

    // Check if starts after sentence-ending punctuation
    const isAfterSentenceEnd = leadingPunct.includes("¿") || leadingPunct.includes("¡");

    if (isFirstWord || isAfterSentenceEnd) {
      isFirstWord = false;
      // Capitalize first letter, lowercase rest (unless it's a preserved pattern)
      return leadingPunct + core.charAt(0).toUpperCase() + core.slice(1).toLowerCase() + trailingPunct;
    }

    isFirstWord = false;

    // Common Spanish lowercase words
    if (SPANISH_LOWERCASE_WORDS.has(core.toLowerCase())) {
      return leadingPunct + core.toLowerCase() + trailingPunct;
    }

    // Everything else: lowercase (Spanish capitalization rule)
    return leadingPunct + core.charAt(0).toLowerCase() + core.slice(1).toLowerCase() + trailingPunct;
  });

  return result.join("");
}

function enforceSpanishCapitalizationHtml(htmlContent: string): string {
  if (!htmlContent) return htmlContent;

  let fixed = htmlContent;
  let fixCount = 0;

  // Fix H2 and H3 tags in HTML
  fixed = fixed.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (_match, tag, attrs, innerText) => {
    // Don't touch if it contains HTML links or other tags (except simple formatting)
    if (/<a\s/i.test(innerText)) return _match;

    const cleaned = enforceSpanishCapitalizationText(innerText.replace(/<[^>]+>/g, ""));

    // Reconstruct with any inline tags preserved
    if (cleaned !== innerText.replace(/<[^>]+>/g, "")) {
      fixCount++;
      // Simple case: no inner HTML tags
      if (!/<[^>]+>/.test(innerText)) {
        return `<${tag}${attrs}>${cleaned}</${tag}>`;
      }
    }
    return _match;
  });

  if (fixCount > 0) {
    console.log(`Capitalization enforcement: fixed ${fixCount} HTML headings`);
  }

  return fixed;
}

function enforceSpanishCapitalizationField(text: string): string {
  if (!text) return text;
  const fixed = enforceSpanishCapitalizationText(text);
  if (fixed !== text) {
    console.log(`Capitalization fix: "${text}" → "${fixed}"`);
  }
  return fixed;
}

// ==========================================
// EXTERNAL LINK VERIFICATION
// ==========================================
function getOriginUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `${url.protocol}//${url.host}`;
  } catch {
    return urlString;
  }
}

function isHomepageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Consider homepage if path is "/" or empty, with no query params
    return (url.pathname === "/" || url.pathname === "") && !url.search;
  } catch {
    return false;
  }
}

async function verifyAndCleanExternalLinks(htmlContent: string): Promise<string> {
  if (!htmlContent) return htmlContent;

  const linkRegex = /<a\s+([^>]*href="(https?:\/\/[^"]+)"[^>]*)>([^<]*)<\/a>/gi;
  const matches: Array<{ full: string; attrs: string; url: string; text: string }> = [];

  let match;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    matches.push({
      full: match[0],
      attrs: match[1],
      url: match[2],
      text: match[3],
    });
  }

  if (matches.length === 0) {
    console.log("No external links found in content");
    return htmlContent;
  }

  console.log(`Verifying ${matches.length} external links...`);

  const linksToVerify = matches.slice(0, 10);
  let cleanedContent = htmlContent;
  let fixedCount = 0;
  let keptCount = 0;

  const BROWSER_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  for (const link of linksToVerify) {
    if (isHomepageUrl(link.url)) {
      console.log(`Homepage URL, keeping as-is: ${link.url}`);
      continue;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const headResponse = await fetch(link.url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": BROWSER_UA },
      });

      clearTimeout(timeout);

      if (headResponse.status >= 200 && headResponse.status < 400) {
        console.log(`Link OK (${headResponse.status}): ${link.url}`);
        continue;
      }

      if (headResponse.status === 404 || headResponse.status === 410) {
        const originUrl = getOriginUrl(link.url);
        console.log(`Broken link (${headResponse.status}): ${link.url} → ${originUrl}`);
        const newLink = `<a href="${originUrl}" target="_blank" rel="noopener">${link.text}</a>`;
        cleanedContent = cleanedContent.replace(link.full, newLink);
        fixedCount++;
        continue;
      }

      if (headResponse.status === 403 || headResponse.status === 405) {
        // HEAD blocked, retry with GET
        try {
          const ctrl2 = new AbortController();
          const t2 = setTimeout(() => ctrl2.abort(), 8000);
          const getResponse = await fetch(link.url, {
            method: "GET",
            signal: ctrl2.signal,
            redirect: "follow",
            headers: { "User-Agent": BROWSER_UA },
          });
          clearTimeout(t2);
          // Consume body to avoid resource leak
          await getResponse.text().catch(() => {});

          if (getResponse.status === 404 || getResponse.status === 410) {
            const originUrl = getOriginUrl(link.url);
            console.log(`Broken link on GET (${getResponse.status}): ${link.url} → ${originUrl}`);
            const newLink = `<a href="${originUrl}" target="_blank" rel="noopener">${link.text}</a>`;
            cleanedContent = cleanedContent.replace(link.full, newLink);
            fixedCount++;
          } else {
            console.log(`Link kept after GET retry (${getResponse.status}): ${link.url}`);
            keptCount++;
          }
        } catch {
          console.log(`GET retry failed, keeping original: ${link.url}`);
          keptCount++;
        }
        continue;
      }

      // 500+ or other status → keep original (likely temporary server error)
      console.log(`Server error (${headResponse.status}), keeping original: ${link.url}`);
      keptCount++;
    } catch (error) {
      // Network error or timeout → KEEP original link
      console.log(
        `Network/timeout error, keeping original: ${link.url} (${error instanceof Error ? error.message : "unknown"})`,
      );
      keptCount++;
    }
  }

  console.log(`Link verification complete: ${fixedCount} fixed, ${keptCount} kept despite errors`);
  return cleanedContent;
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody: RequestBody = await req.json();
    const { isScheduled, userId: schedulerUserId } = requestBody;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === SUPABASE_SERVICE_ROLE_KEY;

    let supabase: any;
    let userId: string;

    if (isServiceRole) {
      if (!isScheduled) {
        return new Response(JSON.stringify({ error: "Forbidden: internal auth requires scheduled mode" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!schedulerUserId) {
        return new Response(JSON.stringify({ error: "Missing scheduler user context" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("=== SCHEDULER MODE ===");
      supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      userId = schedulerUserId;
      console.log("Using scheduler userId:", userId);
    } else {
      if (isScheduled) {
        return new Response(JSON.stringify({ error: "Forbidden: isScheduled is reserved for internal scheduler" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

      if (claimsError || !claimsData?.claims) {
        console.error("Auth error:", claimsError);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = claimsData.claims.sub as string;

      const rateLimitResult = checkUserRateLimit(userId);
      if (!rateLimitResult.allowed) {
        console.log(`Rate limit exceeded for user: ${userId}`);
        return new Response(JSON.stringify({ error: "Demasiadas peticiones. Por favor, espera un momento." }), {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60),
          },
        });
      }
    }

    console.log("=== GENERATE ARTICLE SAAS ===");
    console.log("User ID:", userId);
    console.log("Is Scheduled:", isScheduled);

    const { siteId, topic: providedTopic, month, year } = requestBody;
    console.log("Site ID:", siteId);
    console.log("Month/Year:", month, year);

    const serviceClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch site and validate ownership or team membership
    let site: any = null;
    let siteOwnerUserId: string = userId;

    // First try direct ownership
    const { data: ownedSite } = await supabase
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .eq("user_id", userId)
      .single();

    if (ownedSite) {
      site = ownedSite;
      siteOwnerUserId = ownedSite.user_id;
    } else {
      // Check team membership (member -> owner only) without any cross-account bypass
      const { data: teamSite } = await serviceClient.from("sites").select("*").eq("id", siteId).single();

      if (teamSite) {
        // Check if user is a team member of the site owner.
        const { data: membership } = await serviceClient
          .from("team_members")
          .select("id")
          .eq("owner_id", teamSite.user_id)
          .eq("member_id", userId)
          .maybeSingle();

        if (membership) {
          site = teamSite;
          siteOwnerUserId = teamSite.user_id;
          console.log(`Team member ${userId} accessing site owned by ${siteOwnerUserId}`);
        }
      }
    }

    if (!site) {
      console.error("Site not found or access denied");
      return new Response(JSON.stringify({ error: "Site not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Site:", site.name);
    console.log("Sector:", site.sector);

    // Check plan limits using the SITE OWNER's profile (not the team member's)
    const profile = await getUserProfile(serviceClient, siteOwnerUserId);
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteOwnerIsSuperAdmin = await isUserSuperAdmin(serviceClient, siteOwnerUserId);

    if (siteOwnerIsSuperAdmin) {
      console.log("Superadmin account: unlimited sites/posts on own account");
    } else {
      // Free plan: lifetime limit of 1 article total (not per month)
      if (profile.plan === "free") {
        const totalArticles = await countTotalArticles(serviceClient, siteOwnerUserId);
        console.log(`Free plan: total articles ever: ${totalArticles}`);

        if (totalArticles >= 1) {
          return new Response(
            JSON.stringify({
              error:
                "Ya has usado tu artículo de prueba. Si quieres seguir publicando, te ayudamos a ampliar tu plan desde Facturación.",
              limit: 1,
              current: totalArticles,
              plan: "free",
              isLifetimeLimit: true,
              upgrade_url: "/billing",
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } else if (profile.plan !== "agency") {
        // Paid non-agency plans: monthly limit
        const articlesThisMonth = await countArticlesThisMonth(serviceClient, siteOwnerUserId, month, year);
        console.log(`Articles this month: ${articlesThisMonth}/${profile.posts_limit}`);

        if (articlesThisMonth >= profile.posts_limit) {
          return new Response(
            JSON.stringify({
              error:
                "Has alcanzado el límite mensual de tu plan. Si quieres seguir publicando este mes, te ayudamos a ampliar tu plan desde Facturación.",
              limit: profile.posts_limit,
              current: articlesThisMonth,
              plan: profile.plan,
              upgrade_url: "/billing",
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } else {
        console.log("Agency plan: unlimited monthly posts");
      }
    }

    const monthNameEs = MONTH_NAMES_ES[month - 1];
    const monthNameCa = MONTH_NAMES_CA[month - 1];
    const today = new Date();
    const dayOfMonth = today.getUTCDate();
    const dateContext = `${dayOfMonth} de ${monthNameEs} ${year}`;

    const { geoContext, locationInfo } = buildGeoContext(site);
    const sectorCategory = detectSectorCategory(site.sector);
    const sectorContext = SECTOR_IMAGE_CONTEXTS[sectorCategory] || SECTOR_IMAGE_CONTEXTS.default;

    // Build prompt variables
    const sector = site.sector || "servicios profesionales";
    const description = site.description
      ? `DESCRIPCIÓN DEL NEGOCIO (contexto interno, NO copiar en el texto): ${site.description}`
      : "";
    const descriptionContext = site.description
      ? `, teniendo en cuenta el contexto del negocio (sin mencionarlo explícitamente)`
      : "";
    const scope = site.geographic_scope === "national" ? "Nacional (España)" : site.location || "General";

    // ==========================================
    // ENRICHED CONTEXT: Pillar rotation & profile
    // ==========================================
    const contentPillars =
      site.content_pillars && site.content_pillars.length > 0
        ? site.content_pillars
        : ["educational", "trends", "seasonal"];

    const lastPillarIndex = site.last_pillar_index ?? 0;
    const currentPillarIndex = (lastPillarIndex + 1) % contentPillars.length;
    const currentPillar = contentPillars[currentPillarIndex];
    const pillarDescription = PILLAR_DESCRIPTIONS[currentPillar] || PILLAR_DESCRIPTIONS.educational;

    console.log(`Content pillar rotation: ${currentPillar} (index ${currentPillarIndex}/${contentPillars.length})`);

    // Tone and audience from profile
    const siteTone = site.tone || "casual";
    const toneDescription = TONE_DESCRIPTIONS[siteTone] || TONE_DESCRIPTIONS.casual;
    const targetAudience = site.target_audience || "";
    const avoidTopics = site.avoid_topics || [];
    const requestedLength = normalizePreferredLength(site.preferred_length);
    const maxAllowedLength = getMaxPreferredLengthForPlan(profile.plan, siteOwnerIsSuperAdmin);
    const effectivePreferredLength = clampPreferredLength(requestedLength, maxAllowedLength);
    const lengthTarget = LENGTH_TARGETS[effectivePreferredLength] || LENGTH_TARGETS.medium;
    if (effectivePreferredLength !== requestedLength) {
      console.log(
        `Length adjusted by plan: requested=${requestedLength}, allowed=${maxAllowedLength}, using=${effectivePreferredLength}`,
      );
    }

    // WordPress context if available
    const wpContext = site.wordpress_context || null;
    const wpStyleNotes = wpContext?.style_notes || "";
    const wpRecentTopics = wpContext?.lastTopics?.slice(0, 15).join(", ") || "";

    // ==========================================
    // LOAD SECTOR PROHIBITED TERMS
    // ==========================================
    let sectorProhibitedTerms: string[] = [];
    try {
      const { data: sectorData } = await supabase
        .from("sector_contexts")
        .select("prohibited_terms")
        .or(`sector_key.eq.${sectorCategory},sector_key.eq.general`)
        .order("sector_key", { ascending: false }); // sector-specific first

      if (sectorData && sectorData.length > 0) {
        // Merge all prohibited terms from sector + general
        sectorProhibitedTerms = sectorData.flatMap((s: { prohibited_terms: string[] }) => s.prohibited_terms || []);
        console.log(`Loaded ${sectorProhibitedTerms.length} prohibited terms for sector ${sectorCategory}`);
      }
    } catch (e) {
      console.log("Could not load sector prohibited terms:", e);
    }

    // Generate topic if not provided
    let topic = providedTopic;

    if (!topic) {
      console.log("Generating topic with AI...");

      // Use dynamic limit based on publish frequency
      const topicsLimit = getTopicsLimitForFrequency(site.publish_frequency || "monthly");
      console.log(`Using topics limit: ${topicsLimit} for frequency: ${site.publish_frequency}`);

      const usedTopics = await getUsedTopicsForSite(supabase, siteId, topicsLimit);
      console.log(`Found ${usedTopics.length} Blooglee topics`);

      // Get WordPress topics from context
      const wpTopics = wpContext?.lastTopics || [];
      console.log(`Found ${wpTopics.length} WordPress topics from context`);
      if (wpTopics.length > 0) {
        console.log("WordPress topics to avoid:", wpTopics.slice(0, 5).join(", "));
      }

      // Build comprehensive avoid list - use full dynamic limit
      const allAvoidTopics = [
        ...avoidTopics,
        ...usedTopics.slice(0, topicsLimit),
        ...wpTopics, // WordPress topics from sync
      ];
      console.log(`Total topics to avoid: ${allAvoidTopics.length}`);

      const usedTopicsSection =
        allAvoidTopics.length > 0
          ? `\n\n⚠️ TEMAS YA USADOS (NO REPETIR NI SIMILARES):\n${allAvoidTopics
              .slice(0, 60)
              .map((t, i) => `${i + 1}. ${t}`)
              .join("\n")}`
          : "";

      // Build avoid topics list for prompt
      const avoidTopicsListForPrompt =
        avoidTopics.length > 0 ? avoidTopics.map((t) => `- ${t}`).join("\n") : "(ninguno especificado)";

      // Build prohibited terms string for prompt
      const prohibitedTermsForPrompt =
        sectorProhibitedTerms.length > 0
          ? sectorProhibitedTerms
              .slice(0, 20)
              .map((t) => `- ${t}`)
              .join("\n")
          : "(ninguno)";

      // Build custom topic directive
      const customTopicDirective = site.custom_topic
        ? `ENFOQUE TEMÁTICO (contexto interno, NO usar literalmente): El cliente quiere contenido orientado hacia "${site.custom_topic}". Genera un tema que encaje con este enfoque de forma natural, sin repetir la frase del cliente.`
        : "";

      // Build enriched topic prompt variables
      const enrichedVariables = {
        siteName: site.name,
        sector: sector,
        description: description,
        descriptionContext: descriptionContext,
        scope: scope,
        month: monthNameEs,
        year: year.toString(),
        dayOfMonth: dayOfMonth.toString(),
        usedTopics: usedTopicsSection,
        pillarType: currentPillar,
        pillarDescription: pillarDescription,
        toneType: siteTone,
        toneDescription: toneDescription,
        targetAudience: targetAudience
          ? `Perfil de la audiencia (NO mencionar en el texto, solo usar como contexto): ${targetAudience}`
          : "Audiencia general",
        wpStyleNotes: wpStyleNotes ? `ESTILO DETECTADO EN SU BLOG: ${wpStyleNotes}` : "",
        wpRecentTopics: wpRecentTopics ? `TEMAS RECIENTES DE SU BLOG: ${wpRecentTopics}` : "",
        prohibitedTerms: prohibitedTermsForPrompt,
        avoidTopicsList: avoidTopicsListForPrompt,
        customTopicDirective: customTopicDirective,
      };

      // Get topic prompt from database with cache
      const topicPrompt = await getPrompt(supabase, "saas.topic", enrichedVariables, FALLBACK_PROMPTS.topic);

      // Single attempt - prohibited terms are now IN the prompt
      try {
        const topicResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: topicPrompt }],
            temperature: 0.85,
            max_tokens: 100,
          }),
        });

        if (topicResponse.ok) {
          const topicData = await topicResponse.json();
          const generatedTopic = topicData.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") || "";

          if (generatedTopic && generatedTopic.length > 5 && generatedTopic.length <= 100) {
            topic = generatedTopic;
            console.log(`✓ Topic generated: "${topic}"`);
          } else {
            console.log(`Topic invalid (empty or wrong length): "${generatedTopic}"`);
          }
        }
      } catch (error) {
        console.error("Topic generation error:", error);
      }

      // Fallback if generation failed - expanded list with dedup
      if (!topic) {
        const concreteFallbacks: Record<string, string[]> = {
          farmacia: [
            "Cómo organizar el mostrador de dermofarmacia",
            "Consejos para la atención de alergias estacionales",
            "Guía de productos para el cuidado solar",
            "Rutina de cuidado facial recomendada por expertos",
            "Suplementos nutricionales más consultados",
            "Cómo elegir el protector solar adecuado",
            "Primeros auxilios básicos en el hogar",
            "Alimentación saludable para deportistas amateur",
            "Cómo prevenir resfriados en invierno",
            "Guía de hidratación corporal por tipo de piel",
            "Vitaminas esenciales para cada etapa de la vida",
            "Consejos para mejorar la calidad del sueño",
          ],
          belleza: [
            "Tendencias en coloración capilar natural",
            "Cuidado del cabello después del verano",
            "Guía de cortes según forma del rostro",
            "Tratamientos capilares sin químicos agresivos",
            "Cómo mantener el color entre visitas al salón",
            "Peinados protectores para cabello frágil",
            "Rutina capilar para cabello rizado",
            "Aceites naturales para nutrir el cabello",
            "Cortes de pelo que rejuvenecen",
            "Cómo elegir el champú adecuado para tu tipo de pelo",
          ],
          marketing: [
            "Estructura de una landing page efectiva",
            "Cómo redactar asuntos de email que abren",
            "Guía de palabras clave long-tail",
            "Estrategia de contenido para redes sociales",
            "Métricas clave para medir tu marketing digital",
            "Cómo crear un calendario editorial efectivo",
            "Copywriting persuasivo para páginas de venta",
            "Automatización de email marketing paso a paso",
            "Optimización de fichas de Google Business",
            "Cómo generar reseñas positivas de clientes",
          ],
          hosteleria: [
            "Carta digital y su impacto en el servicio",
            "Técnicas de fidelización para restaurantes",
            "Tendencias gastronómicas de temporada",
            "Cómo gestionar reseñas online de tu restaurante",
            "Maridajes creativos para sorprender a tus clientes",
            "Estrategias para reducir el desperdicio alimentario",
            "Diseño de menú que maximiza ventas",
            "Experiencia del cliente en hostelería moderna",
            "Ingredientes de proximidad como valor diferencial",
            "Cómo fotografiar platos para redes sociales",
          ],
          tecnologia: [
            "Ciberseguridad básica para pequeñas empresas",
            "Herramientas de productividad para equipos remotos",
            "Automatización de procesos repetitivos",
            "Guía de backup y recuperación de datos",
            "Cómo elegir software de gestión empresarial",
            "Integración de herramientas digitales en tu negocio",
            "Protección de datos personales en la empresa",
            "Workflows automatizados que ahorran tiempo",
            "Comunicación interna con herramientas digitales",
            "Gestión de contraseñas segura para equipos",
          ],
          salud: [
            "Hábitos saludables para trabajadores sedentarios",
            "Guía de estiramientos para la oficina",
            "Alimentación consciente en el día a día",
            "Bienestar emocional en el entorno laboral",
            "Ejercicios de respiración para reducir estrés",
            "Ergonomía en el puesto de trabajo",
            "Hidratación adecuada según tu actividad",
            "Descanso activo durante la jornada laboral",
            "Rutinas de ejercicio para principiantes",
            "Cómo crear un espacio de trabajo saludable",
          ],
          default: [
            "Cómo mejorar la atención al cliente en tu negocio",
            "Organiza tu espacio de trabajo para más productividad",
            "Guía para fidelizar a tus clientes actuales",
            "Estrategias para diferenciarte de la competencia",
            "Cómo gestionar el tiempo de forma eficiente",
            "Comunicación efectiva con tu equipo de trabajo",
            "Procesos internos que puedes simplificar hoy",
            "Cómo medir la satisfacción de tus clientes",
            "Consejos para mejorar tu presencia online",
            "Pequeños cambios que mejoran la experiencia del cliente",
            "Planificación estratégica para el próximo trimestre",
            "Cómo crear una propuesta de valor única",
          ],
        };

        const fallbacks = concreteFallbacks[sectorCategory] || concreteFallbacks.default;
        // Filter against used topics to avoid duplicates
        const allUsed = new Set([...usedTopics, ...wpTopics].map((t) => t.toLowerCase()));
        const availableFallbacks = fallbacks.filter((f) => !allUsed.has(f.toLowerCase()));
        const finalList = availableFallbacks.length > 0 ? availableFallbacks : fallbacks;
        topic = finalList[Math.floor(Math.random() * finalList.length)];
        console.log(`Using fallback topic (filtered): "${topic}"`);
      }
    }

    // Build home URL from blog_url or fallback
    const homeUrl = site.blog_url
      ? (() => {
          try {
            const u = new URL(site.blog_url);
            return `${u.protocol}//${u.host}`;
          } catch {
            return site.blog_url;
          }
        })()
      : "#";

    // Build custom topic directive for article
    const customTopicDirectiveArticle = site.custom_topic
      ? `Enfoque temático del cliente (contexto interno para orientar el contenido, NO copiar literalmente en el texto): "${site.custom_topic}". Usa esto como brújula para el enfoque general, pero redacta de forma natural sin repetir esta frase.`
      : `Sin directriz temática específica. Elige el tema más oportuno para la fecha actual y el sector ${sector}, priorizando búsquedas frecuentes con intención informacional o de consulta práctica. El tema debe ser concreto, no genérico.`;

    // Build avoid topics list for article
    const allProhibitedForArticle =
      [
        ...(avoidTopics.length > 0 ? avoidTopics.map((t) => `- Tema a evitar: ${t}`) : []),
        ...(sectorProhibitedTerms.length > 0
          ? sectorProhibitedTerms.slice(0, 15).map((t) => `- Término prohibido: ${t}`)
          : []),
      ].join("\n") || "(ninguno)";

    // Build system prompt from database with enriched context
    const systemPrompt = await getPrompt(
      supabase,
      "saas.article.system",
      {
        siteName: site.name,
        sector: sector,
        description: description,
        descriptionContext: descriptionContext,
        scope: scope,
        geoContext: geoContext,
        dateContext: dateContext,
        toneType: siteTone,
        toneDescription: toneDescription,
        targetAudience: targetAudience
          ? `Perfil de la audiencia (contexto interno para adaptar tono y enfoque, NUNCA mencionar en el texto): ${targetAudience}`
          : "Audiencia: público general del sector",
        pillarType: currentPillar,
        pillarDescription: pillarDescription,
        lengthWords: lengthTarget.words.toString(),
        lengthDescription: lengthTarget.description,
        wpStyleNotes: wpStyleNotes
          ? `Mantener este estilo detectado en su blog: ${wpStyleNotes}`
          : "Sin estilo previo detectado.",
        homeUrl: homeUrl,
        blogUrl: site.blog_url || "",
        instagramUrl: site.instagram_url || "",
        topic: topic,
        customTopicDirective: customTopicDirectiveArticle,
        avoidTopicsList: allProhibitedForArticle,
        prohibitedTerms:
          sectorProhibitedTerms.length > 0
            ? sectorProhibitedTerms
                .slice(0, 15)
                .map((t) => `- ${t}`)
                .join("\n")
            : "(ninguno)",
      },
      FALLBACK_PROMPTS.articleSystem,
    );

    // Build user prompt from database
    const userPrompt = await getPrompt(
      supabase,
      "saas.article.user",
      {
        topic: topic,
        pillarType: currentPillar,
        pillarDescription: pillarDescription,
        siteName: site.name,
        homeUrl: homeUrl,
        blogUrl: site.blog_url || "",
        instagramUrl: site.instagram_url || "",
        lengthWords: lengthTarget.words.toString(),
      },
      FALLBACK_PROMPTS.articleUser,
    );

    console.log("Generating Spanish article...");

    // Helper to generate Spanish article with a given max_tokens
    async function generateSpanishWithTokens(tokens: number): Promise<{ content: string; response: Response }> {
      const resp = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: tokens,
        }),
      });
      return { content: "", response: resp };
    }

    // Helper to parse Spanish JSON with robust strategy
    function parseArticleJson(rawContent: string): any {
      let cleanContent = rawContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const firstBrace = cleanContent.indexOf("{");
      const lastBrace = cleanContent.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("No JSON object found in response");
      }

      const jsonString = cleanContent.substring(firstBrace, lastBrace + 1);
      const cleanedJson = jsonString.replace(/[\uFEFF\u200B\u200C\u200D]/g, "");

      try {
        return JSON.parse(cleanedJson);
      } catch (firstError) {
        console.log("JSON parse failed on first attempt; applying string-only escaping and retrying");
        const repairedJson = escapeControlCharsInsideStrings(cleanedJson);
        return JSON.parse(repairedJson);
      }
    }

    // Helper to detect truncated JSON
    function isJsonTruncated(error: unknown, rawContent: string): boolean {
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes("Expected ',' or '}'") ||
        msg.includes("Unterminated string") ||
        msg.includes("Expected property name")
      ) {
        return true;
      }
      // Check if content doesn't end with closing brace (sign of truncation)
      const trimmed = rawContent?.trim() || "";
      if (trimmed.length > 100 && !trimmed.endsWith("}")) {
        return true;
      }
      return false;
    }

    let currentMaxTokens = lengthTarget.maxTokens;
    console.log(
      `Generating Spanish article with max_tokens=${currentMaxTokens} (preferred_length=${effectivePreferredLength})...`,
    );

    let spanishArticle;
    let attempts = 0;
    const MAX_ATTEMPTS = 2;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;

      const { response: spanishResponse } = await generateSpanishWithTokens(currentMaxTokens);

      if (!spanishResponse.ok) {
        if (spanishResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (spanishResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await spanishResponse.text();
        throw new Error(`Spanish generation failed: ${spanishResponse.status} - ${errorText}`);
      }

      const spanishData = await spanishResponse.json();
      const spanishContent = spanishData.choices?.[0]?.message?.content;

      if (!spanishContent) {
        throw new Error("No Spanish content generated");
      }

      try {
        spanishArticle = parseArticleJson(spanishContent);
        console.log(`Spanish article parsed successfully on attempt ${attempts} with max_tokens=${currentMaxTokens}`);
        break; // Success
      } catch (e) {
        if (attempts < MAX_ATTEMPTS && isJsonTruncated(e, spanishContent)) {
          const newTokens = currentMaxTokens + 4000;
          console.warn(`JSON appears truncated (attempt ${attempts}). Retrying with max_tokens=${newTokens}...`);
          console.warn("Parse error:", (e as Error).message);
          currentMaxTokens = newTokens;
          continue;
        }
        console.error("Error parsing Spanish JSON:", e);
        console.error("Raw content preview:", spanishContent?.substring(0, 500));
        throw new Error("Failed to parse Spanish article JSON");
      }
    }

    console.log("Spanish article generated successfully");

    // Clean any markdown that slipped into HTML
    if (spanishArticle.content) {
      spanishArticle.content = cleanMarkdownFromHtml(spanishArticle.content);
      console.log("Cleaned markdown from Spanish content");
    }

    // Enforce Spanish capitalization on titles and headings
    spanishArticle.title = enforceSpanishCapitalizationField(spanishArticle.title);
    if (spanishArticle.seo_title) {
      spanishArticle.seo_title = enforceSpanishCapitalizationField(spanishArticle.seo_title);
    }
    if (spanishArticle.content) {
      spanishArticle.content = enforceSpanishCapitalizationHtml(spanishArticle.content);
    }
    console.log("Spanish capitalization enforced on title, seo_title, and headings");

    // Post-generation validation: fix meta_description with AI if needed
    if (spanishArticle.meta_description) {
      spanishArticle.meta_description = await fixMetaDescription(
        spanishArticle.meta_description,
        spanishArticle.focus_keyword || topic,
        LOVABLE_API_KEY!,
      );
      console.log(`Final Spanish meta_description: ${spanishArticle.meta_description.length} chars`);
    }

    // Store Spanish content WITHOUT SEO footer for translation
    const spanishContentWithoutSeo = spanishArticle.content;
    let catalanArticle = null;

    if (site.languages?.includes("catalan")) {
      console.log("Generating NATIVE Catalan version (not translation)...");

      // Get native Catalan generation prompt from database
      const catalanPrompt = await getPrompt(
        supabase,
        "saas.translate.catalan",
        {
          title: spanishArticle.title,
          seoTitle: spanishArticle.seo_title || "",
          meta: spanishArticle.meta_description,
          excerpt: spanishArticle.excerpt || spanishArticle.meta_description,
          focusKeyword: spanishArticle.focus_keyword || "",
          slug: spanishArticle.slug,
          content: spanishContentWithoutSeo,
        },
        FALLBACK_PROMPTS.nativeCatalan,
      );

      try {
        const catalanResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: catalanPrompt }],
            temperature: 0.5,
            max_tokens: lengthTarget.maxTokens,
          }),
        });

        if (catalanResponse.ok) {
          const catalanData = await catalanResponse.json();
          let catalanContent = catalanData.choices?.[0]?.message?.content;

          if (catalanContent) {
            let cleanCatalan = catalanContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");

            const jsonMatch = cleanCatalan.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const cleanedCatalanJson = jsonMatch[0].replace(/[\uFEFF\u200B\u200C\u200D]/g, "");

              try {
                catalanArticle = JSON.parse(cleanedCatalanJson);
              } catch (firstError) {
                console.log("Catalan JSON parse failed on first attempt; applying string-only escaping");
                const repairedCatalanJson = escapeControlCharsInsideStrings(cleanedCatalanJson);
                catalanArticle = JSON.parse(repairedCatalanJson);
              }
              console.log("Native Catalan article generated successfully");

              // Clean any markdown from Catalan content
              if (catalanArticle?.content) {
                catalanArticle.content = cleanMarkdownFromHtml(catalanArticle.content);
                console.log("Cleaned markdown from Catalan content");
              }

              // Fix meta_description with AI if needed
              if (catalanArticle?.meta_description) {
                catalanArticle.meta_description = await fixMetaDescription(
                  catalanArticle.meta_description,
                  catalanArticle.focus_keyword || topic,
                  LOVABLE_API_KEY!,
                );
                console.log(`Final Catalan meta_description: ${catalanArticle.meta_description.length} chars`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error generating Catalan:", error);
      }
    }

    // ==========================================
    // ADD INTERNAL LINK TO HOME ON FIRST BRAND MENTION
    // ==========================================
    function escapeRegexChars(str: string): string {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function addHomeLinkToContent(content: string, siteName: string, blogUrl: string | null): string {
      if (!blogUrl || !siteName) return content;

      // ALWAYS extract the root domain as home URL
      let homeUrl: string;
      try {
        const url = new URL(blogUrl);
        homeUrl = `${url.protocol}//${url.host}`;
      } catch {
        console.log("Failed to parse blog URL for home link");
        return content;
      }

      console.log(`Adding home link: ${siteName} -> ${homeUrl}`);

      // Find first mention of brand name that is NOT inside:
      // 1. An already open <a> tag (not yet closed)
      // 2. An href="..." or src="..." attribute value
      const escapedName = escapeRegexChars(siteName);
      const regex = new RegExp(`\\b${escapedName}\\b`, "gi");

      let match;
      while ((match = regex.exec(content)) !== null) {
        const position = match.index;
        const textBefore = content.substring(0, position);

        // Check 1: Are we inside an <a> tag? (open <a without closing </a>)
        const lastOpenA = textBefore.lastIndexOf("<a ");
        const lastCloseA = textBefore.lastIndexOf("</a>");
        if (lastOpenA > lastCloseA) {
          // We're inside an <a> tag, skip this match
          continue;
        }

        // Check 2: Are we inside an href="..." attribute?
        const lastHref = textBefore.lastIndexOf('href="');
        if (lastHref !== -1 && lastHref > textBefore.lastIndexOf('"', textBefore.length - 1)) {
          // Check if there's a closing quote after href="
          const afterHref = textBefore.substring(lastHref + 6);
          const closingQuote = afterHref.indexOf('"');
          if (closingQuote === -1) {
            // No closing quote found, we're inside the href value
            continue;
          }
        }

        // Check 3: Are we inside a src="..." attribute?
        const lastSrc = textBefore.lastIndexOf('src="');
        if (lastSrc !== -1 && lastSrc > textBefore.lastIndexOf('"', textBefore.length - 1)) {
          const afterSrc = textBefore.substring(lastSrc + 5);
          const closingQuote = afterSrc.indexOf('"');
          if (closingQuote === -1) {
            // No closing quote found, we're inside the src value
            continue;
          }
        }

        // This occurrence is valid - replace it and return
        const before = content.substring(0, position);
        const after = content.substring(position + match[0].length);
        const linkedName = `<a href="${homeUrl}" target="_blank" rel="noopener">${match[0]}</a>`;
        console.log(`Home link added at position ${position}`);
        return before + linkedName + after;
      }

      console.log("No valid position found for home link");
      return content;
    }

    // Add home link to Spanish content (first mention of brand)
    let processedSpanishContent = spanishContentWithoutSeo;
    processedSpanishContent = addHomeLinkToContent(processedSpanishContent, site.name, site.blog_url || null);

    // The closing paragraph with blog/social links is now generated by the AI as part of the article
    // No hardcoded footer needed - the prompt instructs varied closings
    spanishArticle.content = processedSpanishContent;
    console.log("Spanish content processed (closing generated by AI)");

    // Generate image with AI
    let imageResult = null;
    let pexelsQuery = null;

    const skipImage = site.include_featured_image === false;

    if (!skipImage) {
      console.log("Generating image with AI...");

      const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      // Random composition style selection
      const COMPOSITION_STYLES = [
        "flat lay with relevant objects from the sector",
        "close-up macro detail of a key element",
        "minimalist composition with one strong focal point and negative space",
        "environmental wide shot showing the context or setting",
      ];
      const compositionStyle = COMPOSITION_STYLES[Math.floor(Math.random() * COMPOSITION_STYLES.length)];
      console.log("Selected composition style:", compositionStyle);

      // Get image prompt from database
      const imagePrompt = await getPrompt(
        supabase,
        "saas.image",
        {
          topic: topic,
          sector: sector,
          description: site.description ? `CONTEXT: ${site.description}` : "",
          composition_style: compositionStyle,
          color_palette: site.color_palette || "warm neutrals",
          mood: site.mood || "warm and welcoming",
        },
        FALLBACK_PROMPTS.image,
      );

      // Helper to attempt AI image generation
      const attemptAIImage = async (prompt: string, attemptLabel: string): Promise<boolean> => {
        try {
          const imageResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });

          console.log(`AI image ${attemptLabel} response status:`, imageResponse.status);

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const message = imageData.choices?.[0]?.message;
            const base64Image = message?.images?.[0]?.image_url?.url;

            if (base64Image) {
              console.log(`AI image ${attemptLabel} generated successfully, uploading to storage...`);

              const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
              const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

              const timestamp = Date.now();
              const fileName = `${siteId}/${timestamp}-${topic.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}.png`;

              const { error: uploadError } = await supabaseAdmin.storage
                .from("article-images")
                .upload(fileName, imageBuffer, {
                  contentType: "image/png",
                  upsert: true,
                });

              if (uploadError) {
                console.error("Storage upload error:", uploadError);
                return false;
              }

              const { data: urlData } = supabaseAdmin.storage.from("article-images").getPublicUrl(fileName);

              imageResult = {
                url: urlData.publicUrl,
                photographer: "AI Generated",
                photographer_url: null,
              };
              pexelsQuery = "AI Generated";
              console.log(`Image uploaded to storage (${attemptLabel}):`, urlData.publicUrl);
              return true;
            } else {
              console.log(`No base64 image found in ${attemptLabel} response`);
            }
          } else {
            const errorText = await imageResponse.text();
            console.error(`AI image ${attemptLabel} failed:`, imageResponse.status, errorText);
          }
        } catch (error) {
          console.error(`Error in AI image ${attemptLabel}:`, error);
        }
        return false;
      };

      // Attempt 1: Full prompt
      let aiSuccess = await attemptAIImage(imagePrompt, "attempt 1");

      // Attempt 2: Simplified prompt after delay
      if (!aiSuccess) {
        console.log("AI image attempt 1 failed, retrying with simplified prompt in 2s...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const simplifiedPrompt = `Generate a professional blog header image for a ${sector} business about "${topic}". Editorial photography style, 16:9 ratio. NO text, NO logos, NO human faces, NO branded products.`;
        aiSuccess = await attemptAIImage(simplifiedPrompt, "attempt 2");
      }

      // Fallback: Contextual Unsplash search using AI-generated query
      if (!aiSuccess) {
        console.log("AI image failed after 2 attempts, falling back to contextual Unsplash...");

        if (UNSPLASH_ACCESS_KEY) {
          // Generate a contextual search query with AI instead of using generic fallbackQuery
          let contextualQuery = sectorContext.fallbackQuery;
          try {
            const queryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "user",
                    content: `Generate a short Unsplash search query (3-5 English words) to find a relevant photo for a ${sector} blog post about: "${topic}". Return ONLY the search query, nothing else. Avoid generic terms like "business" or "office". Focus on the specific topic and sector.`,
                  },
                ],
              }),
            });
            if (queryResponse.ok) {
              const queryData = await queryResponse.json();
              const generatedQuery = queryData.choices?.[0]?.message?.content?.trim();
              if (generatedQuery && generatedQuery.length > 3 && generatedQuery.length < 80) {
                contextualQuery = generatedQuery;
                console.log("AI-generated Unsplash query:", contextualQuery);
              }
            }
          } catch (e) {
            console.error("Failed to generate contextual query, using sector fallback:", e);
          }

          pexelsQuery = contextualQuery;

          try {
            const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(contextualQuery)}&per_page=20&orientation=landscape`;
            const unsplashResponse = await fetch(searchUrl, {
              headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            });

            if (unsplashResponse.ok) {
              const unsplashData = await unsplashResponse.json();
              const photos = unsplashData.results || [];

              // Filter out prohibited terms from photo descriptions
              const filteredPhotos = photos.filter((p: any) => {
                const desc = (p.description || "" + p.alt_description || "").toLowerCase();
                return !sectorContext.prohibitedTerms.some((term) => desc.includes(term.toLowerCase()));
              });

              const finalPhotos = filteredPhotos.length > 0 ? filteredPhotos : photos;

              if (finalPhotos.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(finalPhotos.length, 10));
                const photo = finalPhotos[randomIndex];
                imageResult = {
                  url: photo.urls.regular,
                  photographer: photo.user.name,
                  photographer_url: photo.user.links.html,
                };
                console.log("Image selected from contextual Unsplash search");
              }
            }
          } catch (error) {
            console.error("Unsplash contextual search error:", error);
          }
        }

        // NO static fallback images — prefer no image over irrelevant image
        if (!imageResult) {
          console.log("All image sources failed. Article will be saved without image. User can regenerate manually.");
          pexelsQuery = null;
        }
      }
    }

    // Calculate week of month (reuse dayOfMonth from above)
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    // ==========================================
    // VERIFY AND CLEAN EXTERNAL LINKS
    // ==========================================
    console.log("Verifying external links in generated content...");

    if (spanishArticle?.content) {
      spanishArticle.content = await verifyAndCleanExternalLinks(spanishArticle.content);
    }
    if (catalanArticle?.content) {
      catalanArticle.content = await verifyAndCleanExternalLinks(catalanArticle.content);
    }

    // Build generation key for deduplication
    const normalizedPublishFrequency = normalizeFrequency(site.publish_frequency);
    const inputGenerationKey = requestBody.generationKey;
    const generationKey = inputGenerationKey || buildGenerationKey(normalizedPublishFrequency, month, year, today);
    console.log("Generation key:", generationKey);

    // Save article to database
    const articleData: Record<string, any> = {
      site_id: siteId,
      user_id: siteOwnerUserId,
      month,
      year,
      topic,
      pexels_query: pexelsQuery,
      content_spanish: spanishArticle,
      content_catalan: catalanArticle,
      image_url: imageResult?.url || null,
      image_photographer: imageResult?.photographer || null,
      image_photographer_url: imageResult?.photographer_url || null,
      week_of_month: weekOfMonth,
      day_of_month: dayOfMonth,
      generation_key: generationKey,
      // Guardrail: only scheduler-generated articles can be reconciled/autopublished later.
      autopublish_enabled: Boolean(isScheduled),
    };

    // Check if article already exists for this generation key
    const serviceClientForCheck = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: existingArticle } = await serviceClientForCheck
      .from("articles")
      .select("*")
      .eq("site_id", siteId)
      .eq("generation_key", generationKey)
      .maybeSingle();

    let savedArticle;
    if (existingArticle) {
      // Article already exists for this period — check if it was a recent duplicate
      const createdAt = new Date(existingArticle.generated_at).getTime();
      const now = Date.now();
      if (now - createdAt < 60000) {
        console.log(
          "⚠️ Duplicate invocation detected (article created <60s ago). Returning existing article:",
          existingArticle.id,
        );
        savedArticle = existingArticle;
      } else {
        // Existing article from a previous run — update it
        const { data, error: updateError } = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", existingArticle.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating article:", updateError);
          throw new Error("Failed to update article");
        }
        savedArticle = data;
        console.log("Updated existing article:", savedArticle.id);
      }
    } else {
      // Insert new article
      const { data, error: insertError } = await supabase.from("articles").insert(articleData).select().single();

      if (insertError) {
        // Handle unique violation (23505) — concurrent insert race condition
        if (insertError.code === "23505") {
          console.log("⚠️ Unique constraint violation (23505) — recovering existing article");
          const { data: recovered } = await serviceClientForCheck
            .from("articles")
            .select("*")
            .eq("site_id", siteId)
            .eq("generation_key", generationKey)
            .maybeSingle();

          if (recovered) {
            console.log("Recovered article after conflict:", recovered.id);
            savedArticle = recovered;
          } else {
            console.error("Could not recover article after 23505 conflict");
            throw new Error("Failed to save article: unique constraint conflict and recovery failed");
          }
        } else {
          console.error("Error saving article:", insertError);
          throw new Error("Failed to save article");
        }
      } else {
        savedArticle = data;
        console.log("Created new article:", savedArticle.id);
      }
    }

    console.log("=== ARTICLE GENERATION COMPLETE ===");
    console.log("Article ID:", savedArticle.id);

    // Update pillar index for next generation (rotation)
    if (!providedTopic) {
      // Only update if we auto-generated the topic
      const { error: pillarUpdateError } = await supabase
        .from("sites")
        .update({ last_pillar_index: currentPillarIndex })
        .eq("id", siteId);

      if (pillarUpdateError) {
        console.error("Error updating pillar index:", pillarUpdateError);
      } else {
        console.log(`Updated pillar index to ${currentPillarIndex} (${currentPillar})`);
      }
    }

    // Send notification email to user + team members
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", siteOwnerUserId)
      .single();

    const teamEmails = await getTeamMemberEmails(supabase, siteOwnerUserId);

    // Only send "article ready" email if NOT scheduled (manual generation)
    // For scheduled generation, the "published" email is sent after WordPress publish
    if (!isScheduled && userProfile?.email) {
      const articleTitle = spanishArticle?.title || catalanArticle?.title || topic;
      const articleExcerpt =
        spanishArticle?.meta_description || catalanArticle?.meta_description || `Nuevo artículo sobre ${topic}`;

      sendArticleNotification(userProfile.email, site.name, articleTitle, articleExcerpt, siteId, teamEmails).catch(
        (err) => console.error("Background email error:", err),
      );
    }

    let autoPublishOutcome: {
      attempted: boolean;
      success: boolean;
      attempts: number;
      reason?: string;
      error?: string;
      post_url?: string;
    } | null = null;

    // Auto-publish to WordPress when scheduled (automated generation)
    if (isScheduled) {
      try {
        const { data: wpConfig } = await supabase
          .from("wordpress_configs")
          .select("id")
          .eq("site_id", siteId)
          .maybeSingle();

        if (wpConfig && spanishArticle) {
          console.log("=== AUTO-PUBLISHING TO WORDPRESS ===");
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

          const publishPayload = {
            site_id: siteId,
            title: spanishArticle.title,
            seo_title: spanishArticle.seo_title,
            content: spanishArticle.content,
            slug: spanishArticle.slug,
            status: "publish",
            image_url: imageResult?.url || null,
            image_alt: spanishArticle.title,
            meta_description: spanishArticle.meta_description,
            excerpt: spanishArticle.excerpt || spanishArticle.meta_description,
            focus_keyword: spanishArticle.focus_keyword,
            lang: "es",
          };

          const publishUrl = `${supabaseUrl}/functions/v1/publish-to-wordpress-saas`;
          const maxAttempts = 3;
          let attempts = 0;
          let lastError = "";
          let publishedPostUrl: string | undefined;

          while (attempts < maxAttempts) {
            attempts++;
            try {
              const publishRes = await fetch(publishUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceRoleKey}`,
                },
                body: JSON.stringify(publishPayload),
              });

              console.log(`[auto-publish] Attempt ${attempts}/${maxAttempts} status: ${publishRes.status}`);

              if (publishRes.ok) {
                const result = await publishRes.json();
                if (result.post_url) {
                  publishedPostUrl = result.post_url;
                  break;
                }
                lastError = "WordPress respondió OK pero sin post_url";
                break;
              }

              const errorBody = await publishRes.text();
              lastError = `HTTP ${publishRes.status}: ${errorBody.substring(0, 500)}`;

              const retryable = publishRes.status >= 500 || publishRes.status === 429;
              if (retryable && attempts < maxAttempts) {
                const waitMs = Math.pow(2, attempts) * 1000;
                console.log(`[auto-publish] Retryable error, retry in ${waitMs}ms`);
                await new Promise((resolve) => setTimeout(resolve, waitMs));
                continue;
              }
              break;
            } catch (publishErr) {
              lastError = publishErr instanceof Error ? publishErr.message : String(publishErr);
              console.error(`[auto-publish] Attempt ${attempts} error:`, publishErr);
              if (attempts < maxAttempts) {
                const waitMs = Math.pow(2, attempts) * 1000;
                await new Promise((resolve) => setTimeout(resolve, waitMs));
              }
            }
          }

          if (publishedPostUrl) {
            await supabase.from("articles").update({ wp_post_url: publishedPostUrl }).eq("id", savedArticle.id);

            await logSiteActivity(
              supabase,
              siteId,
              userId,
              "autopublish_success",
              "Artículo publicado automáticamente en WordPress",
              {
                article_id: savedArticle.id,
                attempts,
                post_url: publishedPostUrl,
              },
            );

            console.log(`[auto-publish] Updated wp_post_url: ${publishedPostUrl}`);
            autoPublishOutcome = {
              attempted: true,
              success: true,
              attempts,
              post_url: publishedPostUrl,
            };

            // === EMAIL TRACKING (always register result) ===
            {
              const articleTitle = spanishArticle?.title || catalanArticle?.title || topic;
              const emailRecipients = userProfile?.email
                ? [userProfile.email, ...teamEmails.filter((e: string) => e !== userProfile.email)]
                : [];

              // Dedup: attempt insert into article_email_notifications
              const { error: dedupErr } = await supabase.from("article_email_notifications").insert({
                article_id: savedArticle.id,
                notification_type: "autopublish_success",
                status: "pending",
                sent_to: emailRecipients,
              });

              if (dedupErr?.code === "23505") {
                console.log("[auto-publish] Email already sent for this article, skipping");
                await logSiteActivity(
                  supabase,
                  siteId,
                  userId,
                  "autopublish_email_skipped_duplicate",
                  "Email omitido: ya existía notificación para este artículo",
                  { article_id: savedArticle.id },
                );
              } else if (dedupErr) {
                console.error("[auto-publish] Dedup insert error:", dedupErr.message);
                await logSiteActivity(
                  supabase,
                  siteId,
                  userId,
                  "autopublish_email_failed",
                  "Error insertando dedup de email",
                  { article_id: savedArticle.id, error: dedupErr.message },
                );
              } else if (!userProfile?.email) {
                console.log("[auto-publish] No owner email found, marking failed");
                await supabase
                  .from("article_email_notifications")
                  .update({ status: "failed", error: "no_owner_email" })
                  .eq("article_id", savedArticle.id)
                  .eq("notification_type", "autopublish_success");
                await logSiteActivity(
                  supabase,
                  siteId,
                  userId,
                  "autopublish_email_failed",
                  "No se encontró email del propietario",
                  { article_id: savedArticle.id, error: "no_owner_email" },
                );
              } else {
                try {
                  await sendPublishedNotification(
                    userProfile.email,
                    site.name,
                    articleTitle,
                    publishedPostUrl,
                    siteId,
                    teamEmails,
                  );
                  await supabase
                    .from("article_email_notifications")
                    .update({ status: "sent", sent_to: emailRecipients })
                    .eq("article_id", savedArticle.id)
                    .eq("notification_type", "autopublish_success");
                  await logSiteActivity(
                    supabase,
                    siteId,
                    userId,
                    "autopublish_email_sent",
                    "Email de artículo publicado enviado",
                    { article_id: savedArticle.id, post_url: publishedPostUrl, recipients: emailRecipients },
                  );
                } catch (emailErr) {
                  const emailErrMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
                  console.error("[auto-publish] Email notification error:", emailErrMsg);
                  await supabase
                    .from("article_email_notifications")
                    .update({ status: "failed", error: emailErrMsg })
                    .eq("article_id", savedArticle.id)
                    .eq("notification_type", "autopublish_success");
                  await logSiteActivity(
                    supabase,
                    siteId,
                    userId,
                    "autopublish_email_failed",
                    "Falló envío de email tras auto-publicación",
                    { article_id: savedArticle.id, error: emailErrMsg },
                  );
                }
              }
            }
          } else {
            await logSiteActivity(
              supabase,
              siteId,
              userId,
              "autopublish_failed",
              "Falló la publicación automática en WordPress",
              {
                article_id: savedArticle.id,
                attempts,
                error: lastError || "Unknown publish error",
              },
            );

            autoPublishOutcome = {
              attempted: true,
              success: false,
              attempts,
              error: lastError || "Unknown publish error",
            };
            console.error(`[auto-publish] Failed after ${attempts} attempts: ${lastError}`);
          }
        } else {
          const reason = !wpConfig ? "no_wordpress_config" : "no_spanish_content";
          autoPublishOutcome = {
            attempted: false,
            success: false,
            attempts: 0,
            reason,
          };
          console.log(`No WordPress config found or no Spanish content - skipping auto-publish (${reason})`);
        }
      } catch (autoPublishError) {
        autoPublishOutcome = {
          attempted: true,
          success: false,
          attempts: 0,
          error: autoPublishError instanceof Error ? autoPublishError.message : String(autoPublishError),
        };
        console.error("[auto-publish] Non-blocking error:", autoPublishError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        article: savedArticle,
        content: {
          spanish: spanishArticle,
          catalan: catalanArticle,
        },
        image: imageResult,
        auto_publish: autoPublishOutcome,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in generate-article-saas:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
