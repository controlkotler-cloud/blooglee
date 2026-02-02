import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Definición exacta de lo que Blooglee puede y no puede hacer
const BLOOGLEE_DEFINITION = `
DEFINICIÓN EXACTA DE BLOOGLEE (funcionalidades REALES):

Blooglee es una plataforma SaaS que hace ÚNICAMENTE esto:
1. Genera artículos de blog con IA (GPT-5, Gemini 2.5) de 800-1200 palabras
2. Optimiza SEO automáticamente: meta título, meta descripción, slug, estructura H1-H3
3. Incluye imagen destacada automática (de Pexels, Unsplash o generada por IA)
4. Publica directamente en WordPress con un solo clic mediante API REST
5. Soporta español, catalán e inglés
6. Gestiona múltiples sitios web desde un dashboard centralizado (hasta 10 sitios)

⛔ BLOOGLEE NO HACE (son afirmaciones FALSAS si aparecen):
- NO genera newsletters ni email marketing
- NO gestiona redes sociales (LinkedIn, Instagram, Facebook, X, TikTok)
- NO hace SEO técnico ni auditorías SEO
- NO ofrece analytics ni informes de rendimiento
- NO crea landing pages
- NO hace reporting automatizado de métricas
- NO monitoriza NAP ni datos de negocio local
- NO tiene dashboards de métricas avanzadas
- NO integra con herramientas de análisis (GA4, Search Console)
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
`;

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  audience: string;
}

// Correct false claims in a blog post
async function correctBlogPost(
  lovableApiKey: string,
  post: BlogPost
): Promise<string | null> {
  console.log(`\n📝 Processing: "${post.title}"`);
  
  const prompt = `Eres un editor experto que debe CORREGIR un artículo de blog que contiene afirmaciones FALSAS sobre la plataforma Blooglee.

${BLOOGLEE_DEFINITION}

ARTÍCULO ORIGINAL A CORREGIR:
Título: ${post.title}

${post.content}

INSTRUCCIONES DE CORRECCIÓN:

1. LEE el artículo completo y DETECTA todos los párrafos donde se mencione Blooglee con funcionalidades que NO tiene según la definición anterior.

2. Para CADA mención falsa de Blooglee:
   - Si habla de funcionalidades de blog/contenido/WordPress → AJUSTA para que solo mencione generación de artículos y publicación en WordPress
   - Si habla de funcionalidades que Blooglee NO tiene (email, redes sociales, analytics, SEO técnico, etc.) → ELIMINA la mención a Blooglee de ese párrafo o reescríbelo para que tenga sentido sin mencionar Blooglee
   
3. MANTÉN el resto del artículo EXACTAMENTE igual (estructura, secciones, tablas, FAQs, etc.)

4. ASEGÚRATE de que el texto sigue teniendo sentido tras las correcciones

5. Las menciones CORRECTAS de Blooglee son:
   - "Blooglee genera artículos de blog con IA" ✓
   - "Blooglee publica automáticamente en WordPress" ✓
   - "Blooglee incluye imágenes destacadas" ✓
   - "Blooglee optimiza SEO de posts (títulos, meta, slugs)" ✓
   - "Blooglee gestiona múltiples blogs" ✓

6. Las menciones INCORRECTAS (deben eliminarse o corregirse):
   - "Blooglee automatiza email marketing" ✗
   - "Blooglee gestiona redes sociales" ✗
   - "Blooglee ofrece analytics" ✗
   - "Blooglee hace auditorías SEO" ✗
   - "Blooglee genera informes" ✗
   - Cualquier otra funcionalidad no listada arriba ✗

IMPORTANTE:
- Devuelve el artículo COMPLETO en Markdown
- NO añadas explicaciones, solo el contenido corregido
- Si el artículo no tiene errores, devuélvelo tal cual
- Mantén todos los enlaces, tablas y estructura original
- NO modifiques el footer con enlaces a Instagram y /auth

Devuelve el artículo corregido ahora:`;

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
        temperature: 0.3, // Low temperature for more accurate corrections
      }),
    });

    if (!response.ok) {
      console.error(`AI request failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    let correctedContent = data.choices?.[0]?.message?.content;
    
    if (!correctedContent) {
      console.error("No content in response");
      return null;
    }

    // Clean up content
    correctedContent = correctedContent.trim();
    if (correctedContent.startsWith('```markdown')) {
      correctedContent = correctedContent.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
    } else if (correctedContent.startsWith('```')) {
      correctedContent = correctedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    console.log(`✓ Corrected: "${post.title}" (${correctedContent.split(/\s+/).length} words)`);
    return correctedContent;
  } catch (error) {
    console.error(`Error correcting post: ${error}`);
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const postId = body.postId; // Optional: correct a specific post
    const dryRun = body.dryRun ?? false; // If true, don't save changes
    const limit = body.limit ?? 50; // Limit number of posts to process

    console.log("=".repeat(60));
    console.log("🔧 CORRECTING FALSE BLOOGLEE CLAIMS IN BLOG POSTS");
    console.log(`   Dry run: ${dryRun}`);
    console.log(`   Post ID: ${postId || 'all'}`);
    console.log(`   Limit: ${limit}`);
    console.log("=".repeat(60));

    // Fetch posts to correct
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, content, audience')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (postId) {
      query = query.eq('id', postId);
    } else {
      query = query.limit(limit);
    }

    const { data: posts, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch posts: ${fetchError.message}`);
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No posts to correct", corrected: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`\n📚 Found ${posts.length} posts to process\n`);

    const results: { id: string; title: string; status: 'corrected' | 'error' | 'skipped' }[] = [];
    let correctedCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        const correctedContent = await correctBlogPost(lovableApiKey, post);
        
        if (!correctedContent) {
          results.push({ id: post.id, title: post.title, status: 'error' });
          errorCount++;
          continue;
        }

        // Check if content actually changed
        if (correctedContent === post.content) {
          console.log(`⏭️ Skipped (no changes): "${post.title}"`);
          results.push({ id: post.id, title: post.title, status: 'skipped' });
          continue;
        }

        if (!dryRun) {
          // Update the post in the database
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ 
              content: correctedContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);

          if (updateError) {
            console.error(`Failed to update post ${post.id}: ${updateError.message}`);
            results.push({ id: post.id, title: post.title, status: 'error' });
            errorCount++;
            continue;
          }
        }

        results.push({ id: post.id, title: post.title, status: 'corrected' });
        correctedCount++;

        // Add delay between posts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing post ${post.id}: ${error}`);
        results.push({ id: post.id, title: post.title, status: 'error' });
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 CORRECTION SUMMARY");
    console.log("=".repeat(60));
    console.log(`   Total processed: ${posts.length}`);
    console.log(`   Corrected: ${correctedCount}`);
    console.log(`   Skipped (no changes): ${results.filter(r => r.status === 'skipped').length}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Dry run: ${dryRun}`);
    console.log("=".repeat(60));

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        total: posts.length,
        corrected: correctedCount,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: errorCount,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
