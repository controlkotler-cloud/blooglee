import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// Topics for empresas (businesses) - expanded for premium content
const EMPRESA_TOPICS = [
  "automatizar marketing contenidos pymes",
  "SEO local para pequeñas empresas",
  "content marketing ROI medición",
  "blog corporativo estrategia beneficios",
  "estrategia contenidos digital",
  "IA para marketing empresarial automatización",
  "posicionamiento web local negocios",
  "generación leads inbound marketing blog",
  "WordPress para empresas optimización",
  "analytics marketing contenidos métricas",
  "branded content storytelling empresas",
  "email marketing automatización contenidos",
  "estrategia omnicanal contenidos",
  "marketing automation herramientas",
  "customer journey contenidos digitales",
];

// Topics for agencias (agencies) - expanded
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
  "multi-client SEO strategy escalable",
  "rentabilidad servicios contenidos agencia",
  "pitch propuestas content marketing",
  "retención clientes agencias marketing",
  "formación equipos content marketing",
  "dashboards reporting clientes",
];

async function getUsedBlogTopics(supabase: any, audience: string): Promise<string[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('title')
    .eq('audience', audience.toLowerCase())
    .order('published_at', { ascending: false })
    .limit(50);
  
  return data?.map((p: any) => p.title.toLowerCase()) || [];
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

// Step 1: Generate metadata (title, slug, excerpt, keywords)
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
TEMAS DISPONIBLES: ${topicPool.join(', ')}
TEMAS YA USADOS (evitar): ${usedTopics.slice(0, 15).join(', ') || 'ninguno'}

${categoryInstruction}

Elige un tema ÚNICO y genera los metadatos para un artículo de blog épico.

REGLAS:
- El año actual es ${currentYear}. NO menciones años anteriores.
- NO incluir el año en el título (contenido evergreen)
- El título debe ser irresistible y tener máximo 60 caracteres
- El excerpt debe tener máximo 155 caracteres

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
  "excerpt": "Meta description atractiva (max 155 chars)",
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
    
    return {
      title: parsed.title || "Artículo sin título",
      slug: parsed.slug || `articulo-${Date.now()}`,
      excerpt: parsed.excerpt || "",
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
- Plataforma: Blooglee (https://blooglee.com) - SaaS de automatización de blogs con IA
- Instagram: https://www.instagram.com/blooglee_/
- Audiencia: ${audienceContext}

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

[Prueba Blooglee gratis](/auth) y transforma tu estrategia de contenidos.

IMPORTANTE:
- NO uses JSON, solo Markdown puro
- NO incluyas el título del artículo al inicio (ya lo tenemos)
- Menciona Blooglee naturalmente 3-4 veces
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

async function generateBlogContent(
  lovableApiKey: string,
  category: string,
  usedTopics: string[],
  now: Date,
  forceCategory?: string
): Promise<BlogPostData | null> {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = MONTH_NAMES[currentMonth];
  
  // Step 1: Generate metadata
  console.log("Step 1: Generating metadata...");
  const metadata = await generateMetadata(lovableApiKey, category, usedTopics, currentYear, forceCategory);
  
  if (!metadata) {
    console.error("Failed to generate metadata");
    return null;
  }
  
  console.log(`Metadata ready: "${metadata.title}" [${metadata.thematic_category}]`);

  // Step 2: Generate content
  console.log("Step 2: Generating content...");
  const content = await generateContent(lovableApiKey, metadata, category, currentYear, monthName);
  
  if (!content) {
    console.error("Failed to generate content");
    return null;
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

    // Get used topics to avoid repetition
    const usedTopics = await getUsedBlogTopics(supabase, category);
    console.log(`Found ${usedTopics.length} existing topics to avoid`);

    // Determine thematic category: use forced, or calculate rotation automatically
    let effectiveThematicCategory = forceThematicCategory;
    if (!effectiveThematicCategory) {
      effectiveThematicCategory = await getNextThematicCategory(supabase, category);
      console.log(`Auto-rotated thematic category: ${effectiveThematicCategory}`);
    }

    // Generate premium content (2-step process)
    console.log(`Generating with thematicCategory: ${effectiveThematicCategory}`);
    const blogData = await generateBlogContent(lovableApiKey, category, usedTopics, now, effectiveThematicCategory);
    
    if (!blogData) {
      throw new Error("Failed to generate blog content");
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

serve(handler);
