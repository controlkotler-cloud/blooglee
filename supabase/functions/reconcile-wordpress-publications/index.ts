import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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

async function getTeamMemberEmails(supabase: any, ownerId: string): Promise<string[]> {
  try {
    const { data: teamMembers } = await supabase.from("team_members").select("member_id").eq("owner_id", ownerId);
    if (!teamMembers || teamMembers.length === 0) return [];
    const memberIds = teamMembers.map((m: { member_id: string }) => m.member_id);
    const { data: profiles } = await supabase.from("profiles").select("email").in("user_id", memberIds);
    return profiles?.map((p: { email: string }) => p.email).filter(Boolean) || [];
  } catch (e) {
    console.error("Error fetching team member emails:", e);
    return [];
  }
}

async function sendReconcilePublishedEmail(
  supabase: any,
  article: { id: string; site_id: string; user_id: string; topic: string },
  siteName: string,
  postUrl: string,
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.log("[reconcile] RESEND_API_KEY not configured, skipping email");
    return;
  }

  let recipients: string[] = [];
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", article.user_id)
      .single();

    if (!profile?.email) {
      console.log("[reconcile] No owner email found, skipping email");
      return;
    }

    const teamEmails = await getTeamMemberEmails(supabase, article.user_id);
    recipients = [profile.email, ...teamEmails.filter((e: string) => e !== profile.email)];

    // Dedup: attempt insert into article_email_notifications
    const { error: dedupErr } = await supabase
      .from("article_email_notifications")
      .insert({
        article_id: article.id,
        notification_type: "autopublish_reconciled",
        status: "pending",
        sent_to: recipients,
      });

    if (dedupErr?.code === "23505") {
      console.log("[reconcile] Email already sent for this article, skipping");
      return;
    }
    if (dedupErr) {
      console.error("[reconcile] Dedup insert error:", dedupErr.message);
      return;
    }

    const siteUrl = "https://blooglee.lovable.app";
    const spanish = (article as any).content_spanish || {};
    const catalan = (article as any).content_catalan || {};
    const articleTitle = spanish.title || catalan.title || article.topic;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f3ff;">
<div style="max-width:600px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
<header style="background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 50%,#F97316 100%);padding:40px 30px;text-align:center;">
<h1 style="color:white;margin:0;font-size:28px;font-weight:700;">🚀 Artículo publicado</h1>
</header>
<main style="padding:40px 30px;">
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">¡Buenas noticias!</p>
<p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Tu artículo para <strong style="color:#8B5CF6;">${siteName}</strong> se ha publicado automáticamente en WordPress:</p>
<div style="background:linear-gradient(to right,#f0fdf4,#ecfdf5);padding:24px;border-radius:12px;border-left:4px solid #22c55e;margin:24px 0;">
<h2 style="color:#1f2937;margin:0 0 12px;font-size:20px;font-weight:600;">${articleTitle}</h2>
<a href="${postUrl}" style="color:#8B5CF6;font-size:14px;word-break:break-all;">${postUrl}</a>
</div>
<div style="text-align:center;margin:32px 0;">
<a href="${postUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:white;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;box-shadow:0 4px 14px 0 rgba(34,197,94,0.4);">Ver artículo en tu blog</a>
</div>
<div style="text-align:center;">
<a href="${siteUrl}/site/${article.site_id}" style="color:#8B5CF6;text-decoration:none;font-size:14px;">Ver en tu panel de Blooglee →</a>
</div>
</main>
<footer style="background-color:#faf5ff;padding:24px 30px;text-align:center;border-top:1px solid #e9d5ff;">
<p style="color:#9ca3af;font-size:12px;margin:0;">Blooglee - Automatiza tu blog con IA</p>
<p style="margin:8px 0 0;"><a href="https://www.instagram.com/blooglee_/" style="color:#8B5CF6;text-decoration:none;font-size:12px;">Síguenos en Instagram</a></p>
</footer>
</div></body></html>`;

    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Blooglee <noreply@blooglee.com>",
      to: recipients,
      subject: `🚀 Artículo publicado en ${siteName}`,
      html,
    });

    if (error) {
      console.error("[reconcile] Email send error:", error);
      await supabase
        .from("article_email_notifications")
        .update({ status: "failed", error: JSON.stringify(error) })
        .eq("article_id", article.id)
        .eq("notification_type", "autopublish_reconciled");
      await logSiteActivity(supabase, article.site_id, article.user_id, "autopublish_reconcile_email_failed", "Falló envío de email tras reconciliación", { article_id: article.id, error: JSON.stringify(error) });
    } else {
      console.log(`[reconcile] Published email sent to: ${recipients.join(", ")}`);
      await supabase
        .from("article_email_notifications")
        .update({ status: "sent", sent_to: recipients })
        .eq("article_id", article.id)
        .eq("notification_type", "autopublish_reconciled");
      await logSiteActivity(supabase, article.site_id, article.user_id, "autopublish_reconcile_email_sent", "Email de artículo publicado enviado por reconciliador", { article_id: article.id, post_url: postUrl, recipients });
    }
  } catch (emailErr) {
    const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
    console.error("[reconcile] Email exception:", msg);
    await supabase
      .from("article_email_notifications")
      .update({ status: "failed", error: msg })
      .eq("article_id", article.id)
      .eq("notification_type", "autopublish_reconciled");
    await logSiteActivity(supabase, article.site_id, article.user_id, "autopublish_reconcile_email_failed", "Excepción enviando email tras reconciliación", { article_id: article.id, error: msg });
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
      .select("id, site_id, user_id, content_spanish, content_catalan, image_url, generated_at, wp_post_url, topic")
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
        skip_reasons: { no_site: 0, no_auto_generate: 0, no_wp_config: 0, missing_title: 0, missing_content: 0, missing_slug: 0 },
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
    const skipReasons: Record<string, number> = { no_site: 0, no_auto_generate: 0, no_wp_config: 0, missing_title: 0, missing_content: 0, missing_slug: 0 };
    const errors: Array<Record<string, unknown>> = [];

    async function skipWithLog(article: any, reason: string): Promise<void> {
      skipped++;
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      if (article.site_id && article.user_id) {
        await logSiteActivity(
          supabase,
          article.site_id,
          article.user_id,
          "autopublish_reconcile_skipped",
          `Artículo omitido por reconciliador: ${reason}`,
          { article_id: article.id, reason }
        );
      }
    }

    for (const article of pendingArticles as any[]) {
      const site = siteMap.get(article.site_id);

      if (!site) {
        await skipWithLog(article, "no_site");
        continue;
      }

      if (!site.auto_generate) {
        await skipWithLog(article, "no_auto_generate");
        continue;
      }

      if (!wpConfiguredSiteIds.has(article.site_id)) {
        await skipWithLog(article, "no_wp_config");
        continue;
      }

      const spanish = (article.content_spanish || {}) as SpanishArticleContent;
      const catalan = (article.content_catalan || {}) as SpanishArticleContent;

      const title = spanish.title || catalan.title;
      const content = spanish.content || catalan.content;
      const slug = spanish.slug || catalan.slug;

      if (!title) {
        await skipWithLog(article, "missing_title");
        continue;
      }
      if (!content) {
        await skipWithLog(article, "missing_content");
        continue;
      }
      if (!slug) {
        await skipWithLog(article, "missing_slug");
        continue;
      }

      if (dryRun) {
        published++;
        continue;
      }

      const publishPayload = {
        site_id: article.site_id,
        title,
        seo_title: spanish.seo_title || catalan.seo_title,
        content,
        slug,
        status: "publish",
        image_url: article.image_url || null,
        image_alt: title,
        meta_description: spanish.meta_description || catalan.meta_description,
        excerpt: spanish.excerpt || catalan.excerpt || spanish.meta_description || catalan.meta_description,
        focus_keyword: spanish.focus_keyword || catalan.focus_keyword,
        lang: spanish.title ? "es" : "ca",
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

        // Send email notification (non-blocking)
        await sendReconcilePublishedEmail(supabase, article, site.name, result.post_url);

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
      skip_reasons: skipReasons,
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
