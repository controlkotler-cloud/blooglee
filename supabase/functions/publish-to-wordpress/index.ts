import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  farmacia_id: string;
  title: string;
  content: string;
  slug: string;
  status: 'publish' | 'draft' | 'future';
  date?: string; // ISO 8601 format
  image_url?: string;
  image_alt?: string;
  meta_description?: string; // For Yoast SEO
  lang?: 'es' | 'ca'; // For Polylang integration
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { farmacia_id, title, content, slug, status, date, image_url, image_alt, meta_description, lang } = await req.json() as PublishRequest;

    console.log(`[publish-to-wordpress] Starting publication for farmacia: ${farmacia_id}`);
    console.log(`[publish-to-wordpress] Title: ${title}`);
    console.log(`[publish-to-wordpress] Status: ${status}, Date: ${date || 'now'}`);

    // Validate required fields
    if (!farmacia_id || !title || !content || !slug || !status) {
      console.error('[publish-to-wordpress] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: farmacia_id, title, content, slug, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get WordPress credentials from database
    console.log('[publish-to-wordpress] Fetching WordPress credentials...');
    const { data: wpSite, error: wpError } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('farmacia_id', farmacia_id)
      .maybeSingle();

    if (wpError) {
      console.error('[publish-to-wordpress] Database error:', wpError);
      return new Response(
        JSON.stringify({ error: `Database error: ${wpError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wpSite) {
      console.error('[publish-to-wordpress] No WordPress site configured for this farmacia');
      return new Response(
        JSON.stringify({ error: 'No WordPress site configured for this farmacia' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[publish-to-wordpress] Found WordPress site: ${wpSite.site_url}`);

    // Create Basic Auth header
    const credentials = btoa(`${wpSite.wp_username}:${wpSite.wp_app_password}`);
    const authHeader = `Basic ${credentials}`;

    // Upload featured image if provided
    let featuredMediaId: number | null = null;
    if (image_url) {
      console.log('[publish-to-wordpress] Uploading featured image...');
      
      try {
        // Call the upload-wordpress-media function
        const uploadResponse = await fetch(`${supabaseUrl}/functions/v1/upload-wordpress-media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            site_url: wpSite.site_url,
            wp_username: wpSite.wp_username,
            wp_app_password: wpSite.wp_app_password,
            image_url,
            image_alt: image_alt || title,
            image_title: title,
          }),
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          console.warn('[publish-to-wordpress] Image upload failed, continuing without featured image:', uploadResult);
        } else {
          featuredMediaId = uploadResult.media_id;
          console.log(`[publish-to-wordpress] Featured image uploaded, media ID: ${featuredMediaId}`);
        }
      } catch (uploadError) {
        console.warn('[publish-to-wordpress] Image upload error, continuing without featured image:', uploadError);
      }
    }

    // Determine final status
    let finalStatus = status;
    if (status === 'publish' && date) {
      const publishDate = new Date(date);
      const now = new Date();
      if (publishDate > now) {
        finalStatus = 'future';
        console.log(`[publish-to-wordpress] Future date detected, changing status to 'future'`);
      }
    }

    // Prepare post data
    const postData: Record<string, any> = {
      title,
      content,
      slug,
      status: finalStatus,
      // Language for Polylang (requires wp-rest-polylang plugin or custom REST registration)
      lang: lang || 'es',
      // Meta description for Yoast SEO (requires Yoast and REST API meta registration)
      meta: {
        _yoast_wpseo_metadesc: meta_description || '',
      },
    };

    if (date) {
      postData.date = date;
    }

    if (featuredMediaId) {
      postData.featured_media = featuredMediaId;
    }

    // Normalizar URL: quitar /wp-admin si el usuario lo incluyó por error
    const normalizedSiteUrl = wpSite.site_url
      .replace(/\/wp-admin\/?$/, '')
      .replace(/\/$/, '');
    
    // Publish to WordPress
    const wpApiUrl = `${normalizedSiteUrl}/wp-json/wp/v2/posts`;
    console.log(`[publish-to-wordpress] Publishing to WordPress: ${wpApiUrl}`);

    const wpResponse = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    // Leer respuesta como texto primero para mejor diagnóstico
    const responseText = await wpResponse.text();
    console.log(`[publish-to-wordpress] Response status: ${wpResponse.status}`);
    
    let wpResult;
    try {
      wpResult = JSON.parse(responseText);
    } catch {
      console.error('[publish-to-wordpress] Response is not valid JSON:', responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ 
          error: 'WordPress returned an invalid response. Check if the site URL is correct and the REST API is enabled.',
          details: responseText.substring(0, 200)
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wpResponse.ok) {
      console.error('[publish-to-wordpress] WordPress API error:', wpResult);
      return new Response(
        JSON.stringify({ 
          error: wpResult.message || 'Failed to publish to WordPress',
          code: wpResult.code,
          details: wpResult
        }),
        { status: wpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[publish-to-wordpress] Publication successful! Post ID: ${wpResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        post_id: wpResult.id,
        post_url: wpResult.link,
        status: wpResult.status,
        date: wpResult.date,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    console.error('[publish-to-wordpress] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
