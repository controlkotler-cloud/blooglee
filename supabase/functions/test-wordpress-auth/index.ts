const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface TestAuthRequest {
  url: string;
  username: string;
  app_password: string;
}

interface TestAuthResponse {
  authenticated: boolean;
  can_publish: boolean;
  user_role: string;
  site_title: string;
  error_type?: 'auth_failed' | 'no_permissions' | 'timeout';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, username, app_password } = await req.json() as TestAuthRequest;

    if (!url || !username || !app_password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: url, username, app_password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedUrl = url.replace(/\/+$/, '');
    const credentials = btoa(`${username}:${app_password}`);

    // Build list of base URLs to try: original URL + root origin as fallback
    const urlsToTry = [normalizedUrl];
    try {
      const origin = new URL(normalizedUrl).origin;
      if (origin !== normalizedUrl) {
        urlsToTry.push(origin);
      }
    } catch { /* ignore */ }

    // Test authentication with /wp-json/wp/v2/users/me
    let meResponse: Response | null = null;
    let usedBaseUrl = normalizedUrl;

    for (const baseUrl of urlsToTry) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${baseUrl}/wp-json/wp/v2/users/me?context=edit`, {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'User-Agent': 'Blooglee/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // If we get a non-404 response, use it
        if (res.status !== 404) {
          meResponse = res;
          usedBaseUrl = baseUrl;
          break;
        }

        // If 404, consume body and try next URL
        await res.text();
        console.log(`[test-wordpress-auth] 404 at ${baseUrl}/wp-json/..., trying next`);
      } catch (err) {
        console.error(`[test-wordpress-auth] Fetch error for ${baseUrl}:`, err);
      }
    }

    if (!meResponse) {
      const result: TestAuthResponse = {
        authenticated: false,
        can_publish: false,
        user_role: '',
        site_title: '',
        error_type: 'timeout',
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (meResponse.status === 401 || meResponse.status === 403) {
      const result: TestAuthResponse = {
        authenticated: false,
        can_publish: false,
        user_role: '',
        site_title: '',
        error_type: 'auth_failed',
      };
      await meResponse.text();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!meResponse.ok) {
      const body = await meResponse.text();
      console.error('[test-wordpress-auth] Unexpected status:', meResponse.status, body.substring(0, 300));
      const result: TestAuthResponse = {
        authenticated: false,
        can_publish: false,
        user_role: '',
        site_title: '',
        error_type: 'auth_failed',
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userData = await meResponse.json();

    const roles: string[] = userData.roles ?? [];
    const capabilities: Record<string, boolean> = userData.capabilities ?? {};
    const userRole = roles[0] ?? 'unknown';

    const canPublish = !!(capabilities.publish_posts || capabilities.edit_posts);

    // Get site title
    let siteTitle = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const rootRes = await fetch(`${usedBaseUrl}/wp-json/`, {
        headers: { 'User-Agent': 'Blooglee/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (rootRes.ok) {
        const rootData = await rootRes.json();
        siteTitle = rootData.name ?? '';
      } else {
        await rootRes.text();
      }
    } catch {
      // Non-critical
    }

    if (!canPublish) {
      const result: TestAuthResponse = {
        authenticated: true,
        can_publish: false,
        user_role: userRole,
        site_title: siteTitle,
        error_type: 'no_permissions',
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result: TestAuthResponse = {
      authenticated: true,
      can_publish: true,
      user_role: userRole,
      site_title: siteTitle,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[test-wordpress-auth] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
