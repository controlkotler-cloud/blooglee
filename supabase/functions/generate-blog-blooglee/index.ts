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
}

// Topics for empresas (businesses)
const EMPRESA_TOPICS = [
  "automatizar marketing contenidos",
  "SEO para pequeñas empresas",
  "content marketing ROI",
  "blog corporativo beneficios",
  "estrategia contenidos digital",
  "IA para marketing empresarial",
  "posicionamiento web local",
  "generación leads blog",
  "WordPress para empresas",
  "analytics marketing contenidos",
];

// Topics for agencias (agencies)
const AGENCIA_TOPICS = [
  "escalar producción contenidos clientes",
  "gestionar múltiples blogs WordPress",
  "white label content tools",
  "reporting automatizado agencias",
  "workflow agencia marketing",
  "herramientas IA para agencias",
  "pricing servicios content marketing",
  "client onboarding process",
  "content calendar management",
  "multi-client SEO strategy",
];

async function getUsedBlogTopics(supabase: any, category: string): Promise<string[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('title')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(30);
  
  return data?.map((p: any) => p.title.toLowerCase()) || [];
}

async function fetchUnsplashImage(query: string, accessKey: string): Promise<{ url: string; photographer: string; photographer_url: string } | null> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.results?.length) return null;
    
    const photo = data.results[Math.floor(Math.random() * Math.min(data.results.length, 3))];
    return {
      url: `${photo.urls.regular}&w=800&h=400&fit=crop`,
      photographer: photo.user.name,
      photographer_url: photo.user.links.html,
    };
  } catch (error) {
    console.error("Unsplash error:", error);
    return null;
  }
}

async function generateBlogContent(
  lovableApiKey: string,
  category: string,
  usedTopics: string[],
  now: Date
): Promise<BlogPostData | null> {
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const dayOfMonth = now.getDate();
  
  const topicPool = category === 'Empresas' ? EMPRESA_TOPICS : AGENCIA_TOPICS;
  const audienceContext = category === 'Empresas' 
    ? "pequeñas y medianas empresas españolas que quieren mejorar su presencia digital"
    : "agencias de marketing digital que gestionan contenido para múltiples clientes";

  const prompt = `Eres un experto en SEO, AEO (Answer Engine Optimization) y marketing de contenidos.
Fecha REAL de hoy: ${dayOfMonth} de ${MONTH_NAMES[currentMonth - 1]} de ${currentYear}

IMPORTANTE - RESTRICCIONES TEMPORALES:
- El año actual es ${currentYear}. NO menciones años anteriores (2025, 2024, etc.)
- EVITA poner el año en títulos - el contenido debe ser atemporal/evergreen
- Si necesitas mencionar fechas específicas, usa siempre ${currentYear}

Tu objetivo: Escribir un artículo de blog para Blooglee.com optimizado para:
1. SEO tradicional (Google)
2. AEO - Aparecer en respuestas de ChatGPT, Claude, Perplexity
3. AI Overviews de Google

AUDIENCIA: ${audienceContext}

TEMAS POSIBLES (elige uno y desarróllalo): ${topicPool.join(', ')}
TEMAS YA USADOS (NO repetir): ${usedTopics.slice(0, 15).join(', ') || 'ninguno'}

REQUISITOS DEL ARTÍCULO:
1. Título: máximo 60 caracteres, incluir keyword principal, SIN incluir el año
2. Excerpt/Meta description: máximo 155 caracteres, llamativo y con CTA implícito
3. Contenido: 1000-1500 palabras en Markdown
4. Incluir al menos 1 tabla comparativa
5. Incluir sección FAQ al final (3-4 preguntas)
6. Mencionar Blooglee naturalmente 2-3 veces (sin ser spam)
7. Incluir datos/estadísticas citables (inventados pero realistas)
8. Estructura: H2 y H3, listas, párrafos cortos
9. Tono: profesional pero cercano, evitar jerga técnica excesiva
10. IMPORTANTE: Optimizado para que LLMs puedan extraer respuestas directas

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título SEO optimizado (sin año)",
  "slug": "url-amigable-sin-acentos",
  "excerpt": "Meta description atractiva",
  "content": "Contenido completo en Markdown",
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "read_time": "X min"
}

Responde SOLO con el JSON válido, sin explicaciones.`;

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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error(`AI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    
    if (!rawContent) return null;

    // Parse JSON from response
    const jsonStart = rawContent.indexOf('{');
    const jsonEnd = rawContent.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;
    
    const jsonStr = rawContent.substring(jsonStart, jsonEnd + 1)
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      title: parsed.title || "Artículo sin título",
      slug: parsed.slug || `articulo-${Date.now()}`,
      excerpt: parsed.excerpt || "",
      content: parsed.content || "",
      seo_keywords: parsed.seo_keywords || [],
      read_time: parsed.read_time || "5 min",
    };
  } catch (error) {
    console.error("Failed to generate blog content:", error);
    return null;
  }
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

    const { category } = await req.json();
    
    if (!category || !['Empresas', 'Agencias'].includes(category)) {
      throw new Error("Invalid category. Must be 'Empresas' or 'Agencias'");
    }

    console.log(`Generating blog post for category: ${category}`);

    const now = new Date();

    // Check if already generated today for this category
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { data: existingToday } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('category', category)
      .gte('published_at', todayStart.toISOString())
      .limit(1);

    if (existingToday && existingToday.length > 0) {
      console.log(`Already generated ${category} post today, skipping`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Already generated today" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get used topics
    const usedTopics = await getUsedBlogTopics(supabase, category);

    // Generate content
    const blogData = await generateBlogContent(lovableApiKey, category, usedTopics, now);
    
    if (!blogData) {
      throw new Error("Failed to generate blog content");
    }

    // Fetch image
    const imageQuery = category === 'Empresas' 
      ? "business office marketing digital"
      : "marketing agency team creative";
    
    let imageUrl = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop";
    
    if (unsplashKey) {
      const image = await fetchUnsplashImage(imageQuery, unsplashKey);
      if (image) {
        imageUrl = image.url;
      }
    }

    // Insert into database
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        slug: blogData.slug,
        title: blogData.title,
        excerpt: blogData.excerpt,
        content: blogData.content,
        image_url: imageUrl,
        category: category,
        author_name: "Equipo Blooglee",
        author_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        author_role: "Marketing Digital",
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

    console.log(`✓ Generated blog post: ${blogData.title}`);

    return new Response(
      JSON.stringify({
        success: true,
        post: {
          id: insertedPost.id,
          slug: insertedPost.slug,
          title: insertedPost.title,
          category: insertedPost.category,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating blog post:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
