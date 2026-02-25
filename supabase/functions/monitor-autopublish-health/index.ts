import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface RequestBody {
  window_minutes?: number;
  pending_threshold?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const TAG = "[monitor-autopublish-health]";
  console.log(`${TAG} started at ${new Date().toISOString()}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const opsAlertEmails = Deno.env.get("OPS_ALERT_EMAILS") || "";
    const alertFromEmail = Deno.env.get("ALERT_FROM_EMAIL") || "alerts@blooglee.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: RequestBody = {};
    try {
      body = await req.json();
    } catch {
      // defaults
    }

    const windowMinutes = body.window_minutes ?? 60;
    const pendingThreshold = body.pending_threshold ?? 1;

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // --- Metric 1: Failed reconciliation events in window ---
    const { count: failedReconcile, error: failedErr } = await supabase
      .from("site_activity_log")
      .select("id", { count: "exact", head: true })
      .eq("action_type", "autopublish_reconcile_failed")
      .gte("created_at", windowStart.toISOString());

    if (failedErr) console.error(`${TAG} Error querying failed reconcile:`, failedErr);
    const failedCount = failedReconcile ?? 0;

    // --- Metric 2: Pending publishable articles (last 24h) ---
    // Articles with no wp_post_url, whose site has auto_generate=true AND a wordpress_config
    const { data: pendingArticles, error: pendingErr } = await supabase
      .from("articles")
      .select("id, site_id, topic, generated_at")
      .is("wp_post_url", null)
      .gte("generated_at", last24h.toISOString())
      .order("generated_at", { ascending: false })
      .limit(100);

    if (pendingErr) console.error(`${TAG} Error querying pending articles:`, pendingErr);

    let pendingPublishable = 0;
    const pendingDetails: Array<{ id: string; site_id: string; topic: string; generated_at: string }> = [];

    if (pendingArticles && pendingArticles.length > 0) {
      // Get sites with auto_generate=true
      const siteIds = [...new Set(pendingArticles.map((a: any) => a.site_id))];
      const { data: autoSites } = await supabase
        .from("sites")
        .select("id")
        .in("id", siteIds)
        .eq("auto_generate", true);

      const autoSiteIds = new Set((autoSites || []).map((s: any) => s.id));

      // Get sites with wordpress config
      const { data: wpConfigs } = await supabase
        .from("wordpress_configs")
        .select("site_id")
        .in("site_id", siteIds);

      const wpConfiguredSiteIds = new Set((wpConfigs || []).map((c: any) => c.site_id));

      for (const article of pendingArticles as any[]) {
        if (autoSiteIds.has(article.site_id) && wpConfiguredSiteIds.has(article.site_id)) {
          pendingPublishable++;
          if (pendingDetails.length < 10) {
            pendingDetails.push({
              id: article.id,
              site_id: article.site_id,
              topic: article.topic,
              generated_at: article.generated_at,
            });
          }
        }
      }
    }

    console.log(`${TAG} Metrics: failed_reconcile=${failedCount}, pending_publishable=${pendingPublishable}`);

    // --- Evaluate alert condition ---
    const shouldAlert = failedCount > 0 || pendingPublishable > pendingThreshold;

    if (!shouldAlert) {
      console.log(`${TAG} No alert needed. All healthy.`);
      return new Response(
        JSON.stringify({
          success: true,
          alerted: false,
          failed_reconcile: failedCount,
          pending_publishable: pendingPublishable,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // --- Deduplicate: insert into ops_alert_log (unique on alert_type + alert_hour) ---
    // Truncate to hour
    const alertHour = new Date(now);
    alertHour.setUTCMinutes(0, 0, 0);

    const alertPayload = {
      failed_reconcile: failedCount,
      pending_publishable: pendingPublishable,
      pending_details: pendingDetails,
      checked_at: now.toISOString(),
    };

    const { error: insertErr } = await supabase.from("ops_alert_log").insert({
      alert_type: "autopublish_health",
      alert_hour: alertHour.toISOString(),
      payload: alertPayload,
    });

    if (insertErr) {
      // Unique violation = already alerted this hour
      if (insertErr.code === "23505") {
        console.log(`${TAG} alert skipped (already sent this hour: ${alertHour.toISOString()})`);
        return new Response(
          JSON.stringify({
            success: true,
            alerted: false,
            reason: "already_alerted_this_hour",
            failed_reconcile: failedCount,
            pending_publishable: pendingPublishable,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      console.error(`${TAG} Error inserting alert log:`, insertErr);
    }

    // --- Send email via Resend ---
    const recipients = opsAlertEmails
      .split(",")
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0);

    if (recipients.length === 0 || !resendApiKey) {
      console.warn(`${TAG} No recipients or RESEND_API_KEY configured. Alert logged but not emailed.`);
      return new Response(
        JSON.stringify({
          success: true,
          alerted: true,
          emailed: false,
          reason: "no_recipients_or_api_key",
          failed_reconcile: failedCount,
          pending_publishable: pendingPublishable,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const subject = `⚠️ Blooglee Autopublish Alert: ${failedCount} fallos, ${pendingPublishable} pendientes`;
    const htmlBody = `
      <h2>Alerta de salud de autopublicación</h2>
      <p><strong>Hora:</strong> ${now.toISOString()}</p>
      <hr/>
      <table style="border-collapse:collapse; width:100%;">
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Fallos de reconciliación (última hora)</strong></td><td style="padding:8px; border:1px solid #ddd;">${failedCount}</td></tr>
        <tr><td style="padding:8px; border:1px solid #ddd;"><strong>Artículos pendientes de publicar (24h)</strong></td><td style="padding:8px; border:1px solid #ddd;">${pendingPublishable}</td></tr>
      </table>
      ${
        pendingDetails.length > 0
          ? `<h3>Top artículos pendientes</h3>
        <ul>${pendingDetails.map((d) => `<li>${d.topic} (site: ${d.site_id.slice(0, 8)}…, generado: ${d.generated_at})</li>`).join("")}</ul>`
          : ""
      }
      <p style="color:#888; font-size:12px;">Este email se envía máximo 1 vez por hora. Alerta registrada en ops_alert_log.</p>
    `;

    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: alertFromEmail,
          to: recipients,
          subject,
          html: htmlBody,
        }),
      });

      const resendBody = await resendRes.text();
      console.log(`${TAG} alert sent via Resend (status: ${resendRes.status}): ${resendBody}`);
    } catch (emailErr) {
      console.error(`${TAG} Failed to send email via Resend:`, emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerted: true,
        emailed: true,
        failed_reconcile: failedCount,
        pending_publishable: pendingPublishable,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`${TAG} Error:`, error);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
