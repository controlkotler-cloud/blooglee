import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const PORTAL_URL = "https://blooglee.lovable.app";
const NOTIFICATION_EMAILS = ["control@mkpro.es", "laura@mkpro.es"];
const MAX_ARTICLES_PER_RUN = 50;

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// ============= HELPER FUNCTIONS =============

function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(date.getFullYear(), date.getMonth(), diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// ============= FREQUENCY VALIDATION =============

interface ShouldGenerateResult {
  shouldGenerate: boolean;
  reason?: string;
}

async function shouldGenerateForSite(
  supabase: SupabaseClient,
  siteId: string,
  frequency: string,
  currentMonth: number,
  currentYear: number,
  now: Date
): Promise<ShouldGenerateResult> {
  if (frequency === 'daily' || frequency === 'daily_weekdays') {
    if (frequency === 'daily_weekdays') {
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { shouldGenerate: false, reason: 'Fin de semana - no se genera con frecuencia L-V' };
      }
    }
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { data } = await supabase
      .from('articles')
      .select('id')
      .eq('site_id', siteId)
      .gte('generated_at', todayStart.toISOString())
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene artículo hoy' : undefined
    };
  }
  
  if (frequency === 'weekly') {
    const weekStart = getStartOfWeek(now);
    const { data } = await supabase
      .from('articles')
      .select('id')
      .eq('site_id', siteId)
      .gte('generated_at', weekStart.toISOString())
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene artículo esta semana' : undefined
    };
  }
  
  // monthly (default)
  const { data } = await supabase
    .from('articles')
    .select('id')
    .eq('site_id', siteId)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .limit(1);
  return { 
    shouldGenerate: !data || data.length === 0,
    reason: data?.length ? 'Ya tiene artículo este mes' : undefined
  };
}

// ============= PLAN LIMITS =============

interface PlanLimitsResult {
  withinLimits: boolean;
  used: number;
  limit: number;
  userEmail?: string;
}

async function checkPlanLimits(
  supabase: SupabaseClient,
  userId: string,
  currentMonth: number,
  currentYear: number
): Promise<PlanLimitsResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('posts_limit, email')
    .eq('user_id', userId)
    .single();
  
  const postsLimit = profile?.posts_limit ?? 1;
  
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .eq('year', currentYear);
  
  const used = count || 0;
  
  return {
    withinLimits: used < postsLimit,
    used,
    limit: postsLimit,
    userEmail: profile?.email
  };
}

// ============= DYNAMIC TOPIC GENERATION =============

async function generateDynamicTopic(
  lovableApiKey: string,
  entity: { name: string; sector?: string | null; location?: string | null },
  currentMonth: number,
  currentYear: number,
  usedTopics: string[],
  now: Date
): Promise<string> {
  const dayOfMonth = now.getDate();
  const dayOfWeek = DAY_NAMES[now.getDay()];
  
  const prompt = `Eres un experto en SEO y marketing de contenidos.
Fecha REAL de hoy: ${dayOfMonth} de ${MONTH_NAMES[currentMonth - 1]} de ${currentYear} (${dayOfWeek})

Empresa: ${entity.name}
Sector: ${entity.sector || "servicios profesionales"}
Localidad: ${entity.location || "España"}

TEMAS YA USADOS (NO repetir): ${usedTopics.slice(-20).join(', ') || 'ninguno'}

Genera UN tema para artículo de blog que:
1. Sea 100% relevante para el sector "${entity.sector || 'servicios profesionales'}"
2. Considere eventos/efemérides REALES de esta fecha (${dayOfMonth}/${currentMonth}/${currentYear})
3. Tenga en cuenta tendencias actuales de ${currentYear}
4. NO sea genérico - debe ser específico y útil
5. Máximo 60 caracteres
6. NO incluir nombre de empresa
7. NO repetir temas ya usados

Solo responde con el tema, sin explicaciones ni comillas.`;

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
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response not ok: ${response.status}`);
    }

    const data = await response.json();
    const topic = data.choices?.[0]?.message?.content?.trim();
    
    if (!topic) throw new Error("Empty topic from AI");
    
    return topic;
  } catch (error) {
    console.error("Failed to generate dynamic topic:", error);
    return `Novedades en ${entity.sector || "servicios"} para ${MONTH_NAMES[currentMonth - 1]}`;
  }
}

// ============= GET USED TOPICS =============

async function getUsedTopics(
  supabase: SupabaseClient,
  siteId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('articles')
    .select('topic')
    .eq('site_id', siteId)
    .order('generated_at', { ascending: false })
    .limit(30);
  
  return data?.map(a => a.topic) || [];
}

// ============= RESULT INTERFACES =============

interface WordPressPublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}

interface GenerationResult {
  entityName: string;
  entityType: 'site';
  success: boolean;
  error?: string;
  wpSpanish?: WordPressPublishResult;
  wpCatalan?: WordPressPublishResult;
  skippedReason?: string;
  limitExceeded?: boolean;
}

// ============= MAIN HANDLER =============

const handler = async (req: Request): Promise<Response> => {
  console.log("=== GENERATE ARTICLES STARTED ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const generateArticleSaasUrl = `${supabaseUrl}/functions/v1/generate-article-saas`;

    console.log(`Processing for ${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[currentMonth - 1]} ${currentYear}`);

    const results: GenerationResult[] = [];
    let articlesGenerated = 0;

    // ========== 1. PROCESS SITES (SaaS - Based on frequency + plan limits) ==========
    console.log("=== Processing SITES (SaaS) ===");
    
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("*")
      .eq("auto_generate", true)
      .order("publish_frequency", { ascending: true });

    if (sitesError) {
      console.error(`Error fetching sites: ${sitesError.message}`);
    } else {
      console.log(`Found ${sites?.length || 0} sites with auto_generate`);

      for (const site of sites || []) {
        if (articlesGenerated >= MAX_ARTICLES_PER_RUN) {
          console.log(`Rate limit reached (${MAX_ARTICLES_PER_RUN}), stopping`);
          break;
        }

        // Check frequency
        const check = await shouldGenerateForSite(
          supabase, site.id, site.publish_frequency || 'monthly',
          currentMonth, currentYear, now
        );

        if (!check.shouldGenerate) {
          console.log(`Skipping site ${site.name}: ${check.reason}`);
          continue;
        }

        // Check plan limits
        const limits = await checkPlanLimits(supabase, site.user_id, currentMonth, currentYear);
        
        if (!limits.withinLimits) {
          console.log(`Site ${site.name} exceeded plan limits (${limits.used}/${limits.limit})`);
          
          if (limits.userEmail) {
            try {
              await resend.emails.send({
                from: "Blooglee <hola@blooglee.com>",
                reply_to: "info@blooglee.com",
                to: [limits.userEmail],
                subject: `Límite de artículos alcanzado - ${site.name}`,
                html: `
                  <h1>Límite de artículos alcanzado</h1>
                  <p>No se ha podido generar el artículo automático para <strong>${site.name}</strong>.</p>
                  <p>Has usado <strong>${limits.used}</strong> de <strong>${limits.limit}</strong> artículos este mes.</p>
                  <p>Actualiza tu plan para generar más artículos.</p>
                  <p><a href="${PORTAL_URL}/billing">Ver planes</a></p>
                `,
              });
            } catch (e) {
              console.error("Failed to send limit exceeded email:", e);
            }
          }

          results.push({
            entityName: site.name,
            entityType: 'site',
            success: false,
            limitExceeded: true,
            error: `Límite excedido: ${limits.used}/${limits.limit}`,
          });
          continue;
        }

        // Get used topics
        const usedTopics = await getUsedTopics(supabase, site.id);

        // Generate topic
        let topicTema = site.custom_topic;
        if (!topicTema && lovableApiKey) {
          topicTema = await generateDynamicTopic(
            lovableApiKey,
            { name: site.name, sector: site.sector, location: site.location },
            currentMonth, currentYear, usedTopics, now
          );
        } else if (!topicTema) {
          topicTema = `Novedades en ${site.sector || "servicios"} para ${MONTH_NAMES[currentMonth - 1]}`;
        }

        const topic = {
          tema: topicTema,
          keywords: [],
          pexels_query: site.sector ? `${site.sector} professional business` : "business professional"
        };

        console.log(`[Site] Generating for ${site.name} (${site.publish_frequency}) - Topic: ${topic.tema}`);

        try {
          const response = await fetch(generateArticleSaasUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              site_id: site.id,
              user_id: site.user_id,
              is_scheduler: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          const generatedData = await response.json();
          articlesGenerated++;

          let wpSpanish: WordPressPublishResult | undefined;
          let wpCatalan: WordPressPublishResult | undefined;

          const { data: wpConfig } = await supabase
            .from("wordpress_configs")
            .select("*")
            .eq("site_id", site.id)
            .maybeSingle();

          if (wpConfig && generatedData.content?.spanish) {
            console.log(`WordPress configured for site ${site.name}`);
          }

          results.push({
            entityName: site.name,
            entityType: 'site',
            success: true,
            wpSpanish,
            wpCatalan,
          });
        } catch (error) {
          console.error(`✗ Error for site ${site.name}:`, error);
          results.push({
            entityName: site.name,
            entityType: 'site',
            success: false,
            error: String(error),
          });
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // ========== 2. GENERATE BLOOGLEE BLOG POSTS ==========
    console.log("=== Generating Blooglee Blog Posts ===");

    let blogGeneratedCount = 0;
    const blogCategories = ['Empresas', 'Agencias'];
    
    for (const blogCategory of blogCategories) {
      try {
        console.log(`Generating blog post for ${blogCategory}...`);
        
        const blogResponse = await fetch(`${supabaseUrl}/functions/v1/generate-blog-blooglee`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ category: blogCategory }),
        });

        if (blogResponse.ok) {
          const blogResult = await blogResponse.json();
          if (blogResult.success && !blogResult.skipped) {
            console.log(`✓ Generated blog post: ${blogResult.post?.title || blogCategory}`);
            blogGeneratedCount++;
          } else if (blogResult.skipped) {
            console.log(`Blog post for ${blogCategory} already exists today`);
          }
        } else {
          console.error(`Failed to generate blog post for ${blogCategory}: ${blogResponse.status}`);
        }
      } catch (e) {
        console.error(`Error generating blog post for ${blogCategory}:`, e);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Blog posts generated: ${blogGeneratedCount}`);

    // ========== 3. UPDATE SEO ASSETS ==========
    console.log("=== Updating SEO Assets ===");
    
    try {
      const seoResponse = await fetch(`${supabaseUrl}/functions/v1/update-seo-assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({}),
      });

      if (seoResponse.ok) {
        const seoResult = await seoResponse.json();
        console.log(`✓ SEO assets updated: ${seoResult.generated?.posts_count || 0} posts in sitemap`);
      } else {
        console.error(`Failed to update SEO assets: ${seoResponse.status}`);
      }
    } catch (e) {
      console.error("Error updating SEO assets:", e);
    }

    // ========== 4. SEND SEGMENTED NEWSLETTERS ==========
    console.log("=== Sending Segmented Newsletters ===");
    
    try {
      const newsletterResponse = await fetch(`${supabaseUrl}/functions/v1/send-newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({}),
      });

      if (newsletterResponse.ok) {
        const newsletterResult = await newsletterResponse.json();
        if (newsletterResult.skipped) {
          console.log(`Newsletter skipped: ${newsletterResult.reason}`);
        } else {
          console.log(`✓ Newsletters sent: ${newsletterResult.emailsSent || 0} emails`);
        }
      } else {
        console.error(`Failed to send newsletters: ${newsletterResponse.status}`);
      }
    } catch (e) {
      console.error("Error sending newsletters:", e);
    }

    // ========== SUMMARY ==========
    const successCount = results.filter(r => r.success && !r.skippedReason).length;
    const skippedCount = results.filter(r => r.skippedReason).length;
    const failCount = results.filter(r => !r.success).length;
    const limitExceededCount = results.filter(r => r.limitExceeded).length;
    const wpPublished = results.filter(r => r.wpSpanish?.success || r.wpCatalan?.success).length;

    console.log(`=== GENERATION COMPLETE ===`);
    console.log(`Generated: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount}, Limit Exceeded: ${limitExceededCount}, WP: ${wpPublished}, Blog: ${blogGeneratedCount}`);

    // Build email
    let successTableRows = '';
    for (const result of results.filter(r => r.success && !r.skippedReason)) {
      const wpStatus = [];
      if (result.wpSpanish?.success) wpStatus.push(`<a href="${result.wpSpanish.postUrl}">ES ✓</a>`);
      if (result.wpSpanish && !result.wpSpanish.success) wpStatus.push(`ES ✗`);
      if (result.wpCatalan?.success) wpStatus.push(`<a href="${result.wpCatalan.postUrl}">CA ✓</a>`);
      if (result.wpCatalan && !result.wpCatalan.success) wpStatus.push(`CA ✗`);
      
      successTableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityType}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${wpStatus.length > 0 ? wpStatus.join(' | ') : 'No WP'}</td>
        </tr>
      `;
    }

    let failedTableRows = '';
    for (const result of results.filter(r => !r.success)) {
      failedTableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityType}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: ${result.limitExceeded ? 'orange' : 'red'};">
            ${result.limitExceeded ? '⚠️ ' : ''}${result.error || 'Unknown error'}
          </td>
        </tr>
      `;
    }

    const emailHtml = `
      <h1>Blooglee - Generación Automática</h1>
      <p>Fecha: <strong>${now.getDate()} ${MONTH_NAMES[currentMonth - 1]} ${currentYear}</strong></p>
      
      <h2>Resumen</h2>
      <ul>
        <li><strong>Artículos generados:</strong> ${successCount}</li>
        <li><strong>Omitidos (ya existían):</strong> ${skippedCount}</li>
        <li><strong>Errores:</strong> ${failCount}</li>
        <li><strong>Límite excedido:</strong> ${limitExceededCount}</li>
        <li><strong>Publicados en WordPress:</strong> ${wpPublished}</li>
      </ul>
      
      ${successCount > 0 ? `
        <h2>✓ Artículos Generados</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Sitio</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tipo</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">WordPress</th>
            </tr>
          </thead>
          <tbody>${successTableRows}</tbody>
        </table>
      ` : ''}
      
      ${failCount > 0 ? `
        <h2>✗ Errores</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Sitio</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tipo</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Error</th>
            </tr>
          </thead>
          <tbody>${failedTableRows}</tbody>
        </table>
      ` : ''}
      
      <p><a href="${PORTAL_URL}/dashboard">Acceder a Blooglee</a></p>
      <p>Saludos,<br>Blooglee</p>
    `;

    // Only send email if something was generated or there were errors
    if (successCount > 0 || failCount > 0) {
      await resend.emails.send({
        from: "Blooglee <hola@blooglee.com>",
        reply_to: "info@blooglee.com",
        to: NOTIFICATION_EMAILS,
        subject: `Blooglee ${now.getDate()}/${currentMonth}/${currentYear} - ${successCount} generados`,
        html: emailHtml,
      });
      console.log("Notification email sent");
    } else {
      console.log("No changes, skipping notification email");
    }

    return new Response(
      JSON.stringify({
        message: "Generation complete",
        generated: successCount,
        skipped: skippedCount,
        failed: failCount,
        limitExceeded: limitExceededCount,
        wpPublished,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Fatal error:", error);

    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "Blooglee <hola@blooglee.com>",
          reply_to: "info@blooglee.com",
          to: NOTIFICATION_EMAILS,
          subject: "ERROR - Generación automática Blooglee",
          html: `
            <h1>Error en Blooglee</h1>
            <p>Se ha producido un error durante la generación automática:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${errorMessage}</pre>
            <p><a href="${PORTAL_URL}/dashboard">Acceder al portal</a></p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send error email:", emailError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
