import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  pexelsQuery: string;
  usedImageUrls?: string[];
  articleTitle?: string;
  articleContent?: string;
  companySector?: string;
}

interface SectorContext {
  examples: string[];
  prohibitedTerms: string[];
  fallbackQuery: string;
}

// Sector-specific image contexts (hardcoded base sectors)
const SECTOR_IMAGE_CONTEXTS: Record<string, SectorContext> = {
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
  belleza: {
    examples: [
      "beautiful hairstyle woman portrait natural light",
      "elegant haircut woman closeup professional photo",
      "hair color highlights blonde brunette natural",
      "modern hairstyle waves curls woman portrait",
      "sleek straight hair woman fashion photography",
      "hair texture closeup shiny healthy natural"
    ],
    prohibitedTerms: [
      "barber", "barbershop", "beard", "men haircut", "shaving", "razor", "male grooming",
      "hairdresser", "stylist working", "salon interior", "cutting hair", "scissors cutting",
      "hair salon chair", "mirror reflection salon", "cape apron", "hair dryer", "curling iron"
    ],
    fallbackQuery: "beautiful hairstyle woman portrait elegant"
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
  
  // Belleza first to avoid "salud" matching
  if (s.includes("peluqu") || s.includes("cabello") || s.includes("estétic") || s.includes("estetica") || s.includes("hair") || s.includes("salon de belleza") || s.includes("salón de belleza") || s.includes("beauty") || s.includes("manicur") || s.includes("maquillaje")) {
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

// Get or create sector context from database
async function getOrCreateSectorContext(
  sector: string | null | undefined,
  supabaseClient: any,
  lovableApiKey: string
): Promise<SectorContext> {
  if (!sector) {
    return SECTOR_IMAGE_CONTEXTS.default;
  }

  // 1. Check hardcoded sectors first
  const detectedCategory = detectSectorCategory(sector);
  if (detectedCategory !== "default" && SECTOR_IMAGE_CONTEXTS[detectedCategory]) {
    console.log(`Using hardcoded sector context: ${detectedCategory}`);
    return SECTOR_IMAGE_CONTEXTS[detectedCategory];
  }

  // 2. Search in database for existing dynamic sector
  const sectorLower = sector.toLowerCase();
  console.log(`Searching database for sector: "${sectorLower}"`);
  
  try {
    const { data: existingSector, error } = await supabaseClient
      .from('sector_contexts')
      .select('*')
      .or(`sector_key.eq.${sectorLower.replace(/\s+/g, '_')},sector_keywords.cs.{"${sectorLower}"}`)
      .maybeSingle();

    if (error) {
      console.error("Error querying sector_contexts:", error);
    }

    if (existingSector) {
      console.log(`Found existing dynamic sector in DB: ${existingSector.sector_key}`);
      return {
        examples: existingSector.image_examples || [],
        prohibitedTerms: existingSector.prohibited_terms || [],
        fallbackQuery: existingSector.fallback_query || "professional business modern"
      };
    }
  } catch (dbError) {
    console.error("Database error when searching sector:", dbError);
  }

  // 3. Generate with AI and save to database
  console.log(`Sector "${sector}" not found. Generating with AI...`);
  const newContext = await generateSectorContextWithAI(sector, lovableApiKey);
  
  // Save to database for future use
  const sectorKey = sectorLower.replace(/\s+/g, '_').substring(0, 50);
  try {
    const { error: insertError } = await supabaseClient
      .from('sector_contexts')
      .insert({
        sector_key: sectorKey,
        sector_keywords: [sectorLower, ...newContext.keywords],
        image_examples: newContext.examples,
        prohibited_terms: newContext.prohibitedTerms,
        fallback_query: newContext.fallbackQuery,
        tone_description: newContext.toneDescription
      });

    if (insertError) {
      console.error("Error saving sector context to DB:", insertError);
    } else {
      console.log(`Sector "${sectorKey}" saved to database for future use`);
    }
  } catch (saveError) {
    console.error("Error saving sector to database:", saveError);
  }

  return {
    examples: newContext.examples,
    prohibitedTerms: newContext.prohibitedTerms,
    fallbackQuery: newContext.fallbackQuery
  };
}

// Generate sector context with AI
async function generateSectorContextWithAI(sector: string, lovableApiKey: string): Promise<{
  keywords: string[];
  examples: string[];
  prohibitedTerms: string[];
  fallbackQuery: string;
  toneDescription: string;
}> {
  console.log(`Generating sector context with AI for: "${sector}"`);
  
  const prompt = `Eres un experto en marketing y fotografía profesional. 
  
Para el sector empresarial "${sector}", genera un contexto de imágenes profesionales.

Responde SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "keywords": ["palabra1", "palabra2", "palabra3"],
  "examples": [
    "query unsplash 1 en inglés 4-6 palabras",
    "query unsplash 2 en inglés 4-6 palabras",
    "query unsplash 3 en inglés 4-6 palabras",
    "query unsplash 4 en inglés 4-6 palabras",
    "query unsplash 5 en inglés 4-6 palabras"
  ],
  "prohibitedTerms": ["término1 en inglés", "término2 en inglés"],
  "fallbackQuery": "query genérico profesional en inglés 4-5 palabras",
  "toneDescription": "Descripción breve del tono para este sector"
}

REGLAS:
- keywords: 3-5 palabras clave en ESPAÑOL para detectar este sector
- examples: queries de búsqueda para Unsplash en INGLÉS, profesionales y positivos
- prohibitedTerms: cosas que NO queremos en las imágenes (en inglés)
- fallbackQuery: un query genérico pero seguro para el sector (en inglés)`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`AI response not ok: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }
    
    // Clean and parse JSON
    const cleanContent = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '');
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`AI generated sector context for "${sector}":`, parsed);
    return parsed;
  } catch (error) {
    console.error(`Error generating sector context with AI for "${sector}":`, error);
    return {
      keywords: [sector.toLowerCase()],
      examples: [
        "professional team collaboration office",
        "business success growth abstract",
        "modern workspace minimal clean"
      ],
      prohibitedTerms: [],
      fallbackQuery: "professional business modern office",
      toneDescription: "Profesional e informativo"
    };
  }
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
    }

    // Create Supabase client for dynamic sector lookup
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("=== REGENERATE IMAGE ===");
    console.log("Article title:", articleTitle || "No title provided");
    console.log("Company sector:", companySector || "No sector provided");
    console.log("Excluding URLs:", usedImageUrls.length, "images");

    // Get sector-specific context (dynamic!)
    const sectorContext = await getOrCreateSectorContext(companySector, supabase, LOVABLE_API_KEY || "");
    console.log("Sector context obtained:", sectorContext.fallbackQuery);

    // Default to sector fallback query
    let searchQuery = sectorContext.fallbackQuery;

    // If we have title/content AND API key, use AI to generate contextual query
    if (LOVABLE_API_KEY && (articleTitle || articleContent)) {
      console.log("Generating image search query with AI for sector:", companySector);
      
      const cleanTextContent = articleContent
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 500) || '';

      const prohibitedList = sectorContext.prohibitedTerms.length > 0 
        ? sectorContext.prohibitedTerms.join(", ") 
        : "ninguno específico";

      const imageQueryPrompt = `Genera UN query de búsqueda para Unsplash para encontrar una imagen relevante.

SECTOR DE LA EMPRESA: ${companySector || "General"}
TÍTULO DEL ARTÍCULO: ${articleTitle || "Sin título"}
EXTRACTO DEL CONTENIDO: ${cleanTextContent || "Sin contenido"}

REGLAS ESTRICTAS:
1. Máximo 4-5 palabras en INGLÉS (Unsplash funciona mejor en inglés)
2. El query DEBE ser 100% relevante para el sector "${companySector}"
3. PROHIBIDO TOTALMENTE estas palabras: pharmacy, pharmacist, medicine, pills, drugs, doctor, hospital, medical, ${prohibitedList}
4. PROHIBIDO incluir nombres de marcas comerciales
5. Busca escenas PROFESIONALES del sector, no productos genéricos

EJEMPLOS BUENOS PARA ESTE SECTOR:
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
