import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: `Genera un post de Instagram en {language}.
Reglas:
- 150-250 palabras
- Emojis moderados (3-5 max)
- Tono cercano y visual
- CTA al final invitando a interactuar
- SIN hashtags
- Formato: texto plano listo para copiar y pegar`,

  linkedin: `Genera un post de LinkedIn en {language}.
Reglas:
- 200-500 palabras
- Tono profesional pero accesible
- Incluye datos o estadísticas relevantes cuando sea posible
- CTA al final (pregunta o invitación a comentar)
- SIN hashtags
- Usa saltos de línea para buena legibilidad
- Formato: texto plano listo para copiar y pegar`,

  facebook: `Genera un post de Facebook en {language}.
Reglas:
- 100-300 palabras
- Tono conversacional y amigable
- Termina con una pregunta para fomentar interacción
- SIN hashtags
- Formato: texto plano listo para copiar y pegar`,

  tiktok: `Genera un guion de TikTok/Reel de 30-60 segundos en {language}.
Reglas:
- Formato estructurado por escenas
- Cada escena con: duración, texto en pantalla, narración
- Gancho fuerte en los primeros 3 segundos
- CTA al final
- SIN hashtags
- Formato JSON array de escenas: [{"scene": 1, "duration": "0-3s", "screen_text": "...", "narration": "...", "visual": "..."}]`,
};

const LANGUAGE_MAP: Record<string, string> = {
  spanish: "español",
  catalan: "catalán", 
  english: "inglés",
};

const IMAGE_STYLE_PROMPT = `Create a visually striking social media image in a modern 3D abstract style. 
Use a gradient color palette of violet (#8B5CF6), fuchsia (#D946EF), and orange (#F97316).
Include floating 3D geometric elements (spheres, cubes, abstract shapes) with glass/metallic materials.
The composition should be clean and professional, suitable for social media.
No text on the image. Ultra high resolution.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { blogPostId, platform, contentType, language, customTopic } = await req.json();

    if (!platform || !language) {
      return new Response(JSON.stringify({ error: "platform and language are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get blog post content if provided
    let blogContent = "";
    let blogTitle = "";
    if (blogPostId) {
      const { data: post } = await supabase
        .from("blog_posts")
        .select("title, content, excerpt")
        .eq("id", blogPostId)
        .single();
      if (post) {
        blogTitle = post.title;
        blogContent = `Título: ${post.title}\nResumen: ${post.excerpt}\nContenido: ${post.content.substring(0, 3000)}`;
      }
    }

    const langLabel = LANGUAGE_MAP[language] || "español";
    const platformPrompt = (PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.instagram)
      .replace("{language}", langLabel);

    const topicContext = blogContent
      ? `Adapta el siguiente artículo de blog para redes sociales:\n\n${blogContent}`
      : `Tema: ${customTopic || "Marketing digital y SEO"}`;

    // Generate text content
    const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Eres un experto en social media marketing para Blooglee, una plataforma de generación automática de contenido SEO para blogs.\n\n${platformPrompt}` },
          { role: "user", content: topicContext },
        ],
      }),
    });

    if (!textResponse.ok) {
      const errText = await textResponse.text();
      console.error("AI text error:", textResponse.status, errText);
      throw new Error(`AI gateway error: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const generatedContent = textData.choices?.[0]?.message?.content || "";

    // Generate title
    const title = blogTitle
      ? `${platform.toUpperCase()} - ${blogTitle.substring(0, 60)}`
      : `${platform.toUpperCase()} - ${(customTopic || "Post").substring(0, 60)}`;

    // Generate image
    let imageUrl: string | null = null;
    const topicForImage = customTopic || blogTitle || "digital marketing SEO";
    const imagePrompt = `${IMAGE_STYLE_PROMPT}\nTopic hint: ${topicForImage}`;

    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const base64Url = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (base64Url) {
          const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `social/${platform}/${crypto.randomUUID()}.png`;
          
          const { error: uploadError } = await supabase.storage
            .from("article-images")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        }
      }
    } catch (imgErr) {
      console.error("Image generation error (non-fatal):", imgErr);
    }

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("social_content")
      .insert({
        blog_post_id: blogPostId || null,
        platform,
        content_type: contentType || "post",
        title,
        content: generatedContent,
        media_prompt: imagePrompt,
        image_url: imageUrl,
        status: "draft",
        language,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-social-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
