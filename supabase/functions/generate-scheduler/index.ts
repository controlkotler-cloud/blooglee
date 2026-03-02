import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

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
  localDayOfWeek: number;
  localDayOfMonth: number;
  localWeekOfMonth: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
    weekday: "short",
    day: "numeric",
  });
  const parts = fmt.formatToParts(now);
  const localHour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const localDayOfMonth = Number(parts.find((p) => p.type === "day")?.value ?? 1);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const localDayOfWeek = weekdayMap[weekdayStr] ?? 1;
  const localWeekOfMonth = Math.ceil(localDayOfMonth / 7);

  return { localHour, localDayOfWeek, localDayOfMonth, localWeekOfMonth };
}

function shouldSiteGenerateNow(
  site: SiteEntity,
  now: Date,
): { due: boolean; localHour: number; targetHour: number; tz: string } {
  const tz = site.timezone || "Europe/Madrid";
  const { localHour, localDayOfWeek, localDayOfMonth, localWeekOfMonth } = getLocalDateParts(now, tz);

  const targetHour = site.publish_hour_local ?? site.publish_hour_utc ?? 9;
  const hourReached = localHour >= targetHour;
  const frequency = normalizeFrequency(site.publish_frequency);

  let due = false;
  switch (frequency) {
    case "daily":
      due = hourReached;
      break;
    case "daily_weekdays":
      due = localDayOfWeek >= 1 && localDayOfWeek <= 5 && hourReached;
      break;
    case "weekly":
      due =
        localDayOfWeek > (site.publish_day_of_week ?? 1) ||
        (localDayOfWeek === (site.publish_day_of_week ?? 1) && hourReached);
      break;
    case "biweekly":
      if (localWeekOfMonth !== 1 && localWeekOfMonth !== 3) {
        due = false;
      } else {
        due =
          localDayOfWeek > (site.publish_day_of_week ?? 1) ||
          (localDayOfWeek === (site.publish_day_of_week ?? 1) && hourReached);
      }
      break;
    case "monthly":
      if (site.publish_day_of_month !== null && site.publish_day_of_month !== undefined) {
        due =
          localDayOfMonth > site.publish_day_of_month || (localDayOfMonth === site.publish_day_of_month && hourReached);
      } else {
        const targetDayOfWeek = site.publish_day_of_week ?? 1;
        const targetWeekOfMonth = site.publish_week_of_month ?? 1;
        if (localWeekOfMonth > targetWeekOfMonth) due = true;
        else if (localWeekOfMonth < targetWeekOfMonth) due = false;
        else due = localDayOfWeek > targetDayOfWeek || (localDayOfWeek === targetDayOfWeek && hourReached);
      }
      break;
    default:
      due = false;
  }

  return { due, localHour, targetHour, tz };
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
            `Skipping site ${site.name} - not scheduled now (freq: ${frequency}, tz: ${schedResult.tz}, localHour: ${schedResult.localHour}, targetHour: ${schedResult.targetHour}, day_of_week: ${site.publish_day_of_week}, day_of_month: ${site.publish_day_of_month}, utc: ${now.toISOString()})`,
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
          `Dispatching generation for site ${site.name} (tz: ${schedResult.tz}, localHour: ${schedResult.localHour}, targetHour: ${schedResult.targetHour})`,
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

    if (shouldRunHourlyMaintenance) {
      console.log("[scheduler] dispatch reconcile-wordpress-publications start");
      dispatchGeneration(supabaseUrl, supabaseServiceKey, "reconcile-wordpress-publications", {
        lookback_hours: 168,
        batch_size: 100,
      });
      console.log("[scheduler] dispatch reconcile-wordpress-publications done");

      console.log("[scheduler] dispatch monitor-autopublish-health start");
      dispatchGeneration(supabaseUrl, supabaseServiceKey, "monitor-autopublish-health", {
        window_minutes: 60,
        pending_threshold: 1,
      });
      console.log("[scheduler] dispatch monitor-autopublish-health done");
    } else {
      console.log(`[scheduler] skip hourly maintenance at minute ${now.getUTCMinutes()}`);
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
        reconcile_dispatched: shouldRunHourlyMaintenance,
        monitor_dispatched: shouldRunHourlyMaintenance,
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
