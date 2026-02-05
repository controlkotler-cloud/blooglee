import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
// MARKDOWN CLEANUP - Remove markdown syntax that slipped into HTML
// ==========================================
function cleanMarkdownFromHtml(content: string): string {
  if (!content) return content;
  
  return content
    // **texto** or __texto__ → <strong>texto</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // *texto* or _texto_ → <em>texto</em> (not inside strong tags)
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
    // ~~texto~~ → <del>texto</del>
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // `codigo` → <code>codigo</code>
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// ==========================================
// FALLBACK PROMPTS (used if DB prompt not found)
// ==========================================
const FALLBACK_PROMPTS = {
  topic: `Eres un experto en marketing de contenidos para el sector "{{sector}}".

EMPRESA: {{siteName}}
SECTOR: {{sector}}
{{description}}
ÁMBITO: {{scope}}
{{targetAudience}}

TIPO DE CONTENIDO REQUERIDO: {{pillarType}}
{{pillarDescription}}

TONO DE VOZ: {{toneType}}
{{toneDescription}}

{{wpStyleNotes}}
{{wpRecentTopics}}

CONTEXTO TEMPORAL: Estamos en {{month}} {{year}}, considera estacionalidad si aplica.
{{usedTopics}}

Genera UN tema de blog que:
1. Encaje PERFECTAMENTE con el pilar de contenido "{{pillarType}}"
2. Sea relevante para el sector {{sector}}{{descriptionContext}}
3. Tenga potencial SEO
4. Considere la estacionalidad si el pilar es "seasonal"
5. NO mencione el nombre de la empresa
6. Sea DIFERENTE a los temas ya usados
7. NO incluyas el año en el tema (ej: "2026", "este año")
8. Usa capitalización española (solo inicial mayúscula, no Title Case)
9. Use el tono indicado

Responde SOLO con el tema (máx 80 caracteres), sin explicaciones.`,

  articleSystem: `Eres un redactor experto en marketing de contenidos y SEO para el sector {{sector}}.

EMPRESA: {{siteName}}
SECTOR: {{sector}}
{{description}}
ÁMBITO: {{scope}}
{{targetAudience}}

TONO DE VOZ: {{toneType}}
{{toneDescription}}

TIPO DE CONTENIDO: {{pillarType}}
{{pillarDescription}}

LONGITUD OBJETIVO: {{lengthDescription}}

{{wpStyleNotes}}

TU MISIÓN: Generar un artículo de {{lengthWords}} palabras optimizado para SEO{{descriptionContext}}.

REGLAS DE ESTRUCTURA HTML:
- ⚠️ NO incluyas <h1> en el contenido - WordPress lo añade automáticamente desde el título
- El contenido DEBE empezar con un <h2> introductorio DIFERENTE al título H1
- Ese H2 inicial debe ser un gancho o resumen del tema, NO repetir el título

{{geoContext}}

⚠️ OPTIMIZACIÓN SEO CRÍTICA (Yoast verde OBLIGATORIO):

1. FOCUS KEYWORD (2-4 palabras):
   - DEBE aparecer MÍNIMO 5 VECES en el texto completo
   - Distribuir uniformemente: intro, mitad del artículo, y conclusión (NO todo junto)
   - DEBE aparecer en el seo_title (AL INICIO, primeras palabras)
   - DEBE aparecer en la meta_description
   - DEBE aparecer en el primer párrafo (primeras 100 palabras)
   - DEBE aparecer en AL MENOS 2 subtítulos H2 o H3
   - Usa SINÓNIMOS de la keyword en otras secciones para distribución natural

2. ENLACES EXTERNOS OBLIGATORIOS:
   - INCLUYE 1-2 enlaces a fuentes de autoridad (Wikipedia, estudios, instituciones oficiales, medios reconocidos)
   - Formato: <a href="URL" target="_blank" rel="noopener">texto ancla descriptivo</a>
   - NO enlaces a competidores directos

3. META DESCRIPTION:
   - EXACTAMENTE 140-150 caracteres (NUNCA más de 150)
   - Incluir focus_keyword
   - Terminar con CTA

4. PÁRRAFOS Y LEGIBILIDAD:
   - Mantén los párrafos entre 2-4 oraciones
   - Usa transiciones entre secciones

5. PREGUNTAS PAA (People Also Ask):
   - INCLUYE 1-2 subtítulos H2 en FORMATO PREGUNTA
   - Estas preguntas deben ser las que los usuarios buscan en Google sobre el tema
   - Ejemplos: "¿Por qué...?", "¿Cómo...?", "¿Cuál es...?", "¿Qué significa...?"
   - Responde la pregunta en el párrafo siguiente (2-4 oraciones directas)
   - Esto mejora posicionamiento en featured snippets de Google

⚠️ CAPITALIZACIÓN ESPAÑOLA OBLIGATORIA:
- SOLO la primera letra del título/subtítulo en mayúscula (+ nombres propios)

LISTAS:
- Si enumeras con dos puntos (:), usa lista HTML (<ul><li>)

CONTEXTO TEMPORAL: Hoy es {{dateContext}}.

FORMATO DE RESPUESTA JSON (TODOS los campos son OBLIGATORIOS):
{
  "title": "Título H1 atractivo (máx 70 chars, SIN nombre empresa, SIN año)",
  "seo_title": "SEO title (máx 60 chars, EMPIEZA con focus_keyword)",
  "meta_description": "Meta descripción (140-150 caracteres EXACTOS) con focus_keyword y CTA",
  "excerpt": "Resumen breve (máx 160 chars) DIFERENTE a meta_description",
  "focus_keyword": "keyword principal de 2-4 palabras",
  "slug": "url-con-focus-keyword-sin-espacios",
  "content": "<h2>Subtítulo con focus_keyword</h2><p>Primer párrafo con focus_keyword...</p>...<h2>¿Pregunta PAA relevante?</h2><p>Respuesta...</p>"
}

RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO.`,

  articleUser: `TEMA: {{topic}}

TIPO DE CONTENIDO: {{pillarType}}
{{pillarDescription}}

Genera un artículo profesional que encaje con este tipo de contenido.

REGLAS OBLIGATORIAS:
1. El contenido HTML NO debe contener <h1> (WordPress lo añade)
2. Empieza el contenido con un <h2> que sea un GANCHO, diferente al título
3. INCLUYE 1-2 enlaces externos a fuentes de autoridad (Wikipedia, estudios, instituciones) - OBLIGATORIO
4. La meta_description debe tener EXACTAMENTE 140-150 caracteres (NUNCA más de 150)
5. El focus_keyword (2-4 palabras) debe aparecer MÍNIMO 5 VECES distribuidas uniformemente
6. El focus_keyword debe estar en: slug, seo_title (AL INICIO), meta_description, primer párrafo y AL MENOS 2 subtítulos H2/H3
7. INCLUYE 1-2 subtítulos H2 en formato PREGUNTA (¿Por qué...?, ¿Cómo...?, ¿Qué...?) con respuesta directa

FORMATO JSON OBLIGATORIO (TODOS los campos requeridos):
{
  "title": "Título H1 atractivo (máx 70 caracteres)",
  "seo_title": "SEO title que EMPIEZA con focus_keyword (máx 60 chars)",
  "meta_description": "Meta descripción (140-150 chars EXACTOS) con keyword y CTA",
  "excerpt": "Resumen diferente a meta_description (máx 160 chars)",
  "focus_keyword": "keyword principal 2-4 palabras",
  "slug": "url-con-keyword-sin-espacios",
  "content": "<h2>Subtítulo con keyword</h2><p>Primer párrafo con keyword...</p>...<h2>¿Pregunta PAA?</h2><p>Respuesta...</p>"
}`,

  translateCatalan: `Traduce este artículo del español al catalán.

ARTÍCULO:
Título: {{title}}
SEO Title: {{seoTitle}}
Meta: {{meta}}
Excerpt: {{excerpt}}
Focus Keyword: {{focusKeyword}}
Slug: {{slug}}
Contenido: {{content}}

REGLAS DE TRADUCCIÓN:
- Mantén el focus_keyword traducido al catalán
- La meta_description NO puede superar 155 caracteres
- El excerpt debe ser diferente a la meta_description

RESPONDE EN JSON (TODOS los campos obligatorios):
{
  "title": "Títol en català",
  "seo_title": "SEO title en català (màx 60 chars)",
  "meta_description": "Meta descripció en català (MÀXIM 155 chars)",
  "excerpt": "Resum en català (màx 160 chars, diferent de meta)",
  "focus_keyword": "keyword traduïda al català",
  "slug": "url-en-catala",
  "content": "Contingut HTML en català"
}`,

  image: `Generate a professional blog header image.

TOPIC: "{{topic}}"
SECTOR: {{sector}}
{{description}}

REQUIREMENTS:
- Clean, professional photograph
- Visually related to the topic and sector
- NO text, NO logos, NO faces
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

const LENGTH_TARGETS: Record<string, { words: number; description: string }> = {
  short: { words: 800, description: "~800 palabras, lectura rápida de 3 minutos" },
  medium: { words: 1500, description: "~1500 palabras, lectura de 6-7 minutos" },
  long: { words: 2500, description: "~2500 palabras, guía completa de 10+ minutos" }
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

async function getUsedTopicsForSite(supabaseClient: any, siteId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from('articles')
      .select('topic')
      .eq('site_id', siteId)
      .order('generated_at', { ascending: false })
      .limit(50);
    
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
// MAIN HANDLER
// ==========================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    const dateContext = `${monthNameEs} ${year}`;
    
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
    const wpRecentTopics = wpContext?.lastTopics?.slice(0, 5).join(', ') || '';

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
      const usedTopics = await getUsedTopicsForSite(supabase, siteId);
      console.log(`Found ${usedTopics.length} Blooglee topics`);
      
      // Get WordPress topics from context
      const wpTopics = wpContext?.lastTopics || [];
      console.log(`Found ${wpTopics.length} WordPress topics from context`);
      if (wpTopics.length > 0) {
        console.log('WordPress topics to avoid:', wpTopics.slice(0, 5).join(', '));
      }
      
      // Build comprehensive avoid list
      const allAvoidTopics = [
        ...avoidTopics,
        ...usedTopics.slice(0, 30),
        ...wpTopics // WordPress topics from sync
      ];
      console.log(`Total topics to avoid: ${allAvoidTopics.length}`);
      
      const usedTopicsSection = allAvoidTopics.length > 0 
        ? `\n\n⚠️ TEMAS A EVITAR (NO REPETIR NI SIMILARES):\n${allAvoidTopics.slice(0, 40).map((t, i) => `${i+1}. ${t}`).join('\n')}`
        : '';

      // Build prohibited terms string for prompt
      const prohibitedTermsForPrompt = sectorProhibitedTerms.length > 0
        ? `- ${sectorProhibitedTerms.slice(0, 20).join('\n- ')}`
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
        usedTopics: usedTopicsSection,
        // NEW: Enriched context
        pillarType: currentPillar,
        pillarDescription: pillarDescription,
        toneType: siteTone,
        toneDescription: toneDescription,
        targetAudience: targetAudience ? `AUDIENCIA OBJETIVO: ${targetAudience}` : '',
        wpStyleNotes: wpStyleNotes ? `ESTILO DETECTADO EN SU BLOG: ${wpStyleNotes}` : '',
        wpRecentTopics: wpRecentTopics ? `TEMAS RECIENTES DE SU BLOG: ${wpRecentTopics}` : '',
        // NEW: Prohibited terms
        prohibitedTerms: prohibitedTermsForPrompt
      };

      // Get topic prompt from database with cache
      const topicPrompt = await getPrompt(
        supabase,
        'saas.topic',
        enrichedVariables,
        FALLBACK_PROMPTS.topic
      );

      // Maximum retry attempts for topic validation
      const MAX_TOPIC_ATTEMPTS = 3;
      let topicAttempt = 0;
      let validTopic = false;

      while (!validTopic && topicAttempt < MAX_TOPIC_ATTEMPTS) {
        topicAttempt++;
        console.log(`Topic generation attempt ${topicAttempt}/${MAX_TOPIC_ATTEMPTS}`);
        
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
              temperature: 0.85 + (topicAttempt * 0.1), // Increase temperature on retries
              max_tokens: 100,
            }),
          });

          if (topicResponse.ok) {
            const topicData = await topicResponse.json();
            const generatedTopic = topicData.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") || '';
            
            if (generatedTopic) {
              // Validate topic doesn't contain prohibited terms
              const topicLower = generatedTopic.toLowerCase();
              const containsProhibited = sectorProhibitedTerms.some(term => 
                topicLower.includes(term.toLowerCase())
              );
              
              // Also check for generic patterns
              const genericPatterns = [
                /\b(202\d|2030)\b/, // Years
                /\b(futuro|future)\b/i,
                /\b(tendencias?|trends?)\b/i,
                /\b(digitaliza|transforma)/i,
                /\b(innovaci[oó]n|disrupt)/i,
                /\b(inteligencia artificial|ia\s|ai\s)/i
              ];
              
              const containsGenericPattern = genericPatterns.some(pattern => pattern.test(topicLower));
              
              if (!containsProhibited && !containsGenericPattern) {
                topic = generatedTopic;
                validTopic = true;
                console.log(`✓ Valid topic generated: "${topic}"`);
              } else {
                console.log(`✗ Topic rejected (contains prohibited/generic terms): "${generatedTopic}"`);
              }
            }
          }
        } catch (error) {
          console.error(`Topic generation attempt ${topicAttempt} error:`, error);
        }
      }
      
      // Fallback if all attempts failed - generate a concrete, sector-specific topic
      if (!topic) {
        const concreteFallbacks: Record<string, string[]> = {
          farmacia: [
            "Cómo organizar el mostrador de dermofarmacia",
            "Consejos para la atención de alergias estacionales",
            "Guía de productos para el cuidado solar"
          ],
          marketing: [
            "Estructura de una landing page efectiva",
            "Cómo redactar asuntos de email que abren",
            "Guía de palabras clave long-tail"
          ],
          default: [
            "Cómo mejorar la atención al cliente",
            "Organiza tu espacio de trabajo eficientemente",
            "Guía para fidelizar a tus clientes"
          ]
        };
        
        const fallbacks = concreteFallbacks[sectorCategory] || concreteFallbacks.default;
        topic = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        console.log(`Using concrete fallback topic: "${topic}"`);
      }
    }

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
        // NEW: Enriched context
        toneType: siteTone,
        toneDescription: toneDescription,
        targetAudience: targetAudience ? `AUDIENCIA: ${targetAudience}` : '',
        pillarType: currentPillar,
        pillarDescription: pillarDescription,
        lengthWords: lengthTarget.words.toString(),
        lengthDescription: lengthTarget.description,
        wpStyleNotes: wpStyleNotes ? `ESTILO A MANTENER: ${wpStyleNotes}` : ''
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
        pillarDescription: pillarDescription
      },
      FALLBACK_PROMPTS.articleUser
    );

    console.log("Generating Spanish article...");

    const spanishResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        max_tokens: 8000,
      }),
    });

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
    let spanishContent = spanishData.choices?.[0]?.message?.content;

    if (!spanishContent) {
      throw new Error("No Spanish content generated");
    }

    // Parse JSON from response using robust two-attempt strategy
    let spanishArticle;
    try {
      let cleanContent = spanishContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        console.error("JSON extraction failed:", { firstBrace, lastBrace, contentLength: cleanContent.length });
        throw new Error("No JSON object found in response");
      }
      
      const jsonString = cleanContent.substring(firstBrace, lastBrace + 1);
      
      // Clean BOM and zero-width characters (always safe to remove globally)
      const cleanedJson = jsonString.replace(/[\uFEFF\u200B\u200C\u200D]/g, '');
      
      // Attempt 1: Parse directly (works for most valid JSON)
      try {
        spanishArticle = JSON.parse(cleanedJson);
      } catch (firstError) {
        console.log("JSON parse failed on first attempt; applying string-only escaping and retrying");
        console.log("First error:", (firstError as Error).message);
        console.log("Raw content preview:", cleanedJson.substring(0, 200));
        
        // Attempt 2: Escape control chars ONLY inside string literals
        const repairedJson = escapeControlCharsInsideStrings(cleanedJson);
        spanishArticle = JSON.parse(repairedJson);
        console.log("JSON parse succeeded after string-only escaping");
      }
    } catch (e) {
      console.error("Error parsing Spanish JSON:", e);
      console.error("Raw content preview:", spanishContent?.substring(0, 500));
      throw new Error("Failed to parse Spanish article JSON");
    }

    console.log("Spanish article generated successfully");

    // Clean any markdown that slipped into HTML
    if (spanishArticle.content) {
      spanishArticle.content = cleanMarkdownFromHtml(spanishArticle.content);
      console.log("Cleaned markdown from Spanish content");
    }

    // Post-generation validation: truncate meta_description if over 155 chars
    if (spanishArticle.meta_description && spanishArticle.meta_description.length > 155) {
      console.log(`Meta description too long (${spanishArticle.meta_description.length} chars), truncating to 155`);
      spanishArticle.meta_description = spanishArticle.meta_description.substring(0, 152) + '...';
    }

    // Store Spanish content WITHOUT SEO footer for translation
    const spanishContentWithoutSeo = spanishArticle.content;
    let catalanArticle = null;
    
    if (site.languages?.includes("catalan")) {
      console.log("Generating Catalan version...");
      
      // Get Catalan translation prompt from database
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
        FALLBACK_PROMPTS.translateCatalan
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
            temperature: 0.3,
            max_tokens: 8000,
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
              // Clean BOM and zero-width characters
              const cleanedCatalanJson = jsonMatch[0].replace(/[\uFEFF\u200B\u200C\u200D]/g, '');
              
              // Two-attempt parsing for Catalan too
              try {
                catalanArticle = JSON.parse(cleanedCatalanJson);
              } catch (firstError) {
                console.log("Catalan JSON parse failed on first attempt; applying string-only escaping");
                const repairedCatalanJson = escapeControlCharsInsideStrings(cleanedCatalanJson);
              catalanArticle = JSON.parse(repairedCatalanJson);
              }
              console.log("Catalan article generated successfully");
              
              // Clean any markdown from Catalan content
              if (catalanArticle?.content) {
                catalanArticle.content = cleanMarkdownFromHtml(catalanArticle.content);
                console.log("Cleaned markdown from Catalan content");
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
      
      // Find first mention of brand name (case insensitive, not inside an existing tag)
      const escapedName = escapeRegexChars(siteName);
      // Match siteName not preceded by '>' or followed by '<' (to avoid matching inside tags)
      const regex = new RegExp(`(?<![>"])\\b(${escapedName})\\b(?![<"])`, 'i');
      const match = content.match(regex);
      
      if (match && match.index !== undefined) {
        // Replace only the first occurrence
        const before = content.substring(0, match.index);
        const after = content.substring(match.index + match[0].length);
        const linkedName = `<a href="${homeUrl}" target="_blank" rel="noopener">${match[0]}</a>`;
        console.log(`Home link added at position ${match.index}`);
        return before + linkedName + after;
      }
      
      return content;
    }

    // Add home link to Spanish content (first mention of brand)
    let processedSpanishContent = spanishContentWithoutSeo;
    processedSpanishContent = addHomeLinkToContent(processedSpanishContent, site.name, site.blog_url || null);

    // Add SEO footer with blog/social links to Spanish content
    console.log("Adding SEO footer links...");
    const seoLinksEs: string[] = [];
    if (site.blog_url) {
      seoLinksEs.push(`<a href="${site.blog_url}" target="_blank" rel="noopener">nuestro blog</a>`);
    }
    if (site.instagram_url) {
      seoLinksEs.push(`<a href="${site.instagram_url}" target="_blank" rel="noopener">nuestras redes sociales</a>`);
    }
    
    if (seoLinksEs.length > 0) {
      const linksTextEs = seoLinksEs.join(' y ');
      const closingParagraphEs = `<p><strong>¿Quieres más consejos?</strong> Visita ${linksTextEs} para descubrir más contenido de ${site.name}.</p>`;
      spanishArticle.content = processedSpanishContent + closingParagraphEs;
      console.log("SEO footer added to Spanish article");
    } else {
      spanishArticle.content = processedSpanishContent;
    }

    // Add SEO footer to Catalan content AFTER translation
    if (catalanArticle?.content) {
      const seoLinksCa: string[] = [];
      if (site.blog_url) {
        seoLinksCa.push(`<a href="${site.blog_url}" target="_blank" rel="noopener">el nostre blog</a>`);
      }
      if (site.instagram_url) {
        seoLinksCa.push(`<a href="${site.instagram_url}" target="_blank" rel="noopener">les nostres xarxes socials</a>`);
      }
      
      if (seoLinksCa.length > 0) {
        const linksTextCa = seoLinksCa.join(' i ');
        const closingParagraphCa = `<p><strong>Vols més consells?</strong> Visita ${linksTextCa} per descobrir més contingut de ${site.name}.</p>`;
        catalanArticle.content += closingParagraphCa;
        console.log("SEO footer added to Catalan article");
      }
    }

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
