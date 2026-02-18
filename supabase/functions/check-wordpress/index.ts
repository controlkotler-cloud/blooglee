const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

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
    let wpV2Response: Response | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      wpV2Response = await fetch(`${siteUrl}/wp-json/wp/v2/`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Blooglee/1.0' },
        redirect: 'follow',
      });

      clearTimeout(timeout);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('abort') || errMsg.includes('timed out')) {
        result.error_type = 'timeout';
      } else {
        result.error_type = 'not_found';
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Detect plugins from headers
    const poweredBy = wpV2Response.headers.get('x-powered-by') ?? '';
    const linkHeader = wpV2Response.headers.get('link') ?? '';
    const serverHeader = wpV2Response.headers.get('server') ?? '';

    if (poweredBy.toLowerCase().includes('wp') || poweredBy.toLowerCase().includes('wordpress')) {
      result.detected_plugins.push('WordPress Core');
    }
    if (linkHeader.includes('wp-json')) {
      result.detected_plugins.push('REST API');
    }

    // Check common security plugin headers
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
      // API exists but restricted
      result.is_wordpress = true;
      result.api_rest_active = false;
      result.error_type = 'api_disabled';
    } else {
      // Try root wp-json to confirm WordPress
      result.error_type = 'not_wordpress';
    }

    // 2. Fetch site info from /wp-json/
    try {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 10000);

      const rootResponse = await fetch(`${siteUrl}/wp-json/`, {
        signal: controller2.signal,
        headers: { 'User-Agent': 'Blooglee/1.0' },
        redirect: 'follow',
      });
      clearTimeout(timeout2);

      if (rootResponse.ok) {
        result.is_wordpress = true;
        const rootData = await rootResponse.json();
        result.site_name = rootData.name ?? '';
        result.permalink_structure = rootData.url ?? '';

        // Detect plugins from namespaces
        const namespaces: string[] = rootData.namespaces ?? [];
        if (namespaces.includes('yoast/v1') || namespaces.includes('yoast')) {
          result.detected_plugins.push('Yoast SEO');
        }
        if (namespaces.includes('rankmath/v1')) {
          result.detected_plugins.push('Rank Math');
        }
        if (namespaces.includes('wc/v3') || namespaces.includes('wc/v2')) {
          result.detected_plugins.push('WooCommerce');
        }
        if (namespaces.includes('jetpack/v4')) {
          result.detected_plugins.push('Jetpack');
        }
        if (namespaces.includes('polylang/v1')) {
          result.detected_plugins.push('Polylang');
        }
        if (namespaces.includes('wpml/v1')) {
          result.detected_plugins.push('WPML');
        }

        if (!result.api_rest_active && namespaces.includes('wp/v2')) {
          result.api_rest_active = true;
          result.error_type = null;
        }
      } else {
        await rootResponse.text(); // consume body
      }
    } catch {
      // Root endpoint failed, but we already have v2 results
    }

    // Deduplicate plugins
    result.detected_plugins = [...new Set(result.detected_plugins)];

    return new Response(JSON.stringify(result), {
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
