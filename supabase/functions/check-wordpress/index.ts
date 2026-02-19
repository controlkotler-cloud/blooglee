const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/** Extract the origin (scheme + host) from a URL string */
function getOrigin(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.origin;
  } catch {
    return urlStr;
  }
}

/** Try fetching a URL with a timeout, returning the Response or null */
async function safeFetch(url: string, timeoutMs = 10000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Blooglee/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return res;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ is_wordpress: false, error_type: 'not_found', error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize URL
    let siteUrl = url.trim().replace(/\/+$/, '');
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`;
    }

    // Build candidate URLs to check: the given URL + origin (if different)
    const origin = getOrigin(siteUrl);
    const candidates: string[] = [siteUrl];
    if (origin !== siteUrl) {
      candidates.push(origin);
    }

    console.log('Checking WordPress candidates:', candidates);

    for (const candidate of candidates) {
      const checkResult = await checkWordPress(candidate);
      if (checkResult.is_wordpress) {
        console.log('WordPress detected at:', candidate);
        return new Response(JSON.stringify(checkResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // None matched — return the result from the first candidate
    const fallbackResult = await checkWordPress(candidates[0]);
    return new Response(JSON.stringify(fallbackResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ is_wordpress: false, error_type: 'not_found', error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkWordPress(siteUrl: string) {
  const result = {
    is_wordpress: false,
    api_rest_active: false,
    ssl_valid: siteUrl.startsWith('https'),
    detected_plugins: [] as string[],
    site_name: '',
    permalink_structure: '',
    error_type: null as string | null,
  };

  // 1. Check WP REST API v2 endpoint
  const wpV2Response = await safeFetch(`${siteUrl}/wp-json/wp/v2/`);

  if (!wpV2Response) {
    result.error_type = 'timeout';
    return result;
  }

  // Detect plugins from headers
  const poweredBy = wpV2Response.headers.get('x-powered-by') ?? '';
  const linkHeader = wpV2Response.headers.get('link') ?? '';

  if (poweredBy.toLowerCase().includes('wp') || poweredBy.toLowerCase().includes('wordpress')) {
    result.detected_plugins.push('WordPress Core');
  }
  if (linkHeader.includes('wp-json')) {
    result.detected_plugins.push('REST API');
  }

  const allHeaders = Object.fromEntries(wpV2Response.headers.entries());
  for (const [key, value] of Object.entries(allHeaders)) {
    const lower = `${key}:${value}`.toLowerCase();
    if (lower.includes('wordfence')) result.detected_plugins.push('Wordfence');
    if (lower.includes('sucuri')) result.detected_plugins.push('Sucuri');
    if (lower.includes('ithemes')) result.detected_plugins.push('iThemes Security');
    if (lower.includes('cloudflare')) result.detected_plugins.push('Cloudflare');
  }

  if (wpV2Response.ok) {
    result.is_wordpress = true;
    result.api_rest_active = true;
  } else if (wpV2Response.status === 401 || wpV2Response.status === 403) {
    result.is_wordpress = true;
    result.api_rest_active = false;
    result.error_type = 'api_disabled';
  } else {
    result.error_type = 'not_wordpress';
  }

  // 2. Fetch site info from /wp-json/
  try {
    const rootResponse = await safeFetch(`${siteUrl}/wp-json/`);

    if (rootResponse?.ok) {
      result.is_wordpress = true;
      const rootData = await rootResponse.json();
      result.site_name = rootData.name ?? '';
      result.permalink_structure = rootData.url ?? '';

      const namespaces: string[] = rootData.namespaces ?? [];
      if (namespaces.includes('yoast/v1') || namespaces.includes('yoast')) {
        result.detected_plugins.push('Yoast SEO');
      }
      if (namespaces.includes('rankmath/v1')) result.detected_plugins.push('Rank Math');
      if (namespaces.includes('wc/v3') || namespaces.includes('wc/v2')) result.detected_plugins.push('WooCommerce');
      if (namespaces.includes('jetpack/v4')) result.detected_plugins.push('Jetpack');
      if (namespaces.includes('polylang/v1')) result.detected_plugins.push('Polylang');
      if (namespaces.includes('wpml/v1')) result.detected_plugins.push('WPML');

      if (!result.api_rest_active && namespaces.includes('wp/v2')) {
        result.api_rest_active = true;
        result.error_type = null;
      }
    } else {
      await rootResponse?.text();
    }
  } catch {
    // Root endpoint failed
  }

  result.detected_plugins = [...new Set(result.detected_plugins)];
  return result;
}
