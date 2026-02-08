import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function cleanBlogContent(content: string, title: string): string {
  let cleaned = content;

  // Rule 3: Remove AI conversational meta-text before --- separator
  // e.g. "¡Absolutamente! Aquí tienes el artículo..." followed by ---
  cleaned = cleaned.replace(/^[\s\S]*?(?:Absolutamente|Aquí tienes|Here is|Here's|¡Claro|Por supuesto)[\s\S]*?---\s*\n*/i, '');

  // Rule 2: Remove "Título: ..." lines at the beginning (one or more)
  cleaned = cleaned.replace(/^(?:Título\s*:\s*.+\n\s*)+/i, '');

  // Rule 1: Remove duplicate H1 at the beginning (# Title...)
  // Only remove if it's the very first line
  const firstLineMatch = cleaned.match(/^#\s+(.+)\n/);
  if (firstLineMatch) {
    // Remove it - the page already shows the title as H1
    cleaned = cleaned.replace(/^#\s+.+\n+/, '');
  }

  // Rule 4: Trim leading blank lines
  cleaned = cleaned.replace(/^\s*\n+/, '');

  return cleaned;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all published posts
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("id, title, content, slug")
      .eq("is_published", true);

    if (error) throw new Error(`Fetch error: ${error.message}`);
    if (!posts?.length) {
      return new Response(JSON.stringify({ success: true, message: "No posts found", cleaned: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing ${posts.length} published posts...`);

    const results: { slug: string; title: string; change: string }[] = [];
    let cleanedCount = 0;

    for (const post of posts) {
      const original = post.content;
      const cleaned = cleanBlogContent(original, post.title);

      if (cleaned !== original) {
        const { error: updateError } = await supabase
          .from("blog_posts")
          .update({ content: cleaned })
          .eq("id", post.id);

        if (updateError) {
          console.error(`Failed to update ${post.slug}: ${updateError.message}`);
          continue;
        }

        cleanedCount++;
        const removedChars = original.length - cleaned.length;
        const removedPreview = original.substring(0, Math.min(100, original.indexOf('\n') + 1 || 100)).trim();
        results.push({
          slug: post.slug,
          title: post.title,
          change: `Removed ${removedChars} chars. Started with: "${removedPreview}..."`,
        });
        console.log(`✓ Cleaned: ${post.slug} (-${removedChars} chars)`);
      }
    }

    console.log(`Done. Cleaned ${cleanedCount} of ${posts.length} posts.`);

    return new Response(
      JSON.stringify({
        success: true,
        total: posts.length,
        cleaned: cleanedCount,
        unchanged: posts.length - cleanedCount,
        details: results,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
