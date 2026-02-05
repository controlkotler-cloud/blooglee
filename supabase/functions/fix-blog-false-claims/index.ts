import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Términos prohibidos que NUNCA deben aparecer junto a "Blooglee" en la misma frase
const PROHIBITED_PATTERNS = [
  /blooglee[^.]*?(?:monitoriza|monitorización|monitoreo|monitorear)[^.]*\./gi,
  /blooglee[^.]*?(?:NAP|citas NAP|citas locales)[^.]*\./gi,
  /blooglee[^.]*?(?:auditoría|auditorías|auditar)[^.]*\./gi,
  /blooglee[^.]*?(?:análisis predictivo|predictivo|predecir)[^.]*\./gi,
  /blooglee[^.]*?(?:newsletter|newsletters|email marketing)[^.]*\./gi,
  /blooglee[^.]*?(?:redes sociales|social media|rrss)[^.]*\./gi,
  /blooglee[^.]*?(?:analytics|métricas de rendimiento)[^.]*\./gi,
  /blooglee[^.]*?(?:informes automatizados|reporting automatizado)[^.]*\./gi,
  /blooglee[^.]*?(?:fragmentos destacados|featured snippets)[^.]*\./gi,
  /blooglee[^.]*?(?:CRM|gestión de clientes)[^.]*\./gi,
  /blooglee[^.]*?(?:A\/B testing|test A\/B)[^.]*\./gi,
  /blooglee[^.]*?(?:Core Web Vitals)[^.]*\./gi,
  /blooglee[^.]*?(?:link building|outreach)[^.]*\./gi,
  /blooglee[^.]*?(?:landing page|landing pages)[^.]*\./gi,
  /(?:monitoriza|monitorización)[^.]*?blooglee[^.]*\./gi,
  /(?:NAP|citas NAP)[^.]*?blooglee[^.]*\./gi,
  /(?:auditoría|auditorías)[^.]*?blooglee[^.]*\./gi,
  /(?:análisis predictivo)[^.]*?blooglee[^.]*\./gi,
  /(?:newsletter|newsletters)[^.]*?blooglee[^.]*\./gi,
  /(?:redes sociales)[^.]*?blooglee[^.]*\./gi,
  /(?:informes|reporting)[^.]*?blooglee[^.]*?(?:datos|métricas|rendimiento)[^.]*\./gi,
];

// Replacement phrases for different contexts
const REPLACEMENTS: { pattern: RegExp; replacement: string }[] = [
  {
    pattern: /blooglee[^.]*?(?:monitoriza|monitorización|monitoreo)[^.]*?(?:NAP|citas)[^.]*\./gi,
    replacement: "Herramientas especializadas permiten monitorizar citas NAP. Blooglee complementa estas estrategias generando artículos de blog localizados."
  },
  {
    pattern: /blooglee[^.]*?(?:auditoría|auditorías)[^.]*?(?:NAP|SEO|local)[^.]*\./gi,
    replacement: "Para auditorías de SEO local existen herramientas dedicadas. Blooglee se enfoca en generar contenido de blog optimizado para búsquedas locales."
  },
  {
    pattern: /blooglee[^.]*?(?:análisis predictivo|predictivo|predecir|anticipar)[^.]*\./gi,
    replacement: "Blooglee genera artículos de blog con IA, optimizados para SEO y listos para publicar en WordPress."
  },
  {
    pattern: /blooglee[^.]*?(?:proponer ideas|sugerir)[^.]*?(?:datos|informe|métricas)[^.]*\./gi,
    replacement: "Blooglee genera artículos de blog basados en tendencias del sector y temas estacionales."
  },
  {
    pattern: /(?:con\s+)?blooglee[^.]*?(?:informes|reporting|reporte)[^.]*?(?:cliente|automatizado)[^.]*\./gi,
    replacement: "Para reporting automatizado puedes usar Looker Studio o Databox. Blooglee genera artículos de blog listos para publicar."
  },
];

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  audience: string;
}

// Clean content by removing false claims about Blooglee
function cleanFalseClaims(content: string): { cleaned: string; changesCount: number } {
  let cleaned = content;
  let changesCount = 0;

  // Apply specific replacements first
  for (const { pattern, replacement } of REPLACEMENTS) {
    const beforeLength = cleaned.length;
    cleaned = cleaned.replace(pattern, replacement);
    if (cleaned.length !== beforeLength) {
      changesCount++;
    }
  }

  // Remove remaining problematic patterns by replacing Blooglee with generic text
  for (const pattern of PROHIBITED_PATTERNS) {
    const matches = cleaned.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Replace "Blooglee" with "herramientas especializadas" in these sentences
        const corrected = match.replace(/blooglee/gi, "herramientas especializadas");
        cleaned = cleaned.replace(match, corrected);
        changesCount++;
      }
    }
  }

  return { cleaned, changesCount };
}

// AI-assisted correction for complex cases
async function aiCorrectBlogPost(
  lovableApiKey: string,
  post: BlogPost
): Promise<string | null> {
  console.log(`🤖 AI processing: "${post.title}"`);
  
  const prompt = `Eres un editor. Tu ÚNICA tarea es eliminar afirmaciones falsas sobre Blooglee en este texto.

Blooglee SOLO hace esto:
- Genera artículos de blog con IA
- Publica en WordPress automáticamente
- Añade imágenes destacadas
- Optimiza SEO básico de posts

Blooglee NO hace: newsletters, redes sociales, analytics, reporting, NAP, auditorías, CRM, landing pages.

TEXTO:
${post.content}

INSTRUCCIÓN: Si Blooglee aparece junto a funcionalidades que NO tiene, reemplaza "Blooglee" por "herramientas especializadas" en ESA frase específica. Devuelve el texto completo corregido sin explicaciones.`;

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
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`AI request failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content;
    
    if (!result) return null;

    result = result.trim()
      .replace(/^```markdown\n?/, '').replace(/\n?```$/, '')
      .replace(/^```\n?/, '').replace(/\n?```$/, '');

    return result;
  } catch (error) {
    console.error(`AI error: ${error}`);
    return null;
  }
}

// Validate content for violations
function validateContent(content: string): string[] {
  const violations: string[] = [];
  const contentLower = content.toLowerCase();
  const prohibitedTerms = [
    "monitoriza", "monitorización", "NAP", "citas NAP", "auditoría",
    "predictivo", "newsletter", "redes sociales", "analytics", "informes",
    "reporting", "CRM", "A/B testing", "landing page", "fragmentos destacados"
  ];
  
  const bloogleePattern = /blooglee/gi;
  let match;
  
  while ((match = bloogleePattern.exec(contentLower)) !== null) {
    const start = Math.max(0, match.index - 150);
    const end = Math.min(contentLower.length, match.index + 150);
    const context = contentLower.substring(start, end);
    
    for (const term of prohibitedTerms) {
      if (context.includes(term.toLowerCase())) {
        violations.push(term);
      }
    }
  }
  
  return [...new Set(violations)];
}

// Background processing
async function processPostsInBackground(
  supabaseUrl: string,
  supabaseServiceKey: string,
  lovableApiKey: string,
  posts: BlogPost[],
  dryRun: boolean
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let correctedCount = 0;
  let errorCount = 0;
  let unchangedCount = 0;

  for (const post of posts) {
    try {
      console.log(`\n📝 Processing: "${post.title}"`);
      
      // Step 1: Rule-based cleaning
      const { cleaned: cleanedContent, changesCount } = cleanFalseClaims(post.content);
      
      // Step 2: Validate
      let violations = validateContent(cleanedContent);
      
      let finalContent = cleanedContent;
      
      // Step 3: If still has violations, try AI
      if (violations.length > 0) {
        console.log(`   ⚠️ ${violations.length} violations remain, trying AI...`);
        const aiResult = await aiCorrectBlogPost(lovableApiKey, { ...post, content: cleanedContent });
        if (aiResult) {
          const { cleaned: aiCleaned } = cleanFalseClaims(aiResult);
          finalContent = aiCleaned;
          violations = validateContent(finalContent);
        }
      }
      
      // Check if any changes were made
      const hasChanges = finalContent !== post.content;
      
      if (!hasChanges) {
        console.log(`   ⏭️ No changes needed`);
        unchangedCount++;
        continue;
      }

      if (violations.length > 0) {
        console.warn(`   ⚠️ Remaining violations: ${violations.join(', ')}`);
      }

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ content: finalContent, updated_at: new Date().toISOString() })
          .eq('id', post.id);

        if (updateError) {
          console.error(`   ❌ Failed to save: ${updateError.message}`);
          errorCount++;
          continue;
        }
        console.log(`   ✅ Saved successfully`);
      } else {
        console.log(`   📋 Would save (dry run)`);
      }

      correctedCount++;
      
      // Delay between posts
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.error(`Error processing ${post.id}: ${error}`);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 PROCESSING COMPLETE");
  console.log(`   Corrected: ${correctedCount}`);
  console.log(`   Unchanged: ${unchangedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log("=".repeat(60));
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
    const postId = body.postId;
    const dryRun = body.dryRun ?? false;
    const limit = body.limit ?? 30;

    console.log("🔧 BLOG CORRECTION v2 - Rule-based + AI hybrid");
    console.log(`   Limit: ${limit}, Dry: ${dryRun}, Post: ${postId || 'all'}`);

    // Fetch posts
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
        JSON.stringify({ success: true, message: "No posts to correct", started: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 Found ${posts.length} posts, starting background processing...`);

    // @ts-ignore
    EdgeRuntime.waitUntil(
      processPostsInBackground(supabaseUrl, supabaseServiceKey, lovableApiKey, posts, dryRun)
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Started processing ${posts.length} posts in background (hybrid mode)`,
        started: posts.length,
        dryRun
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
