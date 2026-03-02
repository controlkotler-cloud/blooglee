import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const PROTECTED_FILES = ["blooglee-avatar.png"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
