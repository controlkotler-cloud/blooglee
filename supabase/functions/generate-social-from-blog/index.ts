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

const BLOOGLEE_SOCIAL_SYSTEM_PROMPT = `Eres el community manager de Blooglee, una plataforma de automatización de blogs con IA desde Barcelona.

IDENTIDAD DE MARCA:
- Blooglee genera artículos SEO optimizados y los publica en WordPress automáticamente.
- Precio desde 15 €/mes. Hecho en Barcelona.
- Web: blooglee.com | Instagram: @blooglee_

REGLAS ABSOLUTAS DE COMUNICACIÓN:
1. SIEMPRE tutear: "tú" (singular) y "vosotros" (plural). NUNCA "usted/ustedes". Sin excepciones.
2. Español nativo de España. Expresiones naturales permitidas: "echar un vistazo", "ir al grano", "sin complicaciones", "currar", "mola" (con moderación), "basta con", "te lo cuento".
3. PROHIBIDO: anglicismos innecesarios (performar, engagement, insights, leverage, awareness, storytelling), superlativos vacíos (revolucionario, disruptivo, game-changer), mayúsculas agresivas en frases enteras, más de 3 emojis seguidos, frases que suenen a traducción del inglés.
4. Estructura de cada post: Gancho (primera línea impactante) > Contexto > Valor concreto > CTA suave.
5. Cada post debe aportar valor real aunque el lector no conozca Blooglee.
6. Pilares de contenido: Educativo (40%), Producto (25%), Social Proof (20%), Comunidad (15%).

HASHTAGS DE MARCA (rotar, no usar todos a la vez): #Blooglee #TuBlogEnPilotoAutomático #BlogConIA #HechoEnBarcelona
HASHTAGS DE COMUNIDAD (rotar según temática): #SEOenEspañol #MarketingDeContenidos #BloggingTips #PYMEdigital #NegocioLocal #EmprendedoresEspaña #CrecimientoOrgánico

CHECKLIST INTERNA (verificar antes de entregar):
- ¿Usa tú/vosotros? ¿No hay ni un "usted"?
- ¿Suena a español de España natural?
- ¿La primera línea engancha?
- ¿Aporta valor o es solo autopromoción?
- ¿CTA suave y natural?
- ¿Emojis puntuales (2-3 max)?
- ¿Ninguna frase suena a traducción del inglés?`;

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
      copyPrompt: `Genera un post de Instagram en español de España (tuteo, vosotros) para Blooglee.
Audiencia: ${audienceContext}.

TONO: Amigo que sabe de marketing y te lo explica fácil. Visual y didáctico.

FORMATO:
- 150-250 palabras
- Emojis moderados: 2-3 máximo, puntuales y con intención
- Estructura: gancho visual > contexto breve > valor práctico > CTA suave
- CTA: invitar a guardar, comentar o visitar "enlace en bio"
- Menciona que el artículo completo está en "enlace en bio"
- HASHTAGS AL FINAL: 3-5 hashtags. Siempre #Blooglee + 2-4 de comunidad rotando
- Formato: texto plano listo para copiar y pegar, sin markdown
- URL del artículo (para referencia interna): ${postUrl}`,
    },
    {
      platform: "linkedin",
      aspectInstruction: "Crop this image to a 4:5 portrait aspect ratio (1080x1350). Keep the main subject centered. Do NOT add any text, logos, or overlays.",
      storagePath: "social/linkedin/",
      copyPrompt: `Genera un post de LinkedIn en español de España (tuteo, vosotros) para Blooglee.
Audiencia: ${audienceContext}.

TONO: Colega experto tomando un café contigo. Profesional pero cercano, sin corporativismo vacío.

FORMATO:
- 200-400 palabras
- Sin emojis o máximo 1-2 muy puntuales
- Incluye datos, estadísticas o ejemplos concretos
- Saltos de línea generosos (una idea por párrafo)
- Estructura: gancho con dato/pregunta > desarrollo con valor > conclusión > CTA con pregunta abierta
- HASHTAGS AL FINAL: 2-3 hashtags. #Blooglee + 1-2 de nicho profesional
- Incluye el enlace al artículo: ${postUrl}
- Formato: texto plano listo para copiar y pegar, sin markdown`,
    },
    {
      platform: "facebook",
      aspectInstruction: "Crop this image to a 4:5 portrait aspect ratio (1080x1350). Keep the main subject centered. Do NOT add any text, logos, or overlays.",
      storagePath: "social/facebook/",
      copyPrompt: `Genera un post de Facebook en español de España (tuteo, vosotros) para Blooglee.
Audiencia: ${audienceContext}.

TONO: Vecino que te explica las cosas con paciencia. Cercano, explicativo, como si fuera la primera vez.

FORMATO:
- 100-250 palabras
- Emojis moderados: 2-3 máximo
- Usa historias o situaciones reales ("¿Te ha pasado que...?")
- Estructura: gancho cotidiano > explicación sencilla > valor práctico > pregunta abierta al final
- HASHTAGS AL FINAL: 2-3 hashtags. #Blooglee + 1-2 relevantes
- Incluye el enlace al artículo: ${postUrl}
- Formato: texto plano listo para copiar y pegar, sin markdown`,
    },
    {
      platform: "tiktok",
      aspectInstruction: "Crop this image to a 9:16 vertical aspect ratio (1080x1920). Keep the main subject centered. Do NOT add any text, logos, or overlays.",
      storagePath: "social/tiktok/",
      copyPrompt: `Genera un copy de marketing para TikTok en español de España (tuteo, vosotros) para Blooglee.
IMPORTANTE: NO generes un guion de vídeo con escenas. Genera un COPY de marketing directo.
Audiencia: ${audienceContext}.

TONO: Colega que va al grano. Informal, directo, con energía. Humor sutil permitido.

FORMATO:
- 100-200 palabras
- Copy de marketing directo, NO guion de vídeo, NO escenas numeradas
- Gancho fortísimo en la primera frase
- Ritmo rápido, frases cortas
- Emojis: 2-4 máximo
- CTA tipo "link en bio" o "síguenos para más"
- SIN hashtags (no funcionan en TikTok)
- Menciona el artículo completo en el enlace en bio
- Formato: texto plano listo para copiar y pegar, sin markdown`,
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
        model: "google/gemini-3-pro-image-preview",
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
          content: BLOOGLEE_SOCIAL_SYSTEM_PROMPT,
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
      content_type: "post",
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
