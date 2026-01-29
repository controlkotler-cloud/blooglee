import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompanyData {
  name: string;
  location?: string | null;
  sector?: string | null;
  description?: string | null;  // Descripción y audiencia objetivo
  languages?: string[];
  blog_url?: string | null;
  instagram_url?: string | null;
  geographic_scope?: string;
  include_featured_image?: boolean;
}

interface RequestBody {
  company: CompanyData;
  empresaId?: string;        // Para buscar historial de temas usados
  topic?: string | null;
  month: number;
  year: number;
  usedImageUrls?: string[];
  usedTopics?: string[];     // Opcional: temas ya usados desde frontend
  autoGenerateTopic?: boolean;
}

// Helper function to get used topics for a company
async function getUsedTopicsForEmpresa(
  supabaseClient: any,
  empresaId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from('articulos_empresas')
      .select('topic')
      .eq('empresa_id', empresaId)
      .order('generated_at', { ascending: false })
      .limit(50);  // Últimos 50 temas
    
    if (error) {
      console.error("Error fetching used topics:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map((a: { topic: string }) => a.topic);
  } catch (e) {
    console.error("Exception fetching used topics:", e);
    return [];
  }
}

interface SectorContext {
  examples: string[];
  prohibitedTerms: string[];
  fallbackQuery: string;
  toneDescription?: string;
}

// Sector-specific image contexts (hardcoded base sectors)
const SECTOR_IMAGE_CONTEXTS: Record<string, SectorContext> = {
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
  hosteleria: {
    examples: [
      "restaurant interior modern elegant dining tables",
      "chef cooking kitchen professional gourmet",
      "hotel lobby luxury modern reception elegant",
      "cafe terrace outdoor cozy ambiance coffee",
      "gourmet food plating professional presentation",
      "waiter serving customers restaurant professional"
    ],
    prohibitedTerms: ["fast food", "dirty kitchen", "drunk", "messy", "garbage"],
    fallbackQuery: "restaurant elegant dining professional interior"
  },
  retail: {
    examples: [
      "modern retail store interior design shelves",
      "shopping experience customer service professional",
      "boutique fashion store elegant display window",
      "customer shopping happy store modern bags",
      "shop owner small business professional friendly"
    ],
    prohibitedTerms: ["empty store", "closing sale", "cheap", "discount", "clearance"],
    fallbackQuery: "retail store modern shopping experience"
  },
  inmobiliaria: {
    examples: [
      "modern house interior living room bright",
      "real estate agent showing property clients",
      "luxury apartment interior design contemporary",
      "beautiful home exterior garden architecture",
      "keys handover new home happy couple"
    ],
    prohibitedTerms: ["foreclosure", "abandoned", "ruined", "demolished"],
    fallbackQuery: "modern home interior real estate property"
  },
  automocion: {
    examples: [
      "car dealership showroom modern vehicles",
      "mechanic workshop professional automotive repair",
      "new car interior dashboard modern technology",
      "automotive service center professional clean",
      "car keys handover customer satisfaction"
    ],
    prohibitedTerms: ["accident", "crash", "wrecked", "junkyard", "broken"],
    fallbackQuery: "car dealership showroom professional automotive"
  },
  construccion: {
    examples: [
      "construction site workers safety helmets professional",
      "architect blueprints planning modern office",
      "building construction progress crane modern",
      "renovation home improvement professional workers",
      "construction team collaboration project site"
    ],
    prohibitedTerms: ["accident", "collapse", "danger", "unsafe", "abandoned"],
    fallbackQuery: "construction professional workers building modern"
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
  
  // Belleza / Peluquería - MUST BE FIRST to avoid matching "salud"
  if (s.includes("peluqu") || s.includes("cabello") || s.includes("estétic") || s.includes("estetica") || s.includes("hair") || s.includes("salon de belleza") || s.includes("salón de belleza") || s.includes("manicur") || s.includes("pedicur") || s.includes("maquillaje") || s.includes("beauty")) {
    return "belleza";
  }
  // Hostelería
  if (s.includes("restaur") || s.includes("hotel") || s.includes("hostel") || s.includes("bar ") || s.includes("cafeter") || s.includes("gastronom") || s.includes("cocina") || s.includes("catering")) {
    return "hosteleria";
  }
  // Retail / Comercio
  if (s.includes("tienda") || s.includes("retail") || s.includes("comercio") || s.includes("boutique") || s.includes("shop") || s.includes("venta al por menor") || s.includes("moda")) {
    return "retail";
  }
  // Inmobiliaria
  if (s.includes("inmobil") || s.includes("real estate") || s.includes("propiedad") || s.includes("vivienda") || s.includes("alquiler") || s.includes("hipoteca")) {
    return "inmobiliaria";
  }
  // Automoción
  if (s.includes("automóvil") || s.includes("automocion") || s.includes("coche") || s.includes("vehículo") || s.includes("taller mecánico") || s.includes("concesionario") || s.includes("automotive")) {
    return "automocion";
  }
  // Construcción
  if (s.includes("construc") || s.includes("arquitect") || s.includes("reforma") || s.includes("obra") || s.includes("edificación") || s.includes("albañil")) {
    return "construccion";
  }
  // Marketing
  if (s.includes("marketing") || s.includes("seo") || s.includes("digital") || s.includes("publicidad") || s.includes("comunicación") || s.includes("redes sociales")) {
    return "marketing";
  }
  // Tecnología
  if (s.includes("tecnolog") || s.includes("software") || s.includes("informát") || s.includes("desarrollo") || s.includes("programación") || s.includes("it") || s.includes("saas")) {
    return "tecnologia";
  }
  // Salud (after belleza to avoid false positives)
  if (s.includes("salud") || s.includes("médic") || s.includes("clínic") || s.includes("wellness") || s.includes("bienestar") || s.includes("terapia") || s.includes("fisio")) {
    return "salud";
  }
  // Legal
  if (s.includes("legal") || s.includes("abogad") || s.includes("jurídic") || s.includes("notaría") || s.includes("asesoría legal")) {
    return "legal";
  }
  // Finanzas
  if (s.includes("finanz") || s.includes("banco") || s.includes("inversión") || s.includes("contab") || s.includes("fiscal") || s.includes("seguros")) {
    return "finanzas";
  }
  // Industria
  if (s.includes("industria") || s.includes("manufactura") || s.includes("fábrica") || s.includes("producción") || s.includes("logística")) {
    return "industria";
  }
  // Educación
  if (s.includes("educa") || s.includes("formación") || s.includes("academia") || s.includes("enseñanza") || s.includes("universidad") || s.includes("colegio")) {
    return "educacion";
  }
  
  return "default";
}

// Generate sector context with AI for unknown sectors
async function generateSectorContextWithAI(sector: string, lovableApiKey: string): Promise<{
  keywords: string[];
  examples: string[];
  prohibitedTerms: string[];
  fallbackQuery: string;
  toneDescription: string;
}> {
  console.log(`Generating sector context with AI for: "${sector}"`);
  
  const prompt = `Eres un experto en marketing y fotografía profesional. 
  
Para el sector empresarial "${sector}", genera un contexto de imágenes profesionales y tono de comunicación.

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
  "toneDescription": "Descripción breve del tono y enfoque que deben tener los artículos para este sector"
}

REGLAS:
- keywords: 3-5 palabras clave en ESPAÑOL para detectar este sector en el futuro
- examples: queries de búsqueda para Unsplash en INGLÉS, profesionales y positivos
- prohibitedTerms: cosas que NO queremos que aparezcan en las imágenes (en inglés)
- fallbackQuery: un query genérico pero seguro para el sector (en inglés)
- toneDescription: cómo debe ser el tono de los artículos (en español)`;

  try {
    const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    // Return a safe default
    return {
      keywords: [sector.toLowerCase()],
      examples: [
        "professional team collaboration office",
        "business success growth abstract",
        "modern workspace minimal clean"
      ],
      prohibitedTerms: [],
      fallbackQuery: "professional business modern office",
      toneDescription: "Profesional, informativo y orientado al cliente"
    };
  }
}

// Get or create sector context (checks hardcoded, then DB, then generates with AI)
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
        fallbackQuery: existingSector.fallback_query || "professional business modern",
        toneDescription: existingSector.tone_description
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
    fallbackQuery: newContext.fallbackQuery,
    toneDescription: newContext.toneDescription
  };
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client for dynamic sector lookup
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { company, empresaId, topic: providedTopic, month, year, usedImageUrls = [], usedTopics = [], autoGenerateTopic = true }: RequestBody = await req.json();

    console.log("=== GENERATE ARTICLE EMPRESA ===");
    console.log("Company:", company.name);
    console.log("Sector:", company.sector);
    console.log("Geographic scope:", company.geographic_scope);
    console.log("Location:", company.location);
    console.log("Include featured image:", company.include_featured_image);
    console.log("Provided topic:", providedTopic);
    console.log("Empresa ID for topic history:", empresaId || "not provided");

    const monthNameEs = MONTH_NAMES_ES[month - 1];
    const monthNameCa = MONTH_NAMES_CA[month - 1];
    const dateContext = `${monthNameEs} ${year}`;
    const dateContextCa = `${monthNameCa} ${year}`;
    
    const { geoContext, locationInfo } = buildGeoContext(company);

    // Get or create sector context (dynamic!)
    const sectorContext = await getOrCreateSectorContext(company.sector, supabase, LOVABLE_API_KEY);
    console.log("Sector context obtained:", sectorContext.fallbackQuery);

    // Generate or use provided topic
    let topic = providedTopic;
    
    if (!topic || autoGenerateTopic) {
      console.log("Generating topic with AI for sector:", company.sector);
      
      // Fetch used topics if empresaId provided and usedTopics not already passed
      let usedTopicsList: string[] = usedTopics;
      if (empresaId && usedTopicsList.length === 0) {
        usedTopicsList = await getUsedTopicsForEmpresa(supabase, empresaId);
        console.log(`Found ${usedTopicsList.length} previously used topics for empresa ${empresaId}`);
      }
      
      // Build used topics section for prompt
      const usedTopicsSection = usedTopicsList.length > 0 
        ? `\n\n⚠️ TEMAS YA USADOS (NO REPETIR NI HACER VARIACIONES SIMILARES):\n${usedTopicsList.slice(0, 30).map((t, i) => `${i+1}. ${t}`).join('\n')}`
        : '';
      
      const toneHint = sectorContext.toneDescription 
        ? `\nTONO RECOMENDADO: ${sectorContext.toneDescription}` 
        : "";
      
      // Construir contexto de audiencia si hay descripción
      const audienceHintForTopic = company.description 
        ? `\nAUDIENCIA OBJETIVO (MUY IMPORTANTE): ${company.description.substring(0, 300)}
IMPORTANTE: El tema debe ser útil para ATRAER a esta audiencia (clientes potenciales), NO para otros profesionales del sector.`
        : "";

      const topicPrompt = `Eres un experto en marketing de contenidos para el sector "${company.sector || "servicios profesionales"}".

EMPRESA: ${company.name}
SECTOR: ${company.sector || "Servicios profesionales"}
ÁMBITO: ${company.geographic_scope === "national" ? "Nacional (España)" : company.location || "General"}
MES: ${monthNameEs} ${year}${toneHint}${audienceHintForTopic}${usedTopicsSection}

Genera UN tema de blog que:
1. Sea MUY relevante para ATRAER CLIENTES de la empresa (no para otros profesionales del sector)
2. Tenga potencial SEO para ${company.geographic_scope === "local" && company.location ? `negocios en ${company.location}` : "España"}
3. Considere tendencias de ${monthNameEs} ${year}
4. NO mencione el nombre de la empresa
5. Sea útil para los CLIENTES POTENCIALES de este sector
6. NO sea genérico - debe ser específico y práctico
7. SEA COMPLETAMENTE DIFERENTE a los temas ya usados (no variaciones del mismo tema)
8. Si hay audiencia objetivo definida, el tema debe ATRAER a esa audiencia

Ejemplos de temas que ATRAEN CLIENTES (no escritos para profesionales del sector):
- Agencia Marketing: "5 errores de marketing que frenan tu pyme", "Cómo medir el ROI de tu inversión digital", "Guía SEO para autónomos"
- Tecnología: "Automatización que ahorra horas a tu negocio", "Ciberseguridad básica para pymes", "Por qué tu empresa necesita estar en la nube"
- Legal: "Cambios fiscales que afectan a autónomos", "Protección de datos: guía para pequeños negocios"

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
    const toneInstruction = sectorContext.toneDescription 
      ? `\nTONO ESPECÍFICO DEL SECTOR: ${sectorContext.toneDescription}` 
      : "";
    
    // Construir contexto de audiencia objetivo
    const audienceContext = company.description 
      ? `

AUDIENCIA OBJETIVO (MUY IMPORTANTE):
${company.description}

⚠️ REGLA CRÍTICA: El artículo debe estar escrito PARA ATRAER a esta audiencia (clientes potenciales), NO para otros profesionales del sector ${company.sector}.
Por ejemplo, si eres una agencia de marketing, escribe para tus CLIENTES POTENCIALES (pymes, autónomos, empresas B2B), NO para otras agencias de marketing.`
      : "";

    const systemPrompt = `Eres un redactor experto en marketing de contenidos y SEO especializado en el sector ${company.sector || "servicios profesionales"}.

SOBRE LA EMPRESA:
- Nombre: ${company.name}
- Sector: ${company.sector || "Servicios profesionales"}
- Ámbito geográfico: ${company.geographic_scope === "national" ? "Nacional (toda España)" : company.location || "General"}
${toneInstruction}${audienceContext}

TU MISIÓN:
Generar un artículo de blog de ~2000 palabras optimizado para SEO que ATRAIGA CLIENTES para ${company.name}, ofreciendo contenido valioso que resuelva problemas de su audiencia objetivo.

REGLAS CRÍTICAS:
${geoContext}

FORMATO DEL CONTENIDO:
- TÍTULO H1: Máximo 60 caracteres. SIN nombre de empresa. SIN ubicación en el título.
- META DESCRIPTION: 150-160 caracteres, atractiva con CTA implícito.
- SLUG: URL amigable en minúsculas con guiones.
- CONTENIDO: ~2000 palabras con H2 y párrafos. NO uses H1 dentro del contenido.

REGLAS DE ORTOGRAFÍA Y FORMATO OBLIGATORIAS:
- MAYÚSCULAS EN TÍTULOS: Usa las reglas del español, NO el estilo inglés (Title Case). Solo mayúscula inicial en títulos y subtítulos, excepto nombres propios.
  - CORRECTO: "Cómo mejorar tu estrategia de marketing digital"
  - INCORRECTO: "Cómo Mejorar Tu Estrategia De Marketing Digital"
- LISTAS HTML: Si introduces una enumeración con dos puntos (:), formatea TODOS los elementos como lista HTML (<ul><li>...</li></ul>) para mantener consistencia visual. Nunca mezcles párrafos sueltos con listas.

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
- Aplica las reglas de ortografía española: solo mayúscula inicial en títulos/subtítulos (no en cada palabra)
- Si enumeras puntos tras dos puntos (:), usa SIEMPRE formato lista HTML (<ul><li>)
${company.geographic_scope === "national" ? "- NUNCA menciones ubicaciones específicas ni uses la palabra 'null'" : ""}

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título atractivo máx 60 caracteres",
  "meta_description": "Meta descripción de 150-160 caracteres con CTA",
  "slug": "url-amigable-sin-espacios",
  "content": "<h2>Sección 1</h2><p>Contenido...</p><h2>Sección 2</h2><p>Más contenido...</p>"
}`;

    console.log("Generating Spanish article for:", company.name, "Topic:", topic);

    // Generate Spanish article with INTERNAL retry logic for transient failures
    const MAX_CONTENT_RETRIES = 2;
    let spanishContent: string | null = null;
    let spanishArticle: any = null;
    let lastContentError: Error | null = null;

    for (let contentRetry = 0; contentRetry < MAX_CONTENT_RETRIES; contentRetry++) {
      try {
        console.log(`Spanish content generation attempt ${contentRetry + 1}/${MAX_CONTENT_RETRIES}`);
        
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
        spanishContent = spanishData.choices?.[0]?.message?.content;

        if (!spanishContent) {
          throw new Error("No Spanish content generated");
        }

        // Parse JSON from response with robust cleaning
        let cleanContent = spanishContent
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
          throw new Error("No JSON object found in response");
        }
        
        const jsonString = cleanContent.substring(firstBrace, lastBrace + 1);
        const sanitizedJson = jsonString.replace(/[\x00-\x1F\x7F]/g, (char: string) => {
          if (char === '\n' || char === '\r' || char === '\t') return char;
          return '';
        });
        
        spanishArticle = JSON.parse(sanitizedJson);
        console.log(`✓ Spanish content generated successfully on attempt ${contentRetry + 1}`);
        break; // Success! Exit the retry loop
        
      } catch (e) {
        lastContentError = e instanceof Error ? e : new Error(String(e));
        console.error(`Spanish content attempt ${contentRetry + 1} failed:`, lastContentError.message);
        
        if (contentRetry < MAX_CONTENT_RETRIES - 1) {
          console.log(`Retrying Spanish content generation in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // If all retries failed, throw the last error
    if (!spanishArticle) {
      console.error("All Spanish content retries failed");
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

    // Generate image with AI if requested
    let imageResult = null;
    let pexelsQuery = null;
    
    const skipImage = company.include_featured_image === false;
    
    if (!skipImage) {
      console.log("Generating image with AI for sector:", company.sector);
      
      // Build image prompt based on sector
      const imagePrompt = `Generate a professional blog header image.

TOPIC: "${topic}"
SECTOR: ${company.sector || "professional business services"}
CONTEXT: Professional business content for ${company.name}

REQUIREMENTS:
- Clean, professional photograph style
- Visually related to the topic and sector
- NO text, NO logos, NO faces showing
- Suitable for blog header, 16:9 aspect ratio
- High quality, editorial style
- Modern, professional aesthetic
- Avoid: ${sectorContext.prohibitedTerms.join(", ")}`;

      let aiImageSuccess = false;
      
      try {
        console.log("Calling gemini-3-pro-image-preview for image generation...");
        
        const imageResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"]
          }),
        });

        console.log("AI image response status:", imageResponse.status);
        
        if (imageResponse.ok) {
          const imageDataResponse = await imageResponse.json();
          console.log("AI image response structure:", JSON.stringify(Object.keys(imageDataResponse)));
          
          const message = imageDataResponse.choices?.[0]?.message;
          console.log("Message keys:", JSON.stringify(Object.keys(message || {})));
          console.log("Has images array:", !!message?.images);
          console.log("Images count:", message?.images?.length || 0);
          
          const base64Image = message?.images?.[0]?.image_url?.url;
          
          if (base64Image && base64Image.startsWith("data:image")) {
            console.log("AI image generated successfully, uploading to storage...");
            
            // Extract base64 data and convert to buffer
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Generate filename
            const timestamp = Date.now();
            const safeTopicName = topic.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
            const fileName = `empresas/${timestamp}-${safeTopicName}.png`;
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('article-images')
              .upload(fileName, imageBuffer, { 
                contentType: 'image/png', 
                upsert: true 
              });
            
            if (uploadError) {
              console.error("Storage upload error:", uploadError);
            } else {
              // Get public URL
              const { data: publicUrlData } = supabase.storage
                .from('article-images')
                .getPublicUrl(fileName);
              
              if (publicUrlData?.publicUrl) {
                imageResult = {
                  url: publicUrlData.publicUrl,
                  photographer: "AI Generated",
                  photographer_url: "https://ai.gateway.lovable.dev",
                };
                aiImageSuccess = true;
                console.log("Image uploaded to storage:", publicUrlData.publicUrl);
              }
            }
          } else {
            console.log("No valid base64 image found in AI response");
            if (message?.content) {
              console.log("Message content preview:", message.content.substring(0, 200));
            }
          }
        } else {
          const errorText = await imageResponse.text();
          console.error("AI image generation failed:", imageResponse.status, errorText);
        }
      } catch (aiImageError) {
        console.error("AI image generation error:", aiImageError);
      }

      // Fallback to Unsplash if AI image generation failed
      if (!aiImageSuccess && UNSPLASH_ACCESS_KEY) {
        console.log("AI image failed, falling back to Unsplash...");
        
        // Generate search query for Unsplash
        pexelsQuery = sectorContext.fallbackQuery;

        const imageQueryPrompt = `Genera un query de búsqueda para Unsplash basado en este artículo.

SECTOR: ${company.sector || "Servicios profesionales"}
TÍTULO: ${spanishArticle.title}

REGLAS:
1. Máximo 5 palabras en INGLÉS
2. Apropiado para el sector ${company.sector || "profesional"}
3. Evita: ${sectorContext.prohibitedTerms.join(", ")}
4. Responde SOLO con el query.`;

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
              max_tokens: 50,
            }),
          });

          if (queryResponse.ok) {
            const queryData = await queryResponse.json();
            const rawQuery = queryData.choices?.[0]?.message?.content?.trim();
            if (rawQuery && rawQuery.length > 5) {
              pexelsQuery = rawQuery.toLowerCase().replace(/['"]/g, "");
              console.log("AI generated Unsplash query:", pexelsQuery);
            }
          }
        } catch (e) {
          console.error("Error generating Unsplash query:", e);
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
              console.log("Selected Unsplash image from:", photo.user.name);
            } else if (photos.length > 0) {
              const photo = photos[0];
              imageResult = {
                url: photo.urls.regular,
                photographer: photo.user.name,
                photographer_url: photo.user.links.html,
              };
            }
          }
        } catch (unsplashError) {
          console.error("Unsplash error:", unsplashError);
        }

        // Final fallback to predefined images
        if (!imageResult) {
          const availableFallbacks = FALLBACK_IMAGES.filter(img => !usedImageUrls.includes(img.url));
          const fallbackPool = availableFallbacks.length > 0 ? availableFallbacks : FALLBACK_IMAGES;
          const randomIndex = Math.floor(Math.random() * fallbackPool.length);
          imageResult = fallbackPool[randomIndex];
          console.log("Using fallback image:", imageResult.url);
        }
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
