import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// MKPro notification emails
const NOTIFICATION_EMAILS = ["controlkotler@gmail.com", "laura@mkpro.es"];

interface TopicData {
  tema: string;
  keywords: string[];
  pexels_query: string;
}

interface PharmacyData {
  id?: string;
  name: string;
  location?: string | null;
  sector?: string;
  languages: string[];
  blog_url?: string;
  instagram_url?: string;
  geographic_scope?: string; // local, regional, national
}

interface RequestBody {
  pharmacy?: PharmacyData;
  pharmacyId?: string; // For scheduler: lookup pharmacy by ID
  topic?: TopicData | null;
  month: number;
  year: number;
  usedImageUrls?: string[];
  autoGenerateTopic?: boolean;
  skipImage?: boolean;
  isScheduled?: boolean; // Flag for scheduled execution
}

// Send notification email for MKPro - ONLY for published articles
async function sendMKProNotification(
  pharmacyName: string,
  articleTitle: string,
  articleExcerpt: string,
  wpUrl: string,
  isPublished: boolean = true
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping notification");
    return;
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    
    const statusTitle = isPublished ? "🚀 Artículo Publicado" : "📝 Artículo Generado";
    const statusMessage = isPublished 
      ? `Se ha publicado un nuevo artículo para <strong>${pharmacyName}</strong>:`
      : `Se ha generado un nuevo artículo para <strong>${pharmacyName}</strong>:`;
    const buttonText = isPublished ? "Ver artículo publicado →" : "Ver en el blog →";
    const footerText = isPublished 
      ? "MKPro - Publicación automática de contenido" 
      : "MKPro - Generación automática de contenido";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${isPublished ? '#10b981' : '#6366f1'}, ${isPublished ? '#059669' : '#8b5cf6'}); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${statusTitle}</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
        ${statusMessage}
      </p>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid ${isPublished ? '#10b981' : '#8b5cf6'};">
        <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 18px;">${articleTitle}</h2>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">${articleExcerpt || 'Artículo generado automáticamente'}</p>
      </div>
      <p style="margin: 20px 0;"><a href="${wpUrl}" style="display: inline-block; background: ${isPublished ? '#10b981' : '#6366f1'}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">${buttonText}</a></p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
        ${footerText}
      </p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: "Blooglee <hola@blooglee.com>",
      to: NOTIFICATION_EMAILS,
      subject: isPublished ? `🚀 Artículo publicado: ${pharmacyName}` : `✅ Artículo generado: ${pharmacyName}`,
      html,
    });

    console.log("Notification email sent to:", NOTIFICATION_EMAILS.join(", "));
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
}

// ==========================================
// MARKDOWN CLEANUP - Remove markdown syntax that slipped into HTML
// ==========================================
function cleanMarkdownFromHtml(content: string): string {
  if (!content) return content;
  
  return content
    // **texto** or __texto__ → <strong>texto</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // *texto* or _texto_ → <em>texto</em> (not inside strong tags)
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
    // ~~texto~~ → <del>texto</del>
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // `codigo` → <code>codigo</code>
    .replace(/`([^`]+)`/g, '<code>$1</code>');
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
    const requestBody: RequestBody = await req.json();
    const { pharmacyId, pharmacy: providedPharmacy, topic: providedTopic, month, year, usedImageUrls = [], autoGenerateTopic, skipImage, isScheduled } = requestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!UNSPLASH_ACCESS_KEY && !skipImage) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
    }

    // Create Supabase client for DB operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get pharmacy data - either from request or lookup by ID
    let pharmacy: PharmacyData;
    let farmaciaId: string | undefined;

    if (pharmacyId) {
      // Scheduler mode: lookup pharmacy by ID
      console.log("=== SCHEDULER MODE: Looking up pharmacy by ID ===");
      console.log("Pharmacy ID:", pharmacyId);
      
      const { data: farmaciaData, error: farmaciaError } = await supabase
        .from("farmacias")
        .select("*")
        .eq("id", pharmacyId)
        .single();
      
      if (farmaciaError || !farmaciaData) {
        console.error("Farmacia not found:", farmaciaError);
        return new Response(JSON.stringify({ error: "Farmacia not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      pharmacy = {
        id: farmaciaData.id,
        name: farmaciaData.name,
        location: farmaciaData.location,
        languages: farmaciaData.languages || ["spanish"],
        blog_url: farmaciaData.blog_url,
        instagram_url: farmaciaData.instagram_url,
        sector: "farmacia",
        geographic_scope: "local",
      };
      farmaciaId = pharmacyId;
    } else if (providedPharmacy) {
      // Manual mode: use provided pharmacy data
      pharmacy = providedPharmacy;
      farmaciaId = providedPharmacy.id;
    } else {
      return new Response(JSON.stringify({ error: "Either pharmacy or pharmacyId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("=== GENERATE ARTICLE (FARMACIA) ===");
    console.log("Pharmacy:", pharmacy.name);
    console.log("Is Scheduled:", isScheduled);

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
- SEO TITLE: Diferente al H1, optimizado para CTR, máximo 60 caracteres, que EMPIECE con la focus_keyword
- Meta descripción de 150-160 caracteres que INCLUYA la focus_keyword
- EXCERPT: Resumen corto del artículo (diferente a meta_description), máximo 160 caracteres
- FOCUS KEYWORD: Define UNA keyword principal de 2-4 palabras relacionada con el tema
- Slug URL amigable sin tildes ni caracteres especiales que INCLUYA la focus_keyword
- Estructura: introducción + 4-5 secciones H2 + conclusión con CTA
- Menciona la farmacia 1-2 veces en el CONTENIDO (nunca en el título)
${geoContext}
- Tono profesional pero cercano
- El contenido debe estar en formato HTML con tags <h2>, <p>, <ul>, <li>
- VARIEDAD: Aunque el tema sea similar, cada artículo debe tener un enfoque único basado en la farmacia y su ubicación.

ENLACES EXTERNOS (2-3 por artículo):
- Incluye 2-3 enlaces externos a fuentes de autoridad cuando menciones estadísticas, estudios o datos.
- Si conoces la URL exacta del recurso (artículo, estudio, página específica), inclúyela completa.
- Si NO estás seguro de la URL específica, enlaza a la página principal del dominio de esa fuente.
  Ejemplo: en lugar de inventar "oms.int/es/noticias/2024/estudio-inventado", usa simplemente "https://www.who.int"
- El texto del enlace debe ser descriptivo: "según la OMS" con enlace a who.int
- Prioriza fuentes del sector salud: OMS, AEMPS, COFM, revistas médicas reconocidas.

REGLAS SEO CRÍTICAS PARA YOAST (semáforo verde):
1. La FOCUS KEYWORD (2-4 palabras) DEBE aparecer en:
   - El slug (URL)
   - El seo_title (idealmente al INICIO)
   - La meta_description
   - El primer párrafo del contenido (primeras 50 palabras)
   - Al menos 1 subtítulo H2
2. Densidad de keyword: 1-2% del texto total
3. El excerpt debe ser diferente de meta_description pero captar la esencia del artículo

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
  "seo_title": "SEO title que EMPIEZA con focus_keyword (máx 60 caracteres)",
  "meta_description": "Meta descripción de 150-160 caracteres con focus_keyword",
  "excerpt": "Resumen breve del artículo (máx 160 caracteres, diferente a meta_description)",
  "focus_keyword": "keyword principal de 2-4 palabras",
  "slug": "slug-url-con-focus-keyword-sin-tildes",
  "content": "<h2>Subtítulo que incluya focus_keyword...</h2><p>El primer párrafo DEBE contener la focus_keyword de forma natural...</p><h2>Segunda sección</h2><p>Más contenido...</p>"
}`;

    console.log("Generating Spanish article for:", pharmacy.name, "Topic:", topic.tema, "Date:", dateContext);

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
          console.error(`AI gateway error (Spanish) attempt ${contentRetry + 1}:`, spanishResponse.status, errorText);
          throw new Error(`AI gateway error: ${spanishResponse.status}`);
        }

        const spanishData = await spanishResponse.json();
        spanishContent = spanishData.choices?.[0]?.message?.content;
        
        if (!spanishContent) {
          throw new Error("No Spanish content received from AI");
        }

        console.log("Spanish AI response received, parsing JSON...");

        // Parse Spanish JSON
        const jsonMatch = spanishContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          spanishArticle = JSON.parse(jsonMatch[0]);
          
          // Clean any markdown that slipped into HTML
          if (spanishArticle.content) {
            spanishArticle.content = cleanMarkdownFromHtml(spanishArticle.content);
            console.log("Cleaned markdown from Spanish content");
          }
          
          console.log(`✓ Spanish content generated successfully on attempt ${contentRetry + 1}`);
          break; // Success! Exit the retry loop
        } else {
          throw new Error("No JSON found in Spanish response");
        }
      } catch (parseError) {
        lastContentError = parseError instanceof Error ? parseError : new Error(String(parseError));
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
      throw lastContentError || new Error("Failed to generate Spanish content after all retries");
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
        seoLinks.push(`<a href="${pharmacy.instagram_url}" target="_blank" rel="noopener">nuestras redes sociales</a>`);
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
- SEO TITLE: Diferent al H1, optimitzat per CTR, màxim 60 caràcters, que COMENCI amb la focus_keyword
- Meta descripció de 150-160 caràcters en català correcte.
- EXCERPT: Resum curt de l'article (diferent de meta_description), màxim 160 caràcters
- FOCUS KEYWORD: Tradueix la keyword principal del castellà al català (2-4 paraules)
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
SEO Title: ${spanishArticle.seo_title || spanishArticle.title}
Meta descripció: ${spanishArticle.meta_description}
Excerpt: ${spanishArticle.excerpt || spanishArticle.meta_description}
Focus keyword (castellà): ${spanishArticle.focus_keyword || ''}
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
- Tradueix la focus_keyword al català de forma natural (2-4 paraules).
- Assegura't que la focus_keyword aparegui al seo_title, meta_description, slug i primer paràgraf.

RESPÓN NOMÉS AMB JSON VÀLID en aquest format exacte:
{
  "title": "Títol H1 curt i atractiu en CATALÀ PUR (màx 60 caràcters)",
  "seo_title": "SEO title que COMENCI amb focus_keyword (màx 60 caràcters)",
  "meta_description": "Meta descripció de 150-160 caràcters amb focus_keyword",
  "excerpt": "Resum breu de l'article (màx 160 caràcters)",
  "focus_keyword": "keyword principal en català (2-4 paraules)",
  "slug": "slug-url-amb-focus-keyword-sense-accents",
  "content": "<h2>Subtítol amb focus_keyword...</h2><p>Primer paràgraf amb focus_keyword...</p>"
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
              
              // Clean any markdown from Catalan content
              if (catalanArticle?.content) {
                catalanArticle.content = cleanMarkdownFromHtml(catalanArticle.content);
                console.log("Cleaned markdown from Catalan content");
              }
              
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
                  seoLinksCa.push(`<a href="${pharmacy.instagram_url}" target="_blank" rel="noopener">les nostres xarxes socials</a>`);
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

    // ========== PASO 3: Generate image with AI (if not skipped) ==========
    let imageData: { url: string; photographer: string; photographer_url: string } | null = null;
    let aiGeneratedQuery = "";

    if (!skipImage) {
      console.log("Generating image with AI...");
      
      // Create Supabase admin client for storage
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing Supabase credentials for storage");
      }
      
      const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      // Build image prompt
      const imagePrompt = `Generate a professional blog header image.

TOPIC: "${topic.tema}"
SECTOR: health/pharmacy/wellness
CONTEXT: Professional pharmacy/healthcare content

REQUIREMENTS:
- Clean, professional photograph style
- Visually related to the topic: ${topic.tema}
- NO text, NO logos, NO faces showing
- NO pills, NO medicine bottles, NO pharmaceutical products
- Focus on: natural ingredients, wellness lifestyle, healthy living, botanical elements
- Suitable for blog header, 16:9 aspect ratio
- High quality, editorial style
- Bright, clean, modern aesthetic`;

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
            const safeTopicName = topic.tema.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
            const fileName = `farmacias/${timestamp}-${safeTopicName}.png`;
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('article-images')
              .upload(fileName, imageBuffer, { 
                contentType: 'image/png', 
                upsert: true 
              });
            
            if (uploadError) {
              console.error("Storage upload error:", uploadError);
            } else {
              // Get public URL
              const { data: publicUrlData } = supabaseAdmin.storage
                .from('article-images')
                .getPublicUrl(fileName);
              
              if (publicUrlData?.publicUrl) {
                imageData = {
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
        aiGeneratedQuery = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];
        
        // Extract clean text from HTML content for analysis
        const cleanTextContent = spanishArticle.content
          ?.replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 800) || '';

        const imageQueryPrompt = `Genera un query de búsqueda para Unsplash basado en este artículo de farmacia.

TÍTULO: ${spanishArticle.title}
TEMA: ${topic.tema}

REGLAS:
1. Máximo 4-5 palabras en INGLÉS
2. PROHIBIDO: pharmacy, medicine, pills, drugs, doctor, hospital, medical, capsules, bottles
3. Enfócate en: ingredientes naturales, wellness, lifestyle, botanical
4. Responde SOLO con el query, sin explicaciones.`;

        try {
          const queryResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
            if (rawQuery && rawQuery.length > 5 && rawQuery.length < 100) {
              aiGeneratedQuery = rawQuery.toLowerCase().replace(/['"]/g, "");
              console.log("AI generated Unsplash query:", aiGeneratedQuery);
            }
          }
        } catch (e) {
          console.error("Error generating Unsplash query:", e);
        }

        // Search Unsplash
        const randomFallbackImage = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
        imageData = { ...randomFallbackImage };

        try {
          const unsplashResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(aiGeneratedQuery)}&per_page=30&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
          );

          console.log("Unsplash response status:", unsplashResponse.status);
          
          if (unsplashResponse.ok) {
            const unsplashData = await unsplashResponse.json();
            console.log("Unsplash results count:", unsplashData.results?.length || 0);
            
            if (unsplashData.results && unsplashData.results.length > 0) {
              const availablePhotos = unsplashData.results.filter(
                (photo: { urls: { regular: string } }) => !usedImageUrls.includes(photo.urls.regular)
              );
              
              if (availablePhotos.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(10, availablePhotos.length));
                const selectedPhoto = availablePhotos[randomIndex];
                imageData = {
                  url: selectedPhoto.urls.regular,
                  photographer: selectedPhoto.user.name,
                  photographer_url: selectedPhoto.user.links.html,
                };
                console.log("Selected Unsplash image from:", selectedPhoto.user.name);
              }
            }
          }
        } catch (unsplashError) {
          console.error("Unsplash error:", unsplashError);
        }
      }

      console.log("Article generated with image:", imageData?.url?.substring(0, 60));
    } else {
      console.log("Skipping image generation as requested");
    }

    // If scheduled execution, save to DB, publish to WordPress, and send notification
    if (isScheduled && farmaciaId) {
      console.log("Scheduled mode: Saving article to database...");
      
      const now = new Date();
      const dayOfMonth = now.getDate();
      
      const { error: insertError } = await supabase
        .from("articulos")
        .insert({
          farmacia_id: farmaciaId,
          topic: topic?.tema || "Artículo automático",
          month: currentMonth,
          year: currentYear,
          content_spanish: spanishArticle,
          content_catalan: catalanArticle,
          image_url: imageData?.url,
          image_photographer: imageData?.photographer,
          image_photographer_url: imageData?.photographer_url,
          pexels_query: aiGeneratedQuery,
        });

      if (insertError) {
        console.error("Error saving article to DB:", insertError);
      } else {
        console.log("Article saved to database successfully");
      }

      // ========== AUTO-PUBLISH TO WORDPRESS ==========
      let wpPostUrl: string | null = null;
      
      try {
        // Check if pharmacy has WordPress configured
        const { data: wpSite, error: wpSiteError } = await supabase
          .from("wordpress_sites")
          .select("*")
          .eq("farmacia_id", farmaciaId)
          .maybeSingle();
        
        if (wpSiteError) {
          console.error("Error fetching WordPress site:", wpSiteError);
        } else if (wpSite) {
          console.log("WordPress site found, publishing article...");
          
          // Get default taxonomies for this WordPress site
          let categoryIds: number[] = [];
          let tagIds: number[] = [];
          
          try {
            const { data: defaultTaxonomies } = await supabase
              .from("wordpress_site_default_taxonomies")
              .select("taxonomy:wordpress_taxonomies(wp_id, taxonomy_type)")
              .eq("wordpress_site_id", wpSite.id);
            
            if (defaultTaxonomies && defaultTaxonomies.length > 0) {
              for (const dt of defaultTaxonomies) {
                const taxonomy = dt.taxonomy as unknown as { wp_id: number; taxonomy_type: string } | null;
                if (taxonomy) {
                  if (taxonomy.taxonomy_type === "category") {
                    categoryIds.push(taxonomy.wp_id);
                  } else if (taxonomy.taxonomy_type === "tag") {
                    tagIds.push(taxonomy.wp_id);
                  }
                }
              }
            }
            
            // If no defaults, get first available category
            if (categoryIds.length === 0) {
              const { data: categories } = await supabase
                .from("wordpress_taxonomies")
                .select("wp_id")
                .eq("wordpress_site_id", wpSite.id)
                .eq("taxonomy_type", "category")
                .limit(1);
              
              if (categories && categories.length > 0) {
                categoryIds = [categories[0].wp_id];
              }
            }
          } catch (taxError) {
            console.error("Error fetching taxonomies:", taxError);
          }
          
          console.log("Publishing with categories:", categoryIds, "tags:", tagIds);
          
          // Publish Spanish article
          if (spanishArticle) {
            try {
              const publishResponse = await fetch(`${SUPABASE_URL}/functions/v1/publish-to-wordpress`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  farmacia_id: farmaciaId,
                  title: spanishArticle.title,
                  content: spanishArticle.content,
                  slug: spanishArticle.slug,
                  status: "publish",
                  image_url: imageData?.url,
                  image_alt: spanishArticle.title,
                  meta_description: spanishArticle.meta_description,
                  lang: "es",
                  category_ids: categoryIds,
                  tag_ids: tagIds,
                }),
              });
              
              if (publishResponse.ok) {
                const publishResult = await publishResponse.json();
                if (publishResult.success && publishResult.post_url) {
                  wpPostUrl = publishResult.post_url;
                  console.log("✓ Spanish article published to WordPress:", wpPostUrl);
                } else {
                  console.error("WordPress publish failed:", publishResult.error);
                }
              } else {
                const errorText = await publishResponse.text();
                console.error("WordPress publish HTTP error:", publishResponse.status, errorText);
              }
            } catch (publishError) {
              console.error("Error publishing to WordPress:", publishError);
            }
          }
          
          // Publish Catalan article if available
          if (catalanArticle) {
            try {
              const publishResponseCa = await fetch(`${SUPABASE_URL}/functions/v1/publish-to-wordpress`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  farmacia_id: farmaciaId,
                  title: catalanArticle.title,
                  content: catalanArticle.content,
                  slug: catalanArticle.slug + "-ca",
                  status: "publish",
                  image_url: imageData?.url,
                  image_alt: catalanArticle.title,
                  meta_description: catalanArticle.meta_description,
                  lang: "ca",
                  category_ids: categoryIds,
                  tag_ids: tagIds,
                }),
              });
              
              if (publishResponseCa.ok) {
                const publishResultCa = await publishResponseCa.json();
                if (publishResultCa.success) {
                  console.log("✓ Catalan article published to WordPress:", publishResultCa.post_url);
                } else {
                  console.error("WordPress Catalan publish failed:", publishResultCa.error);
                }
              } else {
                console.error("WordPress Catalan publish HTTP error:", publishResponseCa.status);
              }
            } catch (publishErrorCa) {
              console.error("Error publishing Catalan to WordPress:", publishErrorCa);
            }
          }
        } else {
          console.log("No WordPress site configured for this pharmacy");
        }
      } catch (wpError) {
        console.error("WordPress publishing error:", wpError);
      }

      // Save wp_post_url to database if published
      if (wpPostUrl) {
        const { error: updateWpUrlError } = await supabase
          .from("articulos")
          .update({ wp_post_url: wpPostUrl })
          .eq("farmacia_id", farmaciaId)
          .eq("month", month)
          .eq("year", year);
        
        if (updateWpUrlError) {
          console.error("Error updating wp_post_url:", updateWpUrlError);
        } else {
          console.log("wp_post_url saved to database");
        }
      }

      // Send notification email - ONLY if published to WordPress
      if (wpPostUrl) {
        const excerpt = spanishArticle?.meta_description || spanishArticle?.content?.substring(0, 150) || "";
        await sendMKProNotification(
          pharmacy.name,
          spanishArticle?.title || "Artículo publicado",
          excerpt,
          wpPostUrl,
          true // isPublished
        );
      } else {
        console.log("Article generated but not published to WordPress - no email sent");
      }
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
