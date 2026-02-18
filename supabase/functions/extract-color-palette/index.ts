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

    console.log('Extracting colors from:', formattedUrl);

    // Scrape with Firecrawl - get HTML to parse CSS colors
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
      await savePalette(site_id, []);
      return new Response(
        JSON.stringify({ success: true, colors: [], source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = scrapeData.data?.html || scrapeData.html || '';

    // Extract colors from HTML/CSS
    const colors = extractColorsFromHtml(html);

    console.log('Extracted colors:', colors);

    // Save to database
    await savePalette(site_id, colors);

    return new Response(
      JSON.stringify({
        success: true,
        colors,
        source: colors.length > 0 ? 'firecrawl' : 'fallback',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting colors:', error);
    return new Response(
      JSON.stringify({ success: true, colors: [], source: 'fallback' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function savePalette(siteId: string, colors: string[]) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase
    .from('sites')
    .update({ color_palette: colors })
    .eq('id', siteId);

  if (error) {
    console.error('Error saving palette:', error);
  }
}

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
      colorMap.set(hexFromVar, (colorMap.get(hexFromVar) || 0) + 10); // Higher weight
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
    return hex.slice(0, 7); // Strip alpha
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

  // Check if very close to grayscale
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
  if (maxDiff < 15) {
    // It's grayscale - filter out unless mid-range
    return true;
  }

  // Filter pure white/black
  if ((r + g + b) < 30 || (r + g + b) > 735) return true;

  return false;
}
