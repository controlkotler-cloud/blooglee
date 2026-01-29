import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Send email notification to user when article is generated
async function sendArticleNotification(
  userEmail: string,
  siteName: string,
  articleTitle: string,
  articleExcerpt: string,
  siteId: string
): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const siteUrl = "https://blooglee.lovable.app";
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f3ff;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <header style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">📝 Tu artículo está listo</h1>
    </header>
    
    <main style="padding: 40px 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hola,</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Se ha generado un nuevo artículo para <strong style="color: #8B5CF6;">${siteName}</strong>:</p>
      
      <div style="background: linear-gradient(to right, #faf5ff, #fdf4ff); padding: 24px; border-radius: 12px; border-left: 4px solid #8B5CF6; margin: 24px 0;">
        <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">${articleTitle}</h2>
        <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">${articleExcerpt}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${siteUrl}/site/${siteId}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
          Ver artículo en tu panel
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        Si tienes WordPress configurado, puedes publicar el artículo directamente desde tu panel.
      </p>
    </main>
    
    <footer style="background-color: #faf5ff; padding: 24px 30px; text-align: center; border-top: 1px solid #e9d5ff;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Blooglee - Automatiza tu blog con IA
      </p>
      <p style="margin: 8px 0 0 0;">
        <a href="https://www.instagram.com/blooglee_/" style="color: #8B5CF6; text-decoration: none; font-size: 12px;">Síguenos en Instagram</a>
      </p>
    </footer>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "Blooglee <noreply@blooglee.com>",
      to: [userEmail],
      subject: `📝 Nuevo artículo generado para ${siteName}`,
      html,
    });

    if (error) {
      console.error("Error sending notification email:", error);
    } else {
      console.log("Notification email sent to:", userEmail);
    }
  } catch (error) {
    console.error("Exception sending notification email:", error);
  }
}

interface SiteData {
  id: string;
  name: string;
  location?: string | null;
  sector?: string | null;
  description?: string | null;
  languages?: string[];
  blog_url?: string | null;
  instagram_url?: string | null;
  geographic_scope?: string;
  include_featured_image?: boolean;
  user_id: string;
}

interface RequestBody {
  siteId: string;
  topic?: string | null;
  month: number;
  year: number;
}

// Check if user has admin role
async function isUserAdmin(supabaseClient: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
    
    return data?.some((r: { role: string }) => r.role === 'admin') || false;
  } catch (e) {
    console.error("Exception checking admin role:", e);
    return false;
  }
}

// Get user profile with plan limits
async function getUserProfile(supabaseClient: any, userId: string): Promise<{ posts_limit: number; plan: string } | null> {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('posts_limit, plan')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error("Exception fetching profile:", e);
    return null;
  }
}

// Count articles generated this month by user
async function countArticlesThisMonth(supabaseClient: any, userId: string, month: number, year: number): Promise<number> {
  try {
    const { count, error } = await supabaseClient
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);
    
    if (error) {
      console.error("Error counting articles:", error);
      return 0;
    }
    
    return count || 0;
  } catch (e) {
    console.error("Exception counting articles:", e);
    return 0;
  }
}

// Get used topics for a site
async function getUsedTopicsForSite(supabaseClient: any, siteId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from('articles')
      .select('topic')
      .eq('site_id', siteId)
      .order('generated_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error fetching used topics:", error);
      return [];
    }
    
    return data?.map((a: { topic: string }) => a.topic) || [];
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

// Sector-specific image contexts
const SECTOR_IMAGE_CONTEXTS: Record<string, SectorContext> = {
  marketing: {
    examples: ["business team meeting modern office laptop", "digital marketing analytics dashboard screen", "creative workspace minimal design desk"],
    prohibitedTerms: ["facebook logo", "instagram icon", "twitter", "tiktok"],
    fallbackQuery: "professional business workspace modern office"
  },
  tecnologia: {
    examples: ["programmer coding laptop dark modern office", "technology innovation abstract blue lights", "startup team collaboration whiteboard"],
    prohibitedTerms: ["apple logo", "microsoft", "google"],
    fallbackQuery: "technology innovation abstract professional"
  },
  salud: {
    examples: ["wellness lifestyle healthy living nature", "medical professional consultation friendly", "healthcare innovation modern clinic"],
    prohibitedTerms: ["pills", "medicine bottles", "hospital bed", "surgery", "blood"],
    fallbackQuery: "wellness health professional modern"
  },
  belleza: {
    examples: ["beautiful hairstyle woman portrait natural light", "elegant haircut woman closeup professional photo", "hair color highlights natural"],
    prohibitedTerms: ["barber", "barbershop", "beard", "men haircut", "shaving"],
    fallbackQuery: "beautiful hairstyle woman portrait elegant"
  },
  hosteleria: {
    examples: ["restaurant interior modern elegant dining tables", "chef cooking kitchen professional gourmet", "hotel lobby luxury modern reception"],
    prohibitedTerms: ["fast food", "dirty kitchen", "drunk", "messy"],
    fallbackQuery: "restaurant elegant dining professional interior"
  },
  default: {
    examples: ["professional team collaboration office", "business success growth abstract", "modern workspace minimal clean"],
    prohibitedTerms: [],
    fallbackQuery: "professional business success modern"
  }
};

// Fallback images
const FALLBACK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200", photographer: "Austin Distel", photographer_url: "https://unsplash.com/@austindistel" },
  { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200", photographer: "Dylan Gillis", photographer_url: "https://unsplash.com/@dylandgillis" },
  { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200", photographer: "Marvin Meyer", photographer_url: "https://unsplash.com/@marvelous" },
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

// Detect sector category
function detectSectorCategory(sector: string | null | undefined): string {
  if (!sector) return "default";
  const s = sector.toLowerCase();
  
  if (s.includes("peluqu") || s.includes("cabello") || s.includes("estétic") || s.includes("beauty")) return "belleza";
  if (s.includes("restaur") || s.includes("hotel") || s.includes("hostel") || s.includes("bar ") || s.includes("cafeter")) return "hosteleria";
  if (s.includes("marketing") || s.includes("seo") || s.includes("digital") || s.includes("publicidad")) return "marketing";
  if (s.includes("tecnolog") || s.includes("software") || s.includes("informát") || s.includes("saas")) return "tecnologia";
  if (s.includes("salud") || s.includes("médic") || s.includes("clínic") || s.includes("wellness")) return "salud";
  
  return "default";
}

// Build geographic context
function buildGeoContext(site: SiteData): { geoContext: string; locationInfo: string } {
  const scope = site.geographic_scope || "local";
  
  switch (scope) {
    case "local":
      if (!site.location || site.location.trim() === "") {
        return {
          geoContext: `- El contenido es de ámbito general, sin referencias a ubicaciones específicas.`,
          locationInfo: "Ámbito: General"
        };
      }
      return {
        geoContext: `- Menciona la población "${site.location}" 1-2 veces para potenciar el SEO local.`,
        locationInfo: `Localidad: ${site.location}`
      };
      
    case "regional":
      if (!site.location || site.location.trim() === "") {
        return {
          geoContext: `- El contenido es de ámbito regional, pero sin región específica.`,
          locationInfo: "Ámbito: Regional"
        };
      }
      return {
        geoContext: `- Menciona la región "${site.location}" 1-2 veces para SEO regional.`,
        locationInfo: `Región: ${site.location}`
      };
      
    case "national":
    default:
      return {
        geoContext: `- PROHIBIDO mencionar cualquier ubicación geográfica específica. El contenido es para toda España.`,
        locationInfo: "Ámbito: Nacional (toda España)"
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const userId = claimsData.claims.sub as string;
    console.log("=== GENERATE ARTICLE SAAS ===");
    console.log("User ID:", userId);

    const { siteId, topic: providedTopic, month, year }: RequestBody = await req.json();
    console.log("Site ID:", siteId);
    console.log("Month/Year:", month, year);

    // Fetch site and validate ownership
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', userId)
      .single();

    if (siteError || !site) {
      console.error("Site error:", siteError);
      return new Response(JSON.stringify({ error: 'Site not found or access denied' }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log("Site:", site.name);
    console.log("Sector:", site.sector);

    // Check admin status for bypass
    const isAdmin = await isUserAdmin(supabase, userId);
    console.log("Is admin:", isAdmin);

    // Check plan limits (skip for admins)
    if (!isAdmin) {
      const profile = await getUserProfile(supabase, userId);
      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const articlesThisMonth = await countArticlesThisMonth(supabase, userId, month, year);
      console.log(`Articles this month: ${articlesThisMonth}/${profile.posts_limit}`);

      if (articlesThisMonth >= profile.posts_limit) {
        return new Response(JSON.stringify({ 
          error: "Has alcanzado tu límite mensual de artículos",
          limit: profile.posts_limit,
          current: articlesThisMonth,
          plan: profile.plan
        }), { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    } else {
      console.log("Admin bypass: skipping limit check");
    }

    const monthNameEs = MONTH_NAMES_ES[month - 1];
    const monthNameCa = MONTH_NAMES_CA[month - 1];
    const dateContext = `${monthNameEs} ${year}`;
    
    const { geoContext, locationInfo } = buildGeoContext(site);
    const sectorCategory = detectSectorCategory(site.sector);
    const sectorContext = SECTOR_IMAGE_CONTEXTS[sectorCategory] || SECTOR_IMAGE_CONTEXTS.default;

    // Generate topic if not provided
    let topic = providedTopic;
    
    if (!topic) {
      console.log("Generating topic with AI...");
      const usedTopics = await getUsedTopicsForSite(supabase, siteId);
      console.log(`Found ${usedTopics.length} previously used topics`);
      
      const usedTopicsSection = usedTopics.length > 0 
        ? `\n\n⚠️ TEMAS YA USADOS (NO REPETIR):\n${usedTopics.slice(0, 30).map((t, i) => `${i+1}. ${t}`).join('\n')}`
        : '';
      
      const topicPrompt = `Eres un experto en marketing de contenidos para el sector "${site.sector || "servicios profesionales"}".

EMPRESA: ${site.name}
SECTOR: ${site.sector || "Servicios profesionales"}
${site.description ? `DESCRIPCIÓN: ${site.description}` : ''}
ÁMBITO: ${site.geographic_scope === "national" ? "Nacional (España)" : site.location || "General"}
CONTEXTO TEMPORAL: Estamos en ${monthNameEs} ${year}, considera estacionalidad si aplica.${usedTopicsSection}

Genera UN tema de blog que:
1. Sea relevante para el sector ${site.sector || "profesional"}${site.description ? ` y especialmente para una empresa que es: ${site.description}` : ''}
2. Tenga potencial SEO
3. Considere tendencias estacionales si aplica
4. NO mencione el nombre de la empresa
5. Sea DIFERENTE a los temas ya usados
6. NO incluyas el año en el tema (ej: "2026", "este año")
7. Usa capitalización española (solo inicial mayúscula, no Title Case)

Responde SOLO con el tema (máx 80 caracteres), sin explicaciones.`;

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
        topic = `Novedades y tendencias en ${site.sector || "el sector"}`;
      }
    }

    // Build system prompt with description
    const systemPrompt = `Eres un redactor experto en marketing de contenidos y SEO para el sector ${site.sector || "servicios profesionales"}.

EMPRESA: ${site.name}
SECTOR: ${site.sector || "Servicios profesionales"}
${site.description ? `DESCRIPCIÓN: ${site.description}` : ''}
ÁMBITO: ${site.geographic_scope === "national" ? "Nacional" : site.location || "General"}

TU MISIÓN: Generar un artículo de ~2000 palabras optimizado para SEO${site.description ? `, teniendo en cuenta que la empresa es: ${site.description}` : ''}.

REGLAS:
${geoContext}

FORMATO:
- TÍTULO H1: Máximo 60 caracteres. SIN nombre de empresa. SIN año (ej: "2026").
- META DESCRIPTION: 150-160 caracteres con CTA.
- SLUG: URL amigable en minúsculas con guiones.
- CONTENIDO: ~2000 palabras con H2 y párrafos.

⚠️ CAPITALIZACIÓN ESPAÑOLA OBLIGATORIA:
- SOLO la primera letra del título/subtítulo en mayúscula (+ nombres propios)
- INCORRECTO: "Claves Del Éxito Digital Para Farmacias"
- CORRECTO: "Claves del éxito digital para farmacias"
- Los subtítulos H2 siguen la misma regla
- NO uses Title Case inglés bajo ninguna circunstancia

LISTAS:
- Si enumeras con dos puntos (:), usa lista HTML (<ul><li>)

CONTEXTO TEMPORAL: Hoy es ${dateContext}. Usa esta información para estacionalidad, pero NO incluyas el año en el título ni subtítulos.

RESPONDE EN JSON VÁLIDO.`;

    const userPrompt = `TEMA: ${topic}

Genera un artículo profesional.

FORMATO JSON:
{
  "title": "Título atractivo máx 60 caracteres",
  "meta_description": "Meta descripción 150-160 caracteres",
  "slug": "url-amigable",
  "content": "<h2>Sección</h2><p>Contenido...</p>"
}`;

    console.log("Generating Spanish article...");

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
      if (spanishResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
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
    } catch (e) {
      console.error("Error parsing Spanish JSON:", e);
      throw new Error("Failed to parse Spanish article JSON");
    }

    console.log("Spanish article generated successfully");

    // Store Spanish content WITHOUT SEO footer for translation
    const spanishContentWithoutSeo = spanishArticle.content;
    let catalanArticle = null;
    if (site.languages?.includes("catalan")) {
      console.log("Generating Catalan version...");
      
      const catalanPrompt = `Traduce este artículo del español al catalán.

ARTÍCULO:
Título: ${spanishArticle.title}
Meta: ${spanishArticle.meta_description}
Slug: ${spanishArticle.slug}
Contenido: ${spanishContentWithoutSeo}

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
            let cleanCatalan = catalanContent
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```\s*$/i, '');
            
            const jsonMatch = cleanCatalan.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              catalanArticle = JSON.parse(jsonMatch[0]);
              console.log("Catalan article generated successfully");
            }
          }
        }
      } catch (error) {
        console.error("Error generating Catalan:", error);
      }
    }

    // Add SEO footer with blog/social links to Spanish content
    console.log("Adding SEO footer links...");
    const seoLinksEs: string[] = [];
    if (site.blog_url) {
      seoLinksEs.push(`<a href="${site.blog_url}" target="_blank" rel="noopener">nuestro blog</a>`);
    }
    if (site.instagram_url) {
      seoLinksEs.push(`<a href="${site.instagram_url}" target="_blank" rel="noopener">Instagram</a>`);
    }
    
    if (seoLinksEs.length > 0) {
      const linksTextEs = seoLinksEs.join(' y ');
      const closingParagraphEs = `<p><strong>¿Quieres más consejos?</strong> Visita ${linksTextEs} para descubrir más contenido de ${site.name}.</p>`;
      spanishArticle.content = spanishContentWithoutSeo + closingParagraphEs;
      console.log("SEO footer added to Spanish article");
    }

    // Add SEO footer to Catalan content AFTER translation
    if (catalanArticle?.content) {
      const seoLinksCa: string[] = [];
      if (site.blog_url) {
        seoLinksCa.push(`<a href="${site.blog_url}" target="_blank" rel="noopener">el nostre blog</a>`);
      }
      if (site.instagram_url) {
        seoLinksCa.push(`<a href="${site.instagram_url}" target="_blank" rel="noopener">Instagram</a>`);
      }
      
      if (seoLinksCa.length > 0) {
        const linksTextCa = seoLinksCa.join(' i ');
        const closingParagraphCa = `<p><strong>Vols més consells?</strong> Visita ${linksTextCa} per descobrir més contingut de ${site.name}.</p>`;
        catalanArticle.content += closingParagraphCa;
        console.log("SEO footer added to Catalan article");
      }
    }

    // Generate image with AI
    let imageResult = null;
    let pexelsQuery = null;
    
    const skipImage = site.include_featured_image === false;
    
    if (!skipImage) {
      console.log("Generating image with AI...");
      
      // Create Supabase admin client for storage operations
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      
      const imagePrompt = `Generate a professional blog header image.

TOPIC: "${topic}"
SECTOR: ${site.sector || "professional services"}
${site.description ? `CONTEXT: ${site.description}` : ''}

REQUIREMENTS:
- Clean, professional photograph
- Visually related to the topic and sector
- NO text, NO logos, NO faces
- Suitable for blog header, 16:9 ratio
- High quality, editorial style

Generate an image that a ${site.sector || "professional"} business would use for their blog.`;

      try {
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
          const imageData = await imageResponse.json();
          console.log("AI image response structure:", JSON.stringify(Object.keys(imageData)));
          
          // Check both possible response formats
          const message = imageData.choices?.[0]?.message;
          const base64Image = message?.images?.[0]?.image_url?.url;
          
          console.log("Message keys:", message ? JSON.stringify(Object.keys(message)) : "no message");
          console.log("Has images array:", !!message?.images);
          console.log("Images count:", message?.images?.length || 0);
          
          if (base64Image) {
            console.log("AI image generated successfully, uploading to storage...");
            
            // Convert base64 to buffer and upload to storage
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Generate unique filename
            const timestamp = Date.now();
            const fileName = `${siteId}/${timestamp}-${topic.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
            
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
              const { data: urlData } = supabaseAdmin.storage
                .from('article-images')
                .getPublicUrl(fileName);
              
              imageResult = {
                url: urlData.publicUrl,
                photographer: "AI Generated",
                photographer_url: null,
              };
              pexelsQuery = "AI Generated";
              console.log("Image uploaded to storage:", urlData.publicUrl);
            }
          } else {
            console.log("No base64 image found in response");
            console.log("Full message content:", JSON.stringify(message).substring(0, 500));
          }
        } else {
          const errorText = await imageResponse.text();
          console.error("AI image generation failed:", imageResponse.status, errorText);
        }
      } catch (error) {
        console.error("Error generating AI image:", error);
      }

      // Fallback to Unsplash if AI generation failed
      if (!imageResult) {
        console.log("Falling back to Unsplash...");
        const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
        
        if (UNSPLASH_ACCESS_KEY) {
          const fallbackQuery = sectorContext.fallbackQuery;
          pexelsQuery = fallbackQuery;
          
          try {
            const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(fallbackQuery)}&per_page=20&orientation=landscape`;
            const unsplashResponse = await fetch(searchUrl, {
              headers: { "Authorization": `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            });

            if (unsplashResponse.ok) {
              const unsplashData = await unsplashResponse.json();
              const photos = unsplashData.results || [];
              
              if (photos.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(photos.length, 10));
                const photo = photos[randomIndex];
                imageResult = {
                  url: photo.urls.regular,
                  photographer: photo.user.name,
                  photographer_url: photo.user.links.html,
                };
                console.log("Image selected from Unsplash fallback");
              }
            }
          } catch (error) {
            console.error("Unsplash fallback error:", error);
          }
        }

        // Final fallback to static images
        if (!imageResult) {
          const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
          imageResult = FALLBACK_IMAGES[randomIndex];
          pexelsQuery = "fallback";
          console.log("Using static fallback image");
        }
      }
    }

    // Calculate week of month
    const dayOfMonth = new Date().getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    // Save article to database with frequency-aware upsert logic
    const articleData = {
      site_id: siteId,
      user_id: userId,
      month,
      year,
      topic,
      pexels_query: pexelsQuery,
      content_spanish: spanishArticle,
      content_catalan: catalanArticle,
      image_url: imageResult?.url || null,
      image_photographer: imageResult?.photographer || null,
      image_photographer_url: imageResult?.photographer_url || null,
      week_of_month: weekOfMonth,
      day_of_month: dayOfMonth,
    };

    // Check if article already exists based on site's publish frequency
    let existingQuery = supabase
      .from('articles')
      .select('id')
      .eq('site_id', siteId)
      .eq('user_id', userId);

    if (site.publish_frequency === 'daily') {
      // For daily: look for article generated TODAY only
      const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      existingQuery = existingQuery.gte('generated_at', todayStart.toISOString());
    } else if (site.publish_frequency === 'weekly') {
      // For weekly: look for article generated THIS WEEK
      existingQuery = existingQuery
        .eq('week_of_month', weekOfMonth)
        .eq('month', month)
        .eq('year', year);
    } else {
      // For monthly: look for article generated THIS MONTH
      existingQuery = existingQuery
        .eq('month', month)
        .eq('year', year);
    }

    const { data: existingArticle } = await existingQuery.maybeSingle();

    let savedArticle;
    if (existingArticle) {
      // Update existing article
      const { data, error: updateError } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', existingArticle.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating article:", updateError);
        throw new Error("Failed to update article");
      }
      savedArticle = data;
      console.log("Updated existing article:", savedArticle.id);
    } else {
      // Insert new article
      const { data, error: insertError } = await supabase
        .from('articles')
        .insert(articleData)
        .select()
        .single();

      if (insertError) {
        console.error("Error saving article:", insertError);
        throw new Error("Failed to save article");
      }
      savedArticle = data;
      console.log("Created new article:", savedArticle.id);
    }

    console.log("=== ARTICLE GENERATION COMPLETE ===");
    console.log("Article ID:", savedArticle.id);

    // Send notification email to user
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (userProfile?.email) {
      const articleTitle = spanishArticle?.title || catalanArticle?.title || topic;
      const articleExcerpt = spanishArticle?.meta_description || catalanArticle?.meta_description || `Nuevo artículo sobre ${topic}`;
      
      // Don't await - send email in background
      sendArticleNotification(
        userProfile.email,
        site.name,
        articleTitle,
        articleExcerpt,
        siteId
      ).catch(err => console.error("Background email error:", err));
    }

    return new Response(JSON.stringify({
      success: true,
      article: savedArticle,
      content: {
        spanish: spanishArticle,
        catalan: catalanArticle,
      },
      image: imageResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-article-saas:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
