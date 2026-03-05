const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

import { createClient } from "npm:@supabase/supabase-js@2";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function extractHexFromUnknownColor(value: unknown): string | null {
  if (typeof value === 'string') {
    return extractHexFromValue(value);
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const obj = value as Record<string, unknown>;

  // Common color object shapes from scrapers/providers.
  const directCandidates = [obj.hex, obj.value, obj.color, obj.primary, obj.secondary, obj.accent];
  for (const candidate of directCandidates) {
    if (typeof candidate === 'string') {
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
  if (nestedRgb && typeof nestedRgb === 'object') {
    return extractHexFromUnknownColor(nestedRgb);
  }

  return null;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function canPersistForSite(siteId: string, accessToken: string | null): Promise<boolean> {
  if (!accessToken) {
    console.warn('[extract] No access token provided; skipping persistence for site_id');
    return false;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[extract] Missing Supabase env vars; cannot validate site ownership');
    return false;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user?.id) {
    console.warn('[extract] Invalid auth token for site persistence:', authError?.message || 'unknown');
    return false;
  }

  const { data: ownedSite, error: siteError } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (siteError) {
    console.warn('[extract] Ownership check failed:', siteError.message);
    return false;
  }

  return Boolean(ownedSite);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, site_id } = await req.json();
    const normalizedSiteId = typeof site_id === 'string' && site_id.trim().length > 0 ? site_id.trim() : null;
    const accessToken = getBearerToken(req);

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('[extract] Starting extraction for:', formattedUrl, 'site_id:', normalizedSiteId || '(preview mode)');

    let html = '';

    // === STRATEGY 1: Try Firecrawl with branding format for accurate colors ===
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    let brandingData: unknown = null;
    
    if (firecrawlKey) {
      // 1a. Try branding format first (extracts colors from logo/header accurately)
      try {
        console.log('[extract] Trying Firecrawl branding format...');
        const brandingResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ['branding', 'html'],
            onlyMainContent: false,
            waitFor: 3000,
          }),
        });

        const brandingResult = await brandingResponse.json();

        if (brandingResponse.ok && brandingResult.success) {
          brandingData = brandingResult.data?.branding || brandingResult.branding || null;
          html = brandingResult.data?.html || brandingResult.html || '';
          console.log('[extract] Firecrawl OK, HTML length:', html.length, 'branding:', !!brandingData);
          if (brandingData?.colors) {
            console.log('[extract] Branding colors:', JSON.stringify(brandingData.colors));
          }
        } else {
          console.warn('[extract] Firecrawl branding failed:', brandingResult.error || brandingResult.code || 'unknown');
        }
      } catch (err) {
        console.warn('[extract] Firecrawl branding error:', getErrorMessage(err));
      }

      // 1b. If branding didn't return HTML, try plain HTML scrape
      if (!html && firecrawlKey) {
        try {
          console.log('[extract] Trying Firecrawl HTML-only fallback...');
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: formattedUrl,
              formats: ['html'],
              onlyMainContent: false,
              waitFor: 3000,
            }),
          });

          const scrapeData = await scrapeResponse.json();
          if (scrapeResponse.ok && scrapeData.success) {
            html = scrapeData.data?.html || scrapeData.html || '';
            console.log('[extract] Firecrawl HTML fallback OK, length:', html.length);
          }
        } catch (err) {
          console.warn('[extract] Firecrawl HTML fallback error:', getErrorMessage(err));
        }
      }
    } else {
      console.log('[extract] No FIRECRAWL_API_KEY, skipping Firecrawl');
    }

    // === STRATEGY 2: Direct fetch fallback ===
    if (!html) {
      try {
        console.log('[extract] Trying direct fetch...');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(formattedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          },
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeout);

        if (response.ok) {
          html = await response.text();
          console.log('[extract] Direct fetch OK, HTML length:', html.length);
        } else {
          console.warn('[extract] Direct fetch failed with status:', response.status);
        }
      } catch (err) {
        console.warn('[extract] Direct fetch error:', getErrorMessage(err));
      }
    }

    // === STRATEGY 2b: Also fetch external stylesheets for better color extraction ===
    let externalCss = '';
    if (html) {
      try {
        const stylesheetUrls = extractStylesheetUrls(html, formattedUrl);
        console.log('[extract] Found', stylesheetUrls.length, 'external stylesheets');

        // Fetch up to 3 stylesheets
        const fetches = stylesheetUrls.slice(0, 3).map(async (cssUrl) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(cssUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Blooglee/1.0)' },
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              const text = await res.text();
              return text.substring(0, 50000); // Limit to 50KB per stylesheet
            }
            return '';
          } catch {
            return '';
          }
        });

        const cssResults = await Promise.all(fetches);
        externalCss = cssResults.join('\n');
        if (externalCss) {
          console.log('[extract] External CSS total length:', externalCss.length);
        }
      } catch (err) {
        console.warn('[extract] Error fetching stylesheets:', getErrorMessage(err));
      }
    }

    // === EXTRACT DATA ===
    // Priority 1: Use Firecrawl branding colors (most accurate - from logo/header)
    let colors: string[] = [];
    if (brandingData?.colors) {
      const brandColors = brandingData.colors;
      const colorValues: unknown[] = Array.isArray(brandColors)
        ? brandColors
        : [
            brandColors.primary,
            brandColors.secondary,
            brandColors.accent,
            brandColors.background,
            brandColors.textPrimary,
            brandColors.textSecondary,
          ];
      const brandingSet = new Set<string>();

      for (const colorVal of colorValues) {
        const hex = extractHexFromUnknownColor(colorVal);
        if (hex && !isBlackWhiteGray(hex)) {
          brandingSet.add(hex);
        }
      }
      colors = [...brandingSet];
      console.log('[extract] Branding colors extracted:', colors.length, colors.join(', '));
    }
    
    // Priority 2: Fall back to CSS parsing if branding didn't yield enough colors
    if (colors.length < 3 && html) {
      const combinedContent = html + '\n' + externalCss;
      const cssColors = extractColorsFromHtml(combinedContent);
      // Merge, avoiding duplicates
      for (const c of cssColors) {
        if (!colors.includes(c)) colors.push(c);
      }
      colors = colors.slice(0, 6);
    }
    
    let description = html ? extractDescription(html) : undefined;
    const socialLink = html ? extractSocialLink(html) : undefined;
    const blogUrl = html ? extractBlogUrl(html, formattedUrl) : undefined;
    let keywords = html ? extractKeywords(html) : undefined;

    // === AI ENRICHMENT: generate description/keywords if meta tags were missing ===
    if (html && (!description || !keywords)) {
      try {
        console.log('[extract] Meta tags missing (description:', !!description, ', keywords:', !!keywords, ') — using AI');
        const aiResult = await extractWithAI(html, formattedUrl, !description, !keywords);
        if (!description && aiResult.description) {
          description = aiResult.description;
          console.log('[extract] AI description:', description?.substring(0, 80));
        }
        if (!keywords && aiResult.keywords) {
          keywords = aiResult.keywords;
          console.log('[extract] AI keywords:', keywords?.substring(0, 80));
        }
      } catch (err) {
        console.warn('[extract] AI enrichment failed:', getErrorMessage(err));
      }
    }

    console.log('[extract] Results — colors:', colors.length, 'description:', !!description, 'social:', !!socialLink, 'blog:', !!blogUrl, 'keywords:', !!keywords);
    if (colors.length > 0) console.log('[extract] Colors:', colors.join(', '));

    // Save to database only when site_id exists (post-site-creation mode).
    // In onboarding preview mode we only return extracted data to prefill fields.
    if (normalizedSiteId) {
      const canPersist = await canPersistForSite(normalizedSiteId, accessToken);
      if (canPersist) {
        await saveData(normalizedSiteId, { colors, description, socialLink, blogUrl, keywords });
      } else {
        console.warn('[extract] site_id provided but ownership validation failed; skipping persistence');
      }
    } else {
      console.log('[extract] Preview mode: skipping database save (no site_id provided)');
    }

    return new Response(
      JSON.stringify({
        success: true,
        colors,
        description,
        social_link: socialLink,
        blog_url: blogUrl,
        keywords,
        source: colors.length > 0 ? (firecrawlKey ? 'firecrawl' : 'direct') : 'none',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[extract] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =========================================
// STYLESHEET URL EXTRACTION
// =========================================

function extractStylesheetUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  const linkRegex2 = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;

  let match;
  for (const regex of [linkRegex, linkRegex2]) {
    while ((match = regex.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith('//')) href = 'https:' + href;
      else if (href.startsWith('/')) {
        try {
          const base = new URL(baseUrl);
          href = `${base.protocol}//${base.hostname}${href}`;
        } catch { continue; }
      } else if (!href.startsWith('http')) {
        try {
          href = new URL(href, baseUrl).href;
        } catch { continue; }
      }
      // Skip CDN fonts, icons, etc.
      if (!href.includes('fonts.googleapis') && !href.includes('font-awesome') && !href.includes('icons')) {
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
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Read current values to avoid overwriting user edits
  const { data: site } = await supabase
    .from('sites')
    .select('description, instagram_url, blog_url, custom_topic')
    .eq('id', siteId)
    .single();

  const update: Record<string, unknown> = {};

  // Colors: always update (this is the primary purpose)
  // Use a special marker prefix so polling can distinguish "extracted empty" from "default value"
  if (data.colors.length > 0) {
    update.color_palette = data.colors.join(',');
  } else {
    // Mark as "extracted but empty" so polling knows extraction is done
    update.color_palette = 'extracted:';
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
    console.log('[extract] Overwriting blog_url with extracted blog path:', data.blogUrl);
  }

  // Keywords → custom_topic
  if (data.keywords && !site?.custom_topic) {
    update.custom_topic = data.keywords;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from('sites')
      .update(update)
      .eq('id', siteId);

    if (error) {
      console.error('[extract] Error saving data:', error);
    } else {
      console.log('[extract] Saved:', Object.keys(update).join(', '));
    }
  }
}

// =========================================
// AI-POWERED EXTRACTION (Gemini Flash)
// =========================================

async function extractWithAI(
  html: string,
  url: string,
  needsDescription: boolean,
  needsKeywords: boolean,
): Promise<{ description?: string; keywords?: string }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.warn('[extract] No LOVABLE_API_KEY, skipping AI enrichment');
    return {};
  }

  // Strip scripts/styles and take a reasonable chunk of visible text
  const visibleText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 6000);

  if (visibleText.length < 50) return {};

  const parts: string[] = [];
  if (needsDescription) {
    parts.push('"description": una frase de 1-2 líneas que resuma qué hace este negocio, su sector y su propuesta de valor. Máximo 200 caracteres. En español.');
  }
  if (needsKeywords) {
    parts.push('"keywords": entre 3 y 8 palabras clave del negocio separadas por comas, en español. Deben ser términos que describan el sector, los servicios o productos principales. NO incluyas nombres de ciudades, localidades, direcciones ni ubicaciones geográficas.');
  }

  const prompt = `Analiza el contenido de esta web (${url}) y extrae la siguiente información en formato JSON:

{
  ${parts.join(',\n  ')}
}

Contenido de la web:
${visibleText}

Responde SOLO con el JSON, sin markdown ni explicaciones.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.warn('[extract] AI response status:', response.status);
    return {};
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response (strip fences if present)
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      description: typeof parsed.description === 'string' ? parsed.description.substring(0, 250) : undefined,
      keywords: typeof parsed.keywords === 'string' ? parsed.keywords.substring(0, 300) : undefined,
    };
  } catch {
    console.warn('[extract] Failed to parse AI JSON:', cleaned.substring(0, 100));
    return {};
  }
}

// =========================================
// EXTRACTION FUNCTIONS
// =========================================

function extractDescription(html: string): string | undefined {
  // Try meta description first, then og:description
  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  if (metaMatch?.[1]?.trim()) return metaMatch[1].trim();

  const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i);
  if (ogMatch?.[1]?.trim()) return ogMatch[1].trim();

  return undefined;
}

function extractSocialLink(html: string): string | undefined {
  const socialPatterns = [
    /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?twitter\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?x\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"'\s>]+)["']/gi,
  ];

  for (const pattern of socialPatterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      return match[1].split('?')[0].replace(/\/+$/, '');
    }
  }
  return undefined;
}

function extractBlogUrl(html: string, siteUrl: string): string | undefined {
  let siteDomain: string;
  try {
    siteDomain = new URL(siteUrl).hostname;
  } catch {
    return undefined;
  }

  const blogPatterns = ['/blog', '/noticias', '/news', '/articles', '/magazine', '/actualidad', '/recursos'];
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
            return `${linkUrl.protocol}//${linkUrl.hostname}${linkUrl.pathname}`.replace(/\/+$/, '');
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
          return `${base.protocol}//${base.hostname}${match[1]}`.replace(/\/+$/, '');
        } catch { continue; }
      }
    }
  }

  return undefined;
}

function extractKeywords(html: string): string | undefined {
  const match = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i);
  if (match?.[1]?.trim()) return match[1].trim();
  return undefined;
}

// =========================================
// COLOR EXTRACTION
// =========================================

function extractColorsFromHtml(html: string): string[] {
  const colorMap = new Map<string, number>();

  // 1. CSS custom properties (highest weight)
  const cssVarRegex = /--(?:primary|brand|accent|main|theme|secondary|highlight|color-primary|color-secondary|color-accent)[^:]*:\s*([^;]+)/gi;
  let match;
  while ((match = cssVarRegex.exec(html)) !== null) {
    const value = match[1].trim();
    const hex = extractHexFromValue(value);
    if (hex && !isBlackWhiteGray(hex)) {
      colorMap.set(hex, (colorMap.get(hex) || 0) + 20);
    }
  }

  // 2. Colors from key CSS selectors (high weight)
  const importantSelectors = /(?:body|header|nav|\.header|\.nav|\.navbar|\.cta|\.btn-primary|\.btn|button|a:hover|h1|h2)\s*\{[^}]*\}/gi;
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
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
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
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isBlackWhiteGray(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
  if (maxDiff < 15) return true;
  if ((r + g + b) < 30 || (r + g + b) > 735) return true;

  return false;
}
