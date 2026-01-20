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

    // ========== PASO 1: Generar artículo en español ==========
    const spanishSystemPrompt = `Eres un redactor experto en contenido farmacéutico y SEO. Generas artículos de blog profesionales para farmacias.

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

    const spanishUserPrompt = `FARMACIA: ${pharmacy.name}
POBLACIÓN: ${pharmacy.location}
FECHA DEL ARTÍCULO: ${dateContext} (usa esta fecha para cualquier referencia temporal)

TEMA DEL ARTÍCULO: ${topic.tema}
Keywords SEO: ${topic.keywords.join(", ")}

INSTRUCCIONES ESPECIALES:
- El artículo debe ser para ${dateContext}, asegúrate de que todas las referencias temporales sean correctas.
- Personaliza el contenido para ${pharmacy.location}: menciona características locales, clima de la zona, costumbres regionales si aplica.
- Evita comenzar con "Guía de..." o "Guía para..." - usa títulos más creativos y variados.
- Haz que el contenido sea único y específico para esta farmacia en particular.

Genera el artículo completo EN ESPAÑOL. RESPONDE SOLO CON JSON VÁLIDO en este formato exacto:
{
  "title": "Título H1 del artículo en español (creativo, no empieces con 'Guía')",
  "meta_description": "Meta descripción de 150-160 caracteres",
  "slug": "slug-url-amigable-sin-tildes",
  "content": "<h2>Primera sección</h2><p>Contenido...</p><h2>Segunda sección</h2><p>Más contenido...</p>"
}`;

    console.log("Generating Spanish article for:", pharmacy.name, "Topic:", topic.tema, "Date:", dateContext);

    // Generate Spanish article
    const spanishResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: spanishSystemPrompt },
          { role: "user", content: spanishUserPrompt },
        ],
        max_tokens: 8000,
      }),
    });

    if (!spanishResponse.ok) {
      if (spanishResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (spanishResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await spanishResponse.text();
      console.error("AI gateway error (Spanish):", spanishResponse.status, errorText);
      throw new Error(`AI gateway error: ${spanishResponse.status}`);
    }

    const spanishData = await spanishResponse.json();
    const spanishContent = spanishData.choices?.[0]?.message?.content;
    
    if (!spanishContent) {
      throw new Error("No Spanish content received from AI");
    }

    console.log("Spanish AI response received, parsing JSON...");

    // Parse Spanish JSON
    let spanishArticle;
    try {
      const jsonMatch = spanishContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        spanishArticle = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in Spanish response");
      }
    } catch (parseError) {
      console.error("JSON parse error (Spanish):", parseError, "Content:", spanishContent.substring(0, 500));
      throw new Error("Failed to parse Spanish AI response as JSON");
    }

    console.log("Spanish article parsed successfully. Title:", spanishArticle.title?.substring(0, 50));

    // ========== PASO 2: Generar versión en catalán (si es necesario) ==========
    let catalanArticle = null;
    
    if (includesCatalan) {
      console.log("Generating Catalan version from Spanish content...");
      
      const catalanSystemPrompt = `Ets un redactor professional NADIU de català. La teva tasca és redactar articles en un català correcte, natural i fluid.

REGLES IMPORTANTS:
- NO TRADUEIXIS literalment del castellà. REDACTA de nou en català com ho faria un parlant nadiu.
- Utilitza vocabulari genuïnament català, evitant castellanismes.
- Usa expressions i girs propis del català.
- Mantén l'estructura i el contingut de l'article original, però adapta'l al català natural.
- Ortografia i gramàtica catalana impecables (accent obert/tancat, ela geminada, etc.).
- Meta descripció de 150-160 caràcters en català correcte.
- Slug URL sense accents ni caràcters especials.

EXEMPLES DE BON CATALÀ:
- "desenvolupament" (no "desarrollo")
- "assolir" (no "aconseguir" quan significa "lograr")
- "arreu" (no "per tot arreu")
- "malgrat" (no "a pesar de")
- "enguany" (no "aquest any")
- "també" / "tampoc" (mai amb accent gràfic en certes formes)

RESPÓN SEMPRE EN JSON VÀLID.`;

      const catalanUserPrompt = `A partir de l'article següent en castellà, redacta una versió en CATALÀ CORRECTE i NATURAL.

ARTICLE ORIGINAL EN CASTELLÀ:
Títol: ${spanishArticle.title}
Meta descripció: ${spanishArticle.meta_description}
Contingut: ${spanishArticle.content}

FARMÀCIA: ${pharmacy.name}
POBLACIÓ: ${pharmacy.location}
DATA: ${dateContext}

IMPORTANT: 
- Redacta com un parlant nadiu de català, NO tradueixis literalment.
- Adapta expressions, vocabulari i sintaxi al català natural.
- Mantén les mencions a la farmàcia i la població.
- Assegura't que totes les paraules estiguin correctament escrites en català.

RESPÓN NOMÉS AMB JSON VÀLID en aquest format exacte:
{
  "title": "Títol H1 de l'article en català correcte",
  "meta_description": "Meta descripció de 150-160 caràcters en català",
  "slug": "slug-url-amigable-sense-accents",
  "content": "<h2>Primera secció</h2><p>Contingut en català natural...</p>"
}`;

      const catalanResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: catalanSystemPrompt },
            { role: "user", content: catalanUserPrompt },
          ],
          max_tokens: 8000,
        }),
      });

      if (catalanResponse.ok) {
        const catalanData = await catalanResponse.json();
        const catalanContent = catalanData.choices?.[0]?.message?.content;
        
        if (catalanContent) {
          try {
            const jsonMatch = catalanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              catalanArticle = JSON.parse(jsonMatch[0]);
              console.log("Catalan article parsed successfully. Title:", catalanArticle.title?.substring(0, 50));
            }
          } catch (parseError) {
            console.error("JSON parse error (Catalan):", parseError);
            // Continue without Catalan if parsing fails
          }
        }
      } else {
        console.error("Catalan generation failed:", catalanResponse.status);
        // Continue without Catalan if generation fails
      }
    }

    // ========== PASO 3: Buscar imagen en Pexels ==========
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
      const pexelsResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(enhancedQuery)}&per_page=50&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );

      if (pexelsResponse.ok) {
        const pexelsData = await pexelsResponse.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          const suitablePhotos = pexelsData.photos.filter((photo: { 
            avg_color: string; 
            src: { large: string };
            alt?: string;
          }) => {
            if (usedImageUrls.includes(photo.src.large)) {
              return false;
            }
            
            const altText = (photo.alt || "").toLowerCase();
            if (EXCLUDED_TERMS.some(term => altText.includes(term))) {
              return false;
            }
            
            const avgColor = photo.avg_color;
            if (!avgColor) return true;
            
            const r = parseInt(avgColor.slice(1, 3), 16);
            const g = parseInt(avgColor.slice(3, 5), 16);
            const b = parseInt(avgColor.slice(5, 7), 16);
            
            const brightness = (r + g + b) / 3;
            const maxChannel = Math.max(r, g, b);
            const minChannel = Math.min(r, g, b);
            const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;
            
            return brightness > 80 && brightness < 230 && saturation < 0.8;
          });
          
          console.log("Suitable photos after filtering:", suitablePhotos.length, "out of", pexelsData.photos.length);
          
          if (suitablePhotos.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(15, suitablePhotos.length));
            const selectedPhoto = suitablePhotos[randomIndex];
            
            imageData = {
              url: selectedPhoto.src.large,
              photographer: selectedPhoto.photographer,
              photographer_url: selectedPhoto.photographer_url,
            };
            console.log("Selected image from photographer:", selectedPhoto.photographer);
          } else {
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
        content: {
          spanish: spanishArticle,
          catalan: catalanArticle,
        },
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
