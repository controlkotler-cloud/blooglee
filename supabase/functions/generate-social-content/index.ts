import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

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

const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: `Genera un post de Instagram en {language}.

TONO: Amigo que sabe de marketing y te lo explica fácil. Visual y didáctico.

FORMATO:
- 150-250 palabras
- Emojis moderados: 2-3 máximo, puntuales y con intención (nunca decorativos)
- Estructura: gancho visual (primera línea) > contexto breve > valor práctico > CTA suave
- CTA suave al final: invitar a guardar, comentar o visitar "enlace en bio"
- HASHTAGS AL FINAL: incluir 3-5 hashtags. Siempre #Blooglee + 2-4 de comunidad rotando de la lista del Brand Kit
- Formato: texto plano listo para copiar y pegar, sin formato markdown`,

  linkedin: `Genera un post de LinkedIn en {language}.

TONO: Colega experto tomando un café contigo. Profesional pero cercano, sin corporativismo vacío.

FORMATO:
- 200-400 palabras
- Sin emojis o máximo 1-2 muy puntuales
- Incluye datos, estadísticas o ejemplos concretos cuando sea posible
- Usa saltos de línea generosos para buena legibilidad (una idea por párrafo)
- Estructura: gancho con dato/pregunta > desarrollo con valor > conclusión > CTA con pregunta abierta o invitación a comentar
- HASHTAGS AL FINAL: incluir 2-3 hashtags. #Blooglee + 1-2 de nicho profesional
- Formato: texto plano listo para copiar y pegar, sin formato markdown`,

  facebook: `Genera un post de Facebook en {language}.

TONO: Vecino que te explica las cosas con paciencia. Cercano, explicativo, como si fuera la primera vez que el lector oye hablar del tema.

FORMATO:
- 100-250 palabras
- Emojis moderados: 2-3 máximo
- Estructura: gancho cotidiano > explicación sencilla > valor práctico > pregunta abierta al final para fomentar comentarios
- Usa historias o situaciones reales ("¿Te ha pasado que...?")
- HASHTAGS AL FINAL: incluir 2-3 hashtags. #Blooglee + 1-2 relevantes
- Formato: texto plano listo para copiar y pegar, sin formato markdown`,

  tiktok: `Genera un copy de marketing para TikTok en {language}.
IMPORTANTE: NO generes un guion de vídeo con escenas. Genera un COPY de marketing directo.

TONO: Colega que va al grano. Informal, directo, con energía. Humor sutil permitido.

FORMATO:
- 100-200 palabras
- Copy de marketing directo, NO guion de vídeo, NO escenas numeradas
- Gancho fortísimo en la primera frase (pregunta provocadora, dato impactante o afirmación directa)
- Ritmo rápido, frases cortas
- Emojis: 2-4 máximo, con intención
- CTA tipo "link en bio" o "síguenos para más"
- SIN hashtags (no funcionan en TikTok)
- Formato: texto plano listo para copiar y pegar, sin formato markdown`,
};

const LANGUAGE_MAP: Record<string, string> = {
  spanish: "español de España (tuteo, vosotros)",
  catalan: "catalán",
  english: "inglés",
};

const IMAGE_STYLE_PROMPT_SQUARE = `Professional social media image.

STYLE:
- Abstract, minimal, clean design
- Primary gradient colors: purple (#8B5CF6) to fuchsia (#D946EF) to coral (#F97316)
- Soft flowing shapes, smooth gradients, ample negative space
- NO text, NO logos, NO letters, NO words
- NO realistic photos, NO complex 3D objects
- Simple, elegant, modern

FORMAT: Square 1:1 aspect ratio for social media`;

const IMAGE_STYLE_PROMPT_VERTICAL = `Professional social media image for TikTok/Reels.

STYLE:
- Abstract, minimal, clean design
- Primary gradient colors: purple (#8B5CF6) to fuchsia (#D946EF) to coral (#F97316)
- Soft flowing shapes, smooth gradients, ample negative space
- NO text, NO logos, NO letters, NO words
- NO realistic photos, NO complex 3D objects
- Simple, elegant, modern, vertical composition

FORMAT: Vertical 9:16 aspect ratio for TikTok/Reels`;

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

    const langLabel = LANGUAGE_MAP[language] || "español de España (tuteo, vosotros)";
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
          { role: "system", content: BLOOGLEE_SOCIAL_SYSTEM_PROMPT + "\n\n" + platformPrompt },
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
    const isVertical = platform === 'tiktok';
    const imageStylePrompt = isVertical ? IMAGE_STYLE_PROMPT_VERTICAL : IMAGE_STYLE_PROMPT_SQUARE;
    const imagePrompt = `${imageStylePrompt}\n\nCONCEPT: ${topicForImage}`;

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
