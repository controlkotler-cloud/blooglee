import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-scheduler-secret, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = parts[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface SiteEntity {
  id: string;
  name: string;
  user_id: string;
  publish_frequency: string;
  publish_day_of_week: number | null;
  publish_day_of_month: number | null;
  publish_week_of_month: number | null;
  publish_hour_utc: number | null;
  publish_hour_local: number | null;
  timezone: string | null;
}

function normalizeFrequency(rawFrequency: string | null | undefined): string {
  if (!rawFrequency) return "monthly";
  if (rawFrequency === "fortnightly") return "biweekly";
  return rawFrequency;
}

function buildSiteGenerationKey(frequency: string, now: Date): string {
  const normalizedFrequency = normalizeFrequency(frequency);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const weekOfMonth = Math.ceil(now.getUTCDate() / 7);

  switch (normalizedFrequency) {
    case "daily":
    case "daily_weekdays":
      return `${year}-${month}-${day}`;
    case "weekly":
    case "biweekly":
      return `${year}-${month}-w${weekOfMonth}`;
    case "monthly":
    default:
      return `${year}-${month}`;
  }
}

function getLocalDateParts(
  now: Date,
  timezone: string,
): {
  localHour: number;
  localMinute: number;
  localDayOfWeek: number;
  localDayOfMonth: number;
  localWeekOfMonth: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
    day: "numeric",
  });
  const parts = fmt.formatToParts(now);
  const localHour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const localMinute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const localDayOfMonth = Number(parts.find((p) => p.type === "day")?.value ?? 1);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const localDayOfWeek = weekdayMap[weekdayStr] ?? 1;
  const localWeekOfMonth = Math.ceil(localDayOfMonth / 7);

  return { localHour, localMinute, localDayOfWeek, localDayOfMonth, localWeekOfMonth };
}

function shouldSiteGenerateNow(
  site: SiteEntity,
  now: Date,
): { due: boolean; localHour: number; localMinute: number; targetHour: number; tz: string } {
  const tz = site.timezone || "Europe/Madrid";
  const { localHour, localMinute, localDayOfWeek, localDayOfMonth, localWeekOfMonth } = getLocalDateParts(now, tz);

  const targetHour = site.publish_hour_local ?? site.publish_hour_utc ?? 9;
  const hourReached = localHour >= targetHour;
  // Start up to 5 minutes early to absorb generation/publication latency without changing content quality.
  const preWindowReached = targetHour > 0 && localHour === targetHour - 1 && localMinute >= 55;
  const timeReached = hourReached || preWindowReached;
  const frequency = normalizeFrequency(site.publish_frequency);

  let due = false;
  switch (frequency) {
    case "daily":
      due = timeReached;
      break;
    case "daily_weekdays":
      due = localDayOfWeek >= 1 && localDayOfWeek <= 5 && timeReached;
      break;
    case "weekly":
      due =
        localDayOfWeek > (site.publish_day_of_week ?? 1) ||
        (localDayOfWeek === (site.publish_day_of_week ?? 1) && timeReached);
      break;
    case "biweekly":
      if (localWeekOfMonth !== 1 && localWeekOfMonth !== 3) {
        due = false;
      } else {
        due =
          localDayOfWeek > (site.publish_day_of_week ?? 1) ||
          (localDayOfWeek === (site.publish_day_of_week ?? 1) && timeReached);
      }
      break;
    case "monthly":
      if (site.publish_day_of_month !== null && site.publish_day_of_month !== undefined) {
        due =
          localDayOfMonth > site.publish_day_of_month || (localDayOfMonth === site.publish_day_of_month && timeReached);
      } else {
        const targetDayOfWeek = site.publish_day_of_week ?? 1;
        const targetWeekOfMonth = site.publish_week_of_month ?? 1;
        if (localWeekOfMonth > targetWeekOfMonth) due = true;
        else if (localWeekOfMonth < targetWeekOfMonth) due = false;
        else due = localDayOfWeek > targetDayOfWeek || (localDayOfWeek === targetDayOfWeek && timeReached);
      }
      break;
    default:
      due = false;
  }

  return { due, localHour, localMinute, targetHour, tz };
}

async function hasSiteArticleForPeriod(supabase: any, siteId: string, frequency: string, now: Date): Promise<boolean> {
  const normalizedFrequency = normalizeFrequency(frequency);
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const dayOfMonth = now.getUTCDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  try {
    let query = supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("month", month)
      .eq("year", year);

    if (normalizedFrequency === "daily" || normalizedFrequency === "daily_weekdays") {
      query = query.eq("day_of_month", dayOfMonth);
    } else if (normalizedFrequency === "weekly" || normalizedFrequency === "biweekly") {
      query = query.eq("week_of_month", weekOfMonth);
    }

    const { count, error } = await query;
    if (error) {
      console.error(`Error checking existing article for site ${siteId}:`, error);
      return false;
    }

    return (count || 0) > 0;
  } catch (e) {
    console.error("Exception checking existing site article:", e);
    return false;
  }
}

function dispatchGeneration(
  supabaseUrl: string,
  supabaseServiceKey: string,
  endpoint: string,
  payload: Record<string, unknown>,
): void {
  const url = `${supabaseUrl}/functions/v1/${endpoint}`;

  console.log(`Dispatching to ${endpoint} with payload:`, JSON.stringify(payload));

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      console.log(`[${endpoint}] Response status: ${res.status}`);
    })
    .catch((err) => {
      console.error(`[${endpoint}] Dispatch error:`, err);
    });
}

type DispatchAwaitOptions = {
  timeout_ms?: number;
  max_retries?: number;
};

type DispatchAwaitResult = {
  endpoint: string;
  ok: boolean;
  status: number | null;
  attempts: number;
  duration_ms: number;
  error?: string;
};

async function dispatchAndAwait(
  supabaseUrl: string,
  supabaseServiceKey: string,
  endpoint: string,
  payload: Record<string, unknown>,
  options: DispatchAwaitOptions = {},
): Promise<DispatchAwaitResult> {
  const timeoutMs = Math.max(1000, options.timeout_ms ?? 15000);
  const maxRetries = Math.max(0, options.max_retries ?? 1);
  const maxAttempts = maxRetries + 1;
  const url = `${supabaseUrl}/functions/v1/${endpoint}`;

  const startedAt = Date.now();
  let attempts = 0;
  let lastStatus: number | null = null;
  let lastError = "";

  while (attempts < maxAttempts) {
    attempts++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(
        `[${endpoint}] Awaited dispatch attempt ${attempts}/${maxAttempts} with payload: ${JSON.stringify(payload)}`,
      );

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      lastStatus = res.status;

      if (res.ok) {
        return {
          endpoint,
          ok: true,
          status: res.status,
          attempts,
          duration_ms: Date.now() - startedAt,
        };
      }

      const errorText = await res.text().catch(() => "");
      lastError = `HTTP ${res.status}${errorText ? `: ${errorText.substring(0, 500)}` : ""}`;

      const retryable = res.status >= 500 || res.status === 429 || res.status === 408;
      if (retryable && attempts < maxAttempts) {
        const waitMs = Math.min(4000, 500 * Math.pow(2, attempts));
        console.warn(`[${endpoint}] ${lastError}. Retry in ${waitMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      break;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error.message : String(error);

      if (attempts < maxAttempts) {
        const waitMs = Math.min(4000, 500 * Math.pow(2, attempts));
        console.warn(`[${endpoint}] Dispatch exception "${lastError}". Retry in ${waitMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      break;
    }
  }

  return {
    endpoint,
    ok: false,
    status: lastStatus,
    attempts,
    duration_ms: Date.now() - startedAt,
    error: lastError || "unknown_dispatch_error",
  };
}

async function countPendingPublishableArticles(supabase: any): Promise<number> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingArticles, error: pendingErr } = await supabase
    .from("articles")
    .select("id, site_id")
    .is("wp_post_url", null)
    .eq("generation_source", "scheduled")
    .gte("generated_at", last24h)
    .order("generated_at", { ascending: false })
    .limit(500);

  if (pendingErr) {
    console.error("[scheduler] Error counting pending publishable (articles):", pendingErr);
    return 0;
  }

  if (!pendingArticles || pendingArticles.length === 0) {
    return 0;
  }

  const siteIds = [...new Set(pendingArticles.map((a: any) => a.site_id))];
  if (siteIds.length === 0) {
    return 0;
  }

  const [{ data: autoSites, error: autoSitesErr }, { data: wpConfigs, error: wpConfigErr }] = await Promise.all([
    supabase.from("sites").select("id").in("id", siteIds).eq("auto_generate", true),
    supabase.from("wordpress_configs").select("site_id").in("site_id", siteIds),
  ]);

  if (autoSitesErr) {
    console.error("[scheduler] Error counting pending publishable (sites):", autoSitesErr);
    return 0;
  }
  if (wpConfigErr) {
    console.error("[scheduler] Error counting pending publishable (wordpress_configs):", wpConfigErr);
    return 0;
  }

  const autoSiteIds = new Set((autoSites || []).map((s: any) => s.id));
  const wpConfiguredSiteIds = new Set((wpConfigs || []).map((w: any) => w.site_id));

  let count = 0;
  for (const article of pendingArticles as any[]) {
    if (autoSiteIds.has(article.site_id) && wpConfiguredSiteIds.has(article.site_id)) {
      count++;
    }
  }

  return count;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("=== GENERATE SCHEDULER STARTED ===");
  console.log("Time:", new Date().toISOString());

  let supabase: any;
  let runId: number | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
    const claims = token ? parseJwtClaims(token) : null;
    const schedulerSecret = req.headers.get("x-scheduler-secret") ?? "";
    const { data: schedulerToken, error: schedulerTokenError } = await supabase
      .from("scheduler_auth_tokens")
      .select("secret")
      .eq("name", "generate-scheduler")
      .maybeSingle();

    const hasValidSchedulerSecret = Boolean(schedulerSecret && schedulerToken?.secret === schedulerSecret);
    const hasServiceRoleClaim = claims?.role === "service_role";
    if (schedulerTokenError || (!hasValidSchedulerSecret && !hasServiceRoleClaim)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const { data: runRow, error: runErr } = await supabase
        .from("scheduler_runs")
        .insert({ started_at: new Date().toISOString() })
        .select("id")
        .single();
      if (runErr) {
        console.error("[scheduler] Failed to insert scheduler_runs:", runErr.message);
      } else {
        runId = runRow.id;
        console.log(`[scheduler] Run recorded: id=${runId}`);
      }
    } catch (e) {
      console.error("[scheduler] Exception inserting scheduler_runs:", e);
    }

    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    const dispatched = {
      sites: 0,
      skipped: {
        sites: 0,
      },
    };
    const maintenance = {
      resend_email: { ok: false, status: null as number | null, attempts: 0 },
      pending_reconcile: { ok: false, status: null as number | null, attempts: 0 },
      deep_sweep: { ok: false, status: null as number | null, attempts: 0, ran: false },
      monitor: { ok: false, status: null as number | null, attempts: 0, ran: false },
      pending_publishable_before: 0,
      pending_publishable_after: 0,
      post_run_recovery_triggered: false,
    };

    console.log("\n--- Processing Sites ---");
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select(
        "id, name, user_id, auto_generate, publish_frequency, publish_day_of_week, publish_day_of_month, publish_week_of_month, publish_hour_utc, publish_hour_local, timezone",
      )
      .eq("auto_generate", true);

    if (sitesError) {
      console.error("Error fetching sites:", sitesError);
    } else if (sites && sites.length > 0) {
      console.log(`Found ${sites.length} sites with auto_generate=true`);
      console.log(
        `Current UTC time: ${now.toISOString()} (hour: ${now.getUTCHours()}, day: ${now.getUTCDay()}, date: ${now.getUTCDate()})`,
      );

      for (const site of sites as SiteEntity[]) {
        const frequency = normalizeFrequency(site.publish_frequency || "monthly");
        const schedResult = shouldSiteGenerateNow(site, now);

        if (!schedResult.due) {
          console.log(
            `Skipping site ${site.name} - not scheduled now (freq: ${frequency}, tz: ${schedResult.tz}, localTime: ${String(schedResult.localHour).padStart(2, "0")}:${String(schedResult.localMinute).padStart(2, "0")}, targetHour: ${schedResult.targetHour}, day_of_week: ${site.publish_day_of_week}, day_of_month: ${site.publish_day_of_month}, utc: ${now.toISOString()})`,
          );
          continue;
        }

        const hasExisting = await hasSiteArticleForPeriod(supabase, site.id, frequency, now);
        if (hasExisting) {
          console.log(`Skipping site ${site.name} - already has article this period`);
          dispatched.skipped.sites++;
          continue;
        }

        console.log(
          `Dispatching generation for site ${site.name} (tz: ${schedResult.tz}, localTime: ${String(schedResult.localHour).padStart(2, "0")}:${String(schedResult.localMinute).padStart(2, "0")}, targetHour: ${schedResult.targetHour})`,
        );

        const generationKey = buildSiteGenerationKey(frequency, now);
        dispatchGeneration(supabaseUrl, supabaseServiceKey, "generate-article-saas", {
          siteId: site.id,
          month,
          year,
          isScheduled: true,
          userId: site.user_id,
          generationKey,
        });
        dispatched.sites++;
      }
    }

    const shouldRunHourlyMaintenance = now.getUTCMinutes() === 0;

    // Always process email resend retries on every scheduler cycle.
    // This avoids manual intervention when a publish email failed transiently.
    console.log("[scheduler] dispatch reconcile-wordpress-publications (resend_published_email_only) start");
    const resendResult = await dispatchAndAwait(supabaseUrl, supabaseServiceKey, "reconcile-wordpress-publications", {
      lookback_hours: 168,
      batch_size: 100,
      resend_published_email_only: true,
    });
    maintenance.resend_email = {
      ok: resendResult.ok,
      status: resendResult.status,
      attempts: resendResult.attempts,
    };
    if (!resendResult.ok) {
      console.error("[scheduler] resend reconcile failed:", resendResult.error);
    } else {
      console.log("[scheduler] resend reconcile confirmed");
    }
    maintenance.pending_publishable_before = await countPendingPublishableArticles(supabase);
    console.log(`[scheduler] pending publishable before reconcile: ${maintenance.pending_publishable_before}`);

    console.log("[scheduler] dispatch reconcile-wordpress-publications (pending publish) start");
    const pendingReconcileResult = await dispatchAndAwait(
      supabaseUrl,
      supabaseServiceKey,
      "reconcile-wordpress-publications",
      {
        lookback_hours: 168,
        batch_size: 40,
        prioritize_recent: true,
      },
      { timeout_ms: 25000, max_retries: 1 },
    );
    maintenance.pending_reconcile = {
      ok: pendingReconcileResult.ok,
      status: pendingReconcileResult.status,
      attempts: pendingReconcileResult.attempts,
    };
    if (!pendingReconcileResult.ok) {
      console.error("[scheduler] pending reconcile failed:", pendingReconcileResult.error);
    } else {
      console.log("[scheduler] pending reconcile confirmed");
    }

    maintenance.pending_publishable_after = await countPendingPublishableArticles(supabase);
    console.log(`[scheduler] pending publishable after reconcile: ${maintenance.pending_publishable_after}`);

    // If items remain pending, run an immediate second pass to unstick backlog quickly.
    if (maintenance.pending_publishable_after > 0) {
      maintenance.post_run_recovery_triggered = true;
      const recoveryBatch = Math.min(200, Math.max(60, maintenance.pending_publishable_after * 2));
      console.log(`[scheduler] post-run recovery start (batch_size=${recoveryBatch})`);
      const recoveryResult = await dispatchAndAwait(
        supabaseUrl,
        supabaseServiceKey,
        "reconcile-wordpress-publications",
        {
          lookback_hours: 168,
          batch_size: recoveryBatch,
          prioritize_recent: true,
        },
        { timeout_ms: 30000, max_retries: 1 },
      );
      if (!recoveryResult.ok) {
        console.error("[scheduler] post-run recovery failed:", recoveryResult.error);
      } else {
        console.log("[scheduler] post-run recovery confirmed");
      }
      maintenance.pending_publishable_after = await countPendingPublishableArticles(supabase);
      console.log(`[scheduler] pending publishable after recovery: ${maintenance.pending_publishable_after}`);
    }

    console.log("[scheduler] dispatch reconcile-wordpress-publications (resend_published_email_only) done");

    if (shouldRunHourlyMaintenance) {
      // Hourly deep sweep for backlog
      maintenance.deep_sweep.ran = true;
      console.log("[scheduler] dispatch reconcile-wordpress-publications (hourly deep sweep) start");
      const deepSweepResult = await dispatchAndAwait(
        supabaseUrl,
        supabaseServiceKey,
        "reconcile-wordpress-publications",
        {
          lookback_hours: 168,
          batch_size: 200,
        },
        { timeout_ms: 30000, max_retries: 1 },
      );
      maintenance.deep_sweep = {
        ok: deepSweepResult.ok,
        status: deepSweepResult.status,
        attempts: deepSweepResult.attempts,
        ran: true,
      };
      if (!deepSweepResult.ok) {
        console.error("[scheduler] hourly deep sweep failed:", deepSweepResult.error);
      }
      console.log("[scheduler] dispatch reconcile-wordpress-publications (hourly deep sweep) done");

      console.log("[scheduler] dispatch monitor-autopublish-health start");
      maintenance.monitor.ran = true;
      const monitorResult = await dispatchAndAwait(
        supabaseUrl,
        supabaseServiceKey,
        "monitor-autopublish-health",
        {
          window_minutes: 60,
          pending_threshold: 1,
        },
        { timeout_ms: 15000, max_retries: 0 },
      );
      maintenance.monitor = {
        ok: monitorResult.ok,
        status: monitorResult.status,
        attempts: monitorResult.attempts,
        ran: true,
      };
      if (!monitorResult.ok) {
        console.error("[scheduler] monitor-autopublish-health failed:", monitorResult.error);
      }
      console.log("[scheduler] dispatch monitor-autopublish-health done");
    } else {
      console.log(`[scheduler] skip hourly maintenance at minute ${now.getUTCMinutes()}`);
    }

    // Daily WordPress context refresh for all active sites
    // Only run once per day (UTC) to avoid redundant syncs
    try {
      const currentHourUtc = new Date().getUTCHours();
      const REFRESH_HOUR_UTC = 3; // 3 AM UTC
      if (currentHourUtc === REFRESH_HOUR_UTC) {
        console.log("[scheduler] Running daily WordPress context refresh");
        const { data: configs } = await supabase
          .from("wordpress_configs")
          .select("id, site_id");

        if (configs && configs.length > 0) {
          const syncUrl = `${supabaseUrl}/functions/v1/sync-wordpress-taxonomies-saas`;
          let synced = 0;
          for (const cfg of configs as Array<{ id: string; site_id: string }>) {
            try {
              fetch(syncUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  wordpress_config_id: cfg.id,
                  analyze_content: true,
                }),
              }).catch((err) => console.warn(`[scheduler] Daily sync failed for ${cfg.id}:`, err));
              synced++;
            } catch (err) {
              console.warn(`[scheduler] Error dispatching sync for ${cfg.id}:`, err);
            }
          }
          console.log(`[scheduler] Dispatched daily sync to ${synced} WordPress configs`);
        }
      }
    } catch (err) {
      console.warn("[scheduler] Daily WordPress refresh failed:", err);
    }

    const elapsed = Date.now() - startTime;
    console.log("\n=== SCHEDULER COMPLETE ===");
    console.log(`Time elapsed: ${elapsed}ms`);
    console.log(`Dispatched: ${dispatched.sites} sites`);
    console.log(`Skipped (already generated): ${dispatched.skipped.sites} sites`);

    if (runId && supabase) {
      try {
        await supabase
          .from("scheduler_runs")
          .update({
            finished_at: new Date().toISOString(),
            success: true,
            dispatched_sites: dispatched.sites,
            skipped_sites: dispatched.skipped.sites,
            metadata: {
              elapsed_ms: elapsed,
              hourly_maintenance: shouldRunHourlyMaintenance,
              maintenance,
            },
          })
          .eq("id", runId);
      } catch (e) {
        console.error("[scheduler] Failed to update scheduler_runs:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dispatched,
        reconcile_dispatched: true,
        monitor_dispatched: shouldRunHourlyMaintenance,
        maintenance,
        elapsed_ms: elapsed,
        timestamp: now.toISOString(),
        run_id: runId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Scheduler error:", error);

    if (runId && supabase) {
      try {
        await supabase
          .from("scheduler_runs")
          .update({
            finished_at: new Date().toISOString(),
            success: false,
            error: errorMessage,
          })
          .eq("id", runId);
      } catch (e) {
        console.error("[scheduler] Failed to update scheduler_runs on error:", e);
      }
    }

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

Deno.serve(handler);
