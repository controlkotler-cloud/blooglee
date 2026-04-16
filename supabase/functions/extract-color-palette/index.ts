const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

import { createClient } from "npm:@supabase/supabase-js@2";

const previewRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const PREVIEW_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const PREVIEW_RATE_LIMIT_MAX_REQUESTS = 8;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "");
}

function isLocalOrPrivateIpv4(hostname: string): boolean {
  const ip = hostname.trim();
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;

  const octets = ip.split(".").map((n) => Number(n));
  if (octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function isLocalOrPrivateIpv6(hostname: string): boolean {
  const ip = stripIpv6Brackets(hostname).toLowerCase();
  if (!ip.includes(":")) return false;

  if (ip === "::1" || ip === "::") return true;
  if (ip.startsWith("fe80:")) return true; // link-local
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // unique local
  return false;
}

function isLocalOrPrivateHostname(hostname: string): boolean {
  const host = stripIpv6Brackets(hostname).toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host === "localhost.localdomain") return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host.endsWith(".home.arpa")) return true;
  if (isLocalOrPrivateIpv4(host)) return true;
  if (isLocalOrPrivateIpv6(host)) return true;
  return false;
}

function normalizeUrlForExtraction(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const input = raw.trim();
  if (!input) return { ok: false, reason: "url is required" };

  let candidate = input;
  if (!candidate.startsWith("http://") && !candidate.startsWith("https://")) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, reason: "unsupported_protocol" };
  }
  if (!parsed.hostname) {
    return { ok: false, reason: "missing_hostname" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "credentials_in_url_not_allowed" };
  }
  if (isLocalOrPrivateHostname(parsed.hostname)) {
    return { ok: false, reason: "private_or_local_url_not_allowed" };
  }

  return { ok: true, url: parsed.toString() };
}

function getClientIp(req: Request): string {
  const rawHeader =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-client-ip") ||
    "unknown";
  return rawHeader.split(",")[0].trim().toLowerCase();
}

function checkPreviewRateLimit(clientKey: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = previewRateLimitMap.get(clientKey);

  if (previewRateLimitMap.size > 2000) {
    for (const [key, value] of previewRateLimitMap.entries()) {
      if (now > value.resetTime) previewRateLimitMap.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    previewRateLimitMap.set(clientKey, { count: 1, resetTime: now + PREVIEW_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= PREVIEW_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isSameRootHost(a: string, b: string): boolean {
  return a.replace(/^www\./i, "").toLowerCase() === b.replace(/^www\./i, "").toLowerCase();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function extractHexFromUnknownColor(value: unknown): string | null {
  if (typeof value === "string") {
    return extractHexFromValue(value);
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const obj = value as Record<string, unknown>;

  // Common color object shapes from scrapers/providers.
  const directCandidates = [obj.hex, obj.value, obj.color, obj.primary, obj.secondary, obj.accent];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string") {
      const hex = extractHexFromValue(candidate);
      if (hex) return hex;
    }
  }

  // rgb object: { r: 10, g: 20, b: 30 }
  const r = Number(obj.r);
  const g = Number(obj.g);
  const b = Number(obj.b);
  if (
    Number.isFinite(r) &&
    Number.isFinite(g) &&
    Number.isFinite(b) &&
    r >= 0 &&
    r <= 255 &&
    g >= 0 &&
    g <= 255 &&
    b >= 0 &&
    b <= 255
  ) {
    return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
  }

  // Nested rgb object: { rgb: { r, g, b } }
  const nestedRgb = obj.rgb;
  if (nestedRgb && typeof nestedRgb === "object") {
    return extractHexFromUnknownColor(nestedRgb);
  }

  return null;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function canPersistForSite(siteId: string, accessToken: string | null): Promise<boolean> {
  if (!accessToken) {
    console.warn("[extract] No access token provided; skipping persistence for site_id");
    return false;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[extract] Missing Supabase env vars; cannot validate site ownership");
    return false;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user?.id) {
    console.warn("[extract] Invalid auth token for site persistence:", authError?.message || "unknown");
    return false;
  }

  const { data: ownedSite, error: siteError } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (siteError) {
    console.warn("[extract] Ownership check failed:", siteError.message);
    return false;
  }

  return Boolean(ownedSite);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: "invalid_json_body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const rawUrl = typeof body.url === "string" ? body.url : "";
    const rawSiteId = typeof body.site_id === "string" ? body.site_id.trim() : "";
    const normalizedSiteId = rawSiteId.length > 0 ? rawSiteId : null;
    const accessToken = getBearerToken(req);

    if (normalizedSiteId && !isUuid(normalizedSiteId)) {
      return new Response(JSON.stringify({ success: false, error: "invalid_site_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedUrl = normalizeUrlForExtraction(rawUrl);
    if (!normalizedUrl.ok) {
      return new Response(JSON.stringify({ success: false, error: normalizedUrl.reason }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!accessToken) {
      const clientIp = getClientIp(req);
      const userAgent = (req.headers.get("user-agent") || "unknown").slice(0, 120).toLowerCase();
      const limit = checkPreviewRateLimit(`${clientIp}:${userAgent}`);
      if (!limit.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "rate_limit_exceeded",
            retry_after: limit.retryAfter,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": String(limit.retryAfter || 60),
            },
          },
        );
      }
    }

    const formattedUrl = normalizedUrl.url;
    console.log("[extract] Starting extraction for:", formattedUrl, "site_id:", normalizedSiteId || "(preview mode)");

    let html = "";

    // === STRATEGY 1: Try Firecrawl with branding format for accurate colors ===
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    let brandingData: Record<string, unknown> | null = null;

    if (firecrawlKey) {
      // 1a. Try branding format first (extracts colors from logo/header accurately)
      try {
        console.log("[extract] Trying Firecrawl branding format...");
        const brandingResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["branding", "html"],
            onlyMainContent: false,
            waitFor: 3000,
          }),
        });

        const brandingResult = await brandingResponse.json();

        if (brandingResponse.ok && brandingResult.success) {
          const rawBranding = brandingResult.data?.branding || brandingResult.branding || null;
          brandingData =
            rawBranding && typeof rawBranding === "object" ? (rawBranding as Record<string, unknown>) : null;
          html = brandingResult.data?.html || brandingResult.html || "";
          console.log("[extract] Firecrawl OK, HTML length:", html.length, "branding:", !!brandingData);
          if (brandingData?.colors) {
            console.log("[extract] Branding colors:", JSON.stringify(brandingData.colors));
          }
        } else {
          console.warn(
            "[extract] Firecrawl branding failed:",
            brandingResult.error || brandingResult.code || "unknown",
          );
        }
      } catch (err) {
        console.warn("[extract] Firecrawl branding error:", getErrorMessage(err));
      }

      // 1b. If branding didn't return HTML, try plain HTML scrape
      if (!html && firecrawlKey) {
        try {
          console.log("[extract] Trying Firecrawl HTML-only fallback...");
          const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formattedUrl,
              formats: ["html"],
              onlyMainContent: false,
              waitFor: 3000,
            }),
          });

          const scrapeData = await scrapeResponse.json();
          if (scrapeResponse.ok && scrapeData.success) {
            html = scrapeData.data?.html || scrapeData.html || "";
            console.log("[extract] Firecrawl HTML fallback OK, length:", html.length);
          }
        } catch (err) {
          console.warn("[extract] Firecrawl HTML fallback error:", getErrorMessage(err));
        }
      }
    } else {
      console.log("[extract] No FIRECRAWL_API_KEY, skipping Firecrawl");
    }

    // === STRATEGY 2: Direct fetch fallback ===
    if (!html) {
      try {
        console.log("[extract] Trying direct fetch...");
        const response = await fetchWithTimeout(
          formattedUrl,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            },
            redirect: "follow",
          },
          10000,
        );

        const finalUrl = response.url || formattedUrl;
        const finalHost = new URL(finalUrl).hostname;
        if (isLocalOrPrivateHostname(finalHost)) {
          throw new Error("redirected_to_private_host");
        }

        const contentType = (response.headers.get("content-type") || "").toLowerCase();
        const isHtmlLike =
          contentType.length === 0 ||
          contentType.includes("text/html") ||
          contentType.includes("application/xhtml+xml");

        if (!isHtmlLike) {
          console.warn("[extract] Direct fetch content-type is not HTML:", contentType);
        }

        if (response.ok && isHtmlLike) {
          const fetchedHtml = await response.text();
          html = fetchedHtml.length > 1_500_000 ? fetchedHtml.slice(0, 1_500_000) : fetchedHtml;
          console.log("[extract] Direct fetch OK, HTML length:", html.length);
        } else if (!response.ok) {
          console.warn("[extract] Direct fetch failed with status:", response.status);
        } else {
          console.warn("[extract] Direct fetch skipped due to non-HTML response");
        }
      } catch (err) {
        console.warn("[extract] Direct fetch error:", getErrorMessage(err));
      }
    }

    // === STRATEGY 2b: Also fetch external stylesheets for better color extraction ===
    let externalCss = "";
    if (html) {
      try {
        const stylesheetUrls = extractStylesheetUrls(html, formattedUrl);
        console.log("[extract] Found", stylesheetUrls.length, "external stylesheets");

        // Fetch up to 3 stylesheets
        const fetches = stylesheetUrls.slice(0, 3).map(async (cssUrl) => {
          try {
            const res = await fetchWithTimeout(
              cssUrl,
              {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; Blooglee/1.0)" },
                redirect: "follow",
              },
              5000,
            );
            if (res.ok) {
              const finalCssUrl = res.url || cssUrl;
              const finalCssHost = new URL(finalCssUrl).hostname;
              const pageHost = new URL(formattedUrl).hostname;
              if (!isSameRootHost(finalCssHost, pageHost) || isLocalOrPrivateHostname(finalCssHost)) {
                return "";
              }

              const cssContentType = (res.headers.get("content-type") || "").toLowerCase();
              if (cssContentType && !cssContentType.includes("text/css")) {
                return "";
              }

              const text = await res.text();
              return text.substring(0, 50000); // Limit to 50KB per stylesheet
            }
            return "";
          } catch {
            return "";
          }
        });

        const cssResults = await Promise.all(fetches);
        externalCss = cssResults.join("\n");
        if (externalCss) {
          console.log("[extract] External CSS total length:", externalCss.length);
        }
      } catch (err) {
        console.warn("[extract] Error fetching stylesheets:", getErrorMessage(err));
      }
    }

    // === CHALLENGE PAGE DETECTION ===
    if (html) {
      const challenge = detectChallengePage(html);
      if (challenge.isChallenge) {
        console.warn("[extract] Challenge page detected:", challenge.type);
        return new Response(
          JSON.stringify({
            success: false,
            error: "challenge_page_detected",
            challenge_type: challenge.type,
            message: challenge.type === "cloudflare"
              ? "Tu web está protegida por Cloudflare y bloquea el análisis. Desactiva temporalmente el 'Bot Fight Mode' en Cloudflare o añade nuestro IP a la whitelist. Mientras tanto, puedes rellenar los datos manualmente."
              : "Tu web está protegida por reCAPTCHA y bloquea el análisis automático. Puedes rellenar los datos manualmente.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // === EXTRACT DATA ===
    // Priority 1: Use Firecrawl branding colors (most accurate - from logo/header)
    let colors: string[] = [];
    if (brandingData?.colors) {
      const brandColors = brandingData.colors;
      const colorValues: unknown[] = Array.isArray(brandColors)
        ? brandColors
        : brandColors && typeof brandColors === "object"
          ? [
              (brandColors as Record<string, unknown>).primary,
              (brandColors as Record<string, unknown>).secondary,
              (brandColors as Record<string, unknown>).accent,
              (brandColors as Record<string, unknown>).background,
              (brandColors as Record<string, unknown>).textPrimary,
              (brandColors as Record<string, unknown>).textSecondary,
            ]
          : [];
      const brandingSet = new Set<string>();

      for (const colorVal of colorValues) {
        const hex = extractHexFromUnknownColor(colorVal);
        if (hex && !isBlackWhiteGray(hex)) {
          brandingSet.add(hex);
        }
      }
      colors = [...brandingSet];
      console.log("[extract] Branding colors extracted:", colors.length, colors.join(", "));
    }

    // Priority 2: Fall back to CSS parsing if branding didn't yield enough colors
    if (colors.length < 3 && html) {
      const combinedContent = html + "\n" + externalCss;
      const cssColors = extractColorsFromHtml(combinedContent);
      // Merge, avoiding duplicates
      for (const c of cssColors) {
        if (!colors.includes(c)) colors.push(c);
      }
      colors = colors.slice(0, 6);
    }

    let businessName = html ? extractBusinessName(html, formattedUrl) : deriveBusinessNameFromUrl(formattedUrl);
    let description = html ? extractDescription(html) : undefined;
    const socialLink = html ? extractSocialLink(html) : undefined;
    const blogUrl = html ? extractBlogUrl(html, formattedUrl) : undefined;
    let keywords = html ? extractKeywords(html) : undefined;

    // === AI ENRICHMENT: extract full profile ===
    // Declare additional extracted fields from AI
    let aiSector: string | undefined;
    let aiBusinessType: string | undefined;
    let aiLocation: string | undefined;
    let aiToneSuggestion: string | undefined;
    let aiAudienceSuggestion: string | undefined;
    let aiContentGoalSuggestion: string | undefined;
    let aiEditorialFocusSuggestion: string | undefined;
    let aiLanguages: string[] | undefined;

    // Always run AI enrichment to extract full profile (not only missing basic fields)
    if (html) {
      try {
        console.log("[extract] Running full AI enrichment");
        const aiResult = await extractWithAI(html, formattedUrl);
        if (!businessName && aiResult.business_name) {
          businessName = aiResult.business_name;
          console.log("[extract] AI business_name:", businessName);
        }
        if (!description && aiResult.description) {
          description = aiResult.description;
        }
        if (!keywords && aiResult.keywords) {
          keywords = aiResult.keywords;
        }
        aiSector = aiResult.sector;
        aiBusinessType = aiResult.business_type;
        aiLocation = aiResult.location;
        aiToneSuggestion = aiResult.tone_suggestion;
        aiAudienceSuggestion = aiResult.audience_suggestion;
        aiContentGoalSuggestion = aiResult.content_goal_suggestion;
        aiEditorialFocusSuggestion = aiResult.editorial_focus_suggestion;
        aiLanguages = aiResult.languages;
        console.log("[extract] AI extracted fields:", {
          sector: aiSector, businessType: aiBusinessType, tone: aiToneSuggestion,
          goal: aiContentGoalSuggestion, languages: aiLanguages,
        });
      } catch (err) {
        console.warn("[extract] AI enrichment failed:", getErrorMessage(err));
      }
    }

    console.log(
      "[extract] Results — colors:",
      colors.length,
      "business_name:",
      !!businessName,
      "description:",
      !!description,
      "social:",
      !!socialLink,
      "blog:",
      !!blogUrl,
      "keywords:",
      !!keywords,
    );
    if (colors.length > 0) console.log("[extract] Colors:", colors.join(", "));

    // Save to database only when site_id exists (post-site-creation mode).
    // In onboarding preview mode we only return extracted data to prefill fields.
    if (normalizedSiteId) {
      const canPersist = await canPersistForSite(normalizedSiteId, accessToken);
      if (canPersist) {
        await saveData(normalizedSiteId, { colors, description, socialLink, blogUrl, keywords });
      } else {
        console.warn("[extract] site_id provided but ownership validation failed; skipping persistence");
      }
    } else {
      console.log("[extract] Preview mode: skipping database save (no site_id provided)");
    }

    return new Response(
      JSON.stringify({
        success: true,
        colors,
        business_name: businessName,
        description,
        social_link: socialLink,
        blog_url: blogUrl,
        keywords,
        source: colors.length > 0 ? (firecrawlKey ? "firecrawl" : "direct") : "none",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[extract] Fatal error:", error);
    return new Response(JSON.stringify({ success: false, error: getErrorMessage(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// =========================================
// STYLESHEET URL EXTRACTION
// =========================================

function extractStylesheetUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  const linkRegex2 = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
  const baseHost = (() => {
    try {
      return new URL(baseUrl).hostname;
    } catch {
      return "";
    }
  })();

  let match;
  for (const regex of [linkRegex, linkRegex2]) {
    while ((match = regex.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith("//")) href = "https:" + href;
      else if (href.startsWith("/")) {
        try {
          const base = new URL(baseUrl);
          href = `${base.protocol}//${base.hostname}${href}`;
        } catch {
          continue;
        }
      } else if (!href.startsWith("http")) {
        try {
          href = new URL(href, baseUrl).href;
        } catch {
          continue;
        }
      }

      let hrefHost = "";
      try {
        const parsedHref = new URL(href);
        hrefHost = parsedHref.hostname;
        if (!["http:", "https:"].includes(parsedHref.protocol)) continue;
      } catch {
        continue;
      }

      // Only fetch CSS from same host and never from local/private targets.
      if (!baseHost || !isSameRootHost(hrefHost, baseHost) || isLocalOrPrivateHostname(hrefHost)) {
        continue;
      }

      // Skip CDN fonts, icons, etc.
      if (!href.includes("fonts.googleapis") && !href.includes("font-awesome") && !href.includes("icons")) {
        urls.push(href);
      }
    }
  }
  return [...new Set(urls)];
}

// =========================================
// DATA PERSISTENCE
// =========================================

interface ExtractedData {
  colors: string[];
  description?: string;
  socialLink?: string;
  blogUrl?: string;
  keywords?: string;
}

async function saveData(siteId: string, data: ExtractedData) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Read current values to avoid overwriting user edits
  const { data: site } = await supabase
    .from("sites")
    .select("description, instagram_url, blog_url, custom_topic")
    .eq("id", siteId)
    .single();

  const update: Record<string, unknown> = {};

  // Colors: always update (this is the primary purpose)
  // Use a special marker prefix so polling can distinguish "extracted empty" from "default value"
  if (data.colors.length > 0) {
    update.color_palette = data.colors.join(",");
  } else {
    // Mark as "extracted but empty" so polling knows extraction is done
    update.color_palette = "extracted:";
  }

  // Description
  if (data.description && !site?.description) {
    update.description = data.description;
  }

  // Social link → instagram_url column
  if (data.socialLink && !site?.instagram_url) {
    update.instagram_url = data.socialLink;
  }

  // Blog URL — always prefer the extracted blog-specific URL over the homepage
  // The user enters a homepage URL in the wizard (saved to blog_url initially).
  // If we found a real blog path (/blog, /noticias, etc.), overwrite with that.
  if (data.blogUrl) {
    update.blog_url = data.blogUrl;
    console.log("[extract] Overwriting blog_url with extracted blog path:", data.blogUrl);
  }

  // Keywords → custom_topic
  if (data.keywords && !site?.custom_topic) {
    update.custom_topic = data.keywords;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("sites").update(update).eq("id", siteId);

    if (error) {
      console.error("[extract] Error saving data:", error);
    } else {
      console.log("[extract] Saved:", Object.keys(update).join(", "));
    }
  }
}

// =========================================
// AI-POWERED EXTRACTION (Gemini Flash)
// =========================================

async function extractWithAI(
  html: string,
  url: string,
  needsBusinessName: boolean,
  needsDescription: boolean,
  needsKeywords: boolean,
): Promise<{ business_name?: string; description?: string; keywords?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("[extract] No LOVABLE_API_KEY, skipping AI enrichment");
    return {};
  }

  // Strip scripts/styles and take a reasonable chunk of visible text
  const visibleText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 6000);

  if (visibleText.length < 50) return {};

  const parts: string[] = [];
  if (needsBusinessName) {
    parts.push(
      '"business_name": nombre comercial exacto de la empresa o marca principal del sitio (2-6 palabras). Sin eslóganes ni claims.',
    );
  }
  if (needsDescription) {
    parts.push(
      '"description": una frase de 1-2 líneas que resuma qué hace este negocio, su sector y su propuesta de valor. Máximo 200 caracteres. En español.',
    );
  }
  if (needsKeywords) {
    parts.push(
      '"keywords": entre 3 y 8 palabras clave del negocio separadas por comas, en español. Deben ser términos que describan el sector, los servicios o productos principales. NO incluyas nombres de ciudades, localidades, direcciones ni ubicaciones geográficas.',
    );
  }

  const prompt = `Analiza el contenido de esta web (${url}) y extrae la siguiente información en formato JSON:

{
  ${parts.join(",\n  ")}
}

Contenido de la web:
${visibleText}

Responde SOLO con el JSON, sin markdown ni explicaciones.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.warn("[extract] AI response status:", response.status);
    return {};
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Parse JSON from response (strip fences if present)
  const cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      business_name: typeof parsed.business_name === "string" ? sanitizeBusinessName(parsed.business_name) : undefined,
      description: typeof parsed.description === "string" ? parsed.description.substring(0, 250) : undefined,
      keywords: typeof parsed.keywords === "string" ? parsed.keywords.substring(0, 300) : undefined,
    };
  } catch {
    console.warn("[extract] Failed to parse AI JSON:", cleaned.substring(0, 100));
    return {};
  }
}

// =========================================
// EXTRACTION FUNCTIONS
// =========================================

function extractDescription(html: string): string | undefined {
  // Try meta description first, then og:description
  const metaMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  if (metaMatch?.[1]?.trim()) return metaMatch[1].trim();

  const ogMatch =
    html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i);
  if (ogMatch?.[1]?.trim()) return ogMatch[1].trim();

  return undefined;
}

function sanitizeBusinessName(rawName: string): string | undefined {
  if (!rawName) return undefined;

  let name = rawName
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-|–—•·:]+|[\s\-|–—•·:]+$/g, "")
    .trim();

  // Remove very common suffixes that are not part of the brand itself.
  name = name.replace(/\b(inicio|home|blog|noticias|news)\b$/i, "").trim();

  if (name.length < 2 || name.length > 120) return undefined;

  const lowered = name.toLowerCase();
  const generic = new Set(["inicio", "home", "blog", "noticias", "news", "wordpress", "untitled", "site", "website"]);
  if (generic.has(lowered)) return undefined;

  return name;
}

function getHostnameWithoutWww(urlValue: string): string | null {
  try {
    return new URL(urlValue).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

function deriveBusinessNameFromUrl(siteUrl: string): string | undefined {
  const host = getHostnameWithoutWww(siteUrl);
  if (!host) return undefined;

  const root = host.split(".")[0];
  if (!root) return undefined;

  const cleaned = root.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

  if (!cleaned) return undefined;
  return sanitizeBusinessName(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
}

function normalizeTitleCandidate(title: string): string | undefined {
  const segments = title
    .split(/\s*[|–—•·]\s*|\s+-\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const candidate = sanitizeBusinessName(segment);
    if (candidate && candidate.length <= 70) return candidate;
  }

  return sanitizeBusinessName(title);
}

function extractBusinessNameFromJsonLd(html: string): string | undefined {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  const hasBusinessType = (value: unknown): boolean => {
    const types = Array.isArray(value) ? value : [value];
    const joined = types.map((item) => (typeof item === "string" ? item.toLowerCase() : "")).join(" ");

    return /(organization|localbusiness|store|medical|pharmacy|clinic|dentist|restaurant|company|corporation)/.test(
      joined,
    );
  };

  while ((match = jsonLdRegex.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as Record<string, unknown>)?.["@graph"])
          ? ((parsed as Record<string, unknown>)["@graph"] as unknown[])
          : [parsed];

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const obj = node as Record<string, unknown>;
        const nameValue = typeof obj.name === "string" ? obj.name : undefined;
        if (!nameValue) continue;

        const hasSignals =
          hasBusinessType(obj["@type"]) || Boolean(obj.logo) || Boolean(obj.sameAs) || Boolean(obj.url);
        if (!hasSignals) continue;

        const cleaned = sanitizeBusinessName(nameValue);
        if (cleaned) return cleaned;
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return undefined;
}

function extractBusinessName(html: string, siteUrl: string): string | undefined {
  const jsonLdName = extractBusinessNameFromJsonLd(html);
  if (jsonLdName) return jsonLdName;

  const ogSiteName =
    html.match(/<meta\s+(?:property|name)=["']og:site_name["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:site_name["']/i)?.[1];
  const cleanedOgSiteName = ogSiteName ? sanitizeBusinessName(ogSiteName) : undefined;
  if (cleanedOgSiteName) return cleanedOgSiteName;

  const applicationName =
    html.match(/<meta\s+name=["']application-name["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']application-name["']/i)?.[1];
  const cleanedApplicationName = applicationName ? sanitizeBusinessName(applicationName) : undefined;
  if (cleanedApplicationName) return cleanedApplicationName;

  const ogTitle =
    html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i)?.[1];
  if (ogTitle) {
    const normalizedOgTitle = normalizeTitleCandidate(ogTitle);
    if (normalizedOgTitle) return normalizedOgTitle;
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (titleMatch) {
    const titleText = titleMatch
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const normalizedTitle = normalizeTitleCandidate(titleText);
    if (normalizedTitle) return normalizedTitle;
  }

  return deriveBusinessNameFromUrl(siteUrl);
}

function getSocialPriority(hostname: string): number {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  if (host.includes("instagram.com")) return 1;
  if (host.includes("linkedin.com")) return 2;
  if (host.includes("facebook.com")) return 3;
  if (host.includes("tiktok.com")) return 4;
  if (host.includes("youtube.com")) return 5;
  if (host.includes("x.com") || host.includes("twitter.com")) return 6;
  return 99;
}

function isSupportedSocialHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return (
    host.includes("instagram.com") ||
    host.includes("facebook.com") ||
    host.includes("linkedin.com") ||
    host.includes("x.com") ||
    host.includes("twitter.com") ||
    host.includes("tiktok.com") ||
    host.includes("youtube.com")
  );
}

function isShareOrNonProfileSocialUrl(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname.toLowerCase();

  if (host.includes("instagram.com")) {
    return (
      path.startsWith("/p/") ||
      path.startsWith("/reel/") ||
      path.startsWith("/reels/") ||
      path.startsWith("/stories/") ||
      path === "/" ||
      path.includes("/share")
    );
  }

  if (host.includes("facebook.com")) {
    return path.includes("/sharer") || path.includes("/share.php") || path.includes("/dialog/share");
  }

  if (host.includes("linkedin.com")) {
    return path.includes("/share") || path.includes("/feed/update");
  }

  if (host.includes("x.com") || host.includes("twitter.com")) {
    return path.includes("/intent/") || path.includes("/share");
  }

  if (host.includes("youtube.com")) {
    return path.includes("/watch") || path.includes("/playlist") || path.includes("/shorts");
  }

  return false;
}

function normalizeSocialCandidate(rawUrl: string): string | undefined {
  if (!rawUrl) return undefined;
  let candidate = rawUrl.trim().replace(/&amp;/g, "&");
  if (!candidate) return undefined;
  if (candidate.startsWith("mailto:") || candidate.startsWith("tel:")) return undefined;
  if (candidate.startsWith("#")) return undefined;

  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  } else if (candidate.startsWith("www.")) {
    candidate = `https://${candidate}`;
  } else if (!candidate.startsWith("http://") && !candidate.startsWith("https://")) {
    // If domain appears without protocol
    if (/(?:instagram|facebook|linkedin|twitter|x|tiktok|youtube)\.com/i.test(candidate)) {
      candidate = `https://${candidate.replace(/^\/+/, "")}`;
    } else {
      return undefined;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (!isSupportedSocialHost(parsed.hostname)) return undefined;
    if (isShareOrNonProfileSocialUrl(parsed)) return undefined;
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.host}${normalizedPath}`;
  } catch {
    return undefined;
  }
}

function extractSocialLink(html: string): string | undefined {
  const source = html.replace(/\\\//g, "/");
  const candidates: string[] = [];

  // 1) Any href value (absolute, protocol-relative or plain domain)
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(source)) !== null) {
    candidates.push(match[1]);
  }

  // 2) JSON-LD sameAs array
  const sameAsRegex = /"sameAs"\s*:\s*\[([\s\S]*?)\]/gi;
  while ((match = sameAsRegex.exec(source)) !== null) {
    const block = match[1];
    const urlRegex = /"([^"]+)"/g;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(block)) !== null) {
      candidates.push(urlMatch[1]);
    }
  }

  // 3) Plain social URLs in markup/scripts text
  const plainSocialRegex =
    /(?:https?:\/\/|\/\/|www\.)?(?:instagram\.com|facebook\.com|linkedin\.com|twitter\.com|x\.com|tiktok\.com|youtube\.com)\/[^\s"'<>]+/gi;
  while ((match = plainSocialRegex.exec(source)) !== null) {
    candidates.push(match[0]);
  }

  const normalized = [...new Set(candidates.map((c) => normalizeSocialCandidate(c)).filter(Boolean) as string[])];
  if (normalized.length === 0) return undefined;

  normalized.sort((a, b) => {
    const hostA = new URL(a).hostname;
    const hostB = new URL(b).hostname;
    return getSocialPriority(hostA) - getSocialPriority(hostB);
  });

  return normalized[0];
}

function extractBlogUrl(html: string, siteUrl: string): string | undefined {
  let siteDomain: string;
  try {
    siteDomain = new URL(siteUrl).hostname;
  } catch {
    return undefined;
  }

  const blogPatterns = ["/blog", "/noticias", "/news", "/articles", "/magazine", "/actualidad", "/recursos"];
  const linkRegex = /href=["'](https?:\/\/[^"'\s>]+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    try {
      const linkUrl = new URL(href);
      if (linkUrl.hostname === siteDomain) {
        const path = linkUrl.pathname.toLowerCase();
        for (const pattern of blogPatterns) {
          if (path.includes(pattern)) {
            return `${linkUrl.protocol}//${linkUrl.hostname}${linkUrl.pathname}`.replace(/\/+$/, "");
          }
        }
      }
    } catch {
      continue;
    }
  }

  // Also check relative links
  const relLinkRegex = /href=["'](\/[^"'\s>]+)["']/gi;
  while ((match = relLinkRegex.exec(html)) !== null) {
    const path = match[1].toLowerCase();
    for (const pattern of blogPatterns) {
      if (path.includes(pattern)) {
        try {
          const base = new URL(siteUrl);
          return `${base.protocol}//${base.hostname}${match[1]}`.replace(/\/+$/, "");
        } catch {
          continue;
        }
      }
    }
  }

  return undefined;
}

function extractKeywords(html: string): string | undefined {
  const match =
    html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i);
  if (match?.[1]?.trim()) return match[1].trim();
  return undefined;
}

// =========================================
// COLOR EXTRACTION
// =========================================

function extractColorsFromHtml(html: string): string[] {
  const colorMap = new Map<string, number>();

  // 1. CSS custom properties (highest weight)
  const cssVarRegex =
    /--(?:primary|brand|accent|main|theme|secondary|highlight|color-primary|color-secondary|color-accent)[^:]*:\s*([^;]+)/gi;
  let match;
  while ((match = cssVarRegex.exec(html)) !== null) {
    const value = match[1].trim();
    const hex = extractHexFromValue(value);
    if (hex && !isBlackWhiteGray(hex)) {
      colorMap.set(hex, (colorMap.get(hex) || 0) + 20);
    }
  }

  // 2. Colors from key CSS selectors (high weight)
  const importantSelectors =
    /(?:body|header|nav|\.header|\.nav|\.navbar|\.cta|\.btn-primary|\.btn|button|a:hover|h1|h2)\s*\{[^}]*\}/gi;
  while ((match = importantSelectors.exec(html)) !== null) {
    const block = match[0];
    const colorProps = /(?:background-color|background|color|border-color)\s*:\s*([^;]+)/gi;
    let propMatch;
    while ((propMatch = colorProps.exec(block)) !== null) {
      const hex = extractHexFromValue(propMatch[1].trim());
      if (hex && !isBlackWhiteGray(hex)) {
        colorMap.set(hex, (colorMap.get(hex) || 0) + 5);
      }
    }
  }

  // 3. All hex colors
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  while ((match = hexRegex.exec(html)) !== null) {
    const hex = normalizeHex(match[0]);
    if (hex && !isBlackWhiteGray(hex)) {
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
  }

  // 4. rgb/rgba colors
  const rgbRegex = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;
  while ((match = rgbRegex.exec(html)) !== null) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    if (r <= 255 && g <= 255 && b <= 255) {
      const hex = rgbToHex(r, g, b);
      if (!isBlackWhiteGray(hex)) {
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
    }
  }

  // Sort by frequency, take top 6
  return [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([color]) => color);
}

function normalizeHex(hex: string): string | null {
  hex = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{8}$/.test(hex)) return hex.slice(0, 7);
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function extractHexFromValue(value: string): string | null {
  const hexMatch = value.match(/#([0-9a-fA-F]{3,6})\b/);
  if (hexMatch) return normalizeHex(hexMatch[0]);

  const rgbMatch = value.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) return rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));

  // Handle hsl
  const hslMatch = value.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    const [, h, s, l] = hslMatch.map(Number);
    return hslToHex(h, s, l);
  }

  return null;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isBlackWhiteGray(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
  if (maxDiff < 15) return true;
  if (r + g + b < 30 || r + g + b > 735) return true;

  return false;
}
