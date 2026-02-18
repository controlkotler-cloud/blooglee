import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

interface BlogPostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seo_keywords: string[];
  read_time: string;
  thematic_category: string;
}

// Thematic categories (separate from audience)
const THEMATIC_CATEGORIES = ['SEO', 'Marketing', 'Tutoriales', 'Comparativas', 'Producto', 'Tendencias'];

// Post-processing: clean AI-generated content before saving
function cleanGeneratedContent(content: string): string {
  let cleaned = content;

  // Remove AI conversational meta-text before --- separator
  cleaned = cleaned.replace(/^[\s\S]*?(?:Absolutamente|Aquí tienes|Here is|Here's|¡Claro|Por supuesto)[\s\S]*?---\s*\n*/i, '');

  // Remove "Título: ..." lines at the beginning
  cleaned = cleaned.replace(/^(?:Título\s*:\s*.+\n\s*)+/i, '');

  // Remove duplicate H1 at the beginning
  cleaned = cleaned.replace(/^#\s+.+\n+/, '');

  // Trim leading blank lines
  cleaned = cleaned.replace(/^\s*\n+/, '');

  return cleaned;
}

// ==========================================
// SPANISH CAPITALIZATION ENFORCEMENT
// ==========================================
const SPANISH_LOWERCASE_WORDS = new Set([
  'a', 'al', 'ante', 'bajo', 'con', 'contra', 'de', 'del', 'desde', 'durante',
  'e', 'el', 'en', 'entre', 'hacia', 'hasta', 'la', 'las', 'lo', 'los',
  'mediante', 'ni', 'o', 'para', 'pero', 'por', 'que', 'se', 'según', 'sin',
  'sobre', 'su', 'sus', 'tan', 'tu', 'tus', 'u', 'un', 'una', 'uno', 'unos', 'unas',
  'y', 'ya', 'como', 'más', 'muy', 'nos', 'es', 'son', 'no', 'si', 'te', 'mi', 'me',
]);

const PRESERVE_CASE_PATTERNS = /^(SEO|HTML|CSS|API|URL|FAQ|CRM|SaaS|WordPress|Google|Instagram|Facebook|TikTok|LinkedIn|YouTube|iOS|AI|IA|B2B|B2C|KPI|ROI|CMS|PHP|UX|UI|RGPD|LOPD|IVA|Blooglee|etc|vs)$/i;

function enforceSpanishCapitalizationText(text: string): string {
  if (!text || text.length < 2) return text;
  const words = text.split(/(\s+)/);
  let isFirstWord = true;
  
  const result = words.map((word) => {
    if (/^\s+$/.test(word)) return word;
    if (!word) return word;
    
    if (PRESERVE_CASE_PATTERNS.test(word.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/g, ''))) {
      isFirstWord = false;
      return word;
    }
    
    const leadingPunct = word.match(/^([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)/)?.[1] || '';
    const trailingPunct = word.match(/([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)$/)?.[1] || '';
    const core = word.slice(leadingPunct.length, word.length - (trailingPunct.length || 0)) || word.slice(leadingPunct.length);
    
    if (!core) return word;
    
    const isAfterSentenceEnd = leadingPunct.includes('¿') || leadingPunct.includes('¡');
    
    if (isFirstWord || isAfterSentenceEnd) {
      isFirstWord = false;
      return leadingPunct + core.charAt(0).toUpperCase() + core.slice(1).toLowerCase() + trailingPunct;
    }
    
    isFirstWord = false;
    
    if (SPANISH_LOWERCASE_WORDS.has(core.toLowerCase())) {
      return leadingPunct + core.toLowerCase() + trailingPunct;
    }
    
    return leadingPunct + core.charAt(0).toLowerCase() + core.slice(1).toLowerCase() + trailingPunct;
  });
  
  return result.join('');
}

function enforceSpanishCapitalizationMarkdown(content: string): string {
  if (!content) return content;
  let fixCount = 0;
  
  // Fix ## and ### headings in Markdown
  const fixed = content.replace(/^(#{2,3})\s+(.+)$/gm, (_match, hashes, headingText) => {
    // Don't touch if it contains markdown links
    if (/\[.*\]\(.*\)/.test(headingText)) return _match;
    
    const cleaned = enforceSpanishCapitalizationText(headingText.trim());
    if (cleaned !== headingText.trim()) {
      fixCount++;
    }
    return `${hashes} ${cleaned}`;
  });
  
  if (fixCount > 0) {
    console.log(`Capitalization enforcement: fixed ${fixCount} Markdown headings`);
  }
  return fixed;
}

// ===== VERIFICACIÓN INTELIGENTE DE ENLACES EXTERNOS =====
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
    matches.push({ full: match[0], attrs: match[1], url: match[2], text: match[3] });
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
      
      console.log(`Server error (${headResponse.status}), keeping original: ${link.url}`);
      keptCount++;
      
    } catch (error) {
      console.log(`Network/timeout error, keeping original: ${link.url} (${error instanceof Error ? error.message : 'unknown'})`);
      keptCount++;
    }
  }
  
  console.log(`Link verification complete: ${fixedCount} fixed, ${keptCount} kept despite errors`);
  return cleanedContent;
}

// ===== DEFINICIÓN RESTRICTIVA DE BLOOGLEE =====
// Esta definición se incluye en el prompt para evitar que la IA invente funcionalidades
const BLOOGLEE_DEFINITION = `
DEFINICIÓN EXACTA DE BLOOGLEE (NO INVENTAR OTRAS FUNCIONALIDADES):

Blooglee es una plataforma SaaS que hace ÚNICAMENTE esto:
1. Genera artículos de blog con IA (GPT-5, Gemini 2.5) de 800-1200 palabras
2. Optimiza SEO automáticamente: meta título, meta descripción, slug, estructura H1-H3
3. Incluye imagen destacada automática (de Pexels, Unsplash o generada por IA)
4. Publica directamente en WordPress con un solo clic mediante API REST
5. Soporta español, catalán e inglés
6. Gestiona múltiples sitios web desde un dashboard centralizado (hasta 10 sitios)

⛔ BLOOGLEE NO HACE (NUNCA mencionar estas funcionalidades):
- NO genera newsletters ni email marketing
- NO gestiona redes sociales (LinkedIn, Instagram, Facebook, X, TikTok, etc.)
- NO hace SEO técnico ni auditorías SEO
- NO ofrece analytics ni informes de rendimiento
- NO crea landing pages
- NO hace reporting automatizado de métricas
- NO monitoriza NAP ni datos de negocio local
- NO tiene dashboards de métricas avanzadas
- NO integra con herramientas de análisis (GA4, Search Console, etc.)
- NO genera contenido para redes sociales
- NO automatiza campañas de email marketing
- NO hace A/B testing
- NO ofrece CRM ni gestión de clientes
- NO publica en redes sociales
- NO programa publicaciones en social media
- NO hace link building ni outreach
- NO analiza competencia
- NO optimiza Core Web Vitals
- NO genera informes PDF automatizados
- NO hace análisis predictivo
- NO ofrece alertas ni notificaciones de métricas

🚫 EJEMPLOS DE FRASES PROHIBIDAS (NUNCA usar):
- "Blooglee analiza tus métricas" ✗
- "Blooglee monitoriza tu NAP" ✗
- "Blooglee te envía newsletters" ✗
- "Blooglee gestiona tus redes sociales" ✗
- "Blooglee hace auditorías SEO" ✗
- "Blooglee ofrece reporting automatizado" ✗
- "Blooglee genera informes de rendimiento" ✗
- "Blooglee anticipa la demanda con análisis predictivo" ✗
- "Blooglee optimiza fragmentos destacados" ✗
- "Blooglee propone ideas basadas en datos" ✗

✅ EJEMPLOS DE FRASES CORRECTAS (usar estas):
- "Blooglee genera artículos de blog optimizados para SEO" ✓
- "Blooglee publica automáticamente en WordPress" ✓
- "Blooglee incluye imágenes destacadas de Pexels/Unsplash" ✓
- "Blooglee soporta español, catalán e inglés" ✓
- "Blooglee gestiona múltiples blogs desde un único dashboard" ✓
- "Blooglee te ahorra horas de redacción cada semana" ✓

REGLA CRÍTICA SOBRE MENCIONES DE BLOOGLEE:
- Si el tema del artículo es sobre blogs, contenido o WordPress → menciona Blooglee como solución para generar y publicar artículos automáticamente
- Si el tema NO es sobre blogs/contenido → NO menciones Blooglee o hazlo de forma MUY breve y genérica al final
- NUNCA atribuyas a Blooglee funcionalidades que no tiene
- Es 100% preferible NO mencionar Blooglee a inventar lo que hace
- Cuando menciones Blooglee, hazlo SOLO en contexto de: generar artículos, publicar en WordPress, imágenes destacadas, SEO de posts, gestión multi-sitio
`;
// ===== FIN DEFINICIÓN BLOOGLEE =====

// Topics for empresas (businesses) - CLEANED to avoid semantic duplicates
const EMPRESA_TOPICS = [
  "automatizar marketing contenidos pymes",
  "content marketing ROI medición",
  "blog corporativo estrategia beneficios",
  "estrategia contenidos digital",
  "IA para marketing empresarial automatización",
  "generación leads inbound marketing blog",
  "WordPress para empresas optimización",
  "analytics marketing contenidos métricas",
  "branded content storytelling empresas",
  "email marketing automatización contenidos",
  "estrategia omnicanal contenidos",
  "marketing automation herramientas",
  "customer journey contenidos digitales",
  "copywriting persuasivo ventas conversiones",
  "redes sociales integración blog corporativo",
];

// Topics for agencias (agencies) - CLEANED to avoid semantic duplicates
const AGENCIA_TOPICS = [
  "escalar producción contenidos clientes",
  "gestionar múltiples blogs WordPress agencia",
  "white label content tools agencias",
  "reporting automatizado clientes agencia",
  "workflow agencia marketing eficiencia",
  "herramientas IA agencias marketing",
  "pricing servicios content marketing",
  "client onboarding proceso agencias",
  "content calendar management equipos",
  "rentabilidad servicios contenidos agencia",
  "pitch propuestas content marketing",
  "retención clientes agencias marketing",
  "formación equipos content marketing",
  "dashboards métricas clientes agencia",
  "automatización tareas repetitivas agencia",
];

// Enhanced deduplication: get titles AND keywords from existing posts
async function getUsedBlogTopics(supabase: any, audience: string): Promise<string[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('title, seo_keywords')
    .eq('audience', audience.toLowerCase())
    .order('published_at', { ascending: false })
    .limit(30);
  
  const topics: string[] = [];
  data?.forEach((p: any) => {
    // Add title
    topics.push(p.title.toLowerCase());
    // Add keywords
    if (p.seo_keywords?.length) {
      topics.push(...p.seo_keywords.map((k: string) => k.toLowerCase()));
    }
  });
  
  // Remove duplicates
  return [...new Set(topics)];
}

// Check if a new title is too similar to existing topics
// Fixed: Require minimum 3 matching meaningful words to trigger similarity
function isTooSimilar(newTitle: string, existingTopics: string[]): { similar: boolean; matchedTopic?: string; similarity?: number } {
  // Stop words to ignore in similarity calculation (expanded list)
  const stopWords = new Set([
    'el', 'la', 'los', 'las', 'de', 'del', 'en', 'para', 'por', 'con', 
    'tu', 'tus', 'un', 'una', 'y', 'o', 'a', 'que', 'es', 'como', 'cómo', 
    'su', 'sus', 'al', 'se', 'lo', 'le', 'más', 'sin', 'sobre', 'entre',
    'cada', 'todo', 'todos', 'toda', 'todas', 'este', 'esta', 'estos', 'estas',
    'ese', 'esa', 'esos', 'esas', 'muy', 'ya', 'hay', 'hace', 'solo', 'así'
  ]);
  
  // Common generic words that shouldn't trigger similarity on their own
  const genericWords = new Set([
    'blog', 'contenido', 'contenidos', 'marketing', 'digital', 'online',
    'empresa', 'empresas', 'negocio', 'negocios', 'pymes', 'pyme',
    'agencia', 'agencias', 'cliente', 'clientes', 'equipo', 'equipos',
    'guía', 'guia', 'guías', 'estrategia', 'estrategias', 'herramienta', 'herramientas',
    'mejor', 'mejores', 'clave', 'claves', 'éxito', 'exito', 'resultado', 'resultados',
    'año', 'años', 'mes', 'meses', 'nuevo', 'nueva', 'nuevos', 'nuevas'
  ]);
  
  const extractWords = (text: string) => {
    return text.toLowerCase()
      .split(/[\s:,\-–—.;!?¿¡()[\]{}]+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  };
  
  const newWords = extractWords(newTitle);
  const newWordsSet = new Set(newWords);
  
  // Need at least 3 meaningful words in the new title to compare
  if (newWordsSet.size < 3) return { similar: false };
  
  // Separate generic and specific words
  const newSpecificWords = [...newWordsSet].filter(w => !genericWords.has(w));
  
  for (const existing of existingTopics) {
    const existingWords = extractWords(existing);
    const existingWordsSet = new Set(existingWords);
    
    // Skip very short topics (single keywords shouldn't block new content)
    if (existingWordsSet.size < 2) continue;
    
    const intersection = [...newWordsSet].filter(w => existingWordsSet.has(w));
    
    // NEW LOGIC: Must have at least 3 matching words AND at least 1 specific (non-generic) word match
    const specificMatches = intersection.filter(w => !genericWords.has(w));
    
    // Use the larger set size for more lenient percentage calculation
    const similarity = intersection.length / Math.max(newWordsSet.size, existingWordsSet.size);
    
    // Strict conditions: 
    // - At least 3 matching words total
    // - At least 2 specific (non-generic) matching words
    // - Similarity ratio above 50%
    const isSimilar = intersection.length >= 3 && specificMatches.length >= 2 && similarity > 0.5;
    
    if (isSimilar) {
      console.log(`⚠️ Title too similar to: "${existing}" (${(similarity * 100).toFixed(0)}% match)`);
      console.log(`   Matching words: ${intersection.join(', ')}`);
      console.log(`   Specific matches: ${specificMatches.join(', ')}`);
      return { similar: true, matchedTopic: existing, similarity };
    }
  }
  return { similar: false };
}

// Get the next thematic category in rotation for the given audience
async function getNextThematicCategory(supabase: any, audience: string): Promise<string> {
  const CATEGORY_ROTATION = ['SEO', 'Marketing', 'Tutoriales', 'Comparativas', 'Producto', 'Tendencias'];
  
  // Get the last 6 posts for this audience to see which categories were used
  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('audience', audience.toLowerCase())
    .order('published_at', { ascending: false })
    .limit(6);
  
  const recentCategories = recentPosts?.map((p: any) => p.category) || [];
  console.log(`Recent categories for ${audience}: ${recentCategories.join(', ') || 'none'}`);
  
  // Find the first category in our rotation that hasn't been used recently
  for (const cat of CATEGORY_ROTATION) {
    if (!recentCategories.includes(cat)) {
      console.log(`Next category for ${audience}: ${cat} (not in recent 6)`);
      return cat;
    }
  }
  
  // If all categories were used, start fresh with SEO
  console.log(`All categories used for ${audience}, restarting with SEO`);
  return 'SEO';
}

// Generate AI image with Blooglee brand aesthetics
async function generateAIImage(lovableApiKey: string, topic: string, category: string): Promise<{ url: string; isAI: boolean } | null> {
  try {
    console.log("Generating AI image for topic:", topic);
    
    const imagePrompt = `Create a stunning, professional blog header image.

VISUAL STYLE:
- Abstract, modern, conceptual design representing digital transformation
- Primary gradient colors flowing naturally: vibrant purple (#8B5CF6) transitioning to magenta/fuchsia (#D946EF) to warm coral (#F97316)
- Geometric shapes, flowing lines, or abstract patterns suggesting innovation
- High contrast, professional aesthetic with depth and dimension
- Clean, minimal, tech-forward look
- Soft glowing elements and light effects

COMPOSITION:
- 16:9 landscape aspect ratio
- Visual elements following rule-of-thirds
- Ample negative space
- NO text, NO logos, NO letters, NO words
- NO realistic human faces or photographs
- Abstract representation only

CONCEPT: ${topic}
MOOD: ${category === 'Empresas' ? 'Professional, trustworthy, growth-oriented' : 'Creative, innovative, collaborative'}

Create an image that represents content automation, digital marketing, and AI-powered innovation.
Make it look premium, cutting-edge, and suitable for a SaaS marketing blog.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("AI image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error("No image data in response");
      return null;
    }

    console.log("AI image generated successfully");
    return { url: imageData, isAI: true };
  } catch (error) {
    console.error("AI image generation error:", error);
    return null;
  }
}

// Upload base64 image to Supabase storage
async function uploadImageToStorage(
  supabase: any, 
  base64Data: string, 
  slug: string
): Promise<string | null> {
  try {
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    const fileName = `blog/${slug}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    console.log("Image uploaded to storage:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
}

// Fallback to Unsplash
async function fetchUnsplashImage(query: string, accessKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.results?.length) return null;
    
    const photo = data.results[Math.floor(Math.random() * Math.min(data.results.length, 3))];
    return `${photo.urls.regular}&w=1200&h=630&fit=crop`;
  } catch (error) {
    console.error("Unsplash error:", error);
    return null;
  }
}

// Normalize thematic category with fuzzy matching
function normalizeThematicCategory(raw: string): string {
  if (!raw) return 'Marketing';
  
  const normalized = raw.toLowerCase().trim();
  
  const mapping: Record<string, string> = {
    // SEO
    'seo': 'SEO',
    'search engine optimization': 'SEO',
    'posicionamiento': 'SEO',
    'posicionamiento web': 'SEO',
    'optimización seo': 'SEO',
    'keywords': 'SEO',
    'google': 'SEO',
    'search': 'SEO',
    
    // Marketing
    'marketing': 'Marketing',
    'marketing digital': 'Marketing',
    'estrategia': 'Marketing',
    'estrategias': 'Marketing',
    'campañas': 'Marketing',
    'roi': 'Marketing',
    'branding': 'Marketing',
    'publicidad': 'Marketing',
    'ads': 'Marketing',
    
    // Tutoriales
    'tutoriales': 'Tutoriales',
    'tutorial': 'Tutoriales',
    'guía': 'Tutoriales',
    'guias': 'Tutoriales',
    'how-to': 'Tutoriales',
    'howto': 'Tutoriales',
    'paso a paso': 'Tutoriales',
    'cómo': 'Tutoriales',
    'configuración': 'Tutoriales',
    'setup': 'Tutoriales',
    
    // Comparativas
    'comparativas': 'Comparativas',
    'comparativa': 'Comparativas',
    'vs': 'Comparativas',
    'versus': 'Comparativas',
    'comparación': 'Comparativas',
    'análisis': 'Comparativas',
    'review': 'Comparativas',
    'rankings': 'Comparativas',
    'mejores': 'Comparativas',
    'top': 'Comparativas',
    
    // Producto
    'producto': 'Producto',
    'blooglee': 'Producto',
    'actualización': 'Producto',
    'feature': 'Producto',
    'features': 'Producto',
    'novedades': 'Producto',
    'novedad': 'Producto',
    'changelog': 'Producto',
    
    // Tendencias
    'tendencias': 'Tendencias',
    'tendencia': 'Tendencias',
    'futuro': 'Tendencias',
    'predicciones': 'Tendencias',
    'trends': 'Tendencias',
    'innovación': 'Tendencias',
    'ia': 'Tendencias',
    'inteligencia artificial': 'Tendencias',
    'ai': 'Tendencias',
    'emergente': 'Tendencias',
  };
  
  // Direct match
  if (mapping[normalized]) {
    return mapping[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(mapping)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Check if it's already a valid category (case-insensitive)
  const validCategories = ['SEO', 'Marketing', 'Tutoriales', 'Comparativas', 'Producto', 'Tendencias'];
  for (const cat of validCategories) {
    if (normalized === cat.toLowerCase()) {
      return cat;
    }
  }
  
  return 'Marketing';
}

// Step 1: Generate metadata (title, slug, excerpt, keywords) with STRICT deduplication
async function generateMetadata(
  lovableApiKey: string,
  category: string,
  usedTopics: string[],
  currentYear: number,
  forceCategory?: string
): Promise<{ title: string; slug: string; excerpt: string; keywords: string[]; topic: string; thematic_category: string } | null> {
  const topicPool = category === 'Empresas' ? EMPRESA_TOPICS : AGENCIA_TOPICS;
  const audienceContext = category === 'Empresas' 
    ? "PYMEs españolas que quieren automatizar su marketing de contenidos"
    : "agencias de marketing digital que gestionan contenido para múltiples clientes";

  // Format prohibited topics list for the prompt
  const prohibitedTopicsList = usedTopics.slice(0, 30).map(t => `- ${t}`).join('\n');

  // If forceCategory is provided, focus the prompt on that category
  const categoryInstruction = forceCategory 
    ? `CATEGORÍA OBLIGATORIA: ${forceCategory}
El artículo DEBE ser sobre ${forceCategory}. Elige un tema que encaje perfectamente con esta categoría.`
    : `CATEGORÍAS TEMÁTICAS DISPONIBLES (elige UNA que mejor represente el contenido):
- "SEO" → Posicionamiento web, keywords, optimización técnica, Google, rankings
- "Marketing" → Estrategias, campañas, ROI, branding, publicidad
- "Tutoriales" → Guías paso a paso, how-to, configuración, setup
- "Comparativas" → Análisis de herramientas, X vs Y, rankings, reviews
- "Producto" → Novedades de Blooglee, actualizaciones, casos de uso
- "Tendencias" → Novedades del sector, predicciones, IA, innovación`;

  const prompt = `Eres un experto en SEO y marketing de contenidos.

AUDIENCIA: ${audienceContext}
TEMAS SUGERIDOS: ${topicPool.join(', ')}

⛔ TEMAS PROHIBIDOS (NO usar bajo NINGUNA circunstancia):
${prohibitedTopicsList || 'ninguno'}

Si el tema que generas es similar a alguno de los PROHIBIDOS, tu respuesta será rechazada.
Debes buscar un ángulo COMPLETAMENTE DIFERENTE.

${categoryInstruction}

Genera los metadatos para un artículo de blog ORIGINAL y ÚNICO.

REGLAS ESTRICTAS:
- El año actual es ${currentYear}. NO menciones años anteriores.
- NO incluir el año en el título (contenido evergreen)
- El título debe ser irresistible y tener máximo 60 caracteres
- El excerpt: máximo 145 caracteres, tono directo, PROHIBIDO usar signos de exclamación (!) o interrogación (?)
- El tema DEBE ser diferente a todos los prohibidos arriba

REGLAS DE CAPITALIZACIÓN (ESPAÑOL - MUY IMPORTANTE):
- Solo la primera letra del título en mayúscula (más nombres propios)
- NO usar capitalización tipo inglés (Title Case)
- Ejemplo CORRECTO: "Cómo automatizar tu blog con inteligencia artificial"
- Ejemplo INCORRECTO: "Cómo Automatizar Tu Blog Con Inteligencia Artificial"

IMPORTANTE: El campo "thematic_category" DEBE ser EXACTAMENTE una de estas palabras:
SEO, Marketing, Tutoriales, Comparativas, Producto, Tendencias

${forceCategory ? `El campo "thematic_category" DEBE ser: "${forceCategory}"` : ''}

Responde SOLO con este JSON válido:
{
  "topic": "tema elegido en 2-4 palabras",
  "title": "Título SEO optimizado (max 60 chars)",
  "slug": "url-amigable-sin-acentos",
  "excerpt": "Meta description directa (max 145 chars), sin ! ni ?, enfoque en beneficio concreto",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "thematic_category": "${forceCategory || 'UNA de: SEO, Marketing, Tutoriales, Comparativas, Producto, Tendencias'}"
}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    const jsonStart = rawContent.indexOf('{');
    const jsonEnd = rawContent.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;
    
    const jsonStr = rawContent.substring(jsonStart, jsonEnd + 1).replace(/[\x00-\x1F\x7F]/g, '');
    const parsed = JSON.parse(jsonStr);
    
    // Use forceCategory if provided, otherwise normalize the AI response
    const validCategory = forceCategory || normalizeThematicCategory(parsed.thematic_category);
    console.log(`Category: AI said "${parsed.thematic_category}" → normalized to "${validCategory}"`);
    
    // Clean excerpt: remove ! and ? marks, truncate to 145
    let cleanExcerpt = (parsed.excerpt || "")
      .replace(/[!¡?¿]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanExcerpt.length > 145) {
      cleanExcerpt = cleanExcerpt.substring(0, 142) + '...';
    }
    console.log("Cleaned punctuation from excerpt");
    
    return {
      title: parsed.title || "Artículo sin título",
      slug: parsed.slug || `articulo-${Date.now()}`,
      excerpt: cleanExcerpt,
      keywords: parsed.keywords || [],
      topic: parsed.topic || "marketing digital",
      thematic_category: validCategory
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return null;
  }
}

// Step 2: Generate full content separately
async function generateContent(
  lovableApiKey: string,
  metadata: { title: string; topic: string },
  category: string,
  currentYear: number,
  monthName: string
): Promise<string | null> {
  const audienceContext = category === 'Empresas' 
    ? "pequeñas y medianas empresas españolas que quieren mejorar su presencia digital"
    : "agencias de marketing digital que gestionan contenido para múltiples clientes";

  const prompt = `Eres el mejor copywriter de España, especializado en SEO y AEO.
Escribe un artículo de blog ÉPICO y COMPLETO sobre: "${metadata.title}"

CONTEXTO:
- Fecha actual: ${monthName} de ${currentYear}
- Instagram de Blooglee: https://www.instagram.com/blooglee_/
- Audiencia: ${audienceContext}

${BLOOGLEE_DEFINITION}

ESTRUCTURA OBLIGATORIA (2500-3500 palabras en Markdown):

1. INTRODUCCIÓN (150-200 palabras)
   - Dato impactante o pregunta provocadora
   - Promesa de valor

2. 5-7 SECCIONES H2 (300-500 palabras cada una)
   - Usar ## para títulos
   - Incluir ### para subsecciones
   - Al final de secciones importantes: 💡 **Clave:** [insight principal]
   - IMPORTANTE: Los títulos H2 y H3 también deben seguir capitalización española (solo primera letra mayúscula)

REGLAS DE CAPITALIZACIÓN (ESPAÑOL - MUY IMPORTANTE):
- Solo la primera letra de títulos/subtítulos en mayúscula (más nombres propios)
- NO usar capitalización tipo inglés (Title Case)
- Ejemplo CORRECTO: "## Cómo automatizar tu estrategia de contenidos"
- Ejemplo INCORRECTO: "## Cómo Automatizar Tu Estrategia De Contenidos"

3. 2 TABLAS COMPARATIVAS mínimo (formato Markdown)
   | Columna 1 | Columna 2 | Columna 3 |
   |-----------|-----------|-----------|
   | dato 1    | dato 2    | dato 3    |

4. 3+ LISTAS con bullets (- item)

5. DATOS ESTADÍSTICOS (6+ datos porcentuales realistas)
   Ejemplo: "El 73% de las empresas...", "Un incremento del 340%..."

6. FAQ (5-7 preguntas en formato):
   ## Preguntas Frecuentes
   ### ¿Pregunta 1?
   Respuesta completa.

7. ENLACES INTERNOS (usar Markdown):
   - [funcionalidades de Blooglee](/features)
   - [planes y precios](/pricing)
   - [nuestro blog](/blog)
   - [Prueba Blooglee gratis](/auth)

8. FOOTER FINAL:
---

**¿Te ha resultado útil este artículo?** 

Síguenos en [Instagram](https://www.instagram.com/blooglee_/) para más consejos de marketing.

[Prueba Blooglee gratis](/auth) y automatiza la generación de artículos para tu blog WordPress.

IMPORTANTE:
- NO uses JSON, solo Markdown puro
- NO incluyas el título del artículo al inicio (ya lo tenemos)
- Menciona Blooglee SOLO 2-3 veces y SIEMPRE en contexto de generación de blogs/WordPress
- Si el tema del artículo NO es sobre blogs, menciona Blooglee solo al final de forma genérica
- NUNCA inventes funcionalidades de Blooglee que no existen
- El contenido debe ser EXHAUSTIVO y de alta calidad
- Año actual: ${currentYear} (no menciones años anteriores)

Escribe el artículo completo ahora:`;

  try {
    console.log("Generating content for:", metadata.title);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error("Content generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in response");
      return null;
    }

    // Clean up content - remove any JSON wrapper if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```markdown')) {
      cleanContent = cleanContent.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const wordCount = cleanContent.split(/\s+/).length;
    console.log(`Content generated: ${wordCount} words`);

    return cleanContent;
  } catch (error) {
    console.error("Content generation error:", error);
    return null;
  }
}

// Generate blog content with similarity validation and retry logic
async function generateBlogContent(
  lovableApiKey: string,
  category: string,
  usedTopics: string[],
  now: Date,
  forceCategory?: string,
  maxRetries: number = 3
): Promise<BlogPostData | null> {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = MONTH_NAMES[currentMonth];
  
  let attempts = 0;
  
  while (attempts < maxRetries) {
    attempts++;
    console.log(`Step 1: Generating metadata (attempt ${attempts}/${maxRetries})...`);
    
    const metadata = await generateMetadata(lovableApiKey, category, usedTopics, currentYear, forceCategory);
    
    if (!metadata) {
      console.error("Failed to generate metadata");
      continue;
    }
    
    console.log(`Metadata ready: "${metadata.title}" [${metadata.thematic_category}]`);
    
    // Check similarity BEFORE generating expensive content
    const similarityCheck = isTooSimilar(metadata.title, usedTopics);
    
    if (similarityCheck.similar) {
      console.log(`❌ Title rejected (attempt ${attempts}): too similar to existing content`);
      console.log(`   Matched: "${similarityCheck.matchedTopic}" (${((similarityCheck.similarity || 0) * 100).toFixed(0)}%)`);
      
      // Add the rejected title to usedTopics to avoid it in next attempt
      usedTopics.push(metadata.title.toLowerCase());
      continue;
    }
    
    console.log(`✓ Title passed similarity check`);
    
    // Step 2: Generate content only after passing similarity check
    console.log("Step 2: Generating content...");
    const content = await generateContent(lovableApiKey, metadata, category, currentYear, monthName);
    
    if (!content) {
      console.error("Failed to generate content");
      continue;
    }

    // Calculate read time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readMinutes = Math.ceil(wordCount / 200);
    
    return {
      title: metadata.title,
      slug: metadata.slug,
      excerpt: metadata.excerpt,
      content: content,
      seo_keywords: metadata.keywords,
      read_time: `${readMinutes} min`,
      thematic_category: metadata.thematic_category,
    };
  }
  
  console.error(`Failed to generate unique content after ${maxRetries} attempts`);
  return null;
}

// Slugify a title into a URL-friendly string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Trim hyphens
    .substring(0, 80);
}

// Generate excerpt and keywords for a forced topic
async function generateExcerptAndKeywords(
  lovableApiKey: string,
  title: string,
  category: string,
  forceLanguage?: string
): Promise<{ excerpt: string; keywords: string[] }> {
  const lang = forceLanguage === 'catalan' ? 'catalán' : 'español';
  const prompt = `Dado este título de artículo de blog: "${title}"
Audiencia: ${category === 'Empresas' ? 'PYMEs españolas' : 'agencias de marketing digital'}
Idioma: ${lang}

Genera SOLO este JSON:
{
  "excerpt": "Meta description directa de máximo 145 caracteres en ${lang}, sin signos ! ni ?, enfoque en beneficio concreto",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      return { excerpt: title.substring(0, 145), keywords: [] };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const jsonStart = rawContent.indexOf('{');
    const jsonEnd = rawContent.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return { excerpt: title.substring(0, 145), keywords: [] };
    }
    const parsed = JSON.parse(rawContent.substring(jsonStart, jsonEnd + 1).replace(/[\x00-\x1F\x7F]/g, ''));
    
    let cleanExcerpt = (parsed.excerpt || title)
      .replace(/[!¡?¿]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanExcerpt.length > 145) {
      cleanExcerpt = cleanExcerpt.substring(0, 142) + '...';
    }
    
    return { excerpt: cleanExcerpt, keywords: parsed.keywords || [] };
  } catch {
    return { excerpt: title.substring(0, 145), keywords: [] };
  }
}

// Generate content in Catalan
async function generateContentCatalan(
  lovableApiKey: string,
  metadata: { title: string; topic: string },
  category: string,
  currentYear: number,
  monthName: string
): Promise<string | null> {
  const audienceContext = category === 'Empresas' 
    ? "petites i mitjanes empreses catalanes que volen millorar la seva presència digital"
    : "agències de màrqueting digital que gestionen contingut per a múltiples clients";

  const CATALAN_MONTH_NAMES = [
    "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
    "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"
  ];
  const now = new Date();
  const catalanMonth = CATALAN_MONTH_NAMES[now.getMonth()];

  const prompt = `Ets el millor copywriter de Catalunya, especialitzat en SEO i AEO.
Escriu un article de blog ÈPIC i COMPLET sobre: "${metadata.title}"

CONTEXT:
- Data actual: ${catalanMonth} de ${currentYear}
- Instagram de Blooglee: https://www.instagram.com/blooglee_/
- Audiència: ${audienceContext}

${BLOOGLEE_DEFINITION}

IMPORTANT: Tot l'article ha de ser en CATALÀ. No barregis castellà.

ESTRUCTURA OBLIGATÒRIA (2500-3500 paraules en Markdown):

1. INTRODUCCIÓ (150-200 paraules)
   - Dada impactant o pregunta provocadora
   - Promesa de valor

2. 5-7 SECCIONS H2 (300-500 paraules cadascuna)
   - Usar ## per a títols
   - Incloure ### per a subseccions
   - Al final de seccions importants: 💡 **Clau:** [insight principal]
   - IMPORTANT: Els títols H2 i H3 han de seguir capitalització catalana (només primera lletra majúscula)

REGLES DE CAPITALITZACIÓ (CATALÀ - MOLT IMPORTANT):
- Només la primera lletra de títols/subtítols en majúscula (més noms propis)
- NO usar capitalització tipus anglès (Title Case)

3. 2 TAULES COMPARATIVES mínim (format Markdown)

4. 3+ LLISTES amb bullets (- ítem)

5. DADES ESTADÍSTIQUES (6+ dades percentuals realistes)

6. FAQ (5-7 preguntes en format):
   ## Preguntes freqüents
   ### Pregunta 1?
   Resposta completa.

7. ENLLAÇOS INTERNS (usar Markdown):
   - [funcionalitats de Blooglee](/features)
   - [plans i preus](/pricing)
   - [el nostre blog](/blog)
   - [Prova Blooglee gratis](/auth)

8. FOOTER FINAL:
---

**T'ha resultat útil aquest article?**

Segueix-nos a [Instagram](https://www.instagram.com/blooglee_/) per a més consells de màrqueting.

[Prova Blooglee gratis](/auth) i automatitza la generació d'articles per al teu blog WordPress.

IMPORTANT:
- NO usis JSON, només Markdown pur
- NO incloguis el títol de l'article a l'inici (ja el tenim)
- Menciona Blooglee NOMÉS 2-3 vegades i SEMPRE en context de generació de blogs/WordPress
- MAI inventis funcionalitats de Blooglee que no existeixen
- El contingut ha de ser EXHAUSTIU i d'alta qualitat
- Any actual: ${currentYear}
- TOT en CATALÀ, sense excepció

Escriu l'article complet ara:`;

  try {
    console.log("Generating CATALAN content for:", metadata.title);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error("Catalan content generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    let cleanContent = content.trim();
    if (cleanContent.startsWith('```markdown')) {
      cleanContent = cleanContent.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const wordCount = cleanContent.split(/\s+/).length;
    console.log(`Catalan content generated: ${wordCount} words`);
    return cleanContent;
  } catch (error) {
    console.error("Catalan content generation error:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    // Accept both 'category' and 'audience' (for backward compatibility with cron jobs)
    const rawCategory = body.category || body.audience;
    const force = body.force;
    const forceThematicCategory = body.forceThematicCategory;
    const forceTopic = body.forceTopic;
    const forceLanguage = body.forceLanguage;

    // Normalize: accept lowercase and capitalize
    const normalizeCategory = (cat: string): string => {
      if (!cat) return '';
      const lower = cat.toLowerCase();
      if (lower === 'empresas') return 'Empresas';
      if (lower === 'agencias') return 'Agencias';
      return cat;
    };

    const category = normalizeCategory(rawCategory);
    
    if (!category || !['Empresas', 'Agencias'].includes(category)) {
      throw new Error("Invalid category. Must be 'Empresas' or 'Agencias'");
    }
    
    // Validate forceThematicCategory if provided
    if (forceThematicCategory && !THEMATIC_CATEGORIES.includes(forceThematicCategory)) {
      throw new Error(`Invalid forceThematicCategory. Must be one of: ${THEMATIC_CATEGORIES.join(', ')}`);
    }

    console.log(`=== Generating PREMIUM blog post for category: ${category} ===`);
    if (forceTopic) {
      console.log(`FORCED TOPIC: "${forceTopic}"`);
      if (forceLanguage) console.log(`FORCED LANGUAGE: ${forceLanguage}`);
    }

    const now = new Date();

    // Check if already generated today for this audience (skip if force=true or forceTopic)
    if (!force && !forceTopic) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const { data: existingToday } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('audience', category.toLowerCase())
        .gte('published_at', todayStart.toISOString())
        .limit(1);

      if (existingToday && existingToday.length > 0) {
        console.log(`Already generated ${category} post today, skipping`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "Already generated today" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      console.log("Force/forceTopic mode enabled - skipping daily check");
    }

    let blogData: BlogPostData | null = null;

    if (forceTopic) {
      // === FORCED TOPIC PATH ===
      console.log("Using FORCED TOPIC path - skipping auto-generation and similarity check");
      
      const slug = slugify(forceTopic);
      const effectiveCategory = forceThematicCategory || normalizeThematicCategory(forceTopic.split(':')[0] || 'Marketing');
      
      // Generate excerpt and keywords with AI
      const { excerpt, keywords } = await generateExcerptAndKeywords(lovableApiKey, forceTopic, category, forceLanguage);
      console.log(`Excerpt generated: "${excerpt}"`);
      
      // Generate content (Catalan or Spanish)
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthName = MONTH_NAMES[currentMonth];
      
      let content: string | null = null;
      if (forceLanguage === 'catalan') {
        content = await generateContentCatalan(lovableApiKey, { title: forceTopic, topic: forceTopic }, category, currentYear, monthName);
      } else {
        content = await generateContent(lovableApiKey, { title: forceTopic, topic: forceTopic }, category, currentYear, monthName);
      }
      
      if (!content) {
        throw new Error("Failed to generate content for forced topic");
      }
      
      const wordCount = content.split(/\s+/).length;
      const readMinutes = Math.ceil(wordCount / 200);
      
      blogData = {
        title: forceTopic,
        slug,
        excerpt,
        content,
        seo_keywords: keywords,
        read_time: `${readMinutes} min`,
        thematic_category: effectiveCategory,
      };
    } else {
      // === AUTOMATIC PATH (existing logic) ===
      const usedTopics = await getUsedBlogTopics(supabase, category);
      console.log(`Found ${usedTopics.length} existing topics/keywords to avoid`);

      let effectiveThematicCategory = forceThematicCategory;
      if (!effectiveThematicCategory) {
        effectiveThematicCategory = await getNextThematicCategory(supabase, category);
        console.log(`Auto-rotated thematic category: ${effectiveThematicCategory}`);
      }

      console.log(`Generating with thematicCategory: ${effectiveThematicCategory}`);
      blogData = await generateBlogContent(lovableApiKey, category, usedTopics, now, effectiveThematicCategory, 3);
    }
    
    if (!blogData) {
      throw new Error("Failed to generate unique blog content after multiple attempts");
    }

    const wordCount = blogData.content.split(/\s+/).length;
    console.log(`Content ready: "${blogData.title}" (${wordCount} words)`);

    // Generate AI image with Blooglee aesthetics (with retry)
    let imageUrl: string | null = null;
    
    const aiImage = await generateAIImage(lovableApiKey, blogData.title, category);
    
    if (aiImage?.isAI && aiImage.url) {
      const storedUrl = await uploadImageToStorage(supabase, aiImage.url, blogData.slug);
      if (storedUrl) {
        imageUrl = storedUrl;
        console.log("✓ AI image generated and stored");
      } else {
        console.log("AI image storage failed, retrying AI generation...");
      }
    } else {
      console.log("AI image attempt 1 failed, retrying with simplified prompt in 2s...");
    }

    // Retry AI generation if first attempt failed
    if (!imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryImage = await generateAIImage(lovableApiKey, `Blog header about ${blogData.title}. Abstract digital art, purple-fuchsia-coral gradient.`, category);
      if (retryImage?.isAI && retryImage.url) {
        const storedUrl = await uploadImageToStorage(supabase, retryImage.url, blogData.slug);
        if (storedUrl) {
          imageUrl = storedUrl;
          console.log("✓ AI image generated on retry and stored");
        }
      }
    }

    // Contextual Unsplash fallback
    if (!imageUrl && unsplashKey) {
      console.log("AI failed after 2 attempts, falling back to contextual Unsplash...");
      // Generate contextual query with AI
      let unsplashQuery = category === 'Empresas' ? "business digital marketing technology" : "creative agency team marketing";
      try {
        const queryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{
              role: "user",
              content: `Generate a short Unsplash search query (3-5 English words) for a blog header image about: "${blogData.title}". Return ONLY the query. Focus on abstract or conceptual imagery.`
            }],
          }),
        });
        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
          const generated = queryData.choices?.[0]?.message?.content?.trim();
          if (generated && generated.length > 3 && generated.length < 80) {
            unsplashQuery = generated;
            console.log("AI-generated Unsplash query:", unsplashQuery);
          }
        }
      } catch (e) {
        console.error("Failed to generate contextual Unsplash query:", e);
      }
      
      const unsplashUrl = await fetchUnsplashImage(unsplashQuery, unsplashKey);
      if (unsplashUrl) {
        imageUrl = unsplashUrl;
        console.log("Image from contextual Unsplash search");
      }
    }

    // No static fallback — prefer no image over irrelevant image
    if (!imageUrl) {
      console.log("All image sources failed. Blog post will be saved without image.");
    }

    // Clean generated content before saving (prevent duplicate H1, "Título:" lines, AI meta-text)
    const cleanedContent = cleanGeneratedContent(blogData.content);
    console.log(`Content cleaned: ${blogData.content.length} -> ${cleanedContent.length} chars`);

    // Enforce Spanish capitalization on title and headings
    blogData.title = enforceSpanishCapitalizationText(blogData.title);
    const capitalizedContent = enforceSpanishCapitalizationMarkdown(cleanedContent);
    console.log("Spanish capitalization enforced on title and headings");

    // Verify external links before saving
    const verifiedContent = await verifyAndCleanExternalLinks(capitalizedContent);
    console.log(`Links verified: ${capitalizedContent.length} -> ${verifiedContent.length} chars`);

    // Insert into database
    const audienceValue = category.toLowerCase();
    
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        slug: blogData.slug,
        title: blogData.title,
        excerpt: blogData.excerpt,
        content: verifiedContent,
        image_url: imageUrl,
        audience: audienceValue,
        category: blogData.thematic_category,
        author_name: "Generado por Blooglee",
        author_avatar: "https://gqtikajhhggyoiypkbgw.supabase.co/storage/v1/object/public/article-images/blooglee-avatar.png",
        author_role: "IA de Blooglee",
        read_time: blogData.read_time,
        published_at: now.toISOString(),
        is_published: true,
        seo_keywords: blogData.seo_keywords,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`✓ PREMIUM blog post created: ${blogData.title}`);
    console.log(`  - Slug: ${insertedPost.slug}`);
    console.log(`  - Words: ${wordCount}`);
    console.log(`  - Audience: ${audienceValue}`);
    console.log(`  - Category: ${insertedPost.category}`);
    if (forceTopic) console.log(`  - Forced topic: YES`);
    if (forceLanguage) console.log(`  - Language: ${forceLanguage}`);

    // Fire-and-forget: generate social media posts for all platforms
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      fetch(`${supabaseUrl}/functions/v1/generate-social-from-blog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          blogPostId: insertedPost.id,
          title: insertedPost.title,
          excerpt: blogData.excerpt,
          slug: insertedPost.slug,
          imageUrl: imageUrl,
          audience: audienceValue,
        }),
      }).catch((err: unknown) => console.error("Social generation fire-and-forget error:", err));
      console.log("  - Social media generation triggered (async)");
    } catch (socialErr: unknown) {
      console.error("Failed to trigger social generation:", socialErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        post: {
          id: insertedPost.id,
          slug: insertedPost.slug,
          title: insertedPost.title,
          audience: audienceValue,
          category: insertedPost.category,
          wordCount: wordCount,
          hasAIImage: aiImage?.isAI || false,
          forcedTopic: !!forceTopic,
          language: forceLanguage || 'spanish',
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating premium blog post:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
