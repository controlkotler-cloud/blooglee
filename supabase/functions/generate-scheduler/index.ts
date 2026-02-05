import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EntityToProcess {
  id: string;
  name: string;
  publish_frequency: string;
}

interface FarmaciaEntity extends EntityToProcess {
  location: string;
  languages: string[];
}

interface EmpresaEntity extends EntityToProcess {
  sector: string | null;
  location: string | null;
  languages: string[];
}

interface SiteEntity extends EntityToProcess {
  user_id: string;
  sector: string | null;
  location: string | null;
  languages: string[];
  publish_day_of_week: number | null;
  publish_day_of_month: number | null;
  publish_week_of_month: number | null;
  publish_hour_utc: number | null;
}

/**
 * Determines if an entity should generate content today based on frequency (for MKPro)
 * This is the legacy logic for farmacias and empresas
 */
function shouldGenerateToday(
  publishFrequency: string,
  now: Date
): boolean {
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = now.getUTCDate();

  switch (publishFrequency) {
    case "daily":
      return true;

    case "daily_weekdays":
      // Monday (1) to Friday (5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case "weekly":
      // Only on Mondays
      return dayOfWeek === 1;

    case "biweekly":
      // 1st and 3rd Monday of the month
      const weekNumber = Math.ceil(dayOfMonth / 7);
      return dayOfWeek === 1 && (weekNumber === 1 || weekNumber === 3);

    case "monthly":
      // First Monday of the month
      return dayOfWeek === 1 && dayOfMonth <= 7;

    default:
      return false;
  }
}

/**
 * Determines if a SaaS site should generate content NOW based on custom schedule
 * This supports per-site day and hour configuration
 */
function shouldSiteGenerateNow(
  site: SiteEntity,
  now: Date
): boolean {
  const currentHour = now.getUTCHours();
  const currentDayOfWeek = now.getUTCDay();
  const currentDayOfMonth = now.getUTCDate();
  const currentWeekOfMonth = Math.ceil(currentDayOfMonth / 7);

  // Check hour first - must match configured hour (default 9)
  const publishHour = site.publish_hour_utc ?? 9;
  if (currentHour !== publishHour) {
    return false;
  }

  const frequency = site.publish_frequency || "monthly";

  switch (frequency) {
    case "daily":
      return true;

    case "daily_weekdays":
      return currentDayOfWeek >= 1 && currentDayOfWeek <= 5;

    case "weekly":
      // Check configured day of week (default Monday = 1)
      return currentDayOfWeek === (site.publish_day_of_week ?? 1);

    case "biweekly":
      // Check configured day of week on weeks 1 and 3
      return currentDayOfWeek === (site.publish_day_of_week ?? 1) &&
        (currentWeekOfMonth === 1 || currentWeekOfMonth === 3);

    case "monthly":
      // Two modes: fixed day of month OR specific weekday of a specific week
      if (site.publish_day_of_month !== null && site.publish_day_of_month !== undefined) {
        // Fixed day mode (e.g., "day 15 of each month")
        return currentDayOfMonth === site.publish_day_of_month;
      } else {
        // Weekday mode (e.g., "first Monday of each month")
        const targetDayOfWeek = site.publish_day_of_week ?? 1;
        const targetWeekOfMonth = site.publish_week_of_month ?? 1;
        return currentDayOfWeek === targetDayOfWeek && currentWeekOfMonth === targetWeekOfMonth;
      }

    default:
      return false;
  }
}

/**
 * Check if entity already has an article for today's period
 */
async function hasArticleForPeriod(
  supabase: any,
  entityType: "farmacia" | "empresa" | "site",
  entityId: string,
  frequency: string,
  now: Date
): Promise<boolean> {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dayOfMonth = now.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  let table = "";
  let entityColumn = "";

  switch (entityType) {
    case "farmacia":
      table = "articulos";
      entityColumn = "farmacia_id";
      break;
    case "empresa":
      table = "articulos_empresas";
      entityColumn = "empresa_id";
      break;
    case "site":
      table = "articles";
      entityColumn = "site_id";
      break;
  }

  try {
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(entityColumn, entityId)
      .eq("month", month)
      .eq("year", year);

    // Apply period-specific filters
    if (frequency === "daily" || frequency === "daily_weekdays") {
      query = query.eq("day_of_month", dayOfMonth);
    } else if (frequency === "weekly" || frequency === "biweekly") {
      query = query.eq("week_of_month", weekOfMonth);
    }
    // For monthly, just checking month/year is enough

    const { count, error } = await query;

    if (error) {
      console.error(`Error checking existing article for ${entityType} ${entityId}:`, error);
      return false; // Allow generation on error
    }

    return (count || 0) > 0;
  } catch (e) {
    console.error(`Exception checking existing article:`, e);
    return false;
  }
}

/**
 * Dispatch article generation for a single entity (fire-and-forget)
 */
function dispatchGeneration(
  supabaseUrl: string,
  supabaseServiceKey: string,
  endpoint: string,
  payload: Record<string, any>
): void {
  const url = `${supabaseUrl}/functions/v1/${endpoint}`;
  
  console.log(`Dispatching to ${endpoint} with payload:`, JSON.stringify(payload));
  
  // Fire-and-forget - don't await
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify(payload),
  }).then(res => {
    console.log(`[${endpoint}] Response status: ${res.status}`);
  }).catch(err => {
    console.error(`[${endpoint}] Dispatch error:`, err);
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("=== GENERATE SCHEDULER STARTED ===");
  console.log("Time:", new Date().toISOString());

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const dispatched = {
      farmacias: 0,
      empresas: 0,
      sites: 0,
      skipped: {
        farmacias: 0,
        empresas: 0,
        sites: 0,
      }
    };

    // ===== FARMACIAS (MKPro) =====
    console.log("\n--- Processing Farmacias ---");
    const { data: farmacias, error: farmaciasError } = await supabase
      .from("farmacias")
      .select("id, name, location, languages, auto_generate")
      .eq("auto_generate", true);

    if (farmaciasError) {
      console.error("Error fetching farmacias:", farmaciasError);
    } else if (farmacias && farmacias.length > 0) {
      console.log(`Found ${farmacias.length} farmacias with auto_generate=true`);
      
      // Farmacias are monthly by default
      const farmaciaFrequency = "monthly";
      
      if (shouldGenerateToday(farmaciaFrequency, now)) {
        for (const farmacia of farmacias) {
          const hasExisting = await hasArticleForPeriod(
            supabase,
            "farmacia",
            farmacia.id,
            farmaciaFrequency,
            now
          );

          if (hasExisting) {
            console.log(`Skipping farmacia ${farmacia.name} - already has article this period`);
            dispatched.skipped.farmacias++;
            continue;
          }

          // Dispatch generation
          dispatchGeneration(supabaseUrl, supabaseServiceKey, "generate-article", {
            pharmacyId: farmacia.id,
            month,
            year,
            isScheduled: true,
          });
          dispatched.farmacias++;
        }
      } else {
        console.log(`Today is not a generation day for monthly frequency`);
      }
    }

    // ===== EMPRESAS (MKPro) =====
    console.log("\n--- Processing Empresas ---");
    const { data: empresas, error: empresasError } = await supabase
      .from("empresas")
      .select("id, name, sector, location, languages, auto_generate, publish_frequency")
      .eq("auto_generate", true);

    if (empresasError) {
      console.error("Error fetching empresas:", empresasError);
    } else if (empresas && empresas.length > 0) {
      console.log(`Found ${empresas.length} empresas with auto_generate=true`);

      for (const empresa of empresas) {
        const frequency = empresa.publish_frequency || "monthly";
        
        if (!shouldGenerateToday(frequency, now)) {
          console.log(`Skipping empresa ${empresa.name} - not a generation day for ${frequency}`);
          continue;
        }

        const hasExisting = await hasArticleForPeriod(
          supabase,
          "empresa",
          empresa.id,
          frequency,
          now
        );

        if (hasExisting) {
          console.log(`Skipping empresa ${empresa.name} - already has article this period`);
          dispatched.skipped.empresas++;
          continue;
        }

        // Dispatch generation
        dispatchGeneration(supabaseUrl, supabaseServiceKey, "generate-article-empresa", {
          empresaId: empresa.id,
          month,
          year,
          isScheduled: true,
        });
        dispatched.empresas++;
      }
    }

    // ===== SITES (Blooglee SaaS) =====
    console.log("\n--- Processing Sites ---");
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("id, name, user_id, sector, location, languages, auto_generate, publish_frequency, publish_day_of_week, publish_day_of_month, publish_week_of_month, publish_hour_utc")
      .eq("auto_generate", true);

    if (sitesError) {
      console.error("Error fetching sites:", sitesError);
    } else if (sites && sites.length > 0) {
      console.log(`Found ${sites.length} sites with auto_generate=true`);
      console.log(`Current UTC time: ${now.toISOString()} (hour: ${now.getUTCHours()}, day: ${now.getUTCDay()}, date: ${now.getUTCDate()})`);

      for (const site of sites as SiteEntity[]) {
        const frequency = site.publish_frequency || "monthly";
        
        // Use new per-site scheduling logic
        if (!shouldSiteGenerateNow(site, now)) {
          const configuredHour = site.publish_hour_utc ?? 9;
          console.log(`Skipping site ${site.name} - not scheduled now (freq: ${frequency}, hour: ${configuredHour}, day_of_week: ${site.publish_day_of_week}, day_of_month: ${site.publish_day_of_month})`);
          continue;
        }

        const hasExisting = await hasArticleForPeriod(
          supabase,
          "site",
          site.id,
          frequency,
          now
        );

        if (hasExisting) {
          console.log(`Skipping site ${site.name} - already has article this period`);
          dispatched.skipped.sites++;
          continue;
        }

        console.log(`Dispatching generation for site ${site.name} (scheduled at hour ${site.publish_hour_utc ?? 9} UTC)`);
        
        // For SaaS, we need to pass auth context - use service role for scheduled jobs
        dispatchGeneration(supabaseUrl, supabaseServiceKey, "generate-article-saas", {
          siteId: site.id,
          month,
          year,
          isScheduled: true,
          userId: site.user_id, // Pass user_id for notifications
        });
        dispatched.sites++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log("\n=== SCHEDULER COMPLETE ===");
    console.log(`Time elapsed: ${elapsed}ms`);
    console.log(`Dispatched: ${dispatched.farmacias} farmacias, ${dispatched.empresas} empresas, ${dispatched.sites} sites`);
    console.log(`Skipped (already generated): ${dispatched.skipped.farmacias} farmacias, ${dispatched.skipped.empresas} empresas, ${dispatched.skipped.sites} sites`);

    return new Response(
      JSON.stringify({
        success: true,
        dispatched,
        elapsed_ms: elapsed,
        timestamp: now.toISOString(),
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Scheduler error:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

Deno.serve(handler);
