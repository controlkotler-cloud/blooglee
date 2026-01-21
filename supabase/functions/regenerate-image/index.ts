import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  pexelsQuery: string;  // Query específico del tema para búsquedas relevantes
  usedImageUrls?: string[];
}

// Queries genéricos de bienestar para diversificar imágenes en Unsplash
const WELLNESS_QUERIES = [
  "wellness nature peaceful",
  "healthy lifestyle botanical",
  "spa relaxation natural",
  "meditation calm serene",
  "botanical herbs plants",
  "fresh healthy outdoor",
  "natural beauty care",
  "yoga relaxation peaceful",
  "nature landscape peaceful",
  "flowers garden beautiful",
  "sunrise peaceful morning",
  "ocean calm relaxation"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pexelsQuery, usedImageUrls = [] }: RequestBody = await req.json();
    
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
    }

    if (!pexelsQuery) {
      throw new Error("pexelsQuery is required");
    }

    console.log("Regenerating image with query:", pexelsQuery);
    console.log("Excluding URLs:", usedImageUrls.length, "images");

    // Limpiar query de términos farmacéuticos
    const cleanQuery = pexelsQuery
      .replace(/pharmacy|medicine|drug|pill|capsule|bottle|pharmaceutical/gi, "")
      .trim();
    
    const randomWellness = WELLNESS_QUERIES[Math.floor(Math.random() * WELLNESS_QUERIES.length)];
    const enhancedQuery = `${cleanQuery} ${randomWellness.split(" ").slice(0, 2).join(" ")}`.trim();
    
    console.log("Searching Unsplash for:", enhancedQuery);
    
    let imageData = null;

    try {
      // Primera búsqueda con el topic
      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedQuery)}&per_page=30&orientation=landscape`,
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
      
      // Si no encontramos foto, intentar con query genérico
      if (!imageData) {
        console.log("No suitable photos found, trying fallback query...");
        const fallbackQuery = WELLNESS_QUERIES[Math.floor(Math.random() * WELLNESS_QUERIES.length)];
        
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
