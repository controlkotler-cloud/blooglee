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
  companySector?: string; // NEW: sector for better image matching
}

// Sector-specific image contexts for better matching
const SECTOR_IMAGE_CONTEXTS: Record<string, {
  examples: string[];
  prohibitedTerms: string[];
  fallbackQuery: string;
}> = {
  belleza: {
    examples: [
      "hair salon modern interior styling chair woman",
      "hairdresser styling woman long hair professional",
      "beauty salon haircut woman mirror reflection",
      "hair coloring highlights professional salon woman",
      "woman hairstyle beautiful natural light portrait"
    ],
    prohibitedTerms: ["barber", "barbershop", "beard", "men haircut", "shaving", "razor", "male grooming", "barber shop"],
    fallbackQuery: "hair salon woman styling professional beauty"
  },
  hosteleria: {
    examples: [
      "restaurant interior modern elegant dining",
      "chef cooking kitchen professional gourmet",
      "hotel lobby luxury modern reception",
      "cafe terrace outdoor cozy ambiance"
    ],
    prohibitedTerms: ["fast food", "dirty kitchen", "drunk"],
    fallbackQuery: "restaurant elegant dining professional"
  },
  retail: {
    examples: [
      "modern retail store interior design",
      "shopping experience customer service",
      "boutique fashion store elegant"
    ],
    prohibitedTerms: ["empty store", "closing sale", "cheap"],
    fallbackQuery: "retail store modern shopping"
  },
  inmobiliaria: {
    examples: [
      "modern house interior living room",
      "real estate agent showing property",
      "luxury apartment interior design"
    ],
    prohibitedTerms: ["foreclosure", "abandoned", "ruined"],
    fallbackQuery: "modern home interior real estate"
  },
  automocion: {
    examples: [
      "car dealership showroom modern",
      "mechanic workshop professional automotive",
      "new car interior dashboard"
    ],
    prohibitedTerms: ["accident", "crash", "wrecked", "junkyard"],
    fallbackQuery: "car dealership showroom professional"
  },
  construccion: {
    examples: [
      "construction site workers safety helmets",
      "architect blueprints planning office",
      "building construction progress"
    ],
    prohibitedTerms: ["accident", "collapse", "danger"],
    fallbackQuery: "construction professional workers"
  },
  marketing: {
    examples: [
      "business team meeting modern office",
      "digital marketing analytics dashboard",
      "creative workspace minimal design"
    ],
    prohibitedTerms: ["facebook logo", "instagram icon", "specific brand"],
    fallbackQuery: "professional business workspace modern"
  },
  tecnologia: {
    examples: [
      "programmer coding laptop modern",
      "technology innovation abstract",
      "startup team collaboration"
    ],
    prohibitedTerms: ["apple logo", "microsoft", "google"],
    fallbackQuery: "technology innovation professional"
  },
  salud: {
    examples: [
      "wellness lifestyle healthy living",
      "medical professional consultation",
      "healthcare innovation modern"
    ],
    prohibitedTerms: ["pills", "medicine bottles", "hospital bed", "surgery"],
    fallbackQuery: "wellness health professional"
  },
  default: {
    examples: [
      "professional team collaboration office",
      "business success growth abstract",
      "modern workspace minimal clean"
    ],
    prohibitedTerms: [],
    fallbackQuery: "professional business modern"
  }
};

// Detect sector category
function detectSectorCategory(sector: string | null | undefined): string {
  if (!sector) return "default";
  const s = sector.toLowerCase();
  
  if (s.includes("peluqu") || s.includes("cabello") || s.includes("estétic") || s.includes("estetica") || s.includes("hair") || s.includes("salon de belleza") || s.includes("salón de belleza") || s.includes("beauty")) {
    return "belleza";
  }
  if (s.includes("restaur") || s.includes("hotel") || s.includes("hostel") || s.includes("bar ") || s.includes("cafeter") || s.includes("gastronom")) {
    return "hosteleria";
  }
  if (s.includes("tienda") || s.includes("retail") || s.includes("comercio") || s.includes("boutique") || s.includes("moda")) {
    return "retail";
  }
  if (s.includes("inmobil") || s.includes("real estate") || s.includes("propiedad") || s.includes("vivienda")) {
    return "inmobiliaria";
  }
  if (s.includes("automóvil") || s.includes("automocion") || s.includes("coche") || s.includes("vehículo") || s.includes("taller")) {
    return "automocion";
  }
  if (s.includes("construc") || s.includes("arquitect") || s.includes("reforma") || s.includes("obra")) {
    return "construccion";
  }
  if (s.includes("marketing") || s.includes("seo") || s.includes("digital") || s.includes("publicidad")) {
    return "marketing";
  }
  if (s.includes("tecnolog") || s.includes("software") || s.includes("informát") || s.includes("desarrollo")) {
    return "tecnologia";
  }
  if (s.includes("salud") || s.includes("médic") || s.includes("clínic") || s.includes("wellness") || s.includes("bienestar")) {
    return "salud";
  }
  
  return "default";
}

// Get sector context
function getSectorContext(sector: string | null | undefined) {
  const category = detectSectorCategory(sector);
  return { category, context: SECTOR_IMAGE_CONTEXTS[category] || SECTOR_IMAGE_CONTEXTS.default };
}

// Fallback images - PROFESSIONAL/BUSINESS ORIENTED (no specific sector)
const FALLBACK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200", photographer: "Austin Distel", photographer_url: "https://unsplash.com/@austindistel" },
  { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200", photographer: "Dylan Gillis", photographer_url: "https://unsplash.com/@dylandgillis" },
  { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200", photographer: "Marvin Meyer", photographer_url: "https://unsplash.com/@marvelous" },
  { url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200", photographer: "Headway", photographer_url: "https://unsplash.com/@headwayio" },
  { url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200", photographer: "Christina Morillo", photographer_url: "https://unsplash.com/@wocintechchat" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pexelsQuery, usedImageUrls = [], articleTitle, articleContent, companySector }: RequestBody = await req.json();
    
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
    }

    console.log("=== REGENERATE IMAGE ===");
    console.log("Article title:", articleTitle || "No title provided");
    console.log("Company sector:", companySector || "No sector provided");
    console.log("Excluding URLs:", usedImageUrls.length, "images");

    // Get sector-specific context
    const { category: sectorCategory, context: sectorContext } = getSectorContext(companySector);
    console.log("Detected sector category:", sectorCategory);

    // Default to sector fallback query
    let searchQuery = sectorContext.fallbackQuery;

    // If we have title/content AND API key, use AI to generate contextual query
    if (LOVABLE_API_KEY && (articleTitle || articleContent)) {
      console.log("Generating image search query with AI for sector:", sectorCategory);
      
      const cleanTextContent = articleContent
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 500) || '';

      const prohibitedList = sectorContext.prohibitedTerms.length > 0 
        ? sectorContext.prohibitedTerms.join(", ") 
        : "ninguno específico";

      const imageQueryPrompt = `Genera UN query de búsqueda para Unsplash para encontrar una imagen relevante.

SECTOR DE LA EMPRESA: ${companySector || "General"}
CATEGORÍA DETECTADA: ${sectorCategory}
TÍTULO DEL ARTÍCULO: ${articleTitle || "Sin título"}
EXTRACTO DEL CONTENIDO: ${cleanTextContent || "Sin contenido"}

REGLAS ESTRICTAS:
1. Máximo 4-5 palabras en INGLÉS (Unsplash funciona mejor en inglés)
2. El query DEBE ser 100% relevante para el sector "${sectorCategory}"
3. PROHIBIDO TOTALMENTE estas palabras: pharmacy, pharmacist, medicine, pills, drugs, doctor, hospital, medical, ${prohibitedList}
4. PROHIBIDO incluir nombres de marcas comerciales
5. Busca escenas PROFESIONALES del sector, no productos genéricos

EJEMPLOS BUENOS PARA SECTOR "${sectorCategory}":
${sectorContext.examples.map(e => `- "${e}"`).join("\n")}

RESPONDE SOLO con el query en inglés, sin explicaciones, sin comillas, sin puntuación final.`;

      try {
        const imageQueryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
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
            // Clean any prohibited terms that might have slipped through
            let cleanedQuery = rawQuery.toLowerCase();
            
            // Remove general prohibited terms
            const generalProhibited = ["pharmacy", "pharmacist", "pharmacies", "medicine", "medicines", "pills", "pill", "drugs", "drug", "doctor", "doctors", "hospital", "medical", "medications", "medication", "capsule", "capsules", "prescription", "prescriptions", "bottles", "pharmaceutical", "clinic", "nurse", "patient", "healthcare", "treatment"];
            
            // Add sector-specific prohibited terms
            const allProhibited = [...generalProhibited, ...sectorContext.prohibitedTerms];
            
            for (const term of allProhibited) {
              cleanedQuery = cleanedQuery.replace(new RegExp(term, "gi"), "");
            }
            
            cleanedQuery = cleanedQuery.replace(/\s+/g, " ").trim();
            
            if (cleanedQuery.length > 5) {
              searchQuery = cleanedQuery;
              console.log("AI generated image query:", searchQuery);
            } else {
              console.warn("AI query was cleaned to empty, using sector fallback");
              searchQuery = sectorContext.fallbackQuery;
            }
          } else {
            console.warn("AI query response invalid, using sector fallback");
          }
        } else {
          console.warn("Failed to generate AI image query, status:", imageQueryResponse.status);
        }
      } catch (queryError) {
        console.error("Error generating AI image query:", queryError);
      }
    }

    console.log("Searching Unsplash for:", searchQuery);
    
    let imageData = null;

    try {
      // First search with the generated/fallback query
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
          // Filter out already used URLs
          const availablePhotos = unsplashData.results.filter(
            (photo: { urls: { regular: string } }) => !usedImageUrls.includes(photo.urls.regular)
          );
          
          console.log("Available photos after filtering:", availablePhotos.length, "out of", unsplashData.results.length);
          
          if (availablePhotos.length > 0) {
            // Select random photo from top 15
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
      
      // If no photo found, try with sector-specific fallback query
      if (!imageData) {
        console.log("No suitable photos found, trying sector fallback query:", sectorContext.fallbackQuery);
        
        const fallbackResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(sectorContext.fallbackQuery)}&per_page=20&orientation=landscape`,
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
      
      // Final fallback - use professional business images
      if (!imageData) {
        const randomFallbackImage = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
        imageData = randomFallbackImage;
        console.log("Using professional fallback image from:", randomFallbackImage.photographer);
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
