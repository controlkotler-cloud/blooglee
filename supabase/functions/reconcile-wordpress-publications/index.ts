import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface ReconcileRequest {
  lookback_hours?: number;
  batch_size?: number;
  site_id?: string;
  dry_run?: boolean;
}

interface SpanishArticleContent {
  title?: string;
  seo_title?: string;
  content?: string;
  slug?: string;
  meta_description?: string;
  excerpt?: string;
  focus_keyword?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logSiteActivity(
  supabase: any,
  siteId: string,
  userId: string,
  actionType: string,
  description: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from("site_activity_log")
      .insert({
        site_id: siteId,
        user_id: userId,
        action_type: actionType,
        description,
        metadata,
      });

    if (error) {
      console.error(`[site-activity] Failed to log ${actionType}:`, error);
    }
  } catch (error) {
    console.error(`[site-activity] Exception logging ${actionType}:`, error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing Supabase env vars" }, 500);
    }

    const body: ReconcileRequest = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    const lookbackHours = Math.min(Math.max(body.lookback_hours ?? 72, 1), 24 * 30);
    const batchSize = Math.min(Math.max(body.batch_size ?? 50, 1), 200);
    const dryRun = Boolean(body.dry_run);

    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let query = supabase
      .from("articles")
      .select("id, site_id, user_id, content_spanish, image_url, generated_at, wp_post_url, topic")
      .is("wp_post_url", null)
      .gte("generated_at", since)
      .order("generated_at", { ascending: true })
      .limit(batchSize);

    if (body.site_id) {
      query = query.eq("site_id", body.site_id);
    }

    const { data: pendingArticles, error: pendingError } = await query;

    if (pendingError) {
      console.error("Error fetching pending articles:", pendingError);
      return jsonResponse({ error: pendingError.message }, 500);
    }

    if (!pendingArticles || pendingArticles.length === 0) {
      return jsonResponse({
        success: true,
        looked_back_hours: lookbackHours,
        batch_size: batchSize,
        scanned: 0,
        published: 0,
        skipped: 0,
        failed: 0,
        dry_run: dryRun,
      });
    }

    const siteIds = [...new Set(pendingArticles.map((a: any) => a.site_id))];

    const [{ data: sites }, { data: wpConfigs }] = await Promise.all([
      supabase
        .from("sites")
        .select("id, name, auto_generate")
        .in("id", siteIds),
      supabase
        .from("wordpress_configs")
        .select("site_id")
        .in("site_id", siteIds),
    ]);

    const siteMap = new Map((sites || []).map((s: any) => [s.id, s]));
    const wpConfiguredSiteIds = new Set((wpConfigs || []).map((w: any) => w.site_id));

    let published = 0;
    let failed = 0;
    let skipped = 0;
    const errors: Array<Record<string, unknown>> = [];

    for (const article of pendingArticles as any[]) {
      const site = siteMap.get(article.site_id);

      if (!site) {
        skipped++;
        continue;
      }

      if (!site.auto_generate) {
        skipped++;
        continue;
      }

      if (!wpConfiguredSiteIds.has(article.site_id)) {
        skipped++;
        continue;
      }

      const spanish = (article.content_spanish || {}) as SpanishArticleContent;

      if (!spanish.title || !spanish.content || !spanish.slug) {
        skipped++;
        continue;
      }

      if (dryRun) {
        published++;
        continue;
      }

      const publishPayload = {
        site_id: article.site_id,
        title: spanish.title,
        seo_title: spanish.seo_title,
        content: spanish.content,
        slug: spanish.slug,
        status: "publish",
        image_url: article.image_url || null,
        image_alt: spanish.title,
        meta_description: spanish.meta_description,
        excerpt: spanish.excerpt || spanish.meta_description,
        focus_keyword: spanish.focus_keyword,
        lang: "es",
      };

      try {
        const publishRes = await fetch(`${supabaseUrl}/functions/v1/publish-to-wordpress-saas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify(publishPayload),
        });

        if (!publishRes.ok) {
          const errorText = await publishRes.text();
          failed++;
          errors.push({ article_id: article.id, site_id: article.site_id, error: `HTTP ${publishRes.status}: ${errorText.substring(0, 400)}` });

          await logSiteActivity(
            supabase,
            article.site_id,
            article.user_id,
            "autopublish_reconcile_failed",
            "Falló el reconciliador de publicación en WordPress",
            {
              article_id: article.id,
              http_status: publishRes.status,
              error: errorText.substring(0, 500),
            }
          );
          continue;
        }

        const result = await publishRes.json();

        if (!result?.post_url) {
          failed++;
          errors.push({ article_id: article.id, site_id: article.site_id, error: "publish-to-wordpress-saas respondió sin post_url" });
          continue;
        }

        const { error: updateError } = await supabase
          .from("articles")
          .update({ wp_post_url: result.post_url })
          .eq("id", article.id);

        if (updateError) {
          failed++;
          errors.push({ article_id: article.id, site_id: article.site_id, error: `Error actualizando wp_post_url: ${updateError.message}` });
          continue;
        }

        await logSiteActivity(
          supabase,
          article.site_id,
          article.user_id,
          "autopublish_reconciled",
          "Artículo publicado por reconciliador automático",
          {
            article_id: article.id,
            post_url: result.post_url,
            idempotent: Boolean(result.idempotent),
          }
        );

        published++;
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ article_id: article.id, site_id: article.site_id, error: message });

        await logSiteActivity(
          supabase,
          article.site_id,
          article.user_id,
          "autopublish_reconcile_failed",
          "Excepción en reconciliador de publicación",
          {
            article_id: article.id,
            error: message,
          }
        );
      }
    }

    return jsonResponse({
      success: true,
      looked_back_hours: lookbackHours,
      batch_size: batchSize,
      scanned: pendingArticles.length,
      published,
      skipped,
      failed,
      dry_run: dryRun,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("Unexpected reconcile error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 500);
  }
});
