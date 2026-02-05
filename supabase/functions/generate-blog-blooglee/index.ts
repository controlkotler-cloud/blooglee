import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const now = new Date();

    // Check if already generated today for this audience (skip if force=true)
    if (!force) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const { data: existingToday } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('audience', category.toLowerCase()) // Fixed: use 'audience' not 'category'
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
      console.log("Force mode enabled - skipping daily check");
    }

    // Get used topics (titles + keywords) to avoid repetition
    const usedTopics = await getUsedBlogTopics(supabase, category);
    console.log(`Found ${usedTopics.length} existing topics/keywords to avoid`);

    // Determine thematic category: use forced, or calculate rotation automatically
    let effectiveThematicCategory = forceThematicCategory;
    if (!effectiveThematicCategory) {
      effectiveThematicCategory = await getNextThematicCategory(supabase, category);
      console.log(`Auto-rotated thematic category: ${effectiveThematicCategory}`);
    }

    // Generate premium content (with similarity validation and retry)
    console.log(`Generating with thematicCategory: ${effectiveThematicCategory}`);
    const blogData = await generateBlogContent(lovableApiKey, category, usedTopics, now, effectiveThematicCategory, 3);
    
    if (!blogData) {
      throw new Error("Failed to generate unique blog content after multiple attempts");
    }

    const wordCount = blogData.content.split(/\s+/).length;
    console.log(`Content ready: "${blogData.title}" (${wordCount} words)`);

    // Generate AI image with Blooglee aesthetics
    let imageUrl = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop";
    
    const aiImage = await generateAIImage(lovableApiKey, blogData.title, category);
    
    if (aiImage?.isAI && aiImage.url) {
      const storedUrl = await uploadImageToStorage(supabase, aiImage.url, blogData.slug);
      if (storedUrl) {
        imageUrl = storedUrl;
        console.log("✓ AI image generated and stored");
      } else {
        console.log("AI image storage failed, using Unsplash fallback");
        if (unsplashKey) {
          const unsplashUrl = await fetchUnsplashImage(
            category === 'Empresas' ? "business digital marketing technology" : "creative agency team marketing",
            unsplashKey
          );
          if (unsplashUrl) imageUrl = unsplashUrl;
        }
      }
    } else {
      console.log("AI image generation failed, using Unsplash fallback");
      if (unsplashKey) {
        const unsplashUrl = await fetchUnsplashImage(
          category === 'Empresas' ? "business digital marketing technology" : "marketing agency creative",
          unsplashKey
        );
        if (unsplashUrl) imageUrl = unsplashUrl;
      }
    }

    // Insert into database with audience (empresas/agencias) and thematic category
    const audienceValue = category.toLowerCase(); // 'Empresas' -> 'empresas'
    
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        slug: blogData.slug,
        title: blogData.title,
        excerpt: blogData.excerpt,
        content: blogData.content,
        image_url: imageUrl,
        audience: audienceValue,
        category: blogData.thematic_category, // Now uses thematic category (SEO, Marketing, etc.)
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
