import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TopicData {
  tema: string;
  keywords: string[];
  pexels_query: string;
}

interface PharmacyData {
  name: string;
  location: string;
  languages: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pharmacy, topic }: { pharmacy: PharmacyData; topic: TopicData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!PEXELS_API_KEY) {
      throw new Error("PEXELS_API_KEY is not configured");
    }

    const includesCatalan = pharmacy.languages?.includes("catalan");
    
    const languageInstructions = includesCatalan
      ? `Genera DOS versiones del artículo: una en ESPAÑOL y otra en CATALÁN (no traducción, escribe nativamente en cada idioma).`
      : `Genera el artículo en ESPAÑOL.`;

    const systemPrompt = `Eres un redactor experto en contenido farmacéutico y SEO. Generas artículos de blog profesionales para farmacias.

REGLAS IMPORTANTES:
- Genera contenido de ~2000 palabras
- Incluye título H1 atractivo con keyword principal y ubicación
- Meta descripción de 150-160 caracteres
- Slug URL amigable sin tildes ni caracteres especiales
- Estructura: introducción + 4-5 secciones H2 + conclusión con CTA
- Menciona la farmacia 2-3 veces y la población 2-3 veces
- Tono profesional pero cercano
- El contenido debe estar en formato HTML con tags <h2>, <p>, <ul>, <li>

RESPONDE SIEMPRE EN JSON VÁLIDO.`;

    const userPrompt = `FARMACIA: ${pharmacy.name}
POBLACIÓN: ${pharmacy.location}
IDIOMAS REQUERIDOS: ${pharmacy.languages?.join(", ") || "spanish"}

TEMA DEL ARTÍCULO: ${topic.tema}
Keywords SEO: ${topic.keywords.join(", ")}

${languageInstructions}

Genera el artículo completo. RESPONDE SOLO CON JSON VÁLIDO en este formato exacto:
{
  "spanish": {
    "title": "Título H1 del artículo en español",
    "meta_description": "Meta descripción de 150-160 caracteres",
    "slug": "slug-url-amigable-sin-tildes",
    "content": "<h2>Primera sección</h2><p>Contenido...</p><h2>Segunda sección</h2><p>Más contenido...</p>"
  }${includesCatalan ? `,
  "catalan": {
    "title": "Títol H1 de l'article en català",
    "meta_description": "Meta descripció de 150-160 caràcters",
    "slug": "slug-url-amigable-sense-accents",
    "content": "<h2>Primera secció</h2><p>Contingut...</p>"
  }` : ""}
}`;

    console.log("Generating article for:", pharmacy.name, "Topic:", topic.tema);

    // Generate article content using Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error("No content received from AI");
    }

    console.log("AI response received, parsing JSON...");

    // Parse the JSON from AI response
    let articleContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", aiContent.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    // Search for image on Pexels
    console.log("Searching Pexels for:", topic.pexels_query);
    
    let imageData = {
      url: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg",
      photographer: "Pexels",
      photographer_url: "https://pexels.com",
    };

    try {
      const pexelsResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(topic.pexels_query)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );

      if (pexelsResponse.ok) {
        const pexelsData = await pexelsResponse.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          const randomPhoto = pexelsData.photos[Math.floor(Math.random() * pexelsData.photos.length)];
          imageData = {
            url: randomPhoto.src.large,
            photographer: randomPhoto.photographer,
            photographer_url: randomPhoto.photographer_url,
          };
        }
      }
    } catch (pexelsError) {
      console.error("Pexels error (using fallback):", pexelsError);
    }

    console.log("Article generated successfully");

    return new Response(
      JSON.stringify({
        content: articleContent,
        image: imageData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate article error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
