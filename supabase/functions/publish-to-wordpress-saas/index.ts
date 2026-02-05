import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  site_id: string;
  title: string;
  seo_title?: string;
  content: string;
  slug: string;
  status: 'publish' | 'draft' | 'future';
  date?: string;
  image_url?: string;
  image_alt?: string;
  meta_description?: string;
  excerpt?: string;
  focus_keyword?: string;
  lang?: 'es' | 'ca';
  category_ids?: number[];
  tag_ids?: number[];
}

interface PublishResult {
  success: boolean;
  post_id?: number;
  post_url?: string;
  status?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== PUBLISH TO WORDPRESS SAAS ===');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid token:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('User ID:', userId);

    // Parse request body
    const body: PublishRequest = await req.json();
    console.log('Site ID:', body.site_id);
    console.log('Title:', body.title);
    console.log('Status:', body.status);
    console.log('Language:', body.lang || 'es');

    // Validate required fields
    if (!body.site_id || !body.title || !body.content || !body.slug) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: site_id, title, content, slug' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WordPress config for this site
    const { data: wpConfig, error: wpError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('site_id', body.site_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (wpError) {
      console.error('Error fetching WordPress config:', wpError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener configuración de WordPress' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wpConfig) {
      console.error('WordPress config not found for site:', body.site_id);
      return new Response(
        JSON.stringify({ error: 'WordPress no está configurado para este sitio' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WordPress URL:', wpConfig.site_url);

    // Normalize WordPress URL
    let wpUrl = wpConfig.site_url.trim();
    if (wpUrl.endsWith('/wp-admin') || wpUrl.endsWith('/wp-admin/')) {
      wpUrl = wpUrl.replace(/\/wp-admin\/?$/, '');
    }
    if (wpUrl.endsWith('/')) {
      wpUrl = wpUrl.slice(0, -1);
    }

    // Create Basic Auth header
    const credentials = btoa(`${wpConfig.wp_username}:${wpConfig.wp_app_password}`);
    const wpHeaders = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };

    // Upload featured image if provided
    let featuredMediaId: number | undefined;
    if (body.image_url) {
      console.log('Uploading featured image:', body.image_url);
      try {
        // Fetch the image
        const imageResponse = await fetch(body.image_url);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();

          // Determine filename and content type
          const urlParts = body.image_url.split('/');
          let filename = urlParts[urlParts.length - 1].split('?')[0] || 'featured-image.jpg';
          if (!filename.includes('.')) {
            filename += '.jpg';
          }
          const contentType = imageBlob.type || 'image/jpeg';

          console.log('Image filename:', filename);
          console.log('Image content type:', contentType);

          // Upload to WordPress media library
          const mediaResponse = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
            body: imageBuffer,
          });

          const mediaResponseText = await mediaResponse.text();
          console.log('Media upload response status:', mediaResponse.status);

          if (mediaResponse.ok) {
            const mediaData = JSON.parse(mediaResponseText);
            featuredMediaId = mediaData.id;
            console.log('Featured media ID:', featuredMediaId);

            // Update alt text if provided
            if (body.image_alt && featuredMediaId) {
              await fetch(`${wpUrl}/wp-json/wp/v2/media/${featuredMediaId}`, {
                method: 'POST',
                headers: wpHeaders,
                body: JSON.stringify({ alt_text: body.image_alt }),
              });
            }
          } else {
            console.error('Media upload failed:', mediaResponseText);
          }
        }
      } catch (imageError) {
        console.error('Error uploading image:', imageError);
        // Continue without featured image
      }
    }

    // Prepare post data
    const slug = body.lang === 'ca' ? `${body.slug}-ca` : body.slug;
    const postData: Record<string, unknown> = {
      title: body.title,
      content: body.content,
      slug: slug,
      status: body.status === 'future' ? 'future' : body.status,
    };

    // Add featured image if uploaded
    if (featuredMediaId) {
      postData.featured_media = featuredMediaId;
    }

    // Add excerpt (native WordPress field, works without extra config)
    if (body.excerpt) {
      postData.excerpt = body.excerpt.substring(0, 160);
      console.log('Adding excerpt:', body.excerpt.substring(0, 50) + '...');
    }

    // Add scheduled date if provided
    if (body.status === 'future' && body.date) {
      postData.date = body.date;
    }

    // Add Yoast SEO meta fields if provided
    if (body.meta_description || body.seo_title || body.focus_keyword) {
      const yoastMeta: Record<string, string> = {};
      
      if (body.meta_description) {
        // Ensure max 160 characters for meta description
        yoastMeta._yoast_wpseo_metadesc = body.meta_description.substring(0, 160);
      }
      
      if (body.seo_title) {
        // Ensure max 60 characters for SEO title
        yoastMeta._yoast_wpseo_title = body.seo_title.substring(0, 60);
      } else if (body.title) {
        // Fallback to regular title if no seo_title
        yoastMeta._yoast_wpseo_title = body.title.substring(0, 60);
      }

      // Add focus keyword for Yoast analysis
      if (body.focus_keyword) {
        yoastMeta._yoast_wpseo_focuskw = body.focus_keyword.substring(0, 50);
      }
      
      postData.meta = yoastMeta;
      console.log('Yoast meta fields:', yoastMeta);
    }

    // Add language parameter for Polylang
    if (body.lang) {
      postData.lang = body.lang;
    }

    // Add categories if provided
    if (body.category_ids && body.category_ids.length > 0) {
      postData.categories = body.category_ids;
      console.log('Categories:', body.category_ids);
    }

    // Add tags if provided
    if (body.tag_ids && body.tag_ids.length > 0) {
      postData.tags = body.tag_ids;
      console.log('Tags:', body.tag_ids);
    }

    console.log('Creating post with data:', JSON.stringify(postData, null, 2));

    // Create the post
    const postResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: wpHeaders,
      body: JSON.stringify(postData),
    });

    const postResponseText = await postResponse.text();
    console.log('Post creation response status:', postResponse.status);

    if (!postResponse.ok) {
      console.error('Post creation failed:', postResponseText);
      
      // Try to parse error message
      let errorMessage = 'Error al crear el post en WordPress';
      try {
        const errorData = JSON.parse(postResponseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Check for HTML response (common when URL is wrong)
        if (postResponseText.includes('<!DOCTYPE') || postResponseText.includes('<html')) {
          errorMessage = 'La URL de WordPress no es válida o el endpoint REST API no está disponible';
        }
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: postResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const postData2 = JSON.parse(postResponseText);
    console.log('Post created successfully!');
    console.log('Post ID:', postData2.id);
    console.log('Post URL:', postData2.link);

    // Update wordpress_context with the new title (auto-sync)
    try {
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseService = createClient(supabaseUrl, serviceRoleKey);

      const { data: siteData, error: siteError } = await supabaseService
        .from('sites')
        .select('wordpress_context')
        .eq('id', body.site_id)
        .single();

      if (!siteError && siteData) {
        const currentContext = (siteData.wordpress_context as Record<string, unknown>) || {};
        const currentTopics = (currentContext.lastTopics as string[]) || [];

        // Add new title at the beginning, limit to 25
        const updatedTopics = [body.title, ...currentTopics].slice(0, 25);

        const { error: updateError } = await supabaseService
          .from('sites')
          .update({
            wordpress_context: {
              ...currentContext,
              lastTopics: updatedTopics,
              last_publish_at: new Date().toISOString()
            }
          })
          .eq('id', body.site_id);

        if (updateError) {
          console.error('Error updating wordpress_context:', updateError);
        } else {
          console.log('wordpress_context updated with new topic:', body.title);
        }
      }
    } catch (contextError) {
      console.error('Error updating wordpress_context (non-blocking):', contextError);
      // Don't fail the publish if context update fails
    }

    const result: PublishResult = {
      success: true,
      post_id: postData2.id,
      post_url: postData2.link,
      status: postData2.status,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
