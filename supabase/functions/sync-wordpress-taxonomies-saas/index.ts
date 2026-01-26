import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  wordpress_config_id: string;
}

interface Taxonomy {
  id: number;
  name: string;
  slug: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SYNC WORDPRESS TAXONOMIES SAAS ===');

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
    const body: SyncRequest = await req.json();
    console.log('WordPress Config ID:', body.wordpress_config_id);

    if (!body.wordpress_config_id) {
      return new Response(
        JSON.stringify({ error: 'wordpress_config_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WordPress config and validate ownership
    const { data: wpConfig, error: wpError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('id', body.wordpress_config_id)
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
      console.error('WordPress config not found or access denied');
      return new Response(
        JSON.stringify({ error: 'Configuración de WordPress no encontrada' }),
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

    // Fetch categories from WordPress
    console.log('Fetching categories from WordPress...');
    let categories: Taxonomy[] = [];
    try {
      const categoriesResponse = await fetch(`${wpUrl}/wp-json/wp/v2/categories?per_page=100`, {
        headers: wpHeaders,
      });
      
      if (categoriesResponse.ok) {
        categories = await categoriesResponse.json();
        console.log(`Found ${categories.length} categories`);
      } else {
        const errorText = await categoriesResponse.text();
        console.error('Error fetching categories:', categoriesResponse.status, errorText);
      }
    } catch (error) {
      console.error('Exception fetching categories:', error);
    }

    // Fetch tags from WordPress
    console.log('Fetching tags from WordPress...');
    let tags: Taxonomy[] = [];
    try {
      const tagsResponse = await fetch(`${wpUrl}/wp-json/wp/v2/tags?per_page=100`, {
        headers: wpHeaders,
      });
      
      if (tagsResponse.ok) {
        tags = await tagsResponse.json();
        console.log(`Found ${tags.length} tags`);
      } else {
        const errorText = await tagsResponse.text();
        console.error('Error fetching tags:', tagsResponse.status, errorText);
      }
    } catch (error) {
      console.error('Exception fetching tags:', error);
    }

    // Delete existing taxonomies for this config
    console.log('Deleting existing taxonomies...');
    const { error: deleteError } = await supabase
      .from('wordpress_taxonomies_saas')
      .delete()
      .eq('wordpress_config_id', body.wordpress_config_id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting old taxonomies:', deleteError);
    }

    // Insert new taxonomies
    const taxonomiesToInsert = [
      ...categories.map(cat => ({
        wordpress_config_id: body.wordpress_config_id,
        user_id: userId,
        taxonomy_type: 'category',
        wp_id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })),
      ...tags.map(tag => ({
        wordpress_config_id: body.wordpress_config_id,
        user_id: userId,
        taxonomy_type: 'tag',
        wp_id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
    ];

    if (taxonomiesToInsert.length > 0) {
      console.log(`Inserting ${taxonomiesToInsert.length} taxonomies...`);
      const { error: insertError } = await supabase
        .from('wordpress_taxonomies_saas')
        .insert(taxonomiesToInsert);

      if (insertError) {
        console.error('Error inserting taxonomies:', insertError);
        return new Response(
          JSON.stringify({ error: 'Error al guardar taxonomías' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('=== SYNC COMPLETE ===');

    return new Response(
      JSON.stringify({
        success: true,
        categories: categories.length,
        tags: tags.length,
      }),
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
