import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompanyData {
  name: string;
  location?: string | null;
  sector?: string | null;
  languages?: string[];
  blog_url?: string | null;
  instagram_url?: string | null;
  geographic_scope?: string;
  include_featured_image?: boolean;
}

interface RequestBody {
  company: CompanyData;
  topic?: string | null;
  month: number;
  year: number;
  usedImageUrls?: string[];
  autoGenerateTopic?: boolean;
}

// Sector-specific image contexts for better image matching
const SECTOR_IMAGE_CONTEXTS: Record<string, {
  examples: string[];
  prohibitedTerms: string[];
  fallbackQuery: string;
}> = {
  marketing: {
    examples: [
      "business team meeting modern office laptop",
      "digital marketing analytics dashboard screen",
      "creative workspace minimal design desk",
      "professional presentation conference room",
      "social media strategy planning whiteboard"
    ],
    prohibitedTerms: ["facebook logo", "instagram icon", "twitter", "tiktok", "specific brand logos"],
    fallbackQuery: "professional business workspace modern office"
  },
  tecnologia: {
    examples: [
      "programmer coding laptop dark modern office",
      "technology innovation abstract blue lights",
      "startup team collaboration whiteboard ideas",
      "software development workspace monitors",
      "cloud computing server data abstract"
    ],
    prohibitedTerms: ["apple logo", "microsoft", "google", "specific brand"],
    fallbackQuery: "technology innovation abstract professional"
  },
  salud: {
    examples: [
      "wellness lifestyle healthy living nature",
      "medical professional consultation friendly",
      "healthcare innovation modern clinic",
      "healthy lifestyle exercise outdoor",
      "wellness spa relaxation peaceful"
    ],
    prohibitedTerms: ["pills", "medicine bottles", "hospital bed", "surgery", "blood"],
    fallbackQuery: "wellness health professional modern"
  },
  legal: {
    examples: [
      "lawyer office professional desk books",
      "business handshake agreement formal",
      "legal consultation meeting professional",
      "courthouse architecture exterior",
      "contract signing business formal"
    ],
    prohibitedTerms: ["prison", "handcuffs", "police", "crime scene"],
    fallbackQuery: "professional legal office formal"
  },
  finanzas: {
    examples: [
      "financial planning consultation office",
      "business growth chart abstract green",
      "investment strategy meeting professional",
      "banking modern office professional",
      "financial success abstract concept"
    ],
    prohibitedTerms: ["cash money piles", "gambling", "lottery"],
    fallbackQuery: "business finance professional modern"
  },
  industria: {
    examples: [
      "factory modern automation machinery clean",
      "engineer safety helmet blueprints",
      "manufacturing quality control inspection",
      "industrial innovation technology modern",
      "supply chain logistics warehouse modern"
    ],
    prohibitedTerms: ["pollution", "accident", "danger", "hazard"],
    fallbackQuery: "industrial manufacturing modern clean"
  },
  educacion: {
    examples: [
      "education learning classroom modern",
      "teacher student interaction positive",
      "online learning laptop study",
      "university campus students walking",
      "training workshop professional group"
    ],
    prohibitedTerms: ["exam stress", "punishment", "detention"],
    fallbackQuery: "education learning professional modern"
  },
  default: {
    examples: [
      "professional team collaboration office",
      "business success growth abstract",
      "modern workspace minimal clean",
      "professional handshake partnership",
      "corporate meeting room presentation"
    ],
    prohibitedTerms: [],
    fallbackQuery: "professional business success modern"
  }
};

// Fallback images for when Unsplash fails (professional/business oriented)
const FALLBACK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200", photographer: "Austin Distel", photographer_url: "https://unsplash.com/@austindistel" },
  { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200", photographer: "Dylan Gillis", photographer_url: "https://unsplash.com/@dylandgillis" },
  { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200", photographer: "Marvin Meyer", photographer_url: "https://unsplash.com/@marvelous" },
  { url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200", photographer: "Headway", photographer_url: "https://unsplash.com/@headwayio" },
  { url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200", photographer: "Christina Morillo", photographer_url: "https://unsplash.com/@wocintechchat" },
];

const MONTH_NAMES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTH_NAMES_CA = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];

// Helper function for retry logic
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
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

// Detect sector category from sector string
function detectSectorCategory(sector: string | null | undefined): string {
  if (!sector) return "default";
  const s = sector.toLowerCase();
  
  if (s.includes("marketing") || s.includes("seo") || s.includes("digital") || s.includes("publicidad") || s.includes("comunicación") || s.includes("redes sociales")) {
    return "marketing";
  }
  if (s.includes("tecnolog") || s.includes("software") || s.includes("informát") || s.includes("desarrollo") || s.includes("programación") || s.includes("it") || s.includes("saas")) {
    return "tecnologia";
  }
  if (s.includes("salud") || s.includes("médic") || s.includes("clínic") || s.includes("wellness") || s.includes("bienestar") || s.includes("terapia")) {
    return "salud";
  }
  if (s.includes("legal") || s.includes("abogad") || s.includes("jurídic") || s.includes("notaría") || s.includes("asesoría legal")) {
    return "legal";
  }
  if (s.includes("finanz") || s.includes("banco") || s.includes("inversión") || s.includes("contab") || s.includes("fiscal") || s.includes("seguros")) {
    return "finanzas";
  }
  if (s.includes("industria") || s.includes("manufactura") || s.includes("fábrica") || s.includes("producción") || s.includes("logística")) {
    return "industria";
  }
  if (s.includes("educa") || s.includes("formación") || s.includes("academia") || s.includes("enseñanza") || s.includes("universidad") || s.includes("colegio")) {
    return "educacion";
  }
  
  return "default";
}

// Get sector image context
function getSectorImageContext(sector: string | null | undefined) {
  const category = detectSectorCategory(sector);
  return SECTOR_IMAGE_CONTEXTS[category] || SECTOR_IMAGE_CONTEXTS.default;
}

// Build geographic context - PREVENTS null from appearing
function buildGeoContext(company: CompanyData): { geoContext: string; locationInfo: string } {
  const scope = company.geographic_scope || "local";
  
  switch (scope) {
    case "local":
      if (!company.location || company.location.trim() === "") {
        return {
          geoContext: `
- El contenido es de ámbito general, sin referencias a ubicaciones específicas.
- NO menciones ninguna ciudad, pueblo o localidad.`,
          locationInfo: "Ámbito: General"
        };
      }
      return {
        geoContext: `
- Menciona la población "${company.location}" 1-2 veces para potenciar el SEO local.
- Integra la ubicación de forma natural en el contenido.`,
        locationInfo: `Localidad: ${company.location}`
      };
      
    case "regional":
      if (!company.location || company.location.trim() === "") {
        return {
          geoContext: `
- El contenido es de ámbito regional, pero sin región específica.
- NO menciones ninguna ubicación concreta.`,
          locationInfo: "Ámbito: Regional"
        };
      }
      return {
        geoContext: `
- Menciona la región "${company.location}" 1-2 veces para SEO regional.
- Evita mencionar ciudades o pueblos específicos dentro de la región.`,
        locationInfo: `Región: ${company.location}`
      };
      
    case "national":
    default:
      return {
        geoContext: `
- PROHIBIDO TOTALMENTE mencionar cualquier ubicación geográfica específica.
- PROHIBIDO usar la palabra "null", "[ubicación]", o cualquier placeholder.
- El contenido es para toda España, sin referencias a ciudades, provincias o regiones.
- Si necesitas una referencia geográfica, usa SOLO "en España" o "en todo el territorio nacional".
- NUNCA dejes espacios vacíos o variables sin sustituir.`,
        locationInfo: "Ámbito: Nacional (toda España)"
      };
  }
}

// Generate contextual closing paragraph based on sector
async function generateClosingParagraph(
  company: CompanyData,
  articleTitle: string,
  lang: "es" | "ca",
  LOVABLE_API_KEY: string
): Promise<string> {
  const links: string[] = [];
  if (company.blog_url) links.push(`<a href="${company.blog_url}" target="_blank" rel="noopener">nuestro blog</a>`);
  if (company.instagram_url) links.push(`<a href="${company.instagram_url}" target="_blank" rel="noopener">Instagram</a>`);
  
  if (links.length === 0) {
    return lang === "es" 
      ? `<p><strong>¿Te ha resultado útil este contenido?</strong> Compártelo con quien pueda beneficiarse de esta información.</p>`
      : `<p><strong>T'ha resultat útil aquest contingut?</strong> Comparteix-lo amb qui pugui beneficiar-se d'aquesta informació.</p>`;
  }
  
  const linksText = links.join(lang === "ca" ? " i " : " y ");
  const sectorCategory = detectSectorCategory(company.sector);
  
  const prompt = `Genera una frase de cierre para un artículo de blog. RESPONDE SOLO con la frase en HTML.

EMPRESA: ${company.name}
SECTOR: ${company.sector || "Servicios profesionales"}
TÍTULO DEL ARTÍCULO: ${articleTitle}
IDIOMA: ${lang === "es" ? "Español" : "Catalán"}
ENLACES DISPONIBLES: ${linksText}

La frase debe:
1. Invitar al lector a explorar más contenido
2. Ser natural y relevante para el sector ${company.sector || "profesional"}
3. Integrar los enlaces de forma orgánica
4. Máximo 2 líneas
5. NO mencionar farmacias ni salud a menos que sea el sector

Ejemplos por sector:
- Marketing: "¿Quieres más estrategias para hacer crecer tu negocio? Descubre más en ${linksText}."
- Tecnología: "¿Te interesa la innovación? Síguenos en ${linksText} para más novedades."
- Legal: "¿Necesitas más orientación profesional? Visita ${linksText} para más información."
- General: "¿Te ha gustado este contenido? Encuentra más recursos en ${linksText}."

RESPONDE SOLO con la frase en formato: <p><strong>[Frase]</strong></p>`;

  try {
    const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const closingText = data.choices?.[0]?.message?.content?.trim();
      if (closingText && closingText.includes("<p>")) {
        return closingText;
      }
    }
  } catch (error) {
    console.error("Error generating closing paragraph:", error);
  }
  
  // Fallback based on sector category
  const fallbacks: Record<string, Record<string, string>> = {
    es: {
      marketing: `<p><strong>¿Quieres más estrategias para hacer crecer tu negocio?</strong> Descubre más contenido en ${linksText}.</p>`,
      tecnologia: `<p><strong>¿Te interesa la innovación y la tecnología?</strong> Síguenos en ${linksText} para más novedades.</p>`,
      salud: `<p><strong>¿Buscas más información sobre bienestar?</strong> Visita ${linksText} para más contenido.</p>`,
      legal: `<p><strong>¿Necesitas más orientación profesional?</strong> Encuentra más recursos en ${linksText}.</p>`,
      finanzas: `<p><strong>¿Quieres más consejos financieros?</strong> Descubre más en ${linksText}.</p>`,
      industria: `<p><strong>¿Te interesa la innovación industrial?</strong> Síguenos en ${linksText}.</p>`,
      educacion: `<p><strong>¿Quieres seguir aprendiendo?</strong> Visita ${linksText} para más contenido formativo.</p>`,
      default: `<p><strong>¿Te ha gustado este contenido?</strong> Descubre más en ${linksText}.</p>`
    },
    ca: {
      marketing: `<p><strong>Vols més estratègies per fer créixer el teu negoci?</strong> Descobreix més contingut a ${linksText}.</p>`,
      tecnologia: `<p><strong>T'interessa la innovació i la tecnologia?</strong> Segueix-nos a ${linksText} per més novetats.</p>`,
      salud: `<p><strong>Busques més informació sobre benestar?</strong> Visita ${linksText} per més contingut.</p>`,
      legal: `<p><strong>Necessites més orientació professional?</strong> Troba més recursos a ${linksText}.</p>`,
      finanzas: `<p><strong>Vols més consells financers?</strong> Descobreix més a ${linksText}.</p>`,
      industria: `<p><strong>T'interessa la innovació industrial?</strong> Segueix-nos a ${linksText}.</p>`,
      educacion: `<p><strong>Vols continuar aprenent?</strong> Visita ${linksText} per més contingut formatiu.</p>`,
      default: `<p><strong>T'ha agradat aquest contingut?</strong> Descobreix més a ${linksText}.</p>`
    }
  };
  
  return fallbacks[lang][sectorCategory] || fallbacks[lang].default;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company, topic: providedTopic, month, year, usedImageUrls = [], autoGenerateTopic = true }: RequestBody = await req.json();

    console.log("=== GENERATE ARTICLE EMPRESA ===");
    console.log("Company:", company.name);
    console.log("Sector:", company.sector);
    console.log("Geographic scope:", company.geographic_scope);
    console.log("Location:", company.location);
    console.log("Include featured image:", company.include_featured_image);
    console.log("Provided topic:", providedTopic);

    const monthNameEs = MONTH_NAMES_ES[month - 1];
    const monthNameCa = MONTH_NAMES_CA[month - 1];
    const dateContext = `${monthNameEs} ${year}`;
    const dateContextCa = `${monthNameCa} ${year}`;
    
    const { geoContext, locationInfo } = buildGeoContext(company);
    const sectorCategory = detectSectorCategory(company.sector);

    // Generate or use provided topic
    let topic = providedTopic;
    
    if (!topic || autoGenerateTopic) {
      console.log("Generating topic with AI for sector:", company.sector);
      
      const topicPrompt = `Eres un experto en marketing de contenidos para el sector "${company.sector || "servicios profesionales"}".

EMPRESA: ${company.name}
SECTOR: ${company.sector || "Servicios profesionales"}
ÁMBITO: ${company.geographic_scope === "national" ? "Nacional (España)" : company.location || "General"}
MES: ${monthNameEs} ${year}

Genera UN tema de blog que:
1. Sea MUY relevante para el sector ${company.sector || "profesional"}
2. Tenga potencial SEO para ${company.geographic_scope === "local" && company.location ? `negocios en ${company.location}` : "España"}
3. Considere tendencias de ${monthNameEs} ${year}
4. NO mencione el nombre de la empresa
5. Sea útil para los clientes potenciales de este sector
6. NO sea genérico - debe ser específico del sector

Ejemplos por sector:
- Marketing: "Estrategias de contenido para aumentar conversiones en 2025"
- Tecnología: "Automatización de procesos: cómo reducir costes operativos"
- Legal: "Cambios fiscales que afectan a autónomos este año"
- Industrial: "Mantenimiento predictivo: la clave para evitar paradas de producción"

Responde SOLO con el tema (máx 80 caracteres), sin explicaciones ni comillas.`;

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
            temperature: 0.8,
            max_tokens: 100,
          }),
        });

        if (topicResponse.ok) {
          const topicData = await topicResponse.json();
          topic = topicData.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") || topic;
          console.log("AI generated topic:", topic);
        }
      } catch (error) {
        console.error("Error generating topic:", error);
      }
      
      if (!topic) {
        topic = `Novedades del sector ${company.sector || "profesional"} para ${monthNameEs} ${year}`;
      }
    }

    // Build dynamic system prompt based on sector
    const systemPrompt = `Eres un redactor experto en marketing de contenidos y SEO especializado en el sector ${company.sector || "servicios profesionales"}.

SOBRE LA EMPRESA:
- Nombre: ${company.name}
- Sector: ${company.sector || "Servicios profesionales"}
- Ámbito geográfico: ${company.geographic_scope === "national" ? "Nacional (toda España)" : company.location || "General"}

TU MISIÓN:
Generar un artículo de blog de ~2000 palabras optimizado para SEO, relevante para el sector ${company.sector || "profesional"} y atractivo para su audiencia objetivo.

REGLAS CRÍTICAS:
${geoContext}

FORMATO DEL CONTENIDO:
- TÍTULO H1: Máximo 60 caracteres. SIN nombre de empresa. SIN ubicación en el título.
- META DESCRIPTION: 150-160 caracteres, atractiva con CTA implícito.
- SLUG: URL amigable en minúsculas con guiones.
- CONTENIDO: ~2000 palabras con H2 y párrafos. NO uses H1 dentro del contenido.

TONO:
- Profesional pero accesible
- Adaptado al sector ${company.sector || "profesional"}
- Orientado a aportar valor al lector

FECHA ACTUAL: ${dateContext}

RESPONDE ÚNICAMENTE EN JSON VÁLIDO.`;

    const userPrompt = `EMPRESA: ${company.name}
SECTOR: ${company.sector || "Servicios profesionales"}
${locationInfo}
FECHA: ${dateContext}

TEMA DEL ARTÍCULO: ${topic}

Genera un artículo profesional para el blog de esta empresa.
El contenido debe ser relevante para su sector (${company.sector || "profesional"}) y audiencia objetivo.

IMPORTANTE:
- El título NO debe incluir el nombre de la empresa ni la ubicación
- El contenido debe ser específico del sector, no genérico
- Aporta valor real al lector con información útil y práctica
${company.geographic_scope === "national" ? "- NUNCA menciones ubicaciones específicas ni uses la palabra 'null'" : ""}

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título atractivo máx 60 caracteres",
  "meta_description": "Meta descripción de 150-160 caracteres con CTA",
  "slug": "url-amigable-sin-espacios",
  "content": "<h2>Sección 1</h2><p>Contenido...</p><h2>Sección 2</h2><p>Más contenido...</p>"
}`;

    console.log("Generating Spanish article for:", company.name, "Topic:", topic);

    // Generate Spanish article
    const spanishResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!spanishResponse.ok) {
      if (spanishResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await spanishResponse.text();
      throw new Error(`Spanish generation failed: ${spanishResponse.status} - ${errorText}`);
    }

    const spanishData = await spanishResponse.json();
    let spanishContent = spanishData.choices?.[0]?.message?.content;

    if (!spanishContent) {
      throw new Error("No Spanish content generated");
    }

    // Parse JSON from response
    let spanishArticle;
    try {
      // First, strip markdown code fences if present
      let cleanContent = spanishContent
        .replace(/^```(?:json)?\s*/i, '')  // Remove opening ```json
        .replace(/\s*```\s*$/i, '');        // Remove closing ```
      
      // Extract JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in content:", cleanContent.substring(0, 300));
        throw new Error("No JSON object found in response");
      }
      
      // Parse the extracted JSON
      spanishArticle = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Error parsing Spanish JSON:", e);
      console.error("Raw content preview:", spanishContent.substring(0, 500));
      throw new Error("Failed to parse Spanish article JSON");
    }

    // Validate no "null" in content for national scope
    if (company.geographic_scope === "national") {
      if (spanishArticle.content.includes(" null ") || spanishArticle.content.includes(">null<") || spanishArticle.content.includes("en null")) {
        console.warn("Detected 'null' in content, cleaning...");
        spanishArticle.content = spanishArticle.content
          .replace(/ en null /gi, " ")
          .replace(/ null /gi, " ")
          .replace(/>null</gi, "><")
          .replace(/en null,/gi, "")
          .replace(/null/gi, "España");
      }
    }

    // Generate contextual closing paragraph
    const closingParagraphEs = await generateClosingParagraph(company, spanishArticle.title, "es", LOVABLE_API_KEY);
    spanishArticle.content += closingParagraphEs;

    console.log("Spanish article generated successfully");

    // Generate Catalan version if needed
    let catalanArticle = null;
    if (company.languages?.includes("catalan")) {
      console.log("Generating Catalan version...");
      
      const catalanPrompt = `Traduce el siguiente artículo del español al catalán.

REGLAS ESTRICTAS:
1. PROHIBIDO usar palabras en español. Todo debe estar en catalán correcto.
2. El título debe empezar con artículo catalán apropiado (El, La, Els, Les, Un, Una, etc.)
3. NO uses "para" (español), usa "per a" o "per" (catalán)
4. NO uses "y" (español), usa "i" (catalán)
5. NO uses "de la", usa "de la" o "del" según corresponda en catalán
6. Adapta expresiones al catalán natural, no traduzcas literalmente

ARTÍCULO EN ESPAÑOL:
Título: ${spanishArticle.title}
Meta: ${spanishArticle.meta_description}
Slug: ${spanishArticle.slug}
Contenido: ${spanishArticle.content}

RESPONDE EN JSON:
{
  "title": "Títol en català",
  "meta_description": "Meta descripció en català",
  "slug": "url-en-catala",
  "content": "Contingut HTML en català"
}`;

      try {
        const catalanResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: catalanPrompt }],
            temperature: 0.3,
            max_tokens: 8000,
          }),
        });

        if (catalanResponse.ok) {
          const catalanData = await catalanResponse.json();
          let catalanContent = catalanData.choices?.[0]?.message?.content;
          
          if (catalanContent) {
            // Strip markdown code fences if present
            let cleanCatalan = catalanContent
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```\s*$/i, '');
            
            const jsonMatch = cleanCatalan.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              catalanArticle = JSON.parse(jsonMatch[0]);
              
              // Generate Catalan closing paragraph
              const closingParagraphCa = await generateClosingParagraph(company, catalanArticle.title, "ca", LOVABLE_API_KEY);
              catalanArticle.content += closingParagraphCa;
              
              console.log("Catalan article generated successfully");
            }
          }
        }
      } catch (error) {
        console.error("Error generating Catalan:", error);
      }
    }

    // Generate image if requested
    let imageResult = null;
    let pexelsQuery = null;
    
    const skipImage = company.include_featured_image === false;
    
    if (!skipImage && UNSPLASH_ACCESS_KEY) {
      console.log("Generating image for sector:", company.sector);
      
      const sectorContext = getSectorImageContext(company.sector);
      
      // Generate image query using AI
      const imageQueryPrompt = `Genera un query de búsqueda para Unsplash basado en este artículo.

SECTOR: ${company.sector || "Servicios profesionales"}
TÍTULO: ${spanishArticle.title}
RESUMEN: ${spanishArticle.content.substring(0, 500)}

REGLAS:
1. El query debe ser en INGLÉS
2. Máximo 5 palabras
3. Debe representar visualmente el tema del artículo
4. Debe ser apropiado para el sector ${company.sector || "profesional"}
5. NO uses términos médicos, farmacéuticos ni de salud (a menos que el sector sea de salud)
6. Evita: ${sectorContext.prohibitedTerms.join(", ")}

EJEMPLOS PARA ESTE SECTOR:
${sectorContext.examples.join("\n")}

Responde SOLO con el query en inglés, sin explicaciones.`;

      try {
        const queryResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: imageQueryPrompt }],
            temperature: 0.5,
            max_tokens: 50,
          }),
        });

        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
          pexelsQuery = queryData.choices?.[0]?.message?.content?.trim().toLowerCase().replace(/['"]/g, "");
          console.log("AI generated image query:", pexelsQuery);
        }
      } catch (error) {
        console.error("Error generating image query:", error);
      }
      
      if (!pexelsQuery) {
        pexelsQuery = sectorContext.fallbackQuery;
      }

      // Search Unsplash
      try {
        const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(pexelsQuery)}&per_page=20&orientation=landscape`;
        const unsplashResponse = await fetch(searchUrl, {
          headers: { "Authorization": `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        });

        if (unsplashResponse.ok) {
          const unsplashData = await unsplashResponse.json();
          const photos = unsplashData.results || [];
          
          // Filter out already used images
          const availablePhotos = photos.filter((p: { urls: { regular: string } }) => 
            !usedImageUrls.includes(p.urls.regular)
          );
          
          if (availablePhotos.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(availablePhotos.length, 10));
            const photo = availablePhotos[randomIndex];
            imageResult = {
              url: photo.urls.regular,
              photographer: photo.user.name,
              photographer_url: photo.user.links.html,
            };
            console.log("Image selected from Unsplash:", imageResult.url);
          } else if (photos.length > 0) {
            // Use any photo if all are used
            const randomIndex = Math.floor(Math.random() * Math.min(photos.length, 10));
            const photo = photos[randomIndex];
            imageResult = {
              url: photo.urls.regular,
              photographer: photo.user.name,
              photographer_url: photo.user.links.html,
            };
          }
        }
      } catch (error) {
        console.error("Unsplash search error:", error);
      }

      // Fallback to predefined images
      if (!imageResult) {
        const availableFallbacks = FALLBACK_IMAGES.filter(img => !usedImageUrls.includes(img.url));
        const fallbackPool = availableFallbacks.length > 0 ? availableFallbacks : FALLBACK_IMAGES;
        const randomIndex = Math.floor(Math.random() * fallbackPool.length);
        imageResult = fallbackPool[randomIndex];
        console.log("Using fallback image:", imageResult.url);
      }
    }

    const response = {
      content: {
        spanish: spanishArticle,
        catalan: catalanArticle,
      },
      image: imageResult,
      pexels_query: pexelsQuery,
      topic: topic,
    };

    console.log("=== ARTICLE GENERATION COMPLETE ===");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-article-empresa:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
