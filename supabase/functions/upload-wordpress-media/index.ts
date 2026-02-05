// Deno native serve

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadMediaRequest {
  site_url: string;
  wp_username: string;
  wp_app_password: string;
  image_url: string;
  image_alt?: string;
  image_title?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { site_url, wp_username, wp_app_password, image_url, image_alt, image_title } = await req.json() as UploadMediaRequest;

    console.log(`[upload-wordpress-media] Starting upload to ${site_url}`);
    console.log(`[upload-wordpress-media] Image URL: ${image_url}`);

    // Validate required fields
    if (!site_url || !wp_username || !wp_app_password || !image_url) {
      console.error('[upload-wordpress-media] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_url, wp_username, wp_app_password, image_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the image from the source URL
    console.log('[upload-wordpress-media] Downloading image from source...');
    const imageResponse = await fetch(image_url);
    
    if (!imageResponse.ok) {
      console.error(`[upload-wordpress-media] Failed to download image: ${imageResponse.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to download image: ${imageResponse.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBlob = await imageResponse.blob();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Extract filename from URL or generate one
    const urlPath = new URL(image_url).pathname;
    const originalFilename = urlPath.split('/').pop() || 'image.jpg';
    const filename = originalFilename.includes('.') ? originalFilename : `${originalFilename}.jpg`;

    console.log(`[upload-wordpress-media] Image downloaded: ${filename} (${contentType}, ${imageBlob.size} bytes)`);

    // Create Basic Auth header
    const credentials = btoa(`${wp_username}:${wp_app_password}`);
    const authHeader = `Basic ${credentials}`;

    // Prepare the WordPress API endpoint
    const wpApiUrl = `${site_url.replace(/\/$/, '')}/wp-json/wp/v2/media`;
    console.log(`[upload-wordpress-media] Uploading to WordPress: ${wpApiUrl}`);

    // Upload to WordPress
    const formData = new FormData();
    formData.append('file', imageBlob, filename);
    if (image_alt) formData.append('alt_text', image_alt);
    if (image_title) formData.append('title', image_title);

    const wpResponse = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: formData,
    });

    const wpResult = await wpResponse.json();

    if (!wpResponse.ok) {
      console.error('[upload-wordpress-media] WordPress API error:', wpResult);
      return new Response(
        JSON.stringify({ 
          error: wpResult.message || 'Failed to upload to WordPress',
          code: wpResult.code,
          details: wpResult
        }),
        { status: wpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[upload-wordpress-media] Upload successful! Media ID: ${wpResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        media_id: wpResult.id,
        source_url: wpResult.source_url,
        link: wpResult.link,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    console.error('[upload-wordpress-media] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
