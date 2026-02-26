import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface PublishRequest {
  site_id: string;
  article_id?: string;
  title: string;
  seo_title?: string;
  content: string;
  slug: string;
  status: "publish" | "draft" | "future";
  date?: string;
  image_url?: string;
  image_alt?: string;
  meta_description?: string;
  excerpt?: string;
  focus_keyword?: string;
  lang?: "es" | "ca";
  category_ids?: number[];
  tag_ids?: number[];
}

interface PublishResult {
  success: boolean;
  post_id?: number;
  post_url?: string;
  status?: string;
  error?: string;
  already_published?: boolean;
  idempotent?: boolean;
}

interface ExistingPost {
  id: number;
  link: string;
  status: string;
  slug: string;
}

// --- Helper: find existing WP post by slug ---
async function findExistingWpPostBySlug(
  wpUrl: string,
  credentials: string,
  slug: string,
  requestId: string,
): Promise<ExistingPost | null> {
  try {
    const searchUrl = `${wpUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&per_page=1&_fields=id,link,status,slug&status=publish,draft,future,pending,private`;
    console.log(`[${requestId}][idempotency] Checking slug="${slug}"`);

    const res = await fetch(searchUrl, {
      method: "GET",
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!res.ok) {
      console.log(`[${requestId}][idempotency] Slug check returned status=${res.status}, treating as not found`);
      return null;
    }

    const text = await res.text();
    const posts = JSON.parse(text);

    if (Array.isArray(posts) && posts.length > 0) {
      const existing = posts[0];
      console.log(
        `[${requestId}][idempotent_hit] Found existing post id=${existing.id} slug="${existing.slug}" status="${existing.status}"`,
      );
      return {
        id: existing.id,
        link: existing.link,
        status: existing.status,
        slug: existing.slug,
      };
    }

    console.log(`[${requestId}][idempotency] No existing post for slug="${slug}"`);
    return null;
  } catch (error) {
    console.error(`[${requestId}][idempotency] Error checking slug:`, error);
    return null;
  }
}

// --- Helper: persist wp_post_url back to articles table ---
async function persistWpPostUrl(
  supabase: any,
  articleId: string | undefined,
  siteId: string,
  slug: string,
  postUrl: string,
  requestId: string,
): Promise<void> {
  if (articleId) {
    const { error } = await supabase.from("articles").update({ wp_post_url: postUrl }).eq("id", articleId);
    if (error) {
      console.error(`[${requestId}] Failed to update wp_post_url for article ${articleId}:`, error);
    } else {
      console.log(`[${requestId}] Updated wp_post_url for article ${articleId}`);
    }
    return;
  }

  // Fallback: find article by site_id + slug match in content_spanish
  // This handles cases where article_id wasn't passed (legacy callers)
  const { data: articles } = await supabase
    .from("articles")
    .select("id, content_spanish")
    .eq("site_id", siteId)
    .is("wp_post_url", null)
    .order("generated_at", { ascending: false })
    .limit(10);

  if (articles) {
    for (const art of articles) {
      const cs = art.content_spanish as Record<string, unknown> | null;
      if (cs && (cs.slug === slug || cs.slug === slug.replace(/-ca$/, ""))) {
        const { error } = await supabase.from("articles").update({ wp_post_url: postUrl }).eq("id", art.id);
        if (error) {
          console.error(`[${requestId}] Failed to update wp_post_url for matched article ${art.id}:`, error);
        } else {
          console.log(`[${requestId}] Updated wp_post_url for matched article ${art.id} via slug fallback`);
        }
        return;
      }
    }
  }
  console.log(`[${requestId}] No matching article found to update wp_post_url (non-blocking)`);
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const origin = req.headers.get("origin") || "unknown";

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(
      `[${requestId}] OPTIONS preflight from origin=${origin}, headers=${req.headers.get("access-control-request-headers")}`,
    );
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] === PUBLISH TO WORDPRESS SAAS ===`);
    console.log(`[${requestId}] Origin: ${origin}`);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    // Parse request body first (needed for scheduler mode check)
    const body: PublishRequest = await req.json();

    // Determine auth mode: scheduler (service_role) vs user JWT
    let supabase: any;
    let userId: string;
    const isServiceRole = token === supabaseServiceKey;

    if (isServiceRole) {
      // Scheduler mode: service_role_key was passed, use it directly
      console.log("[scheduler-mode] Using service_role auth");
      supabase = createClient(supabaseUrl, supabaseServiceKey);

      // In scheduler mode, we need to find the user_id from the site
      const { data: siteData, error: siteError } = await supabase
        .from("sites")
        .select("user_id")
        .eq("id", body.site_id)
        .single();

      if (siteError || !siteData) {
        console.error("Site not found:", siteError);
        return new Response(JSON.stringify({ error: "Site not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = siteData.user_id;
      console.log("[scheduler-mode] Resolved user_id from site:", userId);
    } else {
      // User mode: validate JWT
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        console.error("Invalid token:", claimsError);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub as string;
    }

    console.log("User ID:", userId);
    console.log("Site ID:", body.site_id);
    console.log("Title:", body.title);
    console.log("Status:", body.status);
    console.log("Language:", body.lang || "es");

    // Validate required fields
    if (!body.site_id || !body.title || !body.content || !body.slug) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos: site_id, title, content, slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get WordPress config for this site
    let wpQuery = supabase.from("wordpress_configs").select("*").eq("site_id", body.site_id);

    if (!isServiceRole) {
      wpQuery = wpQuery.eq("user_id", userId);
    }

    const { data: wpConfig, error: wpError } = await wpQuery.maybeSingle();

    if (wpError) {
      console.error("Error fetching WordPress config:", wpError);
      return new Response(JSON.stringify({ error: "Error al obtener configuración de WordPress" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!wpConfig) {
      console.error("WordPress config not found for site:", body.site_id);
      return new Response(JSON.stringify({ error: "WordPress no está configurado para este sitio" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("WordPress URL:", wpConfig.site_url);

    // Normalize WordPress URL to origin (strip /blog, /wp-admin, etc.)
    let wpUrl = wpConfig.site_url.trim();
    try {
      const parsed = new URL(wpUrl);
      wpUrl = parsed.origin;
    } catch {
      wpUrl = wpUrl.replace(/\/wp-admin\/?$/, "").replace(/\/+$/, "");
    }

    // Create Basic Auth credentials
    const credentials = btoa(`${wpConfig.wp_username}:${wpConfig.wp_app_password}`);
    const wpHeaders = {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };

    // Build the stable slug
    const slug = body.lang === "ca" ? `${body.slug}-ca` : body.slug;

    // Use service role client for DB updates (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // =========================================================
    // STEP 1: Idempotency check — find existing post by slug
    // =========================================================
    const existingPost = await findExistingWpPostBySlug(wpUrl, credentials, slug, requestId);

    if (existingPost) {
      // Post already exists in WP — persist URL back to Supabase and return success
      await persistWpPostUrl(supabaseService, body.article_id, body.site_id, slug, existingPost.link, requestId);

      const result: PublishResult = {
        success: true,
        post_id: existingPost.id,
        post_url: existingPost.link,
        status: existingPost.status,
        already_published: true,
        idempotent: true,
      };

      console.log(
        `[${requestId}][idempotent_hit] Returning existing post id=${existingPost.id} url=${existingPost.link}`,
      );
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // =========================================================
    // STEP 2: Upload featured image if provided
    // =========================================================
    let featuredMediaId: number | undefined;
    if (body.image_url) {
      console.log("Uploading featured image:", body.image_url);
      try {
        const imageResponse = await fetch(body.image_url);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();

          const urlParts = body.image_url.split("/");
          let filename = urlParts[urlParts.length - 1].split("?")[0] || "featured-image.jpg";
          if (!filename.includes(".")) {
            filename += ".jpg";
          }
          const contentType = imageBlob.type || "image/jpeg";

          console.log("Image filename:", filename);
          console.log("Image content type:", contentType);

          const mediaResponse = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": contentType,
              "Content-Disposition": `attachment; filename="${filename}"`,
            },
            body: imageBuffer,
          });

          const mediaResponseText = await mediaResponse.text();
          console.log("Media upload response status:", mediaResponse.status);

          if (mediaResponse.ok) {
            const mediaData = JSON.parse(mediaResponseText);
            featuredMediaId = mediaData.id;
            console.log("Featured media ID:", featuredMediaId);

            if (body.image_alt && featuredMediaId) {
              await fetch(`${wpUrl}/wp-json/wp/v2/media/${featuredMediaId}`, {
                method: "POST",
                headers: wpHeaders,
                body: JSON.stringify({ alt_text: body.image_alt }),
              });
            }
          } else {
            console.error("Media upload failed:", mediaResponseText);
          }
        }
      } catch (imageError) {
        console.error("Error uploading image:", imageError);
      }
    }

    // =========================================================
    // STEP 3: Create the post
    // =========================================================
    const postData: Record<string, unknown> = {
      title: body.title,
      content: body.content,
      slug: slug,
      status: body.status === "future" ? "future" : body.status,
    };

    if (featuredMediaId) {
      postData.featured_media = featuredMediaId;
    }

    if (body.excerpt) {
      postData.excerpt = body.excerpt.substring(0, 160);
      console.log("Adding excerpt:", body.excerpt.substring(0, 50) + "...");
    }

    if (body.status === "future" && body.date) {
      postData.date = body.date;
    }

    if (body.meta_description || body.seo_title || body.focus_keyword) {
      const yoastMeta: Record<string, string> = {};
      if (body.meta_description) {
        yoastMeta._yoast_wpseo_metadesc = body.meta_description.substring(0, 160);
      }
      if (body.seo_title) {
        yoastMeta._yoast_wpseo_title = body.seo_title.substring(0, 60);
      } else if (body.title) {
        yoastMeta._yoast_wpseo_title = body.title.substring(0, 60);
      }
      if (body.focus_keyword) {
        yoastMeta._yoast_wpseo_focuskw = body.focus_keyword.substring(0, 50);
      }
      postData.meta = yoastMeta;
      console.log("Yoast meta fields:", yoastMeta);
    }

    if (body.lang) {
      postData.lang = body.lang;
    }

    if (body.category_ids && body.category_ids.length > 0) {
      postData.categories = body.category_ids;
      console.log("Categories:", body.category_ids);
    }

    if (body.tag_ids && body.tag_ids.length > 0) {
      postData.tags = body.tag_ids;
      console.log("Tags:", body.tag_ids);
    }

    console.log(`[${requestId}] Creating post with slug="${slug}"`);

    const postResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: wpHeaders,
      body: JSON.stringify(postData),
    });

    const postResponseText = await postResponse.text();
    console.log("Post creation response status:", postResponse.status);

    // =========================================================
    // STEP 3b: Handle slug conflict — retry slug lookup
    // =========================================================
    if (!postResponse.ok) {
      console.error("Post creation failed:", postResponseText);

      // Check if this is a slug conflict (WP returns rest_invalid_param or similar)
      const isSlugConflict =
        postResponse.status === 400 ||
        postResponse.status === 409 ||
        postResponseText.includes("slug") ||
        postResponseText.includes("duplicate");

      if (isSlugConflict) {
        console.log(`[${requestId}][slug_conflict_recovered] Slug conflict detected, retrying lookup`);
        const recoveredPost = await findExistingWpPostBySlug(wpUrl, credentials, slug, requestId);

        if (recoveredPost) {
          await persistWpPostUrl(supabaseService, body.article_id, body.site_id, slug, recoveredPost.link, requestId);

          const result: PublishResult = {
            success: true,
            post_id: recoveredPost.id,
            post_url: recoveredPost.link,
            status: recoveredPost.status,
            already_published: true,
            idempotent: true,
          };

          console.log(`[${requestId}][slug_conflict_recovered] Recovered post id=${recoveredPost.id}`);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Real error — parse and return
      let errorMessage = "Error al crear el post en WordPress";
      try {
        const errorData = JSON.parse(postResponseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        if (postResponseText.includes("<!DOCTYPE") || postResponseText.includes("<html")) {
          errorMessage = "La URL de WordPress no es válida o el endpoint REST API no está disponible";
        }
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: postResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================
    // STEP 4: Post created successfully
    // =========================================================
    const createdPost = JSON.parse(postResponseText);
    console.log(`[${requestId}][created_new_post] Post ID: ${createdPost.id}, URL: ${createdPost.link}`);

    // Persist wp_post_url back to articles
    await persistWpPostUrl(supabaseService, body.article_id, body.site_id, slug, createdPost.link, requestId);

    // Update wordpress_context with the new title (auto-sync)
    try {
      const { data: siteData, error: siteError } = await supabaseService
        .from("sites")
        .select("wordpress_context")
        .eq("id", body.site_id)
        .single();

      if (!siteError && siteData) {
        const currentContext = (siteData.wordpress_context as Record<string, unknown>) || {};
        const currentTopics = (currentContext.lastTopics as string[]) || [];
        const updatedTopics = [body.title, ...currentTopics].slice(0, 25);

        const { error: updateError } = await supabaseService
          .from("sites")
          .update({
            wordpress_context: {
              ...currentContext,
              lastTopics: updatedTopics,
              last_publish_at: new Date().toISOString(),
            },
          })
          .eq("id", body.site_id);

        if (updateError) {
          console.error("Error updating wordpress_context:", updateError);
        } else {
          console.log("wordpress_context updated with new topic:", body.title);
        }
      }
    } catch (contextError) {
      console.error("Error updating wordpress_context (non-blocking):", contextError);
    }

    const result: PublishResult = {
      success: true,
      post_id: createdPost.id,
      post_url: createdPost.link,
      status: createdPost.status,
      already_published: false,
    };

    // Fire-and-forget: trigger full WordPress sync to update context
    try {
      const { data: wpCfg } = await supabaseService
        .from("wordpress_configs")
        .select("id")
        .eq("site_id", body.site_id)
        .single();

      if (wpCfg?.id) {
        const syncUrl = `${supabaseUrl}/functions/v1/sync-wordpress-taxonomies-saas`;
        fetch(syncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            wordpress_config_id: wpCfg.id,
            analyze_content: true,
          }),
        })
          .then((res) => {
            console.log(`[sync-after-publish] Response status: ${res.status}`);
          })
          .catch((err) => {
            console.error("[sync-after-publish] Error:", err);
          });
        console.log("[sync-after-publish] Triggered full WordPress sync for config:", wpCfg.id);
      }
    } catch (syncError) {
      console.error("[sync-after-publish] Non-blocking error:", syncError);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error inesperado";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
