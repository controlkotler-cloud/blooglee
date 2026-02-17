import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const METRICOOL_API_BASE = 'https://app.metricool.com/api';

// Map our platform names to Metricool network names
const platformToNetwork: Record<string, string> = {
  instagram: 'instagram',
  linkedin: 'linkedin',
  facebook: 'facebook',
  tiktok: 'tiktok',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check superadmin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['superadmin', 'admin'])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { socialContentId, scheduledDate, scheduledTimezone } = await req.json();

    if (!socialContentId) {
      return new Response(JSON.stringify({ error: 'socialContentId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the social content item
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('social_content')
      .select('*')
      .eq('id', socialContentId)
      .single();

    if (fetchError || !item) {
      return new Response(JSON.stringify({ error: 'Social content not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metricoolToken = Deno.env.get('METRICOOL_USER_TOKEN');
    const metricoolUserId = Deno.env.get('METRICOOL_USER_ID');
    const metricoolBlogId = Deno.env.get('METRICOOL_BLOG_ID');

    if (!metricoolToken || !metricoolUserId || !metricoolBlogId) {
      return new Response(JSON.stringify({ error: 'Metricool credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const network = platformToNetwork[item.platform];
    if (!network) {
      return new Response(JSON.stringify({ error: `Unsupported platform: ${item.platform}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the publication date - default to 1 hour from now if not specified
    const now = new Date();
    const publishDate = scheduledDate 
      ? new Date(scheduledDate) 
      : new Date(now.getTime() + 60 * 60 * 1000);
    
    const timezone = scheduledTimezone || 'Europe/Madrid';

    // Format datetime for Metricool in the target timezone
    const formatInTimezone = (d: Date, tz: string) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).formatToParts(d);
      const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
      return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:00`;
    };

    // Build provider-specific config
    const provider: Record<string, any> = { network };

    // Build the Metricool post body
    const postBody: Record<string, any> = {
      publicationDate: {
        dateTime: formatInTimezone(publishDate, timezone),
        timezone,
      },
      creationDate: {
        dateTime: formatInTimezone(now, timezone),
        timezone,
      },
      text: item.content,
      firstCommentText: '',
      providers: [provider],
      autoPublish: true,
      saveExternalMediaFiles: true,
      shortener: false,
      draft: false,
      hasNotReadNotes: false,
    };

    // Add platform-specific data
    if (network === 'facebook') {
      postBody.facebookData = { type: 'POST' };
    }
    if (network === 'instagram') {
      postBody.instagramData = { autoPublish: true, type: 'POST' };
    }
    if (network === 'linkedin') {
      postBody.linkedinData = { type: 'POST' };
    }
    if (network === 'tiktok') {
      postBody.tiktokData = {};
    }

    // Add media if available
    if (item.image_url) {
      postBody.media = [{
        url: item.image_url,
        type: 'IMAGE',
      }];
    }

    console.log(`[schedule-metricool-post] Scheduling ${network} post for ${formatInTimezone(publishDate, timezone)} ${timezone}`);
    console.log(`[schedule-metricool-post] Post body:`, JSON.stringify(postBody).substring(0, 500));

    // Call Metricool API
    const metricoolUrl = `${METRICOOL_API_BASE}/v2/scheduler/posts?blogId=${metricoolBlogId}&userId=${metricoolUserId}`;

    const metricoolResponse = await fetch(metricoolUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mc-Auth': metricoolToken,
      },
      body: JSON.stringify(postBody),
    });

    const responseText = await metricoolResponse.text();
    console.log(`[schedule-metricool-post] Metricool response status: ${metricoolResponse.status}`);
    console.log(`[schedule-metricool-post] Metricool response: ${responseText.substring(0, 500)}`);

    let metricoolResult;
    try {
      metricoolResult = JSON.parse(responseText);
    } catch {
      metricoolResult = { raw: responseText };
    }

    if (!metricoolResponse.ok) {
      return new Response(JSON.stringify({ 
        error: 'Metricool API error', 
        status: metricoolResponse.status,
        details: metricoolResult 
      }), {
        status: metricoolResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update social_content status and metricool_post_id
    const metricoolPostId = metricoolResult?.id || metricoolResult?.postId || null;
    
    await supabaseAdmin
      .from('social_content')
      .update({
        status: 'scheduled',
        scheduled_for: publishDate.toISOString(),
        metricool_post_id: metricoolPostId ? String(metricoolPostId) : null,
      })
      .eq('id', socialContentId);

    console.log(`[schedule-metricool-post] Success! Post scheduled on ${network}`);

    return new Response(JSON.stringify({
      success: true,
      platform: network,
      scheduled_for: publishDate.toISOString(),
      metricool_post_id: metricoolPostId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[schedule-metricool-post] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
