import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface PlatformConfig {
  platform: string;
  aspectInstruction: string;
  storagePath: string;
  copyPrompt: string;
}

const BLOG_URL_BASE = "https://blooglee.com/blog/";

function buildPlatformConfigs(slug: string, audience: string): PlatformConfig[] {
  const postUrl = `${BLOG_URL_BASE}${slug}`;
  const audienceContext = audience === "empresas"
    ? "empresas y negocios que quieren mejorar su presencia digital"
    : "agencias de marketing y profesionales del sector";

  return [
    {
      platform: "instagram",
      aspectInstruction: "Crop this image to a 4:5 portrait aspect ratio (1080x1350). Keep the main subject centered. Do NOT add any text, logos, or overlays.",
      storagePath: "social/instagram/",
      copyPrompt: `Genera un post de Instagram en español para Blooglee.
Blooglee es una plataforma de generación automática de artículos SEO para blogs.
Audiencia: ${audienceContext}.

Reglas:
- 150-250 palabras
- Emojis moderados (3-5 max)
- Tono cercano y visual
- CTA al final invitando a leer el artículo completo
- Menciona "enlace en bio" para dirigir al artículo
- SIN hashtags
- Formato: texto plano listo para copiar y pegar
- URL del artículo (para referencia interna): ${postUrl}`,
    },
    {
      platform: "linkedin",
      aspectInstruction: "Crop this image to a 4:5 portrait aspect ratio (1080x1350). Keep the main subject centered. Do NOT add any text, logos, or overlays.",
      storagePath: "social/linkedin/",
      copyPrompt: `Genera un post de LinkedIn en español para Blooglee.
Blooglee es una plataforma de generación automática de artículos SEO para blogs.
Audiencia: ${audienceContext}.

Reglas:
- 200-400 palabras
- Tono profesional pero accesible
- Incluye datos o estadísticas relevantes cuando sea posible
- CTA al final con enlace directo al artículo
- SIN hashtags
- Usa saltos de línea para buena legibilidad
- Incluye el enlace al artículo: ${postUrl}
- Formato: texto plano listo para copiar y pegar`,
    },
    {
      platform: "facebook",
      aspectInstruction: "Crop this image to a 4:5 portrait aspect ratio (1080x1350). Keep the main subject centered. Do NOT add any text, logos, or overlays.",
      storagePath: "social/facebook/",
      copyPrompt: `Genera un post de Facebook en español para Blooglee.
Blooglee es una plataforma de generación automática de artículos SEO para blogs.
Audiencia: ${audienceContext}.

Reglas:
- 100-250 palabras
- Tono conversacional y amigable
- Termina con una pregunta para fomentar interacción
- SIN hashtags
- Incluye el enlace al artículo: ${postUrl}
- Formato: texto plano listo para copiar y pegar`,
    },
    {
      platform: "tiktok",
      aspectInstruction: "Crop this image to a 9:16 vertical aspect ratio (1080x1920). Keep the main subject centered. Do NOT add any text, logos, or overlays.",
      storagePath: "social/tiktok/",
      copyPrompt: `Genera un guion de TikTok/Reel de 30-60 segundos en español para Blooglee.
Blooglee es una plataforma de generación automática de artículos SEO para blogs.
Audiencia: ${audienceContext}.

Reglas:
- Formato estructurado por escenas
- Cada escena con: duración, texto en pantalla, narración
- Gancho fuerte en los primeros 3 segundos
- CTA al final dirigiendo al artículo: ${postUrl}
- SIN hashtags
- Formato: lista de escenas numeradas`,
    },
  ];
}

async function adaptImage(
  imageUrl: string,
  instruction: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error(`Image adapt error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const base64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!base64Url) return null;

    const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
    return base64Data;
  } catch (err) {
    console.error("Image adaptation failed:", err);
    return null;
  }
}

async function generateCopy(
  title: string,
  excerpt: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "Eres un experto en social media marketing. Generas contenido adaptado para cada plataforma social. Nunca incluyes hashtags.",
        },
        {
          role: "user",
          content: `Artículo de blog:\nTítulo: ${title}\nResumen: ${excerpt}\n\n${prompt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI text error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function processPlatform(
  config: PlatformConfig,
  blogPostId: string,
  title: string,
  excerpt: string,
  imageUrl: string | null,
  blogPostUrl: string,
  apiKey: string,
  supabase: any
): Promise<void> {
  console.log(`Processing ${config.platform}...`);

  // Generate copy
  const content = await generateCopy(title, excerpt, config.copyPrompt, apiKey);
  console.log(`${config.platform} copy generated (${content.length} chars)`);

  // Adapt image
  let platformImageUrl: string | null = null;
  if (imageUrl) {
    const base64 = await adaptImage(imageUrl, config.aspectInstruction, apiKey);
    if (base64) {
      const binaryData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const fileName = `${config.storagePath}${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(fileName);
        platformImageUrl = urlData.publicUrl;
        console.log(`${config.platform} image uploaded`);
      } else {
        console.error(`${config.platform} image upload error:`, uploadError.message);
      }
    } else {
      // Fallback: use original image
      platformImageUrl = imageUrl;
    }
  }

  // Save to DB
  const { error: saveError } = await supabase
    .from("social_content")
    .insert({
      blog_post_id: blogPostId,
      blog_post_url: blogPostUrl,
      platform: config.platform,
      content_type: config.platform === "tiktok" ? "video_script" : "post",
      title: `${config.platform.toUpperCase()} - ${title.substring(0, 60)}`,
      content,
      media_prompt: config.aspectInstruction,
      image_url: platformImageUrl,
      status: "draft",
      language: "spanish",
    });

  if (saveError) {
    console.error(`${config.platform} save error:`, saveError.message);
  } else {
    console.log(`${config.platform} saved to social_content`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { blogPostId, title, excerpt, slug, imageUrl, audience } = await req.json();

    if (!blogPostId || !title || !slug) {
      return new Response(
        JSON.stringify({ error: "blogPostId, title, and slug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const blogPostUrl = `${BLOG_URL_BASE}${slug}`;
    const configs = buildPlatformConfigs(slug, audience || "empresas");

    console.log(`Generating social content for: "${title}" (${configs.length} platforms)`);

    // Process all platforms in parallel
    const results = await Promise.allSettled(
      configs.map((config) =>
        processPlatform(
          config,
          blogPostId,
          title,
          excerpt || "",
          imageUrl || null,
          blogPostUrl,
          LOVABLE_API_KEY,
          supabase
        )
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Social generation complete: ${succeeded} succeeded, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, platforms: { succeeded, failed } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-social-from-blog error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
