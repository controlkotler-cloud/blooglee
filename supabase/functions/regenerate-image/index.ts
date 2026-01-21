import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  pexelsQuery: string;
  usedImageUrls?: string[];
  articleTitle?: string;
  articleContent?: string;
}

// Fallback queries for when AI query generation fails
const FALLBACK_QUERIES = [
  "natural wellness beauty care",
  "healthy lifestyle nature",
  "botanical plants herbs natural",
  "fresh fruits vegetables healthy",
  "skincare cream beauty treatment",
  "woman relaxation spa wellness",
  "natural ingredients organic beauty"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pexelsQuery, usedImageUrls = [], articleTitle, articleContent }: RequestBody = await req.json();
    
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
    }

    console.log("Regenerating image for article:", articleTitle || "No title provided");
    console.log("Excluding URLs:", usedImageUrls.length, "images");

    let searchQuery = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];

    // Si tenemos título y contenido del artículo, usar IA para generar query
    if (LOVABLE_API_KEY && (articleTitle || articleContent)) {
      console.log("Generating image search query with AI...");
      
      const cleanTextContent = articleContent
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 500) || '';

      const imageQueryPrompt = `Analiza el siguiente artículo y genera UN ÚNICO query de búsqueda para encontrar una imagen de stock relevante en Unsplash.

TÍTULO DEL ARTÍCULO: ${articleTitle || "Sin título"}
EXTRACTO DEL CONTENIDO: ${cleanTextContent || "Sin contenido"}

REGLAS ESTRICTAS para el query:
1. Máximo 4-5 palabras en INGLÉS (Unsplash funciona mejor en inglés)
2. PROHIBIDO TOTALMENTE incluir estas palabras: pharmacy, pharmacist, pharmacies, medicine, medicines, pills, pill, drugs, drug, doctor, doctors, hospital, medical, medications, medication, capsule, capsules, prescription, prescriptions, bottle, bottles, pharmaceutical, clinic, nurse, patient, healthcare, health care, treatment
3. PROHIBIDO incluir nombres de marcas comerciales
4. Busca conceptos VISUALES y NATURALES relacionados con el tema
5. Enfócate en: ingredientes naturales, texturas, ambientes relajantes, elementos de la naturaleza, estilo de vida saludable, bienestar
6. Piensa en imágenes bonitas y evocadoras, no clínicas ni médicas
7. IMPORTANTE: Genera un query DIFERENTE al anterior para obtener variedad

EJEMPLOS DE BUENOS QUERIES:
- Para artículo de cosmética natural: "natural skincare cream woman face"
- Para artículo de vitaminas: "fresh citrus fruits orange healthy"
- Para artículo de cuidado capilar: "woman beautiful hair care natural"
- Para artículo de hidratación: "woman drinking water healthy lifestyle"
- Para artículo de protección solar: "woman beach sunlight summer skin"
- Para artículo de defensas: "fresh vegetables fruits colorful healthy"

EJEMPLOS DE MALOS QUERIES (NUNCA USES ESTOS):
- "pharmacy medicine pills" ❌
- "doctor patient consultation" ❌
- "medical treatment hospital" ❌
- "drug store pharmacist" ❌

RESPONDE SOLO con el query en inglés, sin explicaciones, sin comillas, sin puntuación final.`;

      try {
        const imageQueryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "user", content: imageQueryPrompt },
            ],
            max_tokens: 50,
          }),
        });

        if (imageQueryResponse.ok) {
          const queryData = await imageQueryResponse.json();
          const rawQuery = queryData.choices?.[0]?.message?.content?.trim();
          
          if (rawQuery && rawQuery.length > 5 && rawQuery.length < 100) {
            // Limpiar cualquier término prohibido que se haya colado
            const cleanedQuery = rawQuery
              .toLowerCase()
              .replace(/pharmacy|pharmacist|pharmacies|medicine|medicines|pills?|drugs?|doctor|doctors?|hospital|medical|medications?|capsules?|prescriptions?|bottles?|pharmaceutical|clinic|nurse|patient|healthcare|treatment/gi, "")
              .replace(/\s+/g, " ")
              .trim();
            
            if (cleanedQuery.length > 5) {
              searchQuery = cleanedQuery;
              console.log("AI generated image query:", searchQuery);
            } else {
              console.warn("AI query was cleaned to empty, using fallback");
            }
          } else {
            console.warn("AI query response invalid, using fallback");
          }
        } else {
          console.warn("Failed to generate AI image query, status:", imageQueryResponse.status);
        }
      } catch (queryError) {
        console.error("Error generating AI image query:", queryError);
      }
    } else if (pexelsQuery) {
      // Si no tenemos IA pero tenemos el query anterior, usarlo limpio
      searchQuery = pexelsQuery
        .replace(/pharmacy|pharmacist|medicine|pills?|drugs?|doctor|hospital|medical|medications?|capsules?|pharmaceutical/gi, "")
        .trim() || searchQuery;
    }

    console.log("Searching Unsplash for:", searchQuery);
    
    let imageData = null;

    try {
      // Primera búsqueda con el query de IA
      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=30&orientation=landscape`,
        { 
          headers: { 
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` 
          } 
        }
      );

      if (unsplashResponse.ok) {
        const unsplashData = await unsplashResponse.json();
        if (unsplashData.results && unsplashData.results.length > 0) {
          // Filtrar URLs ya usadas
          const availablePhotos = unsplashData.results.filter(
            (photo: { urls: { regular: string } }) => !usedImageUrls.includes(photo.urls.regular)
          );
          
          console.log("Available photos after filtering:", availablePhotos.length, "out of", unsplashData.results.length);
          
          if (availablePhotos.length > 0) {
            // Seleccionar foto aleatoria de las primeras 15
            const randomIndex = Math.floor(Math.random() * Math.min(15, availablePhotos.length));
            const selectedPhoto = availablePhotos[randomIndex];
            
            imageData = {
              url: selectedPhoto.urls.regular,
              photographer: selectedPhoto.user.name,
              photographer_url: selectedPhoto.user.links.html,
            };
            console.log("Selected image from photographer:", selectedPhoto.user.name);
          }
        }
      }
      
      // Si no encontramos foto, intentar con query genérico de bienestar
      if (!imageData) {
        console.log("No suitable photos found, trying fallback query...");
        const fallbackQuery = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];
        
        const fallbackResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(fallbackQuery)}&per_page=20&orientation=landscape`,
          { 
            headers: { 
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` 
            } 
          }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackPhotos = fallbackData.results?.filter(
            (p: { urls: { regular: string } }) => !usedImageUrls.includes(p.urls.regular)
          ) || [];
          
          if (fallbackPhotos.length > 0) {
            const randomFallback = fallbackPhotos[Math.floor(Math.random() * Math.min(10, fallbackPhotos.length))];
            imageData = {
              url: randomFallback.urls.regular,
              photographer: randomFallback.user.name,
              photographer_url: randomFallback.user.links.html,
            };
            console.log("Selected fallback image from photographer:", randomFallback.user.name);
          }
        }
      }
      
      // Fallback final si todo falla
      if (!imageData) {
        imageData = {
          url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200",
          photographer: "Unsplash",
          photographer_url: "https://unsplash.com",
        };
        console.log("Using default fallback image");
      }

    } catch (unsplashError) {
      console.error("Unsplash error:", unsplashError);
      imageData = {
        url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200",
        photographer: "Unsplash",
        photographer_url: "https://unsplash.com",
      };
    }

    console.log("Image regenerated successfully:", imageData.url.substring(0, 50));

    return new Response(
      JSON.stringify({ image: imageData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Regenerate image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
