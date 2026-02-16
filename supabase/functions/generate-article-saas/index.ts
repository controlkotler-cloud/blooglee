import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

// Get prompt from cache or database, with fallback to hardcoded
async function getPrompt(
  supabase: any,
  key: string,
  variables: Record<string, string>,
  fallback: string
): Promise<string> {
  try {
    // 1. Check cache version from database
    const { data: versionData, error: versionError } = await supabase
      .from('prompt_cache_version')
      .select('version')
      .eq('id', 1)
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
      .from('prompts')
      .select('content')
      .eq('key', key)
      .eq('is_active', true)
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
async function fixMetaDescription(
  metaDesc: string,
  focusKeyword: string,
  apiKey: string
): Promise<string> {
  // Step 1: Always clean punctuation
  let cleaned = metaDesc
    .replace(/[!¡?¿]/g, '')
    .replace(/\s+/g, ' ')
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
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{
          role: "user",
          content: `Reescribe esta meta description para que tenga EXACTAMENTE entre 120 y 140 caracteres. 
La frase debe ser COMPLETA, con sentido, sin cortes ni puntos suspensivos.
Incluye la keyword "${focusKeyword}" de forma natural.
PROHIBIDO usar signos de exclamación (!) o interrogación (?).
Tono directo y profesional.

Meta description original: "${cleaned}"

Responde SOLO con la nueva meta description, sin comillas ni explicaciones.`
        }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      let newMeta = (data.choices?.[0]?.message?.content || '')
        .replace(/^["']|["']$/g, '')
        .replace(/[!¡?¿]/g, '')
        .replace(/\s+/g, ' ')
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
    const lastPeriod = sub.lastIndexOf('.');
    if (lastPeriod > 80) {
      return cleaned.substring(0, lastPeriod + 1);
    }
    // Try comma
    const lastComma = sub.lastIndexOf(',');
    if (lastComma > 80) {
      return cleaned.substring(0, lastComma);
    }
    // Last word boundary
    const lastSpace = sub.lastIndexOf(' ');
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
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // *texto* or _texto_ → <em>texto</em>
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
    // ~~texto~~ → <del>texto</del>
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // `codigo` → <code>codigo</code>
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  
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

  articleSystem: `Eres el mejor redactor de blogs del mundo, especializado en el sector {{sector}}. Escribes artículos que posicionan en Google, enganchen al lector y generen confianza en la marca.

═══════════════════════════════════════
1. EMPRESA
═══════════════════════════════════════
Nombre: {{siteName}}
Sector: {{sector}}
{{description}}

═══════════════════════════════════════
2. CONTEXTO GEOGRÁFICO
═══════════════════════════════════════
{{geoContext}}

═══════════════════════════════════════
3. AUDIENCIA
═══════════════════════════════════════
{{targetAudience}}

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
6. DIRECTRIZ TEMÁTICA
═══════════════════════════════════════
{{customTopicDirective}}

═══════════════════════════════════════
7. ESTILO DEL BLOG EXISTENTE
═══════════════════════════════════════
{{wpStyleNotes}}

═══════════════════════════════════════
8. TEMA DEL ARTÍCULO
═══════════════════════════════════════
{{topic}}

═══════════════════════════════════════
9. LONGITUD
═══════════════════════════════════════
{{lengthDescription}} (~{{lengthWords}} palabras)

═══════════════════════════════════════
10. REGLAS SEO (Yoast verde OBLIGATORIO)
═══════════════════════════════════════

FOCUS KEYWORD (2-4 palabras):
- DEBE aparecer MÍNIMO 5 VECES distribuidas: intro, mitad, conclusión
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
- La PRIMERA vez que menciones "{{siteName}}" en el cuerpo del texto, enlázalo a {{homeUrl}}
- Formato: <a href="{{homeUrl}}" target="_blank" rel="noopener">{{siteName}}</a>

ENLACES EXTERNOS (2 OBLIGATORIOS):
- Incluye 2 enlaces a fuentes de autoridad (Wikipedia, instituciones oficiales, estudios, medios reconocidos)
- Si conoces la URL EXACTA, úsala. Si NO, enlaza SOLO a la homepage del dominio
- Formato: <a href="URL" target="_blank" rel="noopener">texto ancla descriptivo</a>
- NO enlaces a competidores directos

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

═══════════════════════════════════════
14. FORMATO DE RESPUESTA
═══════════════════════════════════════
RESPONDE ÚNICAMENTE con un JSON válido con TODOS estos campos:
{
  "title": "Título H1 atractivo (máx 70 chars, SIN nombre empresa, SIN año)",
  "seo_title": "SEO title que EMPIEZA con focus_keyword (máx 60 chars)",
  "meta_description": "Descripción directa (max 145 chars) con keyword, sin ! ni ?",
  "excerpt": "Resumen DIFERENTE a meta_description (máx 160 chars)",
  "focus_keyword": "keyword principal de 2-4 palabras",
  "slug": "url-con-focus-keyword-sin-espacios",
  "content": "<h2>Subtítulo gancho con keyword</h2><p>Primer párrafo con keyword...</p>...<h2>¿Pregunta PAA?</h2><p>Respuesta...</p>...<p>Frase final variada con enlaces</p>"
}`,

  articleUser: `Escribe el artículo sobre: {{topic}}

Recuerda:
- Pilar de contenido: {{pillarType}} → {{pillarDescription}}
- Longitud: ~{{lengthWords}} palabras
- Enlaza "{{siteName}}" a {{homeUrl}} en su primera mención
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

  image: `Generate a professional blog header image.

TOPIC: "{{topic}}"
SECTOR: {{sector}}
{{description}}

REQUIREMENTS:
- Clean, professional photograph
- Visually related to the topic and sector
- NO text, NO logos, NO watermarks, NO faces
- NEVER invent or show brand names, product labels, or packaging with text on products
- If products appear, they must be generic/unbranded with NO visible text or logos
- Suitable for blog header, 16:9 ratio
- High quality, editorial style

Generate an image that a {{sector}} business would use for their blog.`
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
// EMAIL NOTIFICATION
// ==========================================
async function sendArticleNotification(
  userEmail: string,
  siteName: string,
  articleTitle: string,
  articleExcerpt: string,
  siteId: string
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

    const { error } = await resend.emails.send({
      from: "Blooglee <noreply@blooglee.com>",
      to: [userEmail],
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
  educational: "Contenido EDUCATIVO: guías prácticas, tutoriales paso a paso, how-to, consejos aplicables inmediatamente. Enseña algo útil al lector.",
  trends: "Contenido de TENDENCIAS: novedades del sector, innovación, cambios recientes, lo que viene. Mantén al lector actualizado.",
  cases: "Contenido de CASOS PRÁCTICOS: ejemplos reales, testimonios, historias de éxito, antes/después. Muestra resultados concretos.",
  seasonal: "Contenido ESTACIONAL: adaptado a la época del año, fechas señaladas, temporadas comerciales, eventos relevantes.",
  opinion: "Contenido de OPINIÓN/ANÁLISIS: perspectivas del sector, reflexiones profesionales, análisis de situaciones, visión experta."
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  formal: "Tono FORMAL y profesional: lenguaje institucional, serio pero no frío, evita coloquialismos.",
  casual: "Tono CERCANO pero experto: accesible sin perder autoridad, tutea al lector, conversacional.",
  technical: "Tono TÉCNICO y especializado: usa terminología del sector, para audiencia experta.",
  educational: "Tono DIVULGATIVO y accesible: explica conceptos complejos de forma simple, pedagógico."
};

const LENGTH_TARGETS: Record<string, { words: number; description: string; maxTokens: number }> = {
  short: { words: 800, description: "~800 palabras, lectura rápida de 3 minutos", maxTokens: 6000 },
  medium: { words: 1500, description: "~1500 palabras, lectura de 6-7 minutos", maxTokens: 10000 },
  long: { words: 2500, description: "~2500 palabras, guía completa de 10+ minutos", maxTokens: 16000 }
};

// ==========================================
// SECTOR CONTEXTS
// ==========================================
const SECTOR_IMAGE_CONTEXTS: Record<string, SectorContext> = {
  marketing: {
    examples: ["business team meeting modern office laptop", "digital marketing analytics dashboard screen", "creative workspace minimal design desk"],
    prohibitedTerms: ["facebook logo", "instagram icon", "twitter", "tiktok"],
    fallbackQuery: "professional business workspace modern office"
  },
  tecnologia: {
    examples: ["programmer coding laptop dark modern office", "technology innovation abstract blue lights", "startup team collaboration whiteboard"],
    prohibitedTerms: ["apple logo", "microsoft", "google"],
    fallbackQuery: "technology innovation abstract professional"
  },
  salud: {
    examples: ["wellness lifestyle healthy living nature", "medical professional consultation friendly", "healthcare innovation modern clinic"],
    prohibitedTerms: ["pills", "medicine bottles", "hospital bed", "surgery", "blood"],
    fallbackQuery: "wellness health professional modern"
  },
  belleza: {
    examples: ["beautiful hairstyle woman portrait natural light", "elegant haircut woman closeup professional photo", "hair color highlights natural"],
    prohibitedTerms: ["barber", "barbershop", "beard", "men haircut", "shaving"],
    fallbackQuery: "beautiful hairstyle woman portrait elegant"
  },
  hosteleria: {
    examples: ["restaurant interior modern elegant dining tables", "chef cooking kitchen professional gourmet", "hotel lobby luxury modern reception"],
    prohibitedTerms: ["fast food", "dirty kitchen", "drunk", "messy"],
    fallbackQuery: "restaurant elegant dining professional interior"
  },
  default: {
    examples: ["professional team collaboration office", "business success growth abstract", "modern workspace minimal clean"],
    prohibitedTerms: [],
    fallbackQuery: "professional business success modern"
  }
};

const FALLBACK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200", photographer: "Austin Distel", photographer_url: "https://unsplash.com/@austindistel" },
  { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200", photographer: "Dylan Gillis", photographer_url: "https://unsplash.com/@dylandgillis" },
  { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200", photographer: "Marvin Meyer", photographer_url: "https://unsplash.com/@marvelous" },
];

const MONTH_NAMES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTH_NAMES_CA = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];

// ==========================================
// JSON REPAIR: Escape control chars ONLY inside string literals
// ==========================================
function escapeControlCharsInsideStrings(input: string): string {
  let result = '';
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
    
    if (char === '\\' && inString) {
      // Next char is escaped
      escaped = true;
      result += char;
      continue;
    }
    
    if (inString) {
      // Inside a string - escape control characters
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else if (code >= 0x00 && code <= 0x1F) {
        // Other control chars - convert to unicode escape
        result += '\\u' + code.toString(16).padStart(4, '0');
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
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Fetch attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
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
  if (s.includes("farmacia") || s.includes("parafarm") || s.includes("dermofarm") || s.includes("botica")) return "farmacia";
  if (s.includes("peluqu") || s.includes("cabello") || s.includes("estétic") || s.includes("beauty")) return "belleza";
  if (s.includes("restaur") || s.includes("hotel") || s.includes("hostel") || s.includes("bar ") || s.includes("cafeter")) return "hosteleria";
  if (s.includes("marketing") || s.includes("seo") || s.includes("publicidad") || s.includes("agencia")) return "marketing";
  if (s.includes("tecnolog") || s.includes("software") || s.includes("informát") || s.includes("saas")) return "tecnologia";
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
          locationInfo: "Ámbito: General"
        };
      }
      return {
        geoContext: `- Menciona la población "${site.location}" 1-2 veces para potenciar el SEO local.`,
        locationInfo: `Localidad: ${site.location}`
      };
      
    case "regional":
      if (!site.location || site.location.trim() === "") {
        return {
          geoContext: `- El contenido es de ámbito regional, pero sin región específica.`,
          locationInfo: "Ámbito: Regional"
        };
      }
      return {
        geoContext: `- Menciona la región "${site.location}" 1-2 veces para SEO regional.`,
        locationInfo: `Región: ${site.location}`
      };
      
    case "national":
    default:
      return {
        geoContext: `- PROHIBIDO mencionar cualquier ubicación geográfica específica. El contenido es para toda España.`,
        locationInfo: "Ámbito: Nacional (toda España)"
      };
  }
}

async function isUserAdmin(supabaseClient: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
    
    return data?.some((r: { role: string }) => r.role === 'admin') || false;
  } catch (e) {
    console.error("Exception checking admin role:", e);
    return false;
  }
}

async function getUserProfile(supabaseClient: any, userId: string): Promise<{ posts_limit: number; plan: string } | null> {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('posts_limit, plan')
      .eq('user_id', userId)
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

async function countArticlesThisMonth(supabaseClient: any, userId: string, month: number, year: number): Promise<number> {
  try {
    const { count, error } = await supabaseClient
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);
    
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

// Get dynamic topics limit based on publish frequency
function getTopicsLimitForFrequency(publishFrequency: string): number {
  switch (publishFrequency) {
    case 'daily':
    case 'daily_weekdays':
      return 60; // ~2 months of memory for daily
    case 'weekly':
    case 'biweekly':
      return 30; // ~6-7 months for weekly
    case 'monthly':
    default:
      return 20; // ~20 months for monthly
  }
}

async function getUsedTopicsForSite(supabaseClient: any, siteId: string, limit: number = 50): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from('articles')
      .select('topic')
      .eq('site_id', siteId)
      .order('generated_at', { ascending: false })
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
  'a', 'al', 'ante', 'bajo', 'con', 'contra', 'de', 'del', 'desde', 'durante',
  'e', 'el', 'en', 'entre', 'hacia', 'hasta', 'la', 'las', 'lo', 'los',
  'mediante', 'ni', 'o', 'para', 'pero', 'por', 'que', 'se', 'según', 'sin',
  'sobre', 'su', 'sus', 'tan', 'tu', 'tus', 'u', 'un', 'una', 'uno', 'unos', 'unas',
  'y', 'ya', 'como', 'más', 'muy', 'nos', 'es', 'son', 'no', 'si', 'te', 'mi', 'me',
]);

// Words/patterns that should keep their original casing (brands, acronyms, etc.)
const PRESERVE_CASE_PATTERNS = /^(SEO|HTML|CSS|API|URL|FAQ|CRM|SaaS|WordPress|Google|Instagram|Facebook|TikTok|LinkedIn|YouTube|iOS|AI|IA|B2B|B2C|KPI|ROI|CMS|PHP|UX|UI|RGPD|LOPD|IVA|DNI|NIF|CBD|SPF|LED|OK|etc|vs)$/i;

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
    if (PRESERVE_CASE_PATTERNS.test(word.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/g, ''))) {
      isFirstWord = false;
      return word;
    }
    
    // Extract leading punctuation (¿, ¡, ", etc.)
    const leadingPunct = word.match(/^([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)/)?.[1] || '';
    const trailingPunct = word.match(/([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)$/)?.[1] || '';
    const core = word.slice(leadingPunct.length, word.length - (trailingPunct.length || 0)) || word.slice(leadingPunct.length);
    
    if (!core) {
      return word;
    }
    
    // Check if starts after sentence-ending punctuation
    const isAfterSentenceEnd = leadingPunct.includes('¿') || leadingPunct.includes('¡');
    
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
  
  return result.join('');
}

function enforceSpanishCapitalizationHtml(htmlContent: string): string {
  if (!htmlContent) return htmlContent;
  
  let fixed = htmlContent;
  let fixCount = 0;
  
  // Fix H2 and H3 tags in HTML
  fixed = fixed.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (_match, tag, attrs, innerText) => {
    // Don't touch if it contains HTML links or other tags (except simple formatting)
    if (/<a\s/i.test(innerText)) return _match;
    
    const cleaned = enforceSpanishCapitalizationText(innerText.replace(/<[^>]+>/g, ''));
    
    // Reconstruct with any inline tags preserved
    if (cleaned !== innerText.replace(/<[^>]+>/g, '')) {
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
    return (url.pathname === '/' || url.pathname === '') && !url.search;
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
      text: match[3]
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

  const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  for (const link of linksToVerify) {
    if (isHomepageUrl(link.url)) {
      console.log(`Homepage URL, keeping as-is: ${link.url}`);
      continue;
    }
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const headResponse = await fetch(link.url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': BROWSER_UA }
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
            method: 'GET',
            signal: ctrl2.signal,
            redirect: 'follow',
            headers: { 'User-Agent': BROWSER_UA }
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
      console.log(`Network/timeout error, keeping original: ${link.url} (${error instanceof Error ? error.message : 'unknown'})`);
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
    return new Response('ok', { headers: corsHeaders });
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

    let supabase: any;
    let userId: string;

    if (isScheduled && schedulerUserId && SUPABASE_SERVICE_ROLE_KEY) {
      console.log("=== SCHEDULER MODE ===");
      supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      userId = schedulerUserId;
      console.log("Using scheduler userId:", userId);
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: authHeader } }
      });

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        console.error("Auth error:", claimsError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      userId = claimsData.claims.sub as string;

      const rateLimitResult = checkUserRateLimit(userId);
      if (!rateLimitResult.allowed) {
        console.log(`Rate limit exceeded for user: ${userId}`);
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
    }

    console.log("=== GENERATE ARTICLE SAAS ===");
    console.log("User ID:", userId);
    console.log("Is Scheduled:", isScheduled);

    const { siteId, topic: providedTopic, month, year } = requestBody;
    console.log("Site ID:", siteId);
    console.log("Month/Year:", month, year);

    // Fetch site and validate ownership
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', userId)
      .single();

    if (siteError || !site) {
      console.error("Site error:", siteError);
      return new Response(JSON.stringify({ error: 'Site not found or access denied' }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log("Site:", site.name);
    console.log("Sector:", site.sector);

    // Check admin status for bypass
    const isAdmin = await isUserAdmin(supabase, userId);
    console.log("Is admin:", isAdmin);

    // Check plan limits (skip for admins)
    if (!isAdmin) {
      const profile = await getUserProfile(supabase, userId);
      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const articlesThisMonth = await countArticlesThisMonth(supabase, userId, month, year);
      console.log(`Articles this month: ${articlesThisMonth}/${profile.posts_limit}`);

      if (articlesThisMonth >= profile.posts_limit) {
        return new Response(JSON.stringify({ 
          error: "Has alcanzado tu límite mensual de artículos",
          limit: profile.posts_limit,
          current: articlesThisMonth,
          plan: profile.plan
        }), { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    } else {
      console.log("Admin bypass: skipping limit check");
    }

    const monthNameEs = MONTH_NAMES_ES[month - 1];
    const monthNameCa = MONTH_NAMES_CA[month - 1];
    const today = new Date();
    const dayOfMonth = today.getDate();
    const dateContext = `${dayOfMonth} de ${monthNameEs} ${year}`;
    
    const { geoContext, locationInfo } = buildGeoContext(site);
    const sectorCategory = detectSectorCategory(site.sector);
    const sectorContext = SECTOR_IMAGE_CONTEXTS[sectorCategory] || SECTOR_IMAGE_CONTEXTS.default;

    // Build prompt variables
    const sector = site.sector || "servicios profesionales";
    const description = site.description ? `DESCRIPCIÓN: ${site.description}` : '';
    const descriptionContext = site.description ? `, teniendo en cuenta que la empresa es: ${site.description}` : '';
    const scope = site.geographic_scope === "national" ? "Nacional (España)" : (site.location || "General");

    // ==========================================
    // ENRICHED CONTEXT: Pillar rotation & profile
    // ==========================================
    const contentPillars = site.content_pillars && site.content_pillars.length > 0 
      ? site.content_pillars 
      : ['educational', 'trends', 'seasonal'];
    
    const lastPillarIndex = site.last_pillar_index ?? 0;
    const currentPillarIndex = (lastPillarIndex + 1) % contentPillars.length;
    const currentPillar = contentPillars[currentPillarIndex];
    const pillarDescription = PILLAR_DESCRIPTIONS[currentPillar] || PILLAR_DESCRIPTIONS.educational;
    
    console.log(`Content pillar rotation: ${currentPillar} (index ${currentPillarIndex}/${contentPillars.length})`);
    
    // Tone and audience from profile
    const siteTone = site.tone || 'casual';
    const toneDescription = TONE_DESCRIPTIONS[siteTone] || TONE_DESCRIPTIONS.casual;
    const targetAudience = site.target_audience || '';
    const avoidTopics = site.avoid_topics || [];
    const preferredLength = site.preferred_length || 'medium';
    const lengthTarget = LENGTH_TARGETS[preferredLength] || LENGTH_TARGETS.medium;
    
    // WordPress context if available
    const wpContext = site.wordpress_context || null;
    const wpStyleNotes = wpContext?.style_notes || '';
    const wpRecentTopics = wpContext?.lastTopics?.slice(0, 15).join(', ') || '';

    // ==========================================
    // LOAD SECTOR PROHIBITED TERMS
    // ==========================================
    let sectorProhibitedTerms: string[] = [];
    try {
      const { data: sectorData } = await supabase
        .from('sector_contexts')
        .select('prohibited_terms')
        .or(`sector_key.eq.${sectorCategory},sector_key.eq.general`)
        .order('sector_key', { ascending: false }); // sector-specific first
      
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
      const topicsLimit = getTopicsLimitForFrequency(site.publish_frequency || 'monthly');
      console.log(`Using topics limit: ${topicsLimit} for frequency: ${site.publish_frequency}`);
      
      const usedTopics = await getUsedTopicsForSite(supabase, siteId, topicsLimit);
      console.log(`Found ${usedTopics.length} Blooglee topics`);
      
      // Get WordPress topics from context
      const wpTopics = wpContext?.lastTopics || [];
      console.log(`Found ${wpTopics.length} WordPress topics from context`);
      if (wpTopics.length > 0) {
        console.log('WordPress topics to avoid:', wpTopics.slice(0, 5).join(', '));
      }
      
      // Build comprehensive avoid list - use full dynamic limit
      const allAvoidTopics = [
        ...avoidTopics,
        ...usedTopics.slice(0, topicsLimit),
        ...wpTopics // WordPress topics from sync
      ];
      console.log(`Total topics to avoid: ${allAvoidTopics.length}`);
      
      const usedTopicsSection = allAvoidTopics.length > 0 
        ? `\n\n⚠️ TEMAS YA USADOS (NO REPETIR NI SIMILARES):\n${allAvoidTopics.slice(0, 60).map((t, i) => `${i+1}. ${t}`).join('\n')}`
        : '';

      // Build avoid topics list for prompt
      const avoidTopicsListForPrompt = avoidTopics.length > 0
        ? avoidTopics.map(t => `- ${t}`).join('\n')
        : '(ninguno especificado)';

      // Build prohibited terms string for prompt
      const prohibitedTermsForPrompt = sectorProhibitedTerms.length > 0
        ? sectorProhibitedTerms.slice(0, 20).map(t => `- ${t}`).join('\n')
        : '(ninguno)';

      // Build custom topic directive
      const customTopicDirective = site.custom_topic 
        ? `DIRECTRIZ TEMÁTICA GLOBAL: Todos los temas deben estar orientados hacia "${site.custom_topic}". Úsalo como guía para la temática general.`
        : '';

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
        targetAudience: targetAudience ? `AUDIENCIA OBJETIVO: ${targetAudience}` : '',
        wpStyleNotes: wpStyleNotes ? `ESTILO DETECTADO EN SU BLOG: ${wpStyleNotes}` : '',
        wpRecentTopics: wpRecentTopics ? `TEMAS RECIENTES DE SU BLOG: ${wpRecentTopics}` : '',
        prohibitedTerms: prohibitedTermsForPrompt,
        avoidTopicsList: avoidTopicsListForPrompt,
        customTopicDirective: customTopicDirective,
      };

      // Get topic prompt from database with cache
      const topicPrompt = await getPrompt(
        supabase,
        'saas.topic',
        enrichedVariables,
        FALLBACK_PROMPTS.topic
      );

      // Single attempt - prohibited terms are now IN the prompt
      try {
        const topicResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
          const generatedTopic = topicData.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") || '';
          
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
            "Consejos para mejorar la calidad del sueño"
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
            "Cómo elegir el champú adecuado para tu tipo de pelo"
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
            "Cómo generar reseñas positivas de clientes"
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
            "Cómo fotografiar platos para redes sociales"
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
            "Gestión de contraseñas segura para equipos"
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
            "Cómo crear un espacio de trabajo saludable"
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
            "Cómo crear una propuesta de valor única"
          ]
        };
        
        const fallbacks = concreteFallbacks[sectorCategory] || concreteFallbacks.default;
        // Filter against used topics to avoid duplicates
        const allUsed = new Set([...usedTopics, ...wpTopics].map(t => t.toLowerCase()));
        const availableFallbacks = fallbacks.filter(f => !allUsed.has(f.toLowerCase()));
        const finalList = availableFallbacks.length > 0 ? availableFallbacks : fallbacks;
        topic = finalList[Math.floor(Math.random() * finalList.length)];
        console.log(`Using fallback topic (filtered): "${topic}"`);
      }
    }

    // Build home URL from blog_url or fallback
    const homeUrl = site.blog_url 
      ? (() => { try { const u = new URL(site.blog_url); return `${u.protocol}//${u.host}`; } catch { return site.blog_url; } })()
      : '#';
    
    // Build custom topic directive for article
    const customTopicDirectiveArticle = site.custom_topic
      ? `Directriz temática global del cliente: "${site.custom_topic}". El contenido debe alinearse con esta directriz.`
      : 'Sin directriz temática específica. Genera contenido relevante para el sector.';

    // Build avoid topics list for article
    const allProhibitedForArticle = [
      ...(avoidTopics.length > 0 ? avoidTopics.map(t => `- Tema a evitar: ${t}`) : []),
      ...(sectorProhibitedTerms.length > 0 ? sectorProhibitedTerms.slice(0, 15).map(t => `- Término prohibido: ${t}`) : [])
    ].join('\n') || '(ninguno)';

    // Build system prompt from database with enriched context
    const systemPrompt = await getPrompt(
      supabase,
      'saas.article.system',
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
        targetAudience: targetAudience ? `Audiencia objetivo: ${targetAudience}` : 'Audiencia: público general del sector',
        pillarType: currentPillar,
        pillarDescription: pillarDescription,
        lengthWords: lengthTarget.words.toString(),
        lengthDescription: lengthTarget.description,
        wpStyleNotes: wpStyleNotes ? `Mantener este estilo detectado en su blog: ${wpStyleNotes}` : 'Sin estilo previo detectado.',
        homeUrl: homeUrl,
        blogUrl: site.blog_url || '',
        instagramUrl: site.instagram_url || '',
        topic: topic,
        customTopicDirective: customTopicDirectiveArticle,
        avoidTopicsList: allProhibitedForArticle,
        prohibitedTerms: sectorProhibitedTerms.length > 0 
          ? sectorProhibitedTerms.slice(0, 15).map(t => `- ${t}`).join('\n') 
          : '(ninguno)',
      },
      FALLBACK_PROMPTS.articleSystem
    );

    // Build user prompt from database
    const userPrompt = await getPrompt(
      supabase,
      'saas.article.user',
      { 
        topic: topic,
        pillarType: currentPillar,
        pillarDescription: pillarDescription,
        siteName: site.name,
        homeUrl: homeUrl,
        blogUrl: site.blog_url || '',
        instagramUrl: site.instagram_url || '',
        lengthWords: lengthTarget.words.toString(),
      },
      FALLBACK_PROMPTS.articleUser
    );

    console.log("Generating Spanish article...");

    // Helper to generate Spanish article with a given max_tokens
    async function generateSpanishWithTokens(tokens: number): Promise<{ content: string; response: Response }> {
      const resp = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
      return { content: '', response: resp };
    }

    // Helper to parse Spanish JSON with robust strategy
    function parseArticleJson(rawContent: string): any {
      let cleanContent = rawContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("No JSON object found in response");
      }
      
      const jsonString = cleanContent.substring(firstBrace, lastBrace + 1);
      const cleanedJson = jsonString.replace(/[\uFEFF\u200B\u200C\u200D]/g, '');
      
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
      if (msg.includes("Expected ',' or '}'") || msg.includes("Unterminated string") || msg.includes("Expected property name")) {
        return true;
      }
      // Check if content doesn't end with closing brace (sign of truncation)
      const trimmed = rawContent?.trim() || '';
      if (trimmed.length > 100 && !trimmed.endsWith('}')) {
        return true;
      }
      return false;
    }

    let currentMaxTokens = lengthTarget.maxTokens;
    console.log(`Generating Spanish article with max_tokens=${currentMaxTokens} (preferred_length=${preferredLength})...`);

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
        LOVABLE_API_KEY!
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
        'saas.translate.catalan',
        {
          title: spanishArticle.title,
          seoTitle: spanishArticle.seo_title || '',
          meta: spanishArticle.meta_description,
          excerpt: spanishArticle.excerpt || spanishArticle.meta_description,
          focusKeyword: spanishArticle.focus_keyword || '',
          slug: spanishArticle.slug,
          content: spanishContentWithoutSeo
        },
        FALLBACK_PROMPTS.nativeCatalan
      );

      try {
        const catalanResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
            let cleanCatalan = catalanContent
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```\s*$/i, '');
            
            const jsonMatch = cleanCatalan.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const cleanedCatalanJson = jsonMatch[0].replace(/[\uFEFF\u200B\u200C\u200D]/g, '');
              
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
                  LOVABLE_API_KEY!
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
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
      const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
      
      let match;
      while ((match = regex.exec(content)) !== null) {
        const position = match.index;
        const textBefore = content.substring(0, position);
        
        // Check 1: Are we inside an <a> tag? (open <a without closing </a>)
        const lastOpenA = textBefore.lastIndexOf('<a ');
        const lastCloseA = textBefore.lastIndexOf('</a>');
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
      
      // Get image prompt from database
      const imagePrompt = await getPrompt(
        supabase,
        'saas.image',
        {
          topic: topic,
          sector: sector,
          description: site.description ? `CONTEXT: ${site.description}` : ''
        },
        FALLBACK_PROMPTS.image
      );

      try {
        const imageResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"]
          }),
        });

        console.log("AI image response status:", imageResponse.status);
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          console.log("AI image response structure:", JSON.stringify(Object.keys(imageData)));
          
          const message = imageData.choices?.[0]?.message;
          const base64Image = message?.images?.[0]?.image_url?.url;
          
          console.log("Message keys:", message ? JSON.stringify(Object.keys(message)) : "no message");
          console.log("Has images array:", !!message?.images);
          console.log("Images count:", message?.images?.length || 0);
          
          if (base64Image) {
            console.log("AI image generated successfully, uploading to storage...");
            
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            const timestamp = Date.now();
            const fileName = `${siteId}/${timestamp}-${topic.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('article-images')
              .upload(fileName, imageBuffer, { 
                contentType: 'image/png',
                upsert: true 
              });
            
            if (uploadError) {
              console.error("Storage upload error:", uploadError);
            } else {
              const { data: urlData } = supabaseAdmin.storage
                .from('article-images')
                .getPublicUrl(fileName);
              
              imageResult = {
                url: urlData.publicUrl,
                photographer: "AI Generated",
                photographer_url: null,
              };
              pexelsQuery = "AI Generated";
              console.log("Image uploaded to storage:", urlData.publicUrl);
            }
          } else {
            console.log("No base64 image found in response");
            console.log("Full message content:", JSON.stringify(message).substring(0, 500));
          }
        } else {
          const errorText = await imageResponse.text();
          console.error("AI image generation failed:", imageResponse.status, errorText);
        }
      } catch (error) {
        console.error("Error generating AI image:", error);
      }

      // Fallback to Unsplash if AI generation failed
      if (!imageResult) {
        console.log("Falling back to Unsplash...");
        
        if (UNSPLASH_ACCESS_KEY) {
          const fallbackQuery = sectorContext.fallbackQuery;
          pexelsQuery = fallbackQuery;
          
          try {
            const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(fallbackQuery)}&per_page=20&orientation=landscape`;
            const unsplashResponse = await fetch(searchUrl, {
              headers: { "Authorization": `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            });

            if (unsplashResponse.ok) {
              const unsplashData = await unsplashResponse.json();
              const photos = unsplashData.results || [];
              
              if (photos.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(photos.length, 10));
                const photo = photos[randomIndex];
                imageResult = {
                  url: photo.urls.regular,
                  photographer: photo.user.name,
                  photographer_url: photo.user.links.html,
                };
                console.log("Image selected from Unsplash fallback");
              }
            }
          } catch (error) {
            console.error("Unsplash fallback error:", error);
          }
        }

        // Final fallback to static images
        if (!imageResult) {
          const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
          imageResult = FALLBACK_IMAGES[randomIndex];
          pexelsQuery = "fallback";
          console.log("Using static fallback image");
        }
      }
    }

    // Calculate week of month
    const dayOfMonth = new Date().getDate();
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

    // Save article to database
    const articleData = {
      site_id: siteId,
      user_id: userId,
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
    };

    // Check if article already exists based on site's publish frequency
    let existingQuery = supabase
      .from('articles')
      .select('id')
      .eq('site_id', siteId)
      .eq('user_id', userId);

    if (site.publish_frequency === 'daily') {
      const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      existingQuery = existingQuery.gte('generated_at', todayStart.toISOString());
    } else if (site.publish_frequency === 'weekly') {
      existingQuery = existingQuery
        .eq('week_of_month', weekOfMonth)
        .eq('month', month)
        .eq('year', year);
    } else {
      existingQuery = existingQuery
        .eq('month', month)
        .eq('year', year);
    }

    const { data: existingArticle } = await existingQuery.maybeSingle();

    let savedArticle;
    if (existingArticle) {
      const { data, error: updateError } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', existingArticle.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating article:", updateError);
        throw new Error("Failed to update article");
      }
      savedArticle = data;
      console.log("Updated existing article:", savedArticle.id);
    } else {
      const { data, error: insertError } = await supabase
        .from('articles')
        .insert(articleData)
        .select()
        .single();

      if (insertError) {
        console.error("Error saving article:", insertError);
        throw new Error("Failed to save article");
      }
      savedArticle = data;
      console.log("Created new article:", savedArticle.id);
    }

    console.log("=== ARTICLE GENERATION COMPLETE ===");
    console.log("Article ID:", savedArticle.id);

    // Update pillar index for next generation (rotation)
    if (!providedTopic) {
      // Only update if we auto-generated the topic
      const { error: pillarUpdateError } = await supabase
        .from('sites')
        .update({ last_pillar_index: currentPillarIndex })
        .eq('id', siteId);
      
      if (pillarUpdateError) {
        console.error("Error updating pillar index:", pillarUpdateError);
      } else {
        console.log(`Updated pillar index to ${currentPillarIndex} (${currentPillar})`);
      }
    }

    // Send notification email to user
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (userProfile?.email) {
      const articleTitle = spanishArticle?.title || catalanArticle?.title || topic;
      const articleExcerpt = spanishArticle?.meta_description || catalanArticle?.meta_description || `Nuevo artículo sobre ${topic}`;
      
      sendArticleNotification(
        userProfile.email,
        site.name,
        articleTitle,
        articleExcerpt,
        siteId
      ).catch(err => console.error("Background email error:", err));
    }

    // Auto-publish to WordPress when scheduled (automated generation)
    if (isScheduled) {
      try {
        const { data: wpConfig } = await supabase
          .from('wordpress_configs')
          .select('id')
          .eq('site_id', siteId)
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
            status: 'publish',
            image_url: imageResult?.url || null,
            image_alt: spanishArticle.title,
            meta_description: spanishArticle.meta_description,
            excerpt: spanishArticle.excerpt || spanishArticle.meta_description,
            focus_keyword: spanishArticle.focus_keyword,
            lang: 'es',
          };

          const publishUrl = `${supabaseUrl}/functions/v1/publish-to-wordpress-saas`;
          fetch(publishUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify(publishPayload),
          }).then(async (res) => {
            console.log(`[auto-publish] Response status: ${res.status}`);
            if (res.ok) {
              const result = await res.json();
              if (result.post_url) {
                // Update article with wp_post_url
                await supabase
                  .from('articles')
                  .update({ wp_post_url: result.post_url })
                  .eq('id', savedArticle.id);
                console.log(`[auto-publish] Updated wp_post_url: ${result.post_url}`);
              }
            }
          }).catch(err => {
            console.error('[auto-publish] Error:', err);
          });
        } else {
          console.log("No WordPress config found or no Spanish content - skipping auto-publish");
        }
      } catch (autoPublishError) {
        console.error("[auto-publish] Non-blocking error:", autoPublishError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      article: savedArticle,
      content: {
        spanish: spanishArticle,
        catalan: catalanArticle,
      },
      image: imageResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-article-saas:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
