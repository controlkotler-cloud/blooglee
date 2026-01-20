import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  pexelsQuery: string;  // Query específico del tema para búsquedas relevantes
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
  "yoga relaxation peaceful outdoor",
  "nature landscape peaceful",
  "plants green botanical",
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
    
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    
    if (!PEXELS_API_KEY) {
      throw new Error("PEXELS_API_KEY is not configured");
    }

    if (!pexelsQuery) {
      throw new Error("pexelsQuery is required");
    }

    console.log("Regenerating image with pexelsQuery:", pexelsQuery);
    console.log("Excluding URLs:", usedImageUrls.length, "images");

    // Usar directamente el pexelsQuery específico del tema (ya está optimizado)
    const cleanQuery = pexelsQuery.replace(/pharmacy|medicine|drug|pill|capsule|bottle/gi, "wellness");
    const enhancedQuery = cleanQuery;
    
    console.log("Searching Pexels for:", enhancedQuery);
    
    let imageData = null;

    try {
      // Primera búsqueda con el topic
      const pexelsResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(enhancedQuery)}&per_page=80&orientation=landscape`,
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
            // Excluir URLs ya usadas
            if (usedImageUrls.includes(photo.src.large)) {
              return false;
            }
            
            // Revisar alt text para términos excluidos
            const altText = (photo.alt || "").toLowerCase();
            if (EXCLUDED_TERMS.some(term => altText.includes(term))) {
              return false;
            }
            
            // Filtrar por brillo y saturación
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
            // Seleccionar foto aleatoria de las primeras 20
            const randomIndex = Math.floor(Math.random() * Math.min(20, suitablePhotos.length));
            const selectedPhoto = suitablePhotos[randomIndex];
            
            imageData = {
              url: selectedPhoto.src.large,
              photographer: selectedPhoto.photographer,
              photographer_url: selectedPhoto.photographer_url,
            };
            console.log("Selected image from photographer:", selectedPhoto.photographer);
          }
        }
      }
      
      // Si no encontramos foto, intentar con query genérico
      if (!imageData) {
        console.log("No suitable photos found, trying fallback query...");
        const fallbackQuery = WELLNESS_QUERIES[Math.floor(Math.random() * WELLNESS_QUERIES.length)];
        
        const fallbackResponse = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(fallbackQuery)}&per_page=50&orientation=landscape`,
          { headers: { Authorization: PEXELS_API_KEY } }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackPhotos = fallbackData.photos?.filter((p: { src: { large: string } }) => 
            !usedImageUrls.includes(p.src.large)
          ) || [];
          
          if (fallbackPhotos.length > 0) {
            const randomFallback = fallbackPhotos[Math.floor(Math.random() * Math.min(15, fallbackPhotos.length))];
            imageData = {
              url: randomFallback.src.large,
              photographer: randomFallback.photographer,
              photographer_url: randomFallback.photographer_url,
            };
            console.log("Selected fallback image from photographer:", randomFallback.photographer);
          }
        }
      }
      
      // Fallback final si todo falla
      if (!imageData) {
        imageData = {
          url: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg",
          photographer: "Pexels",
          photographer_url: "https://pexels.com",
        };
        console.log("Using default fallback image");
      }

    } catch (pexelsError) {
      console.error("Pexels error:", pexelsError);
      imageData = {
        url: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg",
        photographer: "Pexels",
        photographer_url: "https://pexels.com",
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
