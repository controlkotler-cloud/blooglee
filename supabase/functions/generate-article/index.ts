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
  location?: string | null;
  sector?: string;
  languages: string[];
  blog_url?: string;
  instagram_url?: string;
  geographic_scope?: string; // local, regional, national
}

interface RequestBody {
  pharmacy: PharmacyData;
  topic: TopicData | null;
  month: number;
  year: number;
  usedImageUrls?: string[];
  autoGenerateTopic?: boolean;
  skipImage?: boolean; // New: skip image generation
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
  { url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200", photographer: "Chelsea shapouri", photographer_url: "https://unsplash.com/@theamomento" },
  { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200", photographer: "Anna Pelzer", photographer_url: "https://unsplash.com/@annapelzer" },
  { url: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=1200", photographer: "Conscious Design", photographer_url: "https://unsplash.com/@conscious_design" },
  { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200", photographer: "Ale Sat", photographer_url: "https://unsplash.com/@alexsat" },
  { url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200", photographer: "Daiga Ellaby", photographer_url: "https://unsplash.com/@daiga_ellaby" },
  { url: "https://images.unsplash.com/photo-1556760544-74068565f05c?w=1200", photographer: "Amplitude Magazin", photographer_url: "https://unsplash.com/@amplitudemagazin" },
];

// Helper function to make AI requests with retry logic for rate limits
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Fetch attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pharmacy, topic: providedTopic, month, year, usedImageUrls = [], autoGenerateTopic, skipImage }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!UNSPLASH_ACCESS_KEY && !skipImage) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
    }

    // Get date context
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
    console.log("Auto generate topic:", autoGenerateTopic);
    console.log("Provided topic:", providedTopic?.tema);
    console.log("Skip image:", skipImage);
    console.log("Geographic scope:", pharmacy.geographic_scope);

    // ========== BUILD GEOGRAPHIC CONTEXT ==========
    const geographicScope = pharmacy.geographic_scope || "local";
    let geoContext = "";
    let geoContextCatalan = "";
    
    switch (geographicScope) {
      case "local":
        geoContext = `
- Menciona la población ${pharmacy.location} 1-2 veces de forma natural en el contenido
- Incluye referencias locales y SEO local
- Adapta el contenido a la zona geográfica específica de ${pharmacy.location}`;
        geoContextCatalan = `
- Menciona la població ${pharmacy.location} 1-2 vegades de forma natural en el contingut
- Inclou referències locals i SEO local`;
        break;
      case "regional":
        geoContext = `
- Menciona la región ${pharmacy.location} (ej: Cataluña, Andalucía) 1-2 veces de forma natural
- NO menciones ciudades específicas
- Enfócate en características regionales y tendencias de la zona`;
        geoContextCatalan = `
- Menciona la regió ${pharmacy.location} 1-2 vegades de forma natural
- NO mencions ciutats específiques
- Centra't en característiques regionals`;
        break;
      case "national":
        geoContext = `
- NO menciones ninguna ubicación geográfica específica
- El contenido debe ser aplicable a toda España
- Usa referencias genéricas como "en nuestro país" o "en España" si es necesario`;
        geoContextCatalan = `
- NO mencions cap ubicació geogràfica específica
- El contingut ha de ser aplicable a tot Espanya
- Utilitza referències genèriques si cal`;
        break;
    }

    // ========== AUTO-GENERATE TOPIC IF NEEDED ==========
    let topic = providedTopic;
    let generatedTopicTema: string | null = null;

    if (!topic || autoGenerateTopic) {
      console.log("Generating AI topic for:", pharmacy.name, "sector:", pharmacy.sector);
      
      const locationContext = geographicScope === "national" 
        ? "España (ámbito nacional)" 
        : `${pharmacy.location} (ámbito ${geographicScope})`;
      
      const topicPrompt = `Eres un experto en SEO y marketing de contenidos para el sector ${pharmacy.sector || "servicios profesionales"}.
Genera UN SOLO tema para un artículo de blog optimizado para SEO.

Empresa: ${pharmacy.name}
Sector: ${pharmacy.sector || "servicios profesionales"}
Ámbito: ${locationContext}
Mes: ${monthName} ${currentYear}

El tema debe:
- Ser MUY relevante para el sector de la empresa
- Tener en cuenta la época del año (${monthName}) y tendencias actuales de ${currentYear}
${geographicScope !== "national" ? `- Ser atractivo para SEO ${geographicScope === "local" ? "local" : "regional"} en ${pharmacy.location}` : "- Ser atractivo para SEO nacional en España"}
- Máximo 60 caracteres
- NO incluir el nombre de la empresa en el tema
- Ser específico y útil para los clientes potenciales

Responde SOLO con el tema, sin explicaciones ni comillas.`;

      try {
        const topicResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: topicPrompt }],
            max_tokens: 100,
          }),
        });

        if (!topicResponse.ok) {
          const errorText = await topicResponse.text();
          console.error(`AI topic generation failed: ${errorText}`);
          throw new Error("AI topic generation failed");
        }

        const topicData = await topicResponse.json();
        generatedTopicTema = topicData.choices?.[0]?.message?.content?.trim() || null;
        
        if (!generatedTopicTema) {
          throw new Error("Empty topic from AI");
        }
        
        console.log(`✓ AI generated topic: ${generatedTopicTema}`);
        
        topic = {
          tema: generatedTopicTema,
          keywords: [],
          pexels_query: pharmacy.sector ? `${pharmacy.sector} professional business` : "business professional wellness"
        };
      } catch (topicError) {
        console.error(`Failed to generate AI topic:`, topicError);
        generatedTopicTema = `Novedades en ${pharmacy.sector || "servicios profesionales"} para ${monthName}`;
        console.log(`Using fallback topic: ${generatedTopicTema}`);
        
        topic = {
          tema: generatedTopicTema,
          keywords: [],
          pexels_query: pharmacy.sector ? `${pharmacy.sector} professional business` : "business professional wellness"
        };
      }
    }

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
${geoContext}
- Tono profesional pero cercano
- El contenido debe estar en formato HTML con tags <h2>, <p>, <ul>, <li>
- VARIEDAD: Aunque el tema sea similar, cada artículo debe tener un enfoque único basado en la farmacia y su ubicación.

RESPONDE SIEMPRE EN JSON VÁLIDO.`;

    const locationInfo = geographicScope === "national" 
      ? "ÁMBITO: Nacional (toda España)" 
      : `POBLACIÓN/REGIÓN: ${pharmacy.location}`;

    const spanishUserPrompt = `FARMACIA: ${pharmacy.name}
${locationInfo}
FECHA DEL ARTÍCULO: ${dateContext} (usa esta fecha para cualquier referencia temporal)

TEMA DEL ARTÍCULO: ${topic.tema}
Keywords SEO: ${topic.keywords.join(", ")}

INSTRUCCIONES ESPECIALES:
- El artículo debe ser para ${dateContext}, asegúrate de que todas las referencias temporales sean correctas.
${geoContext}

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

    // Generate Spanish article with retry logic
    const spanishResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    // Save Spanish content WITHOUT SEO links for Catalan prompt
    const spanishContentWithoutSeoLinks = spanishArticle?.content || '';

    // ========== ADD SEO LINKS TO SPANISH CONTENT ==========
    if (spanishArticle?.content) {
      const seoLinks: string[] = [];
      
      if (pharmacy.blog_url) {
        seoLinks.push(`<a href="${pharmacy.blog_url}" target="_blank" rel="noopener">nuestro blog</a>`);
      }
      if (pharmacy.instagram_url) {
        seoLinks.push(`<a href="${pharmacy.instagram_url}" target="_blank" rel="noopener">Instagram</a>`);
      }
      
      if (seoLinks.length > 0) {
        const linksText = seoLinks.join(' y ');
        const closingParagraph = `<p><strong>¿Quieres más consejos de salud?</strong> Visita ${linksText} para descubrir más contenido de ${pharmacy.name}.</p>`;
        spanishArticle.content += closingParagraph;
        console.log("Added SEO links to Spanish content");
      }
    }

    console.log("Spanish article parsed successfully. Title:", spanishArticle.title?.substring(0, 50));

    // ========== PASO 2: Generate Catalan version (if needed) ==========
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

TRADUCCIONS OBLIGATÒRIES - MAI USAR PARAULES CASTELLANES AL TÍTOL:
- "vence" / "vencer" → "venç" / "vèncer" (AMB ACCENT!) o millor "supera" / "derrota" / "guanya"
- "consigue" / "conseguir" → "aconsegueix" / "aconseguir" o "obté" / "obtenir"  
- "gripe" → "grip" (correcte, però vigila la resta del títol!)
- "combate" / "combatir" → "combat" / "combatre" o "lluita contra"
- "protege" / "proteger" → "protegeix" / "protegir"
- "alcanza" / "alcanzar" → "assoleix" / "assolir" o "arriba a"
- "refuerza" / "reforzar" → "reforça" / "reforçar"
- "cuida" → "cuida" (igual en català)
- "mejora" / "mejorar" → "millora" / "millorar"

EXEMPLES DE TÍTOLS CORRECTES EN CATALÀ:
- "Supera la grip: reforça les teves defenses" ✓
- "Protegeix la pell del fred aquest hivern" ✓
- "Combat el cansament amb vitamines naturals" ✓

EXEMPLES DE TÍTOLS INCORRECTES (BARREJA CASTELLÀ-CATALÀ):
- "Vence la grip: com reforçar el sistema immunitari" ✗ (VENCE és castellà!)
- "Consigue una piel radiante" ✗ (CONSIGUE és castellà!)

EXEMPLES DE BON CATALÀ:
- "desenvolupament" (no "desarrollo")
- "assolir" (no "aconseguir" quan significa "lograr")
- "arreu" (no "per tot arreu")
- "malgrat" (no "a pesar de")
- "enguany" (no "aquest any")

RESPÓN SEMPRE EN JSON VÀLID.`;

      const catalanUserPrompt = `A partir de l'article següent en castellà, redacta una versió en CATALÀ CORRECTE i NATURAL.

ARTICLE ORIGINAL EN CASTELLÀ:
Títol: ${spanishArticle.title}
Meta descripció: ${spanishArticle.meta_description}
Contingut: ${spanishContentWithoutSeoLinks}

FARMÀCIA: ${pharmacy.name}
${geographicScope === "national" ? "ÀMBIT: Nacional (tota Espanya)" : `POBLACIÓ/REGIÓ: ${pharmacy.location}`}
DATA: ${dateContext}

IMPORTANT: 
- Redacta com un parlant nadiu de català, NO tradueixis literalment.
- Adapta expressions, vocabulari i sintaxi al català natural.
${geoContextCatalan}
- El TÍTOL ha de ser curt (màx 60 caràcters) i SENSE nom de farmàcia ni població.
- VERIFICA que el TÍTOL NO contingui cap paraula castellana (vence, consigue, combate, protege, etc.).
- Assegura't que totes les paraules estiguin correctament escrites en català.

RESPÓN NOMÉS AMB JSON VÀLID en aquest format exacte:
{
  "title": "Títol H1 curt i atractiu en CATALÀ PUR (màx 60 caràcters, sense farmàcia ni població)",
  "meta_description": "Meta descripció de 150-160 caràcters en català",
  "slug": "slug-url-amigable-sense-accents",
  "content": "<h2>Primera secció</h2><p>Contingut en català natural...</p>"
}`;

      const catalanResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

      console.log("Catalan AI response status:", catalanResponse.status);

      if (catalanResponse.ok) {
        const catalanData = await catalanResponse.json();
        const catalanContent = catalanData.choices?.[0]?.message?.content;
        console.log("Catalan AI content received:", catalanContent ? "yes" : "no", "length:", catalanContent?.length || 0);
        
        if (catalanContent) {
          try {
            const jsonMatch = catalanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              catalanArticle = JSON.parse(jsonMatch[0]);
              console.log("Catalan article parsed successfully. Title:", catalanArticle.title?.substring(0, 50));
              
              // Validate title doesn't contain Spanish words
              if (catalanArticle?.title) {
                const spanishWordsInTitle = ["vence", "consigue", "alcanza", "combate", "protege", "mejora", "cuida tu", "descubre", "aprende"];
                const titleLower = catalanArticle.title.toLowerCase();
                const hasSpanishWord = spanishWordsInTitle.some(w => titleLower.includes(w));
                
                if (hasSpanishWord) {
                  console.warn("Catalan title contains Spanish words, applying fix...");
                  let fixedTitle = catalanArticle.title
                    .replace(/\bVence\b/gi, "Venç")
                    .replace(/\bvence\b/gi, "venç")
                    .replace(/\bConsigue\b/gi, "Aconsegueix")
                    .replace(/\bconsigue\b/gi, "aconsegueix")
                    .replace(/\bCombate\b/gi, "Combat")
                    .replace(/\bcombate\b/gi, "combat")
                    .replace(/\bProtege\b/gi, "Protegeix")
                    .replace(/\bprotege\b/gi, "protegeix")
                    .replace(/\bMejora\b/gi, "Millora")
                    .replace(/\bmejora\b/gi, "millora")
                    .replace(/\bDescubre\b/gi, "Descobreix")
                    .replace(/\bdescubre\b/gi, "descobreix")
                    .replace(/\bAprende\b/gi, "Aprèn")
                    .replace(/\baprende\b/gi, "aprèn");
                  
                  catalanArticle.title = fixedTitle;
                  console.log("Fixed Catalan title:", fixedTitle);
                }
              }
              
              // Add SEO links to Catalan content
              if (catalanArticle?.content) {
                const seoLinksCa: string[] = [];
                
                if (pharmacy.blog_url) {
                  seoLinksCa.push(`<a href="${pharmacy.blog_url}" target="_blank" rel="noopener">el nostre blog</a>`);
                }
                if (pharmacy.instagram_url) {
                  seoLinksCa.push(`<a href="${pharmacy.instagram_url}" target="_blank" rel="noopener">Instagram</a>`);
                }
                
                if (seoLinksCa.length > 0) {
                  const linksTextCa = seoLinksCa.join(' i ');
                  const closingParagraphCa = `<p><strong>Vols més consells de salut?</strong> Visita ${linksTextCa} per descobrir més contingut de ${pharmacy.name}.</p>`;
                  catalanArticle.content += closingParagraphCa;
                  console.log("Added SEO links to Catalan content");
                }
              }
            } else {
              console.error("No JSON found in Catalan response. Content preview:", catalanContent.substring(0, 200));
            }
          } catch (parseError) {
            console.error("JSON parse error (Catalan):", parseError, "Content preview:", catalanContent?.substring(0, 200));
          }
        } else {
          console.error("Catalan content is empty or undefined");
        }
      } else {
        const errorText = await catalanResponse.text();
        console.error("Catalan generation failed. Status:", catalanResponse.status, "Error:", errorText);
      }
    }

    // ========== PASO 3: Generate image (if not skipped) ==========
    let imageData: { url: string; photographer: string; photographer_url: string } | null = null;
    let aiGeneratedQuery = "";

    if (!skipImage) {
      console.log("Generating image search query with AI...");
      
      // Extract clean text from HTML content for analysis
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

      aiGeneratedQuery = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];

      try {
        const imageQueryResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            // Clean any prohibited terms (double safety)
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

      // Search Unsplash
      console.log("Searching Unsplash with AI-generated query:", aiGeneratedQuery);
      console.log("Excluding URLs:", usedImageUrls.length, "images");
      
      const randomFallbackImage = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
      imageData = { ...randomFallbackImage };

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

      console.log("Article generated successfully with image:", imageData?.url?.substring(0, 50));
    } else {
      console.log("Skipping image generation as requested");
    }

    return new Response(
      JSON.stringify({
        content: {
          spanish: spanishArticle,
          catalan: catalanArticle,
        },
        image: imageData,
        pexels_query: aiGeneratedQuery || null,
        topic: topic?.tema,
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
