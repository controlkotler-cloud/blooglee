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

interface RequestBody {
  pharmacy: PharmacyData;
  topic: TopicData;
  month: number;
  year: number;
  usedImageUrls?: string[];
}

// Términos a excluir en búsquedas de Pexels para evitar productos farmacéuticos
const EXCLUDED_TERMS = ["pill", "capsule", "medicine", "drug", "pharmaceutical", "bottle", "tablet", "prescription"];

// Queries genéricos de bienestar para diversificar imágenes
const WELLNESS_QUERIES = [
  "wellness nature peaceful calm",
  "healthy lifestyle botanical garden",
  "spa relaxation natural beauty",
  "meditation calm serene nature",
  "botanical herbs plants natural",
  "fresh healthy outdoor wellness",
  "calm peaceful woman nature",
  "natural beauty care wellness",
  "healthy food nutrition colorful",
  "yoga relaxation peaceful outdoor"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pharmacy, topic, month, year, usedImageUrls = [] }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!PEXELS_API_KEY) {
      throw new Error("PEXELS_API_KEY is not configured");
    }

    // Obtener fecha real para el prompt
    const monthNames = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    const monthName = monthNames[currentMonth - 1];
    const dateContext = `${monthName} de ${currentYear}`;

    console.log("Pharmacy languages received:", pharmacy.languages);
    const includesCatalan = pharmacy.languages?.includes("catalan");
    console.log("Includes Catalan:", includesCatalan);
    console.log("Date context:", dateContext);
    console.log("Used image URLs count:", usedImageUrls.length);
    
    const languageInstructions = includesCatalan
      ? `Genera DOS versiones del artículo: una en ESPAÑOL y otra en CATALÁN (no traducción, escribe nativamente en cada idioma).`
      : `Genera el artículo en ESPAÑOL.`;

    const systemPrompt = `Eres un redactor experto en contenido farmacéutico y SEO. Generas artículos de blog profesionales para farmacias.

REGLAS IMPORTANTES:
- La fecha actual es ${dateContext.toUpperCase()}. TODAS las referencias temporales deben ser coherentes con esta fecha.
- Genera contenido de ~2000 palabras
- Incluye título H1 atractivo con keyword principal y ubicación
- Meta descripción de 150-160 caracteres
- Slug URL amigable sin tildes ni caracteres especiales
- Estructura: introducción + 4-5 secciones H2 + conclusión con CTA
- Menciona la farmacia 2-3 veces y la población 2-3 veces
- Tono profesional pero cercano
- El contenido debe estar en formato HTML con tags <h2>, <p>, <ul>, <li>
- IMPORTANTE: Personaliza el contenido según la ubicación geográfica de la farmacia. Incluye referencias locales, clima de la zona, y particularidades regionales.
- VARIEDAD: Aunque el tema sea similar, cada artículo debe tener un enfoque único basado en la farmacia y su ubicación.

RESPONDE SIEMPRE EN JSON VÁLIDO.`;

    const userPrompt = `FARMACIA: ${pharmacy.name}
POBLACIÓN: ${pharmacy.location}
FECHA DEL ARTÍCULO: ${dateContext} (usa esta fecha para cualquier referencia temporal)
IDIOMAS REQUERIDOS: ${pharmacy.languages?.join(", ") || "spanish"}

TEMA DEL ARTÍCULO: ${topic.tema}
Keywords SEO: ${topic.keywords.join(", ")}

INSTRUCCIONES ESPECIALES:
- El artículo debe ser para ${dateContext}, asegúrate de que todas las referencias temporales sean correctas.
- Personaliza el contenido para ${pharmacy.location}: menciona características locales, clima de la zona, costumbres regionales si aplica.
- Evita comenzar con "Guía de..." o "Guía para..." - usa títulos más creativos y variados.
- Haz que el contenido sea único y específico para esta farmacia en particular.

${languageInstructions}

Genera el artículo completo. RESPONDE SOLO CON JSON VÁLIDO en este formato exacto:
{
  "spanish": {
    "title": "Título H1 del artículo en español (creativo, no empieces con 'Guía')",
    "meta_description": "Meta descripción de 150-160 caracteres",
    "slug": "slug-url-amigable-sin-tildes",
    "content": "<h2>Primera sección</h2><p>Contenido...</p><h2>Segunda sección</h2><p>Más contenido...</p>"
  }${includesCatalan ? `,
  "catalan": {
    "title": "Títol H1 de l'article en català (creatiu, no comencis amb 'Guia')",
    "meta_description": "Meta descripció de 150-160 caràcters",
    "slug": "slug-url-amigable-sense-accents",
    "content": "<h2>Primera secció</h2><p>Contingut...</p>"
  }` : ""}
}`;

    console.log("Generating article for:", pharmacy.name, "Topic:", topic.tema, "Languages:", pharmacy.languages?.join(", "), "Date:", dateContext);

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

    console.log("Article content parsed. Has Catalan:", !!articleContent.catalan);

    // Search for image on Pexels with wellness-focused terms
    // Combine topic query with random wellness query for variety
    const randomWellnessQuery = WELLNESS_QUERIES[Math.floor(Math.random() * WELLNESS_QUERIES.length)];
    const baseQuery = topic.pexels_query.replace(/pharmacy|medicine|drug|pill|capsule|bottle/gi, "wellness");
    const enhancedQuery = `${baseQuery} ${randomWellnessQuery.split(" ").slice(0, 2).join(" ")}`;
    
    console.log("Searching Pexels for:", enhancedQuery);
    console.log("Excluding URLs:", usedImageUrls.length, "images");
    
    let imageData = {
      url: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg",
      photographer: "Pexels",
      photographer_url: "https://pexels.com",
    };

    try {
      // Request more photos to have better variety
      const pexelsResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(enhancedQuery)}&per_page=50&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );

      if (pexelsResponse.ok) {
        const pexelsData = await pexelsResponse.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          // Filter out already used images and inappropriate images
          const suitablePhotos = pexelsData.photos.filter((photo: { 
            avg_color: string; 
            src: { large: string };
            alt?: string;
          }) => {
            // Exclude already used URLs
            if (usedImageUrls.includes(photo.src.large)) {
              console.log("Excluding already used image:", photo.src.large.substring(0, 50));
              return false;
            }
            
            // Check alt text for excluded terms
            const altText = (photo.alt || "").toLowerCase();
            if (EXCLUDED_TERMS.some(term => altText.includes(term))) {
              console.log("Excluding image with pharmaceutical content:", photo.alt);
              return false;
            }
            
            // Parse the average color to check if it's not too intense/saturated
            const avgColor = photo.avg_color;
            if (!avgColor) return true;
            
            // Simple heuristic: prefer photos that aren't too dark or too saturated
            const r = parseInt(avgColor.slice(1, 3), 16);
            const g = parseInt(avgColor.slice(3, 5), 16);
            const b = parseInt(avgColor.slice(5, 7), 16);
            
            // Avoid very dark or very saturated images
            const brightness = (r + g + b) / 3;
            const maxChannel = Math.max(r, g, b);
            const minChannel = Math.min(r, g, b);
            const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;
            
            return brightness > 80 && brightness < 230 && saturation < 0.8;
          });
          
          console.log("Suitable photos after filtering:", suitablePhotos.length, "out of", pexelsData.photos.length);
          
          if (suitablePhotos.length > 0) {
            // Select a random photo from the suitable ones (first 15 for quality)
            const randomIndex = Math.floor(Math.random() * Math.min(15, suitablePhotos.length));
            const selectedPhoto = suitablePhotos[randomIndex];
            
            imageData = {
              url: selectedPhoto.src.large,
              photographer: selectedPhoto.photographer,
              photographer_url: selectedPhoto.photographer_url,
            };
            console.log("Selected image from photographer:", selectedPhoto.photographer);
          } else {
            // Try a fallback query if no suitable photos found
            console.log("No suitable photos, trying fallback query...");
            const fallbackQuery = "wellness nature botanical peaceful";
            const fallbackResponse = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(fallbackQuery)}&per_page=30&orientation=landscape`,
              { headers: { Authorization: PEXELS_API_KEY } }
            );
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              const fallbackPhotos = fallbackData.photos?.filter((p: { src: { large: string } }) => 
                !usedImageUrls.includes(p.src.large)
              ) || [];
              
              if (fallbackPhotos.length > 0) {
                const randomFallback = fallbackPhotos[Math.floor(Math.random() * Math.min(10, fallbackPhotos.length))];
                imageData = {
                  url: randomFallback.src.large,
                  photographer: randomFallback.photographer,
                  photographer_url: randomFallback.photographer_url,
                };
                console.log("Selected fallback image from photographer:", randomFallback.photographer);
              }
            }
          }
        }
      } else {
        console.error("Pexels API error:", pexelsResponse.status);
      }
    } catch (pexelsError) {
      console.error("Pexels error (using fallback):", pexelsError);
    }

    console.log("Article generated successfully with image:", imageData.url.substring(0, 50));

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