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

// Fallback images when Unsplash search fails - INGREDIENTS/TEXTURES ONLY, NO BRANDED PACKAGING
const FALLBACK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200", photographer: "Chelsea shapouri", photographer_url: "https://unsplash.com/@theamomento" }, // Essential oils close-up
  { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200", photographer: "Anna Pelzer", photographer_url: "https://unsplash.com/@annapelzer" }, // Fresh vegetables colorful
  { url: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=1200", photographer: "Conscious Design", photographer_url: "https://unsplash.com/@conscious_design" }, // Spa stones bamboo
  { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200", photographer: "Ale Sat", photographer_url: "https://unsplash.com/@alexsat" }, // Spa candles towels
  { url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200", photographer: "Daiga Ellaby", photographer_url: "https://unsplash.com/@daiga_ellaby" }, // Lavender natural
  { url: "https://images.unsplash.com/photo-1556760544-74068565f05c?w=1200", photographer: "Amplitude Magazin", photographer_url: "https://unsplash.com/@amplitudemagazin" }, // Cream texture macro
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
2. PROHIBIDO TOTALMENTE incluir estas palabras: pharmacy, pharmacist, pharmacies, medicine, medicines, pills, pill, drugs, drug, doctor, doctors, hospital, medical, medications, medication, capsule, capsules, prescription, prescriptions, bottle, bottles, pharmaceutical, clinic, nurse, patient, healthcare, health care, treatment, product, container, packaging, jar, tube, cosmetic product
3. PROHIBIDO incluir nombres de marcas comerciales
4. PROHIBIDO buscar imágenes de PRODUCTOS o ENVASES - busca INGREDIENTES, TEXTURAS o PERSONAS
5. Enfócate en: ingredientes naturales (aceites, plantas, frutas), texturas de crema/serum sin envase, manos aplicando producto, rostros de personas, paisajes de bienestar
6. Prioriza conceptos abstractos y naturales: gotas de agua, pétalos, hojas, manos, piel, rostro
7. IMPORTANTE: Genera un query DIFERENTE al anterior para obtener variedad

EJEMPLOS DE BUENOS QUERIES (SIN PRODUCTOS):
- Para cosmética natural: "woman hands applying cream skin closeup" (manos, no envase)
- Para vitaminas: "fresh citrus fruits orange slices colorful"
- Para cuidado capilar: "woman beautiful shiny hair natural light"
- Para hidratación: "water droplets clear skin woman face"
- Para protección solar: "woman face sunlight golden hour smile"
- Para skincare: "rose petals natural oils texture macro"

EJEMPLOS DE MALOS QUERIES (NUNCA USES ESTOS):
- "skincare products bottles" ❌ (muestra envases)
- "cosmetic cream jar" ❌ (muestra packaging)
- "beauty products display" ❌ (muestra productos)
- "serum bottle dropper" ❌ (muestra envase)

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

      console.log("Unsplash response status:", unsplashResponse.status);

      if (unsplashResponse.ok) {
        const unsplashData = await unsplashResponse.json();
        console.log("Unsplash results count:", unsplashData.results?.length || 0);
        
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
      } else {
        const errorText = await unsplashResponse.text();
        console.error("Unsplash API error:", unsplashResponse.status, errorText);
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
        
        console.log("Fallback Unsplash response status:", fallbackResponse.status);
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log("Fallback results count:", fallbackData.results?.length || 0);
          
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
        } else {
          const errorText = await fallbackResponse.text();
          console.error("Fallback Unsplash API error:", fallbackResponse.status, errorText);
        }
      }
      
      // Fallback final si todo falla - usar imagen variada, NO yoga
      if (!imageData) {
        const randomFallbackImage = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
        imageData = randomFallbackImage;
        console.log("Using random fallback image from:", randomFallbackImage.photographer);
      }

    } catch (unsplashError) {
      console.error("Unsplash error:", unsplashError);
      const randomFallbackImage = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
      imageData = randomFallbackImage;
      console.log("Error fallback - using image from:", randomFallbackImage.photographer);
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
