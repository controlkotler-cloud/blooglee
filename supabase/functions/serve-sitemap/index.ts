import { createClient } from "npm:@supabase/supabase-js@2";

const DOMAIN = "https://blooglee.com";

const STATIC_PAGES = [
  // Main pages
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/features", priority: "0.9", changefreq: "weekly" },
  { loc: "/pricing", priority: "0.9", changefreq: "weekly" },
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  { loc: "/contact", priority: "0.7", changefreq: "monthly" },
  { loc: "/como-funciona", priority: "0.9", changefreq: "monthly" },
  { loc: "/recursos", priority: "0.8", changefreq: "weekly" },
  { loc: "/help", priority: "0.7", changefreq: "monthly" },
  { loc: "/waitlist", priority: "0.6", changefreq: "monthly" },
  // Use cases
  { loc: "/para/clinicas", priority: "0.8", changefreq: "monthly" },
  { loc: "/para/agencias-marketing", priority: "0.8", changefreq: "monthly" },
  { loc: "/para/tiendas-online", priority: "0.8", changefreq: "monthly" },
  { loc: "/para/autonomos", priority: "0.8", changefreq: "monthly" },
  // Alternatives
  { loc: "/alternativas", priority: "0.8", changefreq: "monthly" },
  { loc: "/alternativas/nextblog", priority: "0.8", changefreq: "monthly" },
  { loc: "/alternativas/jasper", priority: "0.8", changefreq: "monthly" },
  { loc: "/alternativas/copy-ai", priority: "0.8", changefreq: "monthly" },
  // Legal
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/cookies", priority: "0.3", changefreq: "yearly" },
  // AI discovery
  { loc: "/llms.txt", priority: "0.5", changefreq: "monthly" },
];

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    // Fetch all published blog posts
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, published_at, updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error.message);
      throw error;
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += `  <url>\n    <loc>${DOMAIN}${escapeXml(page.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    // Blog posts
    for (const post of posts || []) {
      const lastmod = (post.updated_at || post.published_at || today).split("T")[0];
      xml += `  <url>\n    <loc>${DOMAIN}/blog/${escapeXml(post.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
};

Deno.serve(handler);
