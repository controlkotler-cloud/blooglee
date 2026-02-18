const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, site_id } = await req.json();

    if (!url || !site_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'url and site_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: true, colors: [], source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Extracting data from:', formattedUrl);

    // Scrape with Firecrawl - get HTML to parse CSS colors + meta tags
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

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl scrape failed:', scrapeData);
      await saveData(site_id, { colors: [] });
      return new Response(
        JSON.stringify({ success: true, colors: [], source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.html || scrapeData.html || '';

    // Extract all data from HTML
    const colors = extractColorsFromHtml(html);
    const description = extractDescription(html);
    const socialLink = extractSocialLink(html);
    const blogUrl = extractBlogUrl(html, formattedUrl);
    const keywords = extractKeywords(html);

    console.log('Extracted colors:', colors);
    console.log('Extracted description:', description?.substring(0, 80));
    console.log('Extracted social link:', socialLink);
    console.log('Extracted blog URL:', blogUrl);
    console.log('Extracted keywords:', keywords);

    // Save to database
    await saveData(site_id, { colors, description, socialLink, blogUrl, keywords });

    return new Response(
      JSON.stringify({
        success: true,
        colors,
        description,
        socialLink,
        blogUrl,
        keywords,
        source: colors.length > 0 ? 'firecrawl' : 'fallback',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting data:', error);
    return new Response(
      JSON.stringify({ success: true, colors: [], source: 'fallback' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

  // Build update object — only set fields that have values
  const update: Record<string, unknown> = {};

  // Store colors as comma-separated hex string
  if (data.colors.length > 0) {
    update.color_palette = data.colors.join(',');
  }

  // Description → description column
  if (data.description) {
    // Only set if not already filled (don't overwrite user edits)
    const { data: site } = await supabase
      .from('sites')
      .select('description, instagram_url, blog_url, custom_topic')
      .eq('id', siteId)
      .single();

    if (!site?.description) {
      update.description = data.description;
    }
    if (!site?.instagram_url && data.socialLink) {
      update.instagram_url = data.socialLink;
    }
    if (data.blogUrl && site?.blog_url) {
      // If user gave a generic URL but we found a specific blog URL, update it
      try {
        const userDomain = new URL(site.blog_url).hostname;
        const blogDomain = new URL(data.blogUrl).hostname;
        if (userDomain === blogDomain && data.blogUrl !== site.blog_url) {
          update.blog_url = data.blogUrl;
        }
      } catch {
        // ignore URL parsing errors
      }
    }
    if (!site?.custom_topic && data.keywords) {
      update.custom_topic = data.keywords;
    }
  } else {
    // No description found, still save other fields
    if (data.socialLink) {
      const { data: site } = await supabase
        .from('sites')
        .select('instagram_url')
        .eq('id', siteId)
        .single();
      if (!site?.instagram_url) {
        update.instagram_url = data.socialLink;
      }
    }
  }

  if (Object.keys(update).length === 0 && data.colors.length === 0) {
    // Nothing to update, but still mark color_palette as empty string so polling detects completion
    update.color_palette = '';
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from('sites')
      .update(update)
      .eq('id', siteId);

    if (error) {
      console.error('Error saving data:', error);
    } else {
      console.log('Saved extracted data:', Object.keys(update));
    }
  }
}

// =========================================
// EXTRACTION FUNCTIONS
// =========================================

function extractDescription(html: string): string | undefined {
  // Try og:description first, then meta description
  const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i);
  if (ogMatch?.[1]?.trim()) return ogMatch[1].trim();

  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  if (metaMatch?.[1]?.trim()) return metaMatch[1].trim();

  return undefined;
}

function extractSocialLink(html: string): string | undefined {
  // Priority order: Instagram, Facebook, LinkedIn, Twitter/X, TikTok
  const socialPatterns = [
    /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?twitter\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?x\.com\/[^"'\s>]+)["']/gi,
    /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/[^"'\s>]+)["']/gi,
  ];

  for (const pattern of socialPatterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      // Clean up: remove trailing slashes and query params
      let link = match[1].split('?')[0].replace(/\/+$/, '');
      return link;
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

  // Look for links containing blog-related paths on the same domain
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
            // Return the base blog URL (e.g., https://example.com/blog)
            const blogBase = `${linkUrl.protocol}//${linkUrl.hostname}${linkUrl.pathname}`.replace(/\/+$/, '');
            return blogBase;
          }
        }
      }
    } catch {
      continue;
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
// COLOR EXTRACTION (existing logic)
// =========================================

function extractColorsFromHtml(html: string): string[] {
  const colorMap = new Map<string, number>();

  // 1. Extract hex colors (#xxx and #xxxxxx)
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  let match;
  while ((match = hexRegex.exec(html)) !== null) {
    const hex = normalizeHex(match[0]);
    if (hex && !isBlackWhiteGray(hex)) {
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
  }

  // 2. Extract rgb/rgba colors
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

  // 3. Extract from CSS custom properties (higher weight)
  const cssVarRegex = /--(?:primary|brand|accent|main|theme|secondary|highlight)[^:]*:\s*([^;]+)/gi;
  while ((match = cssVarRegex.exec(html)) !== null) {
    const value = match[1].trim();
    const hexFromVar = extractHexFromValue(value);
    if (hexFromVar && !isBlackWhiteGray(hexFromVar)) {
      colorMap.set(hexFromVar, (colorMap.get(hexFromVar) || 0) + 10);
    }
  }

  // Sort by frequency and take top 6
  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([color]) => color);

  return sorted;
}

function normalizeHex(hex: string): string | null {
  hex = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(hex)) {
    return hex;
  }
  if (/^#[0-9a-f]{8}$/.test(hex)) {
    return hex.slice(0, 7);
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function extractHexFromValue(value: string): string | null {
  const hexMatch = value.match(/#([0-9a-fA-F]{3,6})\b/);
  if (hexMatch) return normalizeHex(hexMatch[0]);

  const rgbMatch = value.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) {
    return rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
  }
  return null;
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
