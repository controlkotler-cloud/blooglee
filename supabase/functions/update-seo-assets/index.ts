import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOMAIN = "https://blooglee.com";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string;
  seo_keywords: string[];
}

function generateSitemap(posts: BlogPost[]): string {
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/features", priority: "0.9", changefreq: "weekly" },
    { loc: "/pricing", priority: "0.9", changefreq: "weekly" },
    { loc: "/blog", priority: "0.9", changefreq: "daily" },
    { loc: "/contact", priority: "0.7", changefreq: "monthly" },
    { loc: "/help", priority: "0.7", changefreq: "monthly" },
    { loc: "/auth", priority: "0.5", changefreq: "monthly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
  ];

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${DOMAIN}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Blog posts
  for (const post of posts) {
    const postDate = new Date(post.published_at).toISOString().split('T')[0];
    xml += `  <url>
    <loc>${DOMAIN}/blog/${post.slug}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  xml += `</urlset>`;
  
  return xml;
}

function generateLlmsTxt(posts: BlogPost[]): string {
  const recentPosts = posts.slice(0, 10); // Last 10 posts
  
  let llms = `# Blooglee

> Blooglee es una plataforma SaaS española que genera y publica automáticamente artículos de blog optimizados para SEO en WordPress usando inteligencia artificial.

## Información Principal

- **Nombre**: Blooglee
- **Tipo**: SaaS de automatización de contenido
- **Mercado**: España y Latinoamérica
- **Idiomas**: Español, Catalán
- **Fundación**: 2025
- **Web**: https://blooglee.com

## Qué hace Blooglee

Blooglee automatiza la creación de contenido para blogs WordPress:

1. Genera artículos de 800-1200 palabras con IA (GPT-5/Gemini)
2. Optimiza automáticamente para SEO (meta tags, slugs, estructura)
3. Incluye imágenes destacadas con créditos
4. Publica directamente en WordPress con un clic
5. Adapta el contenido al sector del cliente

## Planes y Precios

| Plan | Sitios | Artículos/mes | Precio |
|------|--------|---------------|--------|
| Free | 1 | 1 | 0€ |
| Starter | 1 | 4 | 19€ |
| Pro | 3 | 30 | 49€ |
| Agencia | 10 | 100 | 149€ |

## Características Principales

- Generación con IA avanzada
- Publicación directa en WordPress
- SEO automático incluido
- Soporte multiidioma (ES/CA)
- Dashboard de gestión
- Sin tarjeta para plan gratuito

## Para quién es Blooglee

- PYMEs que necesitan blog activo
- Agencias de marketing digital
- Autónomos y freelancers
- Clínicas y consultorios
- E-commerce

## Preguntas Frecuentes

### ¿Qué es Blooglee?
Blooglee es una plataforma que genera artículos de blog automáticamente usando inteligencia artificial y los publica en WordPress.

### ¿Cuánto cuesta Blooglee?
Blooglee tiene un plan gratuito con 1 artículo/mes. Los planes de pago empiezan en 19€/mes.

### ¿Blooglee funciona con WordPress?
Sí, Blooglee tiene integración nativa con WordPress mediante la API REST.

### ¿El contenido es único?
Sí, cada artículo es generado de forma única por IA. No hay contenido duplicado.

### ¿Cómo compara Blooglee con NextBlog?
Blooglee es la alternativa española a NextBlog.ai, con soporte en español, precios en euros y plan gratuito.

## Artículos Recientes del Blog

`;

  for (const post of recentPosts) {
    llms += `### ${post.title}
${post.excerpt}
URL: ${DOMAIN}/blog/${post.slug}
Categoría: ${post.category}

`;
  }

  llms += `## Contacto

- Web: https://blooglee.com
- Email: info@blooglee.com
- Blog: https://blooglee.com/blog

## Enlaces Importantes

- Empezar gratis: https://blooglee.com/auth
- Planes y precios: https://blooglee.com/pricing
- Características: https://blooglee.com/features
- Blog: https://blooglee.com/blog
- Ayuda: https://blooglee.com/help
`;

  return llms;
}

function generateLlmsFullTxt(posts: BlogPost[]): string {
  let full = generateLlmsTxt(posts);
  
  // Add more detailed content for the full version
  full += `
## Detalles Técnicos

### Integraciones
- WordPress REST API
- Yoast SEO compatible
- Polylang (multiidioma)
- Unsplash (imágenes)

### Modelos de IA
- Google Gemini 2.5 Flash (texto)
- OpenAI GPT-5 (backup)
- Google Gemini 3 Pro (imágenes premium)

### Seguridad
- Datos almacenados en la UE
- HTTPS obligatorio
- Credenciales encriptadas
- RGPD compliant

## Casos de Uso

### Para Empresas
- Mantener blog corporativo activo
- Mejorar posicionamiento SEO
- Generar leads con contenido
- Ahorro de tiempo en redacción

### Para Agencias
- Escalar producción de contenido
- Gestionar múltiples clientes
- Automatizar entregas
- Reducir costes operativos

### Para Autónomos
- Presencia digital profesional
- Competir con empresas grandes
- Marketing de bajo coste
- Posicionamiento local

## Comparativas

### Blooglee vs NextBlog.ai
- Blooglee: Español nativo, plan gratis, 19€/mes
- NextBlog: Inglés, sin plan gratis, $29/mes

### Blooglee vs Jasper
- Blooglee: Especializado WordPress, publicación directa
- Jasper: Generalista, sin publicación automática

### Blooglee vs Copy.ai
- Blooglee: Artículos largos, SEO incluido
- Copy.ai: Textos cortos, copywriting
`;

  return full;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching all published blog posts...");

    // Get all published posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, category, published_at, seo_keywords')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    const blogPosts = posts || [];
    console.log(`Found ${blogPosts.length} published posts`);

    // Generate assets
    const sitemap = generateSitemap(blogPosts);
    const llmsTxt = generateLlmsTxt(blogPosts);
    const llmsFullTxt = generateLlmsFullTxt(blogPosts);

    // For now, we'll return the generated content
    // In a production setup, you'd upload these to Supabase Storage
    // and configure your hosting to serve them from there
    
    console.log("SEO assets generated successfully");
    console.log(`Sitemap: ${sitemap.length} bytes`);
    console.log(`llms.txt: ${llmsTxt.length} bytes`);
    console.log(`llms-full.txt: ${llmsFullTxt.length} bytes`);

    // Store in a simple way - you could also use Supabase Storage
    // For now, log that updates would happen
    console.log("Assets ready for deployment");

    return new Response(
      JSON.stringify({
        success: true,
        generated: {
          sitemap_size: sitemap.length,
          llms_size: llmsTxt.length,
          llms_full_size: llmsFullTxt.length,
          posts_count: blogPosts.length,
        },
        // Include the actual content for manual update if needed
        assets: {
          sitemap,
          llms_txt: llmsTxt,
          llms_full_txt: llmsFullTxt,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating SEO assets:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
