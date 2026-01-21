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

// Fallback queries for when AI query generation fails
const FALLBACK_QUERIES = [
  "natural wellness beauty care",
  "healthy lifestyle nature",
  "botanical plants herbs natural",
  "fresh fruits vegetables healthy",
  "skincare cream beauty treatment"
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
    const { pharmacy, topic, month, year, usedImageUrls = [] }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
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
- TÍTULO H1: Máximo 60 caracteres, atractivo, con keyword principal. NUNCA incluyas el nombre de la farmacia, la población, ni palabras como "Cierzo", "Guía de", etc.
- Meta descripción de 150-160 caracteres
- Slug URL amigable sin tildes ni caracteres especiales
- Estructura: introducción + 4-5 secciones H2 + conclusión con CTA
- Menciona la farmacia 1-2 veces en el CONTENIDO (nunca en el título)
- Menciona la población 1-2 veces en el contenido cuando sea natural
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

REGLAS CRÍTICAS PARA EL TÍTULO:
- MÁXIMO 60 caracteres
- NUNCA incluyas: nombre de farmacia, población, "Guía de...", "Cierzo", ni referencias geográficas específicas
- Debe ser atractivo y directo al tema
- Ejemplos BUENOS: "Protege tu piel del frío este invierno", "Vitaminas esenciales para el sistema inmune", "Cuidado capilar: Frena la caída estacional"
- Ejemplos MALOS: "Guía de Farmacia X en Ciudad Y para...", "El Cierzo y tu piel: cómo protegerte en Zaragoza"

Genera el artículo completo EN ESPAÑOL. RESPONDE SOLO CON JSON VÁLIDO en este formato exacto:
{
  "title": "Título H1 corto y atractivo (máx 60 caracteres, sin farmacia ni población)",
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
- TÍTOL: Màxim 60 caràcters, atractiu, SENSE nom de farmàcia ni població.
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
- Mantén les mencions a la farmàcia i la població EN EL CONTINGUT (1-2 vegades).
- El TÍTOL ha de ser curt (màx 60 caràcters) i SENSE nom de farmàcia ni població.
- Assegura't que totes les paraules estiguin correctament escrites en català.

RESPÓN NOMÉS AMB JSON VÀLID en aquest format exacte:
{
  "title": "Títol H1 curt i atractiu (màx 60 caràcters, sense farmàcia ni població)",
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

    // ========== PASO 2.5: Generar query de imagen con IA ==========
    console.log("Generating image search query with AI...");
    
    // Extraer texto limpio del contenido HTML para el análisis
    const cleanTextContent = spanishArticle.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 800) || '';

    const imageQueryPrompt = `Analiza el siguiente artículo y genera UN ÚNICO query de búsqueda para encontrar una imagen de stock relevante en Unsplash.

TÍTULO DEL ARTÍCULO: ${spanishArticle.title}
TEMA PRINCIPAL: ${topic.tema}
EXTRACTO DEL CONTENIDO: ${cleanTextContent.substring(0, 500)}

REGLAS ESTRICTAS para el query:
1. Máximo 4-5 palabras en INGLÉS (Unsplash funciona mejor en inglés)
2. PROHIBIDO TOTALMENTE incluir estas palabras: pharmacy, pharmacist, pharmacies, medicine, medicines, pills, pill, drugs, drug, doctor, doctors, hospital, medical, medications, medication, capsule, capsules, prescription, prescriptions, bottle, bottles, pharmaceutical, clinic, nurse, patient, healthcare, health care, treatment, product, container, packaging, jar, tube, cosmetic product
3. PROHIBIDO incluir nombres de marcas comerciales
4. PROHIBIDO buscar imágenes de PRODUCTOS o ENVASES - busca INGREDIENTES, TEXTURAS o PERSONAS
5. Enfócate en: ingredientes naturales (aceites, plantas, frutas), texturas de crema/serum sin envase, manos aplicando producto, rostros de personas, paisajes de bienestar
6. Prioriza conceptos abstractos y naturales: gotas de agua, pétalos, hojas, manos, piel, rostro
7. Piensa en imágenes bonitas y evocadoras SIN packaging visible

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

    let aiGeneratedQuery = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];

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
          // Limpiar cualquier término prohibido que se haya colado (doble seguridad)
          const cleanedQuery = rawQuery
            .toLowerCase()
            .replace(/pharmacy|pharmacist|pharmacies|medicine|medicines|pills?|drugs?|doctor|doctors?|hospital|medical|medications?|capsules?|prescriptions?|bottles?|pharmaceutical|clinic|nurse|patient|healthcare|treatment/gi, "")
            .replace(/\s+/g, " ")
            .trim();
          
          if (cleanedQuery.length > 5) {
            aiGeneratedQuery = cleanedQuery;
            console.log("AI generated image query:", aiGeneratedQuery);
          } else {
            console.warn("AI query was cleaned to empty, using fallback");
          }
        } else {
          console.warn("AI query response invalid, using fallback. Raw:", rawQuery);
        }
      } else {
        console.warn("Failed to generate AI image query, status:", imageQueryResponse.status);
      }
    } catch (queryError) {
      console.error("Error generating AI image query:", queryError);
    }

    // ========== PASO 3: Buscar imagen en Unsplash con query generado por IA ==========
    console.log("Searching Unsplash with AI-generated query:", aiGeneratedQuery);
    console.log("Excluding URLs:", usedImageUrls.length, "images");
    
    // Seleccionar imagen fallback aleatoria (no yoga)
    const randomFallbackImage = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    let imageData = { ...randomFallbackImage };

    try {
      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(aiGeneratedQuery)}&per_page=30&orientation=landscape`,
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
          // Filtrar imágenes ya usadas
          const availablePhotos = unsplashData.results.filter(
            (photo: { urls: { regular: string } }) => !usedImageUrls.includes(photo.urls.regular)
          );
          
          console.log("Available photos after filtering:", availablePhotos.length, "out of", unsplashData.results.length);
          
          if (availablePhotos.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(10, availablePhotos.length));
            const selectedPhoto = availablePhotos[randomIndex];
            
            imageData = {
              url: selectedPhoto.urls.regular,
              photographer: selectedPhoto.user.name,
              photographer_url: selectedPhoto.user.links.html,
            };
            console.log("Selected Unsplash image from photographer:", selectedPhoto.user.name);
          } else {
            console.log("No available photos with AI query, trying fallback...");
            // Fallback con query genérico de bienestar
            const fallbackQuery = "natural wellness beauty botanical healthy";
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
                console.log("Selected fallback Unsplash image from:", randomFallback.user.name);
              }
            }
          }
        }
      } else {
        const errorText = await unsplashResponse.text();
        console.error("Unsplash API error:", unsplashResponse.status, errorText);
      }
    } catch (unsplashError) {
      console.error("Unsplash error (using fallback):", unsplashError);
    }

    console.log("Article generated successfully with image:", imageData.url.substring(0, 50));

    return new Response(
      JSON.stringify({
        content: {
          spanish: spanishArticle,
          catalan: catalanArticle,
        },
        image: imageData,
        pexels_query: aiGeneratedQuery, // Ahora contiene el query generado por IA
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
