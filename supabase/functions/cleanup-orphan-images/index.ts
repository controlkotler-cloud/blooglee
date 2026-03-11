import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const PROTECTED_FILES = ["blooglee-avatar.png"];

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

function getRoleFromJwt(token: string | null): string | null {
  if (!token || token.split(".").length !== 3) return null;
  try {
    const payload = token.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const json = JSON.parse(decoded) as Record<string, unknown>;
    const role = json.role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

function isInternalAuthorized(req: Request, serviceRoleKey: string, internalSecret?: string | null): boolean {
  const bearerToken = getBearerToken(req);
  const apiKeyHeader = req.headers.get("apikey") || req.headers.get("x-api-key");
  const providedSecret = req.headers.get("x-internal-secret") || req.headers.get("x-cron-secret");

  if (internalSecret && providedSecret && providedSecret === internalSecret) {
    return true;
  }

  if (bearerToken && bearerToken === serviceRoleKey) {
    return true;
  }

  if (apiKeyHeader && apiKeyHeader === serviceRoleKey) {
    return true;
  }

  const bearerRole = getRoleFromJwt(bearerToken);
  if (bearerRole === "service_role" || bearerRole === "supabase_admin") {
    return true;
  }

  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET");

    if (!isInternalAuthorized(req, supabaseServiceKey, internalSecret)) {
      return new Response(
        JSON.stringify({
          error: "unauthorized",
          message: "This endpoint is internal-only. Use service role auth or x-internal-secret.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. List all files in the bucket recursively
    const allFiles: string[] = [];
    const folders = [""];

    while (folders.length > 0) {
      const folder = folders.pop()!;
      const { data: files, error } = await supabase.storage.from("article-images").list(folder, { limit: 1000 });

      if (error) {
        console.error(`Error listing folder "${folder}":`, error);
        continue;
      }

      for (const file of files || []) {
        const fullPath = folder ? `${folder}/${file.name}` : file.name;
        if (file.id) {
          allFiles.push(fullPath);
        } else {
          // It's a folder
          folders.push(fullPath);
        }
      }
    }

    console.log(`Found ${allFiles.length} files in bucket`);

    // 2. Collect all referenced image_urls from 5 tables
    const tables = [
      { table: "articles", column: "image_url" },
      { table: "blog_posts", column: "image_url" },
      { table: "social_content", column: "image_url" },
    ];

    const referencedPaths = new Set<string>();

    for (const { table, column } of tables) {
      const { data, error } = await supabase.from(table).select(column).not(column, "is", null);

      if (error) {
        console.error(`Error querying ${table}:`, error);
        continue;
      }

      for (const row of data || []) {
        const url = row[column] as string;
        if (url && url.includes("article-images")) {
          try {
            const parsed = new URL(url);
            const bucketPath = parsed.pathname.split("/article-images/")[1];
            if (bucketPath) {
              referencedPaths.add(decodeURIComponent(bucketPath));
            }
          } catch {
            // skip malformed urls
          }
        }
      }
    }

    console.log(`Found ${referencedPaths.size} referenced images across tables`);

    // 3. Find orphans (not referenced and not protected)
    const orphans = allFiles.filter((filePath) => {
      const fileName = filePath.split("/").pop() || "";
      if (PROTECTED_FILES.includes(fileName)) return false;
      return !referencedPaths.has(filePath);
    });

    console.log(`Found ${orphans.length} orphan files to delete`);

    // 4. Delete orphans in batches of 100
    const errors: string[] = [];
    let deleted = 0;

    for (let i = 0; i < orphans.length; i += 100) {
      const batch = orphans.slice(i, i + 100);
      const { error } = await supabase.storage.from("article-images").remove(batch);

      if (error) {
        errors.push(`Batch ${i / 100}: ${error.message}`);
      } else {
        deleted += batch.length;
      }
    }

    const result = {
      total_files: allFiles.length,
      referenced: referencedPaths.size,
      deleted,
      kept: allFiles.length - deleted,
      errors,
    };

    console.log("Cleanup result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cleanup-orphan-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
