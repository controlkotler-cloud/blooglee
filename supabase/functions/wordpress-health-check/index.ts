import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface HealthCheck {
  id: string;
  status: "ok" | "warning" | "error";
  message: string;
  value?: string;
  action?: string;
  solution_slug?: string;
}

interface HealthCheckResponse {
  phase: number;
  overall_status: "success" | "warning" | "error";
  checks: HealthCheck[];
  detected_plugins: string[];
  languages?: { code: string; name: string }[];
  categories?: { id: number; name: string; slug: string }[];
  errors: string[];
  recommendations: { priority: string; title: string; slug: string }[];
}

// Known security plugins patterns
const SECURITY_PLUGINS = [
  { name: "wordfence", pattern: /wordfence/i, solution_slug: "wordfence-bloquea-claves" },
  { name: "ithemes", pattern: /ithemes|better-wp-security/i, solution_slug: "ithemes-deshabilita-api" },
  { name: "sucuri", pattern: /sucuri/i, solution_slug: "sucuri-firewall" },
  { name: "all-in-one-security", pattern: /all-in-one.*security|aios/i, solution_slug: "aios-bloqueo" },
  { name: "limit-login", pattern: /limit.*login/i, solution_slug: "limit-login-attempts" },
];

// Known multilang plugins
const MULTILANG_PLUGINS = [
  { name: "polylang", pattern: /polylang/i, solution_slug: "polylang-api-idioma" },
  { name: "wpml", pattern: /wpml|sitepress/i, solution_slug: "wpml-api-idioma" },
  { name: "translatepress", pattern: /translatepress/i, solution_slug: "translatepress-config" },
];

// Known cache plugins
const CACHE_PLUGINS = [
  { name: "wp-rocket", pattern: /wp-rocket/i, solution_slug: "wp-rocket-cache" },
  { name: "w3-total-cache", pattern: /w3-total-cache/i, solution_slug: "w3-total-cache" },
  { name: "wp-super-cache", pattern: /wp-super-cache/i, solution_slug: "wp-super-cache" },
  { name: "litespeed", pattern: /litespeed/i, solution_slug: "litespeed-cache" },
];

async function checkPhase1(siteUrl: string): Promise<{ checks: HealthCheck[]; errors: string[]; detected_plugins: string[] }> {
  const checks: HealthCheck[] = [];
  const errors: string[] = [];
  const detected_plugins: string[] = [];

  // Normalize URL
  let normalizedUrl = siteUrl.trim().replace(/\/+$/, "").replace(/\/wp-admin\/?$/, "");
  
  // Check SSL
  const isHttps = normalizedUrl.startsWith("https://");
  checks.push({
    id: "ssl",
    status: isHttps ? "ok" : "warning",
    message: isHttps ? "SSL válido" : "El sitio no usa HTTPS",
    action: isHttps ? undefined : "Se recomienda usar HTTPS para mayor seguridad",
  });

  // Check API REST accessibility
  try {
    const apiUrl = `${normalizedUrl}/wp-json/`;
    console.log(`Checking API REST at: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      
      checks.push({
        id: "api_rest",
        status: "ok",
        message: "API REST accesible",
      });

      // Extract WordPress version
      const wpVersion = response.headers.get("x-wp-version") || data?.version;
      if (wpVersion) {
        const majorVersion = parseFloat(wpVersion);
        const isVersionOk = majorVersion >= 5.6;
        checks.push({
          id: "version",
          status: isVersionOk ? "ok" : "error",
          message: isVersionOk ? `WordPress ${wpVersion}` : `WordPress ${wpVersion} - Se requiere 5.6 o superior`,
          value: wpVersion,
          solution_slug: isVersionOk ? undefined : "wordpress-version-antigua",
        });
      }

      // Check permalinks - if wp-json works, permalinks are configured
      checks.push({
        id: "permalinks",
        status: "ok",
        message: "Permalinks configurados",
      });

      // Detect plugins from namespaces
      const namespaces = data?.namespaces || [];
      const routes = Object.keys(data?.routes || {});
      const fullText = [...namespaces, ...routes].join(" ");

      // Check security plugins
      for (const plugin of SECURITY_PLUGINS) {
        if (plugin.pattern.test(fullText)) {
          detected_plugins.push(plugin.name);
        }
      }

      // Check multilang plugins
      for (const plugin of MULTILANG_PLUGINS) {
        if (plugin.pattern.test(fullText)) {
          detected_plugins.push(plugin.name);
        }
      }

      // Check cache plugins
      for (const plugin of CACHE_PLUGINS) {
        if (plugin.pattern.test(fullText)) {
          detected_plugins.push(plugin.name);
        }
      }

    } else if (response.status === 401 || response.status === 403) {
      checks.push({
        id: "api_rest",
        status: "error",
        message: "API REST bloqueada - Posible firewall activo",
        solution_slug: "api-rest-bloqueada",
      });
      errors.push(`API REST devolvió error ${response.status}`);
    } else if (response.status === 404) {
      checks.push({
        id: "api_rest",
        status: "error",
        message: "API REST no encontrada - Verifica los permalinks",
        solution_slug: "permalinks-no-configurados",
      });
      errors.push("API REST no encontrada (404)");
    } else {
      checks.push({
        id: "api_rest",
        status: "error",
        message: `Error al acceder a la API REST: ${response.status}`,
      });
      errors.push(`API REST devolvió error ${response.status}`);
    }

  } catch (error) {
    console.error("Error checking API REST:", error);
    checks.push({
      id: "api_rest",
      status: "error",
      message: "No se pudo conectar con el sitio WordPress",
      action: "Verifica que la URL sea correcta y el sitio esté online",
    });
    errors.push(`Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { checks, errors, detected_plugins };
}

async function checkPhase2(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<{ checks: HealthCheck[]; errors: string[]; user_role?: string }> {
  const checks: HealthCheck[] = [];
  const errors: string[] = [];
  let user_role: string | undefined;

  const normalizedUrl = siteUrl.trim().replace(/\/+$/, "").replace(/\/wp-admin\/?$/, "");
  const credentials = btoa(`${username}:${appPassword.replace(/\s/g, "")}`);

  try {
    const userUrl = `${normalizedUrl}/wp-json/wp/v2/users/me?context=edit`;
    console.log(`Checking authentication at: ${userUrl}`);

    const response = await fetch(userUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Basic ${credentials}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      user_role = userData.roles?.[0] || "unknown";
      
      checks.push({
        id: "auth",
        status: "ok",
        message: `Autenticación correcta - Rol: ${user_role}`,
        value: user_role,
      });

      // Check capabilities
      const caps = userData.capabilities || {};
      const canEditPosts = caps.edit_posts || caps.edit_published_posts;
      const canPublishPosts = caps.publish_posts;
      const canUploadFiles = caps.upload_files;

      if (!canEditPosts) {
        checks.push({
          id: "permission_edit",
          status: "error",
          message: "El usuario no puede editar posts",
          solution_slug: "permisos-usuario-insuficientes",
        });
        errors.push("Usuario sin permisos de edición");
      } else {
        checks.push({
          id: "permission_edit",
          status: "ok",
          message: "Puede editar posts",
        });
      }

      if (!canPublishPosts) {
        checks.push({
          id: "permission_publish",
          status: "warning",
          message: "El usuario no puede publicar posts directamente",
          action: "Solo podrás guardar como borrador",
        });
      } else {
        checks.push({
          id: "permission_publish",
          status: "ok",
          message: "Puede publicar posts",
        });
      }

      if (!canUploadFiles) {
        checks.push({
          id: "permission_upload",
          status: "warning",
          message: "El usuario no puede subir archivos",
          action: "Las imágenes destacadas no funcionarán",
          solution_slug: "permisos-subida-archivos",
        });
      } else {
        checks.push({
          id: "permission_upload",
          status: "ok",
          message: "Puede subir archivos",
        });
      }

    } else if (response.status === 401) {
      checks.push({
        id: "auth",
        status: "error",
        message: "Credenciales incorrectas",
        solution_slug: "credenciales-incorrectas",
      });
      errors.push("Error de autenticación 401");
    } else if (response.status === 403) {
      checks.push({
        id: "auth",
        status: "error",
        message: "Acceso denegado - Posible firewall bloqueando",
        solution_slug: "firewall-bloquea-auth",
      });
      errors.push("Error 403 - Firewall detectado");
    } else {
      checks.push({
        id: "auth",
        status: "error",
        message: `Error de autenticación: ${response.status}`,
      });
      errors.push(`Error de autenticación: ${response.status}`);
    }

  } catch (error) {
    console.error("Error checking authentication:", error);
    checks.push({
      id: "auth",
      status: "error",
      message: "Error al verificar autenticación",
    });
    errors.push(`Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { checks, errors, user_role };
}

async function checkPhase3(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<{
  checks: HealthCheck[];
  errors: string[];
  categories: { id: number; name: string; slug: string }[];
  languages: { code: string; name: string }[];
}> {
  const checks: HealthCheck[] = [];
  const errors: string[] = [];
  const categories: { id: number; name: string; slug: string }[] = [];
  const languages: { code: string; name: string }[] = [];

  const normalizedUrl = siteUrl.trim().replace(/\/+$/, "").replace(/\/wp-admin\/?$/, "");
  const credentials = btoa(`${username}:${appPassword.replace(/\s/g, "")}`);
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Basic ${credentials}`,
  };

  // Test post creation
  let testPostId: number | null = null;
  try {
    console.log("Testing post creation...");
    const postResponse = await fetch(`${normalizedUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Blooglee Test Post - Delete Me",
        content: "This is a test post created by Blooglee health check.",
        status: "draft",
      }),
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      testPostId = postData.id;
      checks.push({
        id: "create_post",
        status: "ok",
        message: "Puede crear posts",
      });
    } else {
      const errorText = await postResponse.text();
      console.error("Post creation failed:", postResponse.status, errorText);
      checks.push({
        id: "create_post",
        status: "error",
        message: `No se pueden crear posts: ${postResponse.status}`,
      });
      errors.push(`Error al crear post: ${postResponse.status}`);
    }
  } catch (error) {
    console.error("Error creating test post:", error);
    checks.push({
      id: "create_post",
      status: "error",
      message: "Error al probar creación de posts",
    });
  }

  // Clean up test post
  if (testPostId) {
    try {
      await fetch(`${normalizedUrl}/wp-json/wp/v2/posts/${testPostId}?force=true`, {
        method: "DELETE",
        headers,
      });
      console.log("Test post deleted successfully");
    } catch (error) {
      console.log("Could not delete test post:", error);
    }
  }

  // Test media upload capability (without actually uploading)
  try {
    // We check if the media endpoint is accessible
    const mediaCheckResponse = await fetch(`${normalizedUrl}/wp-json/wp/v2/media?per_page=1`, {
      method: "GET",
      headers,
    });

    if (mediaCheckResponse.ok) {
      checks.push({
        id: "upload_media",
        status: "ok",
        message: "Puede acceder a la biblioteca de medios",
      });
    } else if (mediaCheckResponse.status === 403) {
      checks.push({
        id: "upload_media",
        status: "warning",
        message: "Acceso a medios restringido",
        solution_slug: "permisos-subida-archivos",
      });
    }
  } catch (error) {
    console.log("Media check error:", error);
  }

  // Get categories
  try {
    const catsResponse = await fetch(`${normalizedUrl}/wp-json/wp/v2/categories?per_page=100`, {
      method: "GET",
      headers,
    });

    if (catsResponse.ok) {
      const catsData = await catsResponse.json();
      for (const cat of catsData) {
        categories.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        });
      }
    }
  } catch (error) {
    console.log("Categories fetch error:", error);
  }

  // Check for Polylang languages
  try {
    const polylangResponse = await fetch(`${normalizedUrl}/wp-json/pll/v1/languages`, {
      method: "GET",
      headers,
    });

    if (polylangResponse.ok) {
      const langsData = await polylangResponse.json();
      for (const lang of langsData) {
        languages.push({
          code: lang.slug || lang.code,
          name: lang.name,
        });
      }
      if (languages.length > 0) {
        checks.push({
          id: "polylang",
          status: "warning",
          message: `Polylang detectado con ${languages.length} idiomas`,
          action: "Requiere snippet para publicar en idioma correcto",
          solution_slug: "polylang-api-idioma",
        });
      }
    }
  } catch (error) {
    // Polylang not installed, which is fine
    console.log("Polylang not detected (expected if not installed)");
  }

  return { checks, errors, categories, languages };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { site_url, wp_username, wp_app_password, phase = 1 } = await req.json();

    if (!site_url) {
      return new Response(
        JSON.stringify({ error: "site_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting health check phase ${phase} for: ${site_url}`);

    const response: HealthCheckResponse = {
      phase,
      overall_status: "success",
      checks: [],
      detected_plugins: [],
      languages: [],
      categories: [],
      errors: [],
      recommendations: [],
    };

    // Phase 1: Basic checks (no credentials needed)
    const phase1 = await checkPhase1(site_url);
    response.checks.push(...phase1.checks);
    response.errors.push(...phase1.errors);
    response.detected_plugins.push(...phase1.detected_plugins);

    // Phase 2: Authentication (credentials needed)
    if (phase >= 2 && wp_username && wp_app_password) {
      const phase2 = await checkPhase2(site_url, wp_username, wp_app_password);
      response.checks.push(...phase2.checks);
      response.errors.push(...phase2.errors);
    }

    // Phase 3: Full health check
    if (phase >= 3 && wp_username && wp_app_password) {
      const phase3 = await checkPhase3(site_url, wp_username, wp_app_password);
      response.checks.push(...phase3.checks);
      response.errors.push(...phase3.errors);
      response.categories = phase3.categories;
      response.languages = phase3.languages;
    }

    // Add recommendations based on detected plugins
    for (const plugin of response.detected_plugins) {
      const secPlugin = SECURITY_PLUGINS.find(p => p.name === plugin);
      if (secPlugin) {
        response.recommendations.push({
          priority: "alta",
          title: `Configura ${plugin} para permitir claves de aplicación`,
          slug: secPlugin.solution_slug,
        });
      }
      const multiPlugin = MULTILANG_PLUGINS.find(p => p.name === plugin);
      if (multiPlugin) {
        response.recommendations.push({
          priority: "media",
          title: `Configura ${plugin} para publicar vía API`,
          slug: multiPlugin.solution_slug,
        });
      }
    }

    // Determine overall status
    const hasErrors = response.checks.some(c => c.status === "error");
    const hasWarnings = response.checks.some(c => c.status === "warning");
    response.overall_status = hasErrors ? "error" : hasWarnings ? "warning" : "success";

    console.log(`Health check completed. Status: ${response.overall_status}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        phase: 0,
        overall_status: "error",
        checks: [],
        detected_plugins: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
        recommendations: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
