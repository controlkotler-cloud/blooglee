import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  wordpress_config_id: string;
  analyze_content?: boolean; // New: optionally analyze existing posts
}

interface Taxonomy {
  id: number;
  name: string;
  slug: string;
}

interface WordPressPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
}

interface WordPressContext {
  avgLength: number;
  commonCategories: Array<{ name: string; count: number }>;
  lastTopics: string[];
  detected_tone?: string;
  main_themes?: string[];
  style_notes?: string;
  analyzed_at: string;
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client for auth validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate user via getUser (getClaims doesn't exist)
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Invalid token:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log('User ID:', userId);
    
    // Use service role for updates (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: SyncRequest = await req.json();
    console.log('WordPress Config ID:', body.wordpress_config_id);
    const analyzeContent = body.analyze_content ?? true; // Default to analyzing content

    if (!body.wordpress_config_id) {
      return new Response(
        JSON.stringify({ error: 'wordpress_config_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WordPress config and validate ownership
    const { data: wpConfig, error: wpError } = await supabase
      .from('wordpress_configs')
      .select('*, sites!inner(id, name, user_id)')
      .eq('id', body.wordpress_config_id)
      .maybeSingle();

    if (wpError) {
      console.error('Error fetching WordPress config:', wpError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener configuración de WordPress' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wpConfig) {
      console.error('WordPress config not found');
      return new Response(
        JSON.stringify({ error: 'Configuración de WordPress no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user owns this config
    if (wpConfig.user_id !== userId) {
      console.error('Access denied: user does not own this config');
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WordPress URL:', wpConfig.site_url);
    const siteId = wpConfig.site_id;

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

    // ==========================================
    // CONTENT ANALYSIS: Analyze existing posts
    // ==========================================
    let contentAnalysis: WordPressContext | null = null;
    
    console.log('=== CONTENT ANALYSIS START ===');
    console.log('Site ID for update:', siteId);
    console.log('Analyze content enabled:', analyzeContent);
    
    if (analyzeContent) {
      console.log('Fetching WordPress posts for analysis...');
      
      try {
        // Fetch last 15 published posts
        const postsUrl = `${wpUrl}/wp-json/wp/v2/posts?per_page=15&status=publish&orderby=date&order=desc`;
        console.log('Fetching from:', postsUrl);
        
        const postsResponse = await fetch(postsUrl, { headers: wpHeaders });
        console.log('Posts response status:', postsResponse.status);
        
        if (postsResponse.ok) {
          const posts: WordPressPost[] = await postsResponse.json();
          console.log(`SUCCESS: Found ${posts.length} published posts to analyze`);
          
          if (posts.length > 0) {
            // Extract basic metrics
            const titles = posts.map(p => p.title.rendered.replace(/<[^>]*>/g, ''));
            console.log('Extracted titles:', titles.slice(0, 5));
            const excerpts = posts.map(p => p.excerpt.rendered.replace(/<[^>]*>/g, ''));
            
            // Calculate average content length (word count)
            const wordCounts = posts.map(p => {
              const plainText = p.content.rendered.replace(/<[^>]*>/g, '');
              return plainText.split(/\s+/).length;
            });
            const avgLength = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);
            console.log('Average post length:', avgLength, 'words');
            
            // Count category usage
            const categoryCount: Record<number, number> = {};
            posts.forEach(p => {
              p.categories.forEach(catId => {
                categoryCount[catId] = (categoryCount[catId] || 0) + 1;
              });
            });
            
            // Map category IDs to names
            const commonCategories = Object.entries(categoryCount)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([catId, count]) => {
                const category = categories.find(c => c.id === parseInt(catId));
                return { name: category?.name || `Category ${catId}`, count };
              });
            
            contentAnalysis = {
              avgLength,
              commonCategories,
              lastTopics: titles.slice(0, 10),
              analyzed_at: new Date().toISOString()
            };
            
            // Optionally analyze tone with AI (if Lovable API key available)
            const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
            if (LOVABLE_API_KEY && posts.length >= 3) {
              console.log('Analyzing content tone with AI...');
              
              const analysisPrompt = `Analiza estos títulos y extractos de un blog existente:

${titles.slice(0, 8).map((t, i) => `${i+1}. "${t}": ${excerpts[i]?.substring(0, 100) || ''}`).join('\n')}

Responde SOLO con JSON válido (sin markdown):
{
  "detected_tone": "formal|casual|technical|educational",
  "main_themes": ["tema1", "tema2", "tema3"],
  "style_notes": "Una frase describiendo el estilo general del blog"
}`;
              
              try {
                const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [{ role: 'user', content: analysisPrompt }],
                    temperature: 0.3,
                    max_tokens: 200,
                  }),
                });
                
                if (aiResponse.ok) {
                  const aiData = await aiResponse.json();
                  const aiContent = aiData.choices?.[0]?.message?.content;
                  
                  if (aiContent) {
                    // Parse JSON from response
                    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      const toneAnalysis = JSON.parse(jsonMatch[0]);
                      contentAnalysis = {
                        ...contentAnalysis!,
                        detected_tone: toneAnalysis.detected_tone,
                        main_themes: toneAnalysis.main_themes,
                        style_notes: toneAnalysis.style_notes
                      };
                      console.log('AI tone analysis complete:', toneAnalysis.detected_tone);
                    }
                  }
                }
              } catch (aiError) {
                console.error('AI analysis error (non-blocking):', aiError);
              }
            }
            
            // Save wordpress_context to site
            console.log('=== SAVING WORDPRESS CONTEXT ===');
            console.log('Site ID to update:', siteId);
            console.log('Content analysis data:', JSON.stringify(contentAnalysis));
            
            const { data: updateResult, error: contextError } = await supabase
              .from('sites')
              .update({ wordpress_context: contentAnalysis })
              .eq('id', siteId)
              .select('id, wordpress_context');
            
            if (contextError) {
              console.error('FAILED to save wordpress_context:', contextError);
            } else {
              console.log('SUCCESS: wordpress_context saved to site');
              console.log('Update result:', JSON.stringify(updateResult));
            }
          } else {
            console.log('No posts found, skipping context analysis');
          }
        } else {
          const errorText = await postsResponse.text();
          console.error('Failed to fetch posts:', postsResponse.status, errorText);
        }
      } catch (error) {
        console.error('Content analysis error (non-blocking):', error);
      }
    } else {
      console.log('Content analysis disabled, skipping');
    }

    console.log('=== SYNC COMPLETE ===');

    return new Response(
      JSON.stringify({
        success: true,
        categories: categories.length,
        tags: tags.length,
        content_analyzed: !!contentAnalysis,
        wordpress_context: contentAnalysis
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
