import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  wordpress_site_id: string;
}

interface WordPressTaxonomy {
  id: number;
  name: string;
  slug: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wordpress_site_id } = await req.json() as SyncRequest;

    console.log(`[sync-wordpress-taxonomies] Syncing taxonomies for site: ${wordpress_site_id}`);

    if (!wordpress_site_id) {
      return new Response(
        JSON.stringify({ error: 'wordpress_site_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get WordPress site credentials
    const { data: wpSite, error: wpError } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('id', wordpress_site_id)
      .single();

    if (wpError || !wpSite) {
      console.error('[sync-wordpress-taxonomies] Site not found:', wpError);
      return new Response(
        JSON.stringify({ error: 'WordPress site not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-wordpress-taxonomies] Found site: ${wpSite.site_url}`);

    // Create Basic Auth header
    const credentials = btoa(`${wpSite.wp_username}:${wpSite.wp_app_password}`);
    const authHeader = `Basic ${credentials}`;

    // Normalize site URL
    const normalizedSiteUrl = wpSite.site_url
      .replace(/\/wp-admin\/?$/, '')
      .replace(/\/$/, '');

    // Fetch categories from WordPress
    console.log('[sync-wordpress-taxonomies] Fetching categories...');
    const categoriesUrl = `${normalizedSiteUrl}/wp-json/wp/v2/categories?per_page=100`;
    const categoriesResponse = await fetch(categoriesUrl, {
      headers: { 'Authorization': authHeader },
    });

    let categories: WordPressTaxonomy[] = [];
    if (categoriesResponse.ok) {
      categories = await categoriesResponse.json();
      console.log(`[sync-wordpress-taxonomies] Found ${categories.length} categories`);
    } else {
      console.warn('[sync-wordpress-taxonomies] Failed to fetch categories:', await categoriesResponse.text());
    }

    // Fetch tags from WordPress
    console.log('[sync-wordpress-taxonomies] Fetching tags...');
    const tagsUrl = `${normalizedSiteUrl}/wp-json/wp/v2/tags?per_page=100`;
    const tagsResponse = await fetch(tagsUrl, {
      headers: { 'Authorization': authHeader },
    });

    let tags: WordPressTaxonomy[] = [];
    if (tagsResponse.ok) {
      tags = await tagsResponse.json();
      console.log(`[sync-wordpress-taxonomies] Found ${tags.length} tags`);
    } else {
      console.warn('[sync-wordpress-taxonomies] Failed to fetch tags:', await tagsResponse.text());
    }

    // Prepare upsert data for categories
    const categoryRecords = categories.map((cat) => ({
      wordpress_site_id,
      taxonomy_type: 'category' as const,
      wp_id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));

    // Prepare upsert data for tags
    const tagRecords = tags.map((tag) => ({
      wordpress_site_id,
      taxonomy_type: 'tag' as const,
      wp_id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));

    const allRecords = [...categoryRecords, ...tagRecords];

    if (allRecords.length > 0) {
      // Upsert all taxonomies
      const { error: upsertError } = await supabase
        .from('wordpress_taxonomies')
        .upsert(allRecords, {
          onConflict: 'wordpress_site_id,taxonomy_type,wp_id',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('[sync-wordpress-taxonomies] Upsert error:', upsertError);
        return new Response(
          JSON.stringify({ error: `Failed to save taxonomies: ${upsertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Clean up old taxonomies that no longer exist in WordPress
    const currentCategoryIds = categories.map(c => c.id);
    const currentTagIds = tags.map(t => t.id);

    // Delete categories not in WordPress anymore
    if (currentCategoryIds.length > 0) {
      await supabase
        .from('wordpress_taxonomies')
        .delete()
        .eq('wordpress_site_id', wordpress_site_id)
        .eq('taxonomy_type', 'category')
        .not('wp_id', 'in', `(${currentCategoryIds.join(',')})`);
    }

    // Delete tags not in WordPress anymore
    if (currentTagIds.length > 0) {
      await supabase
        .from('wordpress_taxonomies')
        .delete()
        .eq('wordpress_site_id', wordpress_site_id)
        .eq('taxonomy_type', 'tag')
        .not('wp_id', 'in', `(${currentTagIds.join(',')})`);
    }

    // Fetch and return updated taxonomies
    const { data: updatedTaxonomies, error: fetchError } = await supabase
      .from('wordpress_taxonomies')
      .select('*')
      .eq('wordpress_site_id', wordpress_site_id)
      .order('name');

    if (fetchError) {
      console.error('[sync-wordpress-taxonomies] Fetch error:', fetchError);
    }

    console.log(`[sync-wordpress-taxonomies] Sync complete. Total: ${updatedTaxonomies?.length || 0} taxonomies`);

    return new Response(
      JSON.stringify({
        success: true,
        categories: updatedTaxonomies?.filter(t => t.taxonomy_type === 'category') || [],
        tags: updatedTaxonomies?.filter(t => t.taxonomy_type === 'tag') || [],
        total_categories: categories.length,
        total_tags: tags.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    console.error('[sync-wordpress-taxonomies] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
