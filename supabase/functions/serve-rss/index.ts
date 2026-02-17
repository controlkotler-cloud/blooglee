import { createClient } from "npm:@supabase/supabase-js@2";

const DOMAIN = "https://blooglee.com";

const escapeXml = (str: string): string =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const stripMarkdown = (md: string): string =>
  md.replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[💡🔑📌]/g, "")
    .replace(/\|[^\n]+\|/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .trim();

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, content, published_at, author_name, category")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(100);

  const items = (posts || []).map((p) => {
    const desc = stripMarkdown(p.content).slice(0, 300);
    const pubDate = new Date(p.published_at).toUTCString();
    return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${DOMAIN}/blog/${escapeXml(p.slug)}</link>
      <guid isPermaLink="true">${DOMAIN}/blog/${escapeXml(p.slug)}</guid>
      <description>${escapeXml(desc)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@blooglee.com (${escapeXml(p.author_name)})</author>
      <category>${escapeXml(p.category)}</category>
    </item>`;
  }).join("\n");

  const lastBuildDate = posts?.length
    ? new Date(posts[0].published_at).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blooglee Blog</title>
    <link>${DOMAIN}/blog</link>
    <description>Recursos sobre SEO, marketing de contenidos y automatización de blogs con IA</description>
    <language>es</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${DOMAIN}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
