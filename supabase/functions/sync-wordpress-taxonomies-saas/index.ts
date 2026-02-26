import { createClient } from "npm:@supabase/supabase-js@2";

// CORS headers - includes all Supabase client headers to prevent preflight failures
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface SyncRequest {
  wordpress_config_id: string;
  analyze_content?: boolean;
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
  console.log("=== SYNC WORDPRESS TAXONOMIES SAAS - REQUEST RECEIVED ===");
  console.log("Method:", req.method);

  // Handle CORS preflight requests - MUST return 200 with proper headers
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== SYNC WORDPRESS TAXONOMIES SAAS ===");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header or invalid format");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Detect if called with service_role_key (internal call from publish function)
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;
    let userId: string;

    if (isServiceRole) {
      console.log("=== SERVICE ROLE MODE (internal call) ===");
      // userId will be resolved from the wordpress_config owner below
      userId = "";
    } else {
      // Client for auth validation
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      // Validate user via getUser
      console.log("Validating user token...");
      const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !userData?.user) {
        console.error("Invalid token:", userError?.message || "No user data");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = userData.user.id;
      console.log("User ID validated:", userId);
    }

    // Use service role for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: SyncRequest = await req.json();
    console.log("WordPress Config ID:", body.wordpress_config_id);
    const analyzeContent = body.analyze_content ?? true;

    if (!body.wordpress_config_id) {
      console.error("Missing wordpress_config_id");
      return new Response(JSON.stringify({ error: "wordpress_config_id es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get WordPress config with joined site data
    console.log("Fetching WordPress config...");
    const { data: wpConfig, error: wpError } = await supabase
      .from("wordpress_configs")
      .select("*, sites!inner(id, name, user_id, languages)")
      .eq("id", body.wordpress_config_id)
      .maybeSingle();

    if (wpError) {
      console.error("Error fetching WordPress config:", wpError);
      return new Response(JSON.stringify({ error: "Error al obtener configuración de WordPress" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!wpConfig) {
      console.error("WordPress config not found for ID:", body.wordpress_config_id);
      return new Response(JSON.stringify({ error: "Configuración de WordPress no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership (skip for service_role internal calls)
    if (isServiceRole) {
      // Resolve userId from the config owner for downstream operations
      userId = wpConfig.user_id;
      console.log("Service role: resolved userId from config owner:", userId);
    } else if (wpConfig.user_id !== userId) {
      // Check if user is admin/superadmin OR a team member/owner
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "superadmin"])
        .maybeSingle();

      const { data: teamLink } = await supabase
        .from("team_members")
        .select("id")
        .or(
          `and(owner_id.eq.${userId},member_id.eq.${wpConfig.user_id}),and(owner_id.eq.${wpConfig.user_id},member_id.eq.${userId})`,
        )
        .maybeSingle();

      if (!userRole && !teamLink) {
        console.error("Access denied: user", userId, "does not own config", wpConfig.id);
        return new Response(JSON.stringify({ error: "Acceso denegado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Access granted via", userRole ? `role: ${userRole.role}` : "team membership");
      // Use the config owner's userId for taxonomy operations
      userId = wpConfig.user_id;
    }

    console.log("WordPress URL:", wpConfig.site_url);
    console.log("Site ID:", wpConfig.site_id);
    const siteId = wpConfig.site_id;

    // Normalize WordPress URL to origin (strip /blog, /wp-admin, etc.)
    let wpUrl = wpConfig.site_url.trim();
    try {
      const parsed = new URL(wpUrl);
      wpUrl = parsed.origin;
    } catch {
      // Fallback: manual cleanup
      wpUrl = wpUrl.replace(/\/wp-admin\/?$/, "").replace(/\/+$/, "");
    }
    console.log("Normalized WordPress URL:", wpUrl);

    // Create Basic Auth header for WordPress API
    const credentials = btoa(`${wpConfig.wp_username}:${wpConfig.wp_app_password}`);
    const wpHeaders = {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };

    // ==========================================
    // FETCH CATEGORIES
    // ==========================================
    console.log("=== FETCHING CATEGORIES ===");
    let categories: Taxonomy[] = [];
    try {
      const categoriesUrl = `${wpUrl}/wp-json/wp/v2/categories?per_page=100`;
      console.log("Fetching from:", categoriesUrl);

      const categoriesResponse = await fetch(categoriesUrl, { headers: wpHeaders });
      console.log("Categories response status:", categoriesResponse.status);

      if (categoriesResponse.ok) {
        categories = await categoriesResponse.json();
        console.log(`SUCCESS: Found ${categories.length} categories`);
      } else {
        const errorText = await categoriesResponse.text();
        console.error("FAILED to fetch categories:", categoriesResponse.status, errorText.substring(0, 200));
      }
    } catch (error) {
      console.error("Exception fetching categories:", error);
    }

    // ==========================================
    // FETCH TAGS
    // ==========================================
    console.log("=== FETCHING TAGS ===");
    let tags: Taxonomy[] = [];
    try {
      const tagsUrl = `${wpUrl}/wp-json/wp/v2/tags?per_page=100`;
      console.log("Fetching from:", tagsUrl);

      const tagsResponse = await fetch(tagsUrl, { headers: wpHeaders });
      console.log("Tags response status:", tagsResponse.status);

      if (tagsResponse.ok) {
        tags = await tagsResponse.json();
        console.log(`SUCCESS: Found ${tags.length} tags`);
      } else {
        const errorText = await tagsResponse.text();
        console.error("FAILED to fetch tags:", tagsResponse.status, errorText.substring(0, 200));
      }
    } catch (error) {
      console.error("Exception fetching tags:", error);
    }

    // ==========================================
    // UPDATE TAXONOMIES IN DATABASE
    // ==========================================
    console.log("=== UPDATING TAXONOMIES IN DATABASE ===");

    // Delete existing taxonomies
    const { error: deleteError } = await supabase
      .from("wordpress_taxonomies_saas")
      .delete()
      .eq("wordpress_config_id", body.wordpress_config_id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting old taxonomies:", deleteError);
    } else {
      console.log("Deleted old taxonomies");
    }

    // Insert new taxonomies
    const taxonomiesToInsert = [
      ...categories.map((cat) => ({
        wordpress_config_id: body.wordpress_config_id,
        user_id: userId,
        taxonomy_type: "category",
        wp_id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })),
      ...tags.map((tag) => ({
        wordpress_config_id: body.wordpress_config_id,
        user_id: userId,
        taxonomy_type: "tag",
        wp_id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
    ];

    if (taxonomiesToInsert.length > 0) {
      console.log(`Inserting ${taxonomiesToInsert.length} taxonomies...`);
      const { error: insertError } = await supabase.from("wordpress_taxonomies_saas").insert(taxonomiesToInsert);

      if (insertError) {
        console.error("Error inserting taxonomies:", insertError);
        return new Response(JSON.stringify({ error: "Error al guardar taxonomías" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("SUCCESS: Taxonomies inserted");
    }

    // ==========================================
    // CONTENT ANALYSIS: Fetch and analyze posts
    // ==========================================
    let contentAnalysis: WordPressContext | null = null;

    console.log("=== CONTENT ANALYSIS ===");
    console.log("Analyze content enabled:", analyzeContent);
    console.log("Site ID for context update:", siteId);

    if (analyzeContent) {
      try {
        // Fetch last 15 published posts
        const postsUrl = `${wpUrl}/wp-json/wp/v2/posts?per_page=15&status=publish&orderby=date&order=desc`;
        console.log("Fetching posts from:", postsUrl);

        const postsResponse = await fetch(postsUrl, { headers: wpHeaders });
        console.log("Posts response status:", postsResponse.status);

        if (!postsResponse.ok) {
          const errorText = await postsResponse.text();
          console.error("FAILED to fetch posts:", postsResponse.status);
          console.error("Error body:", errorText.substring(0, 500));
        } else {
          const posts: WordPressPost[] = await postsResponse.json();
          console.log(`SUCCESS: Found ${posts.length} published posts to analyze`);

          if (posts.length > 0) {
            // Extract titles
            const titles = posts.map((p) => p.title.rendered.replace(/<[^>]*>/g, ""));
            console.log("Extracted titles:", JSON.stringify(titles.slice(0, 5)));

            const excerpts = posts.map((p) => p.excerpt.rendered.replace(/<[^>]*>/g, ""));

            // Calculate average content length
            const wordCounts = posts.map((p) => {
              const plainText = p.content.rendered.replace(/<[^>]*>/g, "");
              return plainText.split(/\s+/).length;
            });
            const avgLength = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);
            console.log("Average post length:", avgLength, "words");

            // Count category usage
            const categoryCount: Record<number, number> = {};
            posts.forEach((p) => {
              p.categories.forEach((catId) => {
                categoryCount[catId] = (categoryCount[catId] || 0) + 1;
              });
            });

            // Map category IDs to names
            const commonCategories = Object.entries(categoryCount)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([catId, count]) => {
                const category = categories.find((c) => c.id === parseInt(catId));
                return { name: category?.name || `Category ${catId}`, count };
              });

            contentAnalysis = {
              avgLength,
              commonCategories,
              lastTopics: titles.slice(0, 10),
              analyzed_at: new Date().toISOString(),
            };
            console.log("Content analysis prepared:", JSON.stringify(contentAnalysis));

            // Optional: AI tone analysis
            const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
            if (LOVABLE_API_KEY && posts.length >= 3) {
              console.log("Analyzing content tone with AI...");

              const analysisPrompt = `Analiza estos títulos y extractos de un blog existente:

${titles
  .slice(0, 8)
  .map((t, i) => `${i + 1}. "${t}": ${excerpts[i]?.substring(0, 100) || ""}`)
  .join("\n")}

Responde SOLO con JSON válido (sin markdown):
{
  "detected_tone": "formal|casual|technical|educational",
  "main_themes": ["tema1", "tema2", "tema3"],
  "style_notes": "Una frase describiendo el estilo general del blog"
}`;

              try {
                const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash",
                    messages: [{ role: "user", content: analysisPrompt }],
                    temperature: 0.3,
                    max_tokens: 200,
                  }),
                });

                if (aiResponse.ok) {
                  const aiData = await aiResponse.json();
                  const aiContent = aiData.choices?.[0]?.message?.content;

                  if (aiContent) {
                    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      const toneAnalysis = JSON.parse(jsonMatch[0]);
                      contentAnalysis = {
                        ...contentAnalysis!,
                        detected_tone: toneAnalysis.detected_tone,
                        main_themes: toneAnalysis.main_themes,
                        style_notes: toneAnalysis.style_notes,
                      };
                      console.log("AI tone analysis complete:", toneAnalysis.detected_tone);
                    }
                  }
                }
              } catch (aiError) {
                console.error("AI analysis error (non-blocking):", aiError);
              }
            }

            // ==========================================
            // SAVE WORDPRESS CONTEXT TO SITE
            // ==========================================
            console.log("=== SAVING WORDPRESS CONTEXT ===");
            console.log("Updating site ID:", siteId);
            console.log("Context data:", JSON.stringify(contentAnalysis));

            const { data: updateResult, error: contextError } = await supabase
              .from("sites")
              .update({ wordpress_context: contentAnalysis })
              .eq("id", siteId)
              .select("id, wordpress_context");

            if (contextError) {
              console.error("FAILED to save wordpress_context:", contextError.message, contextError.details);
            } else if (!updateResult || updateResult.length === 0) {
              console.error("WARNING: Update returned no rows - site ID may be incorrect");
            } else {
              console.log("SUCCESS: wordpress_context saved to site");
              console.log("Update result:", JSON.stringify(updateResult));
            }
          } else {
            console.log("No posts found, skipping content analysis");
          }
        }
      } catch (error) {
        console.error("Content analysis error (non-blocking):", error);
      }
    } else {
      console.log("Content analysis disabled, skipping");
    }

    // ==========================================
    // POLYLANG HEALTH CHECK (if site uses Catalan)
    // ==========================================
    const siteLanguages: string[] = (wpConfig as any).sites?.languages || [];
    const hasCatalan = siteLanguages.includes("catalan");
    let polylangStatus: { ok: boolean; message: string } | null = null;

    if (hasCatalan) {
      console.log("=== POLYLANG HEALTH CHECK ===");
      try {
        // 1. Check if Polylang REST endpoint exists
        const polylangUrl = `${wpUrl}/wp-json/pll/v1/languages`;
        const pllRes = await fetch(polylangUrl, { headers: wpHeaders });

        if (!pllRes.ok) {
          polylangStatus = {
            ok: false,
            message: "Polylang no detectado. Instala y activa el plugin Polylang en tu WordPress.",
          };
          console.log("Polylang plugin NOT detected");
        } else {
          const pllLangs = await pllRes.json();
          const hasCa = Array.isArray(pllLangs) && pllLangs.some((l: any) => l.slug === "ca" || l.code === "ca");
          const hasEs = Array.isArray(pllLangs) && pllLangs.some((l: any) => l.slug === "es" || l.code === "es");

          if (!hasEs || !hasCa) {
            polylangStatus = {
              ok: false,
              message: `Faltan idiomas en Polylang: ${!hasEs ? "Español (es)" : ""}${!hasEs && !hasCa ? " y " : ""}${!hasCa ? "Catalán (ca)" : ""}. Configúralos en Idiomas → Idiomas.`,
            };
            console.log("Polylang missing languages:", { hasEs, hasCa });
          } else {
            // 2. Check if REST API accepts "lang" field by creating+deleting a test draft
            try {
              const testRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
                method: "POST",
                headers: wpHeaders,
                body: JSON.stringify({ title: "Blooglee Polylang Test", status: "draft", lang: "ca" }),
              });

              if (testRes.ok) {
                const testPost = await testRes.json();
                // Check if lang was accepted
                const postLang = testPost.lang || testPost.polylang_current_lang;
                if (postLang === "ca") {
                  polylangStatus = {
                    ok: true,
                    message: 'Polylang configurado correctamente. El campo "lang" funciona en la API REST.',
                  };
                  console.log("Polylang REST lang field WORKS");
                } else {
                  polylangStatus = {
                    ok: false,
                    message:
                      'Polylang está instalado pero el campo "lang" no funciona en la API REST. Añade el snippet PHP de Polylang en Code Snippets.',
                  };
                  console.log("Polylang REST lang field NOT working (lang value:", postLang, ")");
                }
                // Clean up test post
                await fetch(`${wpUrl}/wp-json/wp/v2/posts/${testPost.id}?force=true`, {
                  method: "DELETE",
                  headers: wpHeaders,
                }).catch(() => {});
              } else {
                const errText = await testRes.text();
                polylangStatus = {
                  ok: false,
                  message: "No se pudo verificar el snippet de Polylang. Error al crear post de prueba.",
                };
                console.error("Polylang test post failed:", testRes.status, errText.substring(0, 200));
              }
            } catch (testErr) {
              polylangStatus = { ok: false, message: "Error al verificar el snippet de Polylang." };
              console.error("Polylang test error:", testErr);
            }
          }
        }

        // Save diagnostic result: delete old + insert new
        console.log("Saving Polylang diagnostic:", polylangStatus.ok ? "OK" : "ERROR");
        try {
          await supabase.from("wordpress_diagnostics").delete().eq("site_id", siteId).eq("check_type", "polylang");

          const { error: diagError } = await supabase.from("wordpress_diagnostics").insert({
            user_id: userId,
            site_id: siteId,
            check_type: "polylang",
            status: polylangStatus.ok ? "ok" : "error",
            message: polylangStatus.message,
            checked_at: new Date().toISOString(),
          });
          if (diagError) {
            console.error("Failed to save Polylang diagnostic:", diagError.message);
          } else {
            console.log("Polylang diagnostic saved successfully");
          }
        } catch (saveErr) {
          console.error("Exception saving Polylang diagnostic:", saveErr);
        }
      } catch (pllError) {
        console.error("Polylang health check error:", pllError);
        polylangStatus = { ok: false, message: "Error al verificar Polylang." };
      }
    }

    console.log("=== SYNC COMPLETE ===");
    console.log(
      "Categories:",
      categories.length,
      "| Tags:",
      tags.length,
      "| Context analyzed:",
      !!contentAnalysis,
      "| Polylang:",
      polylangStatus ? (polylangStatus.ok ? "OK" : "FAIL") : "N/A",
    );

    return new Response(
      JSON.stringify({
        success: true,
        categories: categories.length,
        tags: tags.length,
        content_analyzed: !!contentAnalysis,
        wordpress_context: contentAnalysis,
        polylang_check: polylangStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error inesperado";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
