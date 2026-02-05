import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  farmacia_id?: string;
  empresa_id?: string;
  title: string;
  content: string;
  slug: string;
  status: 'publish' | 'draft' | 'future';
  date?: string; // ISO 8601 format
  image_url?: string;
  image_alt?: string;
  meta_description?: string; // For Yoast SEO
  seo_title?: string; // For Yoast SEO (custom title)
  focus_keyword?: string; // For Yoast SEO
  excerpt?: string; // Native WP excerpt (Yoast fallback for meta desc)
  lang?: 'es' | 'ca'; // For Polylang integration
  category_ids?: number[]; // WordPress category IDs
  tag_ids?: number[]; // WordPress tag IDs
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { farmacia_id, empresa_id, title, content, slug, status, date, image_url, image_alt, meta_description, seo_title, focus_keyword, excerpt, lang, category_ids, tag_ids } = await req.json() as PublishRequest;

    const entityId = farmacia_id || empresa_id;
    const entityType = farmacia_id ? 'farmacia' : 'empresa';
    
    console.log(`[publish-to-wordpress] Starting publication for ${entityType}: ${entityId}`);
    console.log(`[publish-to-wordpress] Title: ${title}`);
    console.log(`[publish-to-wordpress] Status: ${status}, Date: ${date || 'now'}`);
    console.log(`[publish-to-wordpress] Categories: ${category_ids?.join(',') || 'none'}, Tags: ${tag_ids?.join(',') || 'none'}`);
    console.log(`[publish-to-wordpress] SEO: seo_title=${!!seo_title}, focus_keyword=${!!focus_keyword}, excerpt=${!!excerpt}`);

    // Validate required fields
    if ((!farmacia_id && !empresa_id) || !title || !content || !slug || !status) {
      console.error('[publish-to-wordpress] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: farmacia_id or empresa_id, title, content, slug, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get WordPress credentials from database - check both farmacia_id and empresa_id
    console.log('[publish-to-wordpress] Fetching WordPress credentials...');
    
    let wpSite = null;
    let wpError = null;
    
    if (farmacia_id) {
      const result = await supabase
        .from('wordpress_sites')
        .select('*')
        .eq('farmacia_id', farmacia_id)
        .maybeSingle();
      wpSite = result.data;
      wpError = result.error;
    } else if (empresa_id) {
      const result = await supabase
        .from('wordpress_sites')
        .select('*')
        .eq('empresa_id', empresa_id)
        .maybeSingle();
      wpSite = result.data;
      wpError = result.error;
    }

    if (wpError) {
      console.error('[publish-to-wordpress] Database error:', wpError);
      return new Response(
        JSON.stringify({ error: `Database error: ${wpError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wpSite) {
      console.error(`[publish-to-wordpress] No WordPress site configured for this ${entityType}`);
      return new Response(
        JSON.stringify({ error: `No WordPress site configured for this ${entityType}` }),
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
      // Native WordPress excerpt (works without plugins, Yoast uses as fallback)
      excerpt: excerpt || meta_description?.substring(0, 160) || '',
      // Language for Polylang (requires wp-rest-polylang plugin or custom REST registration)
      lang: lang || 'es',
      // Categories and tags (arrays of WordPress IDs)
      categories: category_ids && category_ids.length > 0 ? category_ids : [],
      tags: tag_ids && tag_ids.length > 0 ? tag_ids : [],
    };

    // Yoast SEO meta fields (require PHP snippet in WP functions.php to enable via REST API)
    const yoastMeta: Record<string, string> = {};
    
    if (meta_description) {
      yoastMeta._yoast_wpseo_metadesc = meta_description.substring(0, 160);
    }
    if (seo_title) {
      yoastMeta._yoast_wpseo_title = seo_title.substring(0, 60);
    }
    if (focus_keyword) {
      yoastMeta._yoast_wpseo_focuskw = focus_keyword;
    }
    
    if (Object.keys(yoastMeta).length > 0) {
      postData.meta = yoastMeta;
    }

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
