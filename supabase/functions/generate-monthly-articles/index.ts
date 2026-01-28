import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PORTAL_URL = "https://blooglee.lovable.app";
const NOTIFICATION_EMAILS = ["control@mkpro.es", "laura@mkpro.es"];
const MAX_ARTICLES_PER_RUN = 50; // Unsplash rate limit

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface SeasonalTopic {
  tema: string;
  keywords: string[];
  pexels_query: string;
}

// Seasonal topics for pharmacies
const SEASONAL_TOPICS: Record<number, SeasonalTopic[]> = {
  1: [
    { tema: "Propósitos saludables de año nuevo", keywords: ["hábitos saludables", "vitaminas", "detox", "ejercicio"], pexels_query: "morning wellness nature fresh start" },
    { tema: "Combatir la gripe y resfriados de invierno", keywords: ["sistema inmune", "vitamina C", "propóleo"], pexels_query: "herbal tea warm cozy winter comfort" },
    { tema: "Cuidado de la piel en invierno", keywords: ["hidratación", "cremas", "labios agrietados"], pexels_query: "spa beauty natural skincare woman face" },
    { tema: "Blue Monday: cuidar la salud mental", keywords: ["ánimo", "vitamina D", "bienestar emocional"], pexels_query: "calm meditation peaceful mindfulness nature" },
    { tema: "Recuperarse de los excesos navideños", keywords: ["digestión", "hígado", "probióticos"], pexels_query: "healthy food vegetables salad nutrition" },
  ],
  2: [
    { tema: "Alergias de invierno y calefacción", keywords: ["humidificadores", "piel seca", "alergias ácaros"], pexels_query: "cozy home wellness comfortable living room" },
    { tema: "San Valentín: cosmética y cuidado personal", keywords: ["perfumes", "cosmética", "regalo pareja"], pexels_query: "beauty spa romantic self care woman" },
    { tema: "Preparar el cuerpo para la primavera", keywords: ["depuración", "energía", "complementos"], pexels_query: "spring nature fresh flowers wellness" },
    { tema: "Salud cardiovascular", keywords: ["colesterol", "omega 3", "corazón sano"], pexels_query: "heart healthy walking nature outdoor" },
    { tema: "Bienestar digestivo en invierno", keywords: ["probióticos", "fibra", "digestión"], pexels_query: "healthy breakfast yogurt fruit nutrition" },
  ],
  3: [
    { tema: "Alergias primaverales: preparación y prevención", keywords: ["antihistamínicos", "polen", "conjuntivitis"], pexels_query: "spring garden flowers peaceful nature" },
    { tema: "Cambio de hora y su efecto en el sueño", keywords: ["melatonina", "insomnio", "ritmo circadiano"], pexels_query: "peaceful sleep bedroom rest calm cozy" },
    { tema: "Detox primaveral", keywords: ["depurativo", "hígado", "drenante"], pexels_query: "green smoothie healthy detox natural" },
    { tema: "Astenia primaveral: combatir el cansancio", keywords: ["jalea real", "ginseng", "energía"], pexels_query: "morning energy vitality outdoor nature" },
    { tema: "Cuidado de la piel al aire libre", keywords: ["protección solar", "hidratación", "exposición"], pexels_query: "outdoor nature spring woman wellness" },
  ],
  4: [
    { tema: "Alergias en plena primavera", keywords: ["polen", "rinitis", "colirios"], pexels_query: "spring nature outdoor peaceful garden" },
    { tema: "Preparar la piel para el sol", keywords: ["protección solar", "vitamina E", "antioxidantes"], pexels_query: "sunlight nature beauty woman outdoor" },
    { tema: "Semana Santa: botiquín de viaje", keywords: ["primeros auxilios", "medicamentos viaje"], pexels_query: "travel nature adventure wellness outdoor" },
    { tema: "Salud digestiva y probióticos", keywords: ["flora intestinal", "digestión", "prebióticos"], pexels_query: "healthy food yogurt nutrition breakfast" },
    { tema: "Fitness y tonificación primaveral", keywords: ["ejercicio", "músculos", "definición"], pexels_query: "fitness outdoor spring exercise nature" },
  ],
  5: [
    { tema: "Día de la madre: belleza y bienestar", keywords: ["cosmética", "regalo", "antiedad"], pexels_query: "beauty spa wellness relaxation woman care" },
    { tema: "Operación bikini saludable", keywords: ["nutrición", "complementos", "ejercicio"], pexels_query: "healthy lifestyle walking beach wellness" },
    { tema: "Protección solar: guía completa", keywords: ["SPF", "fotoprotección", "melanoma"], pexels_query: "sunlight beach summer protection nature" },
    { tema: "Piernas cansadas con el calor", keywords: ["circulación", "varices", "medias compresión"], pexels_query: "legs wellness massage relaxation woman" },
    { tema: "Exámenes: concentración y memoria", keywords: ["omega 3", "vitaminas B", "estrés estudiantes"], pexels_query: "study focus calm concentration desk" },
  ],
  6: [
    { tema: "Protección solar para toda la familia", keywords: ["niños sol", "after sun", "quemaduras"], pexels_query: "family outdoor summer beach happy" },
    { tema: "Botiquín de verano", keywords: ["picaduras", "diarrea viajero", "mareo"], pexels_query: "summer travel beach vacation wellness" },
    { tema: "Hidratación en verano", keywords: ["sales minerales", "agua", "electrolitos"], pexels_query: "water hydration fresh summer healthy" },
    { tema: "Cuidado del cabello en verano", keywords: ["cloro", "sal", "mascarillas capilares"], pexels_query: "hair care summer beach woman beauty" },
    { tema: "Hongos y piscinas: prevención", keywords: ["pie de atleta", "antifúngicos"], pexels_query: "swimming pool summer wellness healthy" },
  ],
  7: [
    { tema: "Viajes y salud: preparación completa", keywords: ["vacunas", "botiquín viaje", "jet lag"], pexels_query: "travel vacation adventure nature beautiful" },
    { tema: "Golpes de calor: prevención y actuación", keywords: ["hidratación", "ancianos", "niños"], pexels_query: "summer cool water hydration refresh" },
    { tema: "Cuidado de la piel tras el sol", keywords: ["after sun", "aloe vera", "hidratación"], pexels_query: "aloe vera skincare natural plant care" },
    { tema: "Alimentación saludable en verano", keywords: ["frutas", "ensaladas", "digestiones"], pexels_query: "summer fruits salad healthy colorful" },
    { tema: "Piernas ligeras en verano", keywords: ["retención líquidos", "calor", "circulación"], pexels_query: "legs wellness summer beach woman" },
  ],
  8: [
    { tema: "Mantener la rutina saludable en vacaciones", keywords: ["ejercicio verano", "alimentación"], pexels_query: "vacation wellness healthy lifestyle outdoor" },
    { tema: "Picaduras de insectos: prevención y tratamiento", keywords: ["mosquitos", "medusas", "repelentes"], pexels_query: "summer outdoor nature peaceful garden" },
    { tema: "Preparar la vuelta al cole", keywords: ["vitaminas niños", "piojos", "revisiones"], pexels_query: "children happy school books backpack" },
    { tema: "Recuperar la piel tras vacaciones", keywords: ["hidratación", "reparación", "manchas"], pexels_query: "skincare beauty spa facial treatment" },
    { tema: "Retomar hábitos saludables post-vacaciones", keywords: ["rutinas", "alimentación", "ejercicio"], pexels_query: "morning routine healthy lifestyle wellness" },
  ],
  9: [
    { tema: "Vuelta al cole saludable", keywords: ["vitaminas", "sistema inmune", "meriendas"], pexels_query: "school children happy backpack outdoor" },
    { tema: "Estrés de la vuelta a la rutina", keywords: ["adaptógenos", "sueño", "ansiedad"], pexels_query: "calm relaxation nature peaceful morning" },
    { tema: "Caída del cabello otoñal", keywords: ["biotina", "champús fortalecedores"], pexels_query: "hair beauty autumn woman natural" },
    { tema: "Preparar las defensas para el otoño", keywords: ["propóleo", "equinácea", "vitamina C"], pexels_query: "autumn nature wellness healthy outdoor" },
    { tema: "Cuidado de la piel tras el verano", keywords: ["reparación", "manchas", "hidratación"], pexels_query: "skincare beauty autumn woman face" },
  ],
  10: [
    { tema: "Prevención de resfriados", keywords: ["vitamina C", "equinácea", "zinc"], pexels_query: "autumn cozy tea warm wellness" },
    { tema: "Cambio de hora otoñal y sueño", keywords: ["melatonina", "ritmo circadiano", "descanso"], pexels_query: "cozy bedroom sleep autumn peaceful" },
    { tema: "Cuidado de la piel en otoño", keywords: ["hidratación", "antioxidantes", "vitaminas"], pexels_query: "autumn beauty skincare woman nature" },
    { tema: "Fortalecimiento del sistema inmune", keywords: ["defensas", "propóleo", "hongos medicinales"], pexels_query: "healthy food autumn vegetables nutrition" },
    { tema: "Halloween y maquillaje seguro", keywords: ["desmaquillantes", "piel sensible", "alergias"], pexels_query: "makeup beauty creative woman face" },
  ],
  11: [
    { tema: "Preparación para el invierno", keywords: ["vitaminas", "defensas", "nutrición"], pexels_query: "autumn winter transition nature cozy" },
    { tema: "Día del hombre: cuidado masculino", keywords: ["afeitado", "cosmética masculina"], pexels_query: "man grooming wellness care handsome" },
    { tema: "Alergia a ácaros en otoño", keywords: ["humedad", "purificadores", "antialérgicos"], pexels_query: "cozy home clean wellness living" },
    { tema: "Black Friday: cuidado con las compras impulsivas", keywords: ["cosmética", "ofertas", "calidad"], pexels_query: "shopping beauty products wellness care" },
    { tema: "Cuidado articular con el frío", keywords: ["colágeno", "glucosamina", "movilidad"], pexels_query: "walking nature autumn wellness outdoor" },
  ],
  12: [
    { tema: "Cuidados de la piel en invierno", keywords: ["hidratación", "labios", "manos"], pexels_query: "winter skincare cozy woman beauty" },
    { tema: "Navidad saludable: evitar excesos", keywords: ["digestión", "probióticos", "moderación"], pexels_query: "healthy food christmas festive nutrition" },
    { tema: "Regalos de salud y bienestar", keywords: ["cosmética natural", "sets regalo", "bienestar"], pexels_query: "gift christmas wellness beauty care" },
    { tema: "Sistema inmune en Navidades", keywords: ["vitaminas", "resfriados", "defensas"], pexels_query: "winter wellness cozy healthy indoor" },
    { tema: "Fin de año: propósitos de salud", keywords: ["hábitos", "planificación", "bienestar"], pexels_query: "new year wellness healthy lifestyle" },
  ],
};

// ============= HELPER FUNCTIONS =============

function isFirstMondayOfMonth(date: Date): boolean {
  // Check if it's Monday (1)
  if (date.getDay() !== 1) return false;
  // Check if it's in the first week (day 1-7)
  return date.getDate() <= 7;
}

function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const weekStart = new Date(date.getFullYear(), date.getMonth(), diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getRandomTopic(month: number, usedTopics: string[]): SeasonalTopic | null {
  const monthTopics = SEASONAL_TOPICS[month] || SEASONAL_TOPICS[1];
  const availableTopics = monthTopics.filter(t => !usedTopics.includes(t.tema));
  
  if (availableTopics.length === 0) {
    return monthTopics[Math.floor(Math.random() * monthTopics.length)];
  }
  
  return availableTopics[Math.floor(Math.random() * availableTopics.length)];
}

// ============= FREQUENCY VALIDATION =============

interface ShouldGenerateResult {
  shouldGenerate: boolean;
  reason?: string;
}

async function shouldGenerateForEntity(
  supabase: SupabaseClient,
  entityId: string,
  entityType: 'farmacia' | 'empresa' | 'site',
  frequency: string,
  currentMonth: number,
  currentYear: number,
  now: Date
): Promise<ShouldGenerateResult> {
  const table = entityType === 'farmacia' ? 'articulos' 
              : entityType === 'empresa' ? 'articulos_empresas' 
              : 'articles';
  const idColumn = entityType === 'farmacia' ? 'farmacia_id'
                 : entityType === 'empresa' ? 'empresa_id'
                 : 'site_id';
  
  // FARMACIAS: Fixed to first Monday of month
  if (entityType === 'farmacia') {
    if (!isFirstMondayOfMonth(now)) {
      return { shouldGenerate: false, reason: 'No es el primer lunes del mes' };
    }
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(idColumn, entityId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene artículo este mes' : undefined
    };
  }
  
  // EMPRESAS and SITES: Based on frequency
  if (frequency === 'daily') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(idColumn, entityId)
      .gte('generated_at', todayStart.toISOString())
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene artículo hoy' : undefined
    };
  }
  
  if (frequency === 'weekly') {
    const weekStart = getStartOfWeek(now);
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(idColumn, entityId)
      .gte('generated_at', weekStart.toISOString())
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene artículo esta semana' : undefined
    };
  }
  
  // monthly (default)
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq(idColumn, entityId)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .limit(1);
  return { 
    shouldGenerate: !data || data.length === 0,
    reason: data?.length ? 'Ya tiene artículo este mes' : undefined
  };
}

// ============= PLAN LIMITS (SaaS Only) =============

interface PlanLimitsResult {
  withinLimits: boolean;
  used: number;
  limit: number;
  userEmail?: string;
}

async function checkPlanLimits(
  supabase: SupabaseClient,
  userId: string,
  currentMonth: number,
  currentYear: number
): Promise<PlanLimitsResult> {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('posts_limit, email')
    .eq('user_id', userId)
    .single();
  
  const postsLimit = profile?.posts_limit ?? 1; // Default Free = 1
  
  // Count articles generated this month for this user
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .eq('year', currentYear);
  
  const used = count || 0;
  
  return {
    withinLimits: used < postsLimit,
    used,
    limit: postsLimit,
    userEmail: profile?.email
  };
}

// ============= DYNAMIC TOPIC GENERATION =============

async function generateDynamicTopic(
  lovableApiKey: string,
  entity: { name: string; sector?: string | null; location?: string | null },
  currentMonth: number,
  currentYear: number,
  usedTopics: string[],
  now: Date
): Promise<string> {
  const dayOfMonth = now.getDate();
  const dayOfWeek = DAY_NAMES[now.getDay()];
  
  const prompt = `Eres un experto en SEO y marketing de contenidos.
Fecha REAL de hoy: ${dayOfMonth} de ${MONTH_NAMES[currentMonth - 1]} de ${currentYear} (${dayOfWeek})

Empresa: ${entity.name}
Sector: ${entity.sector || "servicios profesionales"}
Localidad: ${entity.location || "España"}

TEMAS YA USADOS (NO repetir): ${usedTopics.slice(-20).join(', ') || 'ninguno'}

Genera UN tema para artículo de blog que:
1. Sea 100% relevante para el sector "${entity.sector || 'servicios profesionales'}"
2. Considere eventos/efemérides REALES de esta fecha (${dayOfMonth}/${currentMonth}/${currentYear})
3. Tenga en cuenta tendencias actuales de ${currentYear}
4. NO sea genérico - debe ser específico y útil
5. Máximo 60 caracteres
6. NO incluir nombre de empresa
7. NO repetir temas ya usados

Solo responde con el tema, sin explicaciones ni comillas.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response not ok: ${response.status}`);
    }

    const data = await response.json();
    const topic = data.choices?.[0]?.message?.content?.trim();
    
    if (!topic) throw new Error("Empty topic from AI");
    
    return topic;
  } catch (error) {
    console.error("Failed to generate dynamic topic:", error);
    // Fallback
    return `Novedades en ${entity.sector || "servicios"} para ${MONTH_NAMES[currentMonth - 1]}`;
  }
}

// ============= GET USED TOPICS =============

async function getUsedTopics(
  supabase: SupabaseClient,
  entityId: string,
  entityType: 'empresa' | 'site'
): Promise<string[]> {
  const table = entityType === 'empresa' ? 'articulos_empresas' : 'articles';
  const idColumn = entityType === 'empresa' ? 'empresa_id' : 'site_id';
  
  const { data } = await supabase
    .from(table)
    .select('topic')
    .eq(idColumn, entityId)
    .order('generated_at', { ascending: false })
    .limit(30);
  
  return data?.map(a => a.topic) || [];
}

// ============= TAXONOMY SELECTION =============

interface TaxonomyItem {
  wp_id: number;
  name: string;
  taxonomy_type: string;
}

async function selectTaxonomiesWithAI(
  articleTitle: string,
  articleContent: string,
  categories: TaxonomyItem[],
  tags: TaxonomyItem[],
  lovableApiKey: string
): Promise<{ categoryIds: number[]; tagIds: number[] }> {
  if (categories.length === 0) {
    if (tags.length === 0) return { categoryIds: [], tagIds: [] };
    if (tags.length === 1) return { categoryIds: [], tagIds: [tags[0].wp_id] };
  }
  
  if (categories.length === 1) {
    let tagIds: number[] = [];
    if (tags.length === 1) {
      tagIds = [tags[0].wp_id];
    } else if (tags.length > 1) {
      try {
        tagIds = await selectTagsWithAI(articleTitle, articleContent, tags, lovableApiKey);
      } catch {
        console.log("AI tag selection failed, using no tags");
      }
    }
    return { categoryIds: [categories[0].wp_id], tagIds };
  }
  
  const prompt = `Eres un experto en clasificación de contenido para blogs.

Dado este artículo:
Título: "${articleTitle}"
Contenido (primeros 500 caracteres): "${articleContent.substring(0, 500)}"

Categorías disponibles: ${categories.map(c => `${c.wp_id}:${c.name}`).join(', ')}
Tags disponibles: ${tags.length > 0 ? tags.map(t => `${t.wp_id}:${t.name}`).join(', ') : 'ninguno'}

Selecciona:
- 1 categoría que MEJOR represente el tema principal del artículo
- 0-3 tags relevantes (solo si aplican directamente al contenido)

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin explicaciones:
{"category_id": number, "tag_ids": number[]}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response not ok: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) throw new Error("Empty AI response");
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    const categoryId = parsed.category_id;
    const tagIds = Array.isArray(parsed.tag_ids) ? parsed.tag_ids : [];
    
    const validCategoryIds = categories.some(c => c.wp_id === categoryId) ? [categoryId] : [];
    const validTagIds = tagIds.filter((id: number) => tags.some(t => t.wp_id === id));
    
    return { categoryIds: validCategoryIds, tagIds: validTagIds };
  } catch (error) {
    console.error("AI taxonomy selection failed:", error);
    return { 
      categoryIds: categories.length > 0 ? [categories[0].wp_id] : [], 
      tagIds: [] 
    };
  }
}

async function selectTagsWithAI(
  articleTitle: string,
  articleContent: string,
  tags: TaxonomyItem[],
  lovableApiKey: string
): Promise<number[]> {
  const prompt = `Eres un experto en clasificación de contenido.

Artículo:
Título: "${articleTitle}"
Contenido (primeros 300 chars): "${articleContent.substring(0, 300)}"

Tags disponibles: ${tags.map(t => `${t.wp_id}:${t.name}`).join(', ')}

Selecciona 0-3 tags que apliquen directamente al contenido.
Responde SOLO con JSON: {"tag_ids": number[]}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 50,
    }),
  });

  if (!response.ok) throw new Error("AI failed");
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  const jsonMatch = content?.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  
  const parsed = JSON.parse(jsonMatch[0]);
  const tagIds = Array.isArray(parsed.tag_ids) ? parsed.tag_ids : [];
  
  return tagIds.filter((id: number) => tags.some(t => t.wp_id === id));
}

async function getTaxonomiesForPublish(
  supabase: SupabaseClient,
  wpSiteId: string,
  articleTitle: string,
  articleContent: string,
  lovableApiKey: string | undefined
): Promise<{ categoryIds: number[]; tagIds: number[] }> {
  try {
    const { data: allTaxonomies, error } = await supabase
      .from("wordpress_taxonomies")
      .select("wp_id, name, taxonomy_type")
      .eq("wordpress_site_id", wpSiteId);

    if (error || !allTaxonomies || allTaxonomies.length === 0) {
      return { categoryIds: [], tagIds: [] };
    }

    const categories: TaxonomyItem[] = allTaxonomies
      .filter(t => t.taxonomy_type === "category")
      .map(t => ({ wp_id: t.wp_id as number, name: t.name as string, taxonomy_type: t.taxonomy_type as string }));
    const tags: TaxonomyItem[] = allTaxonomies
      .filter(t => t.taxonomy_type === "tag")
      .map(t => ({ wp_id: t.wp_id as number, name: t.name as string, taxonomy_type: t.taxonomy_type as string }));

    if (categories.length === 0) {
      if (tags.length === 0) return { categoryIds: [], tagIds: [] };
      if (tags.length === 1) return { categoryIds: [], tagIds: [tags[0].wp_id] };
      if (!lovableApiKey) return { categoryIds: [], tagIds: [] };
      const tagIds = await selectTagsWithAI(articleTitle, articleContent, tags, lovableApiKey);
      return { categoryIds: [], tagIds };
    }

    if (categories.length === 1) {
      let tagIds: number[] = [];
      if (tags.length === 1) {
        tagIds = [tags[0].wp_id];
      } else if (tags.length > 1 && lovableApiKey) {
        tagIds = await selectTagsWithAI(articleTitle, articleContent, tags, lovableApiKey);
      }
      return { categoryIds: [categories[0].wp_id], tagIds };
    }

    if (!lovableApiKey) {
      const tagIds = tags.length === 1 ? [tags[0].wp_id] : [];
      return { categoryIds: [categories[0].wp_id], tagIds };
    }

    return await selectTaxonomiesWithAI(articleTitle, articleContent, categories, tags, lovableApiKey);
  } catch (error) {
    console.error("Error getting taxonomies:", error);
    return { categoryIds: [], tagIds: [] };
  }
}

// ============= RESULT INTERFACES =============

interface WordPressPublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}

interface GenerationResult {
  entityName: string;
  entityType: 'farmacia' | 'empresa' | 'site';
  success: boolean;
  error?: string;
  wpSpanish?: WordPressPublishResult;
  wpCatalan?: WordPressPublishResult;
  skippedReason?: string;
  limitExceeded?: boolean;
}

// ============= MAIN HANDLER =============

const handler = async (req: Request): Promise<Response> => {
  console.log("=== GENERATE ARTICLES STARTED ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const generateArticleUrl = `${supabaseUrl}/functions/v1/generate-article`;
    const generateArticleEmpresaUrl = `${supabaseUrl}/functions/v1/generate-article-empresa`;
    const publishUrl = `${supabaseUrl}/functions/v1/publish-to-wordpress`;

    console.log(`Processing for ${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[currentMonth - 1]} ${currentYear}`);
    console.log(`Is first Monday: ${isFirstMondayOfMonth(now)}`);

    const results: GenerationResult[] = [];
    let articlesGenerated = 0;
    const usedTopicsPharmacy: string[] = [];

    // ========== 1. PROCESS FARMACIAS (First Monday only) ==========
    if (isFirstMondayOfMonth(now)) {
      console.log("=== Processing FARMACIAS (First Monday) ===");
      
      const { data: farmacias, error: farmaciasError } = await supabase
        .from("farmacias")
        .select("*")
        .eq("auto_generate", true)
        .order("created_at", { ascending: true });

      if (farmaciasError) {
        console.error(`Error fetching farmacias: ${farmaciasError.message}`);
      } else {
        console.log(`Found ${farmacias?.length || 0} farmacias with auto_generate`);

        for (const farmacia of farmacias || []) {
          if (articlesGenerated >= MAX_ARTICLES_PER_RUN) {
            console.log(`Rate limit reached (${MAX_ARTICLES_PER_RUN}), stopping`);
            break;
          }

          const check = await shouldGenerateForEntity(
            supabase, farmacia.id, 'farmacia', 'monthly', currentMonth, currentYear, now
          );

          if (!check.shouldGenerate) {
            console.log(`Skipping farmacia ${farmacia.name}: ${check.reason}`);
            results.push({
              entityName: farmacia.name,
              entityType: 'farmacia',
              success: true,
              skippedReason: check.reason
            });
            continue;
          }

          const topic = getRandomTopic(currentMonth, usedTopicsPharmacy);
          if (!topic) continue;
          usedTopicsPharmacy.push(topic.tema);

          console.log(`[Farmacia] Generating for ${farmacia.name} - Topic: ${topic.tema}`);

          try {
            const response = await fetch(generateArticleUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                pharmacy: {
                  id: farmacia.id,
                  name: farmacia.name,
                  location: farmacia.location,
                  languages: farmacia.languages,
                  blog_url: farmacia.blog_url,
                  instagram_url: farmacia.instagram_url,
                },
                topic: topic,
                month: currentMonth,
                year: currentYear,
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const generatedData = await response.json();
            
            await supabase.from("articulos").insert({
              farmacia_id: farmacia.id,
              month: currentMonth,
              year: currentYear,
              topic: topic.tema,
              content_spanish: generatedData.content?.spanish || null,
              content_catalan: generatedData.content?.catalan || null,
              image_url: generatedData.image?.url || null,
              image_photographer: generatedData.image?.photographer || null,
              image_photographer_url: generatedData.image?.photographer_url || null,
              pexels_query: generatedData.pexels_query || topic.pexels_query,
            });

            articlesGenerated++;
            console.log(`✓ Generated article for farmacia ${farmacia.name}`);

            // WordPress publish
            let wpSpanish: WordPressPublishResult | undefined;
            let wpCatalan: WordPressPublishResult | undefined;

            const { data: wpSite } = await supabase
              .from("wordpress_sites")
              .select("*")
              .eq("farmacia_id", farmacia.id)
              .maybeSingle();

            if (wpSite && generatedData.content?.spanish) {
              const { categoryIds, tagIds } = await getTaxonomiesForPublish(
                supabase, wpSite.id,
                generatedData.content.spanish.title,
                generatedData.content.spanish.content,
                lovableApiKey
              );

              // Spanish
              try {
                const spanishResp = await fetch(publishUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
                  body: JSON.stringify({
                    farmacia_id: farmacia.id,
                    title: generatedData.content.spanish.title,
                    content: generatedData.content.spanish.content,
                    slug: generatedData.content.spanish.slug,
                    status: "publish",
                    image_url: generatedData.image?.url,
                    image_alt: generatedData.content.spanish.title,
                    meta_description: generatedData.content.spanish.meta_description,
                    lang: "es",
                    category_ids: categoryIds,
                    tag_ids: tagIds,
                  }),
                });
                const spanishResult = await spanishResp.json();
                wpSpanish = spanishResult.success 
                  ? { success: true, postUrl: spanishResult.post_url }
                  : { success: false, error: spanishResult.error };
              } catch (e) {
                wpSpanish = { success: false, error: String(e) };
              }

              // Catalan
              if (generatedData.content?.catalan) {
                try {
                  const catalanResp = await fetch(publishUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
                    body: JSON.stringify({
                      farmacia_id: farmacia.id,
                      title: generatedData.content.catalan.title,
                      content: generatedData.content.catalan.content,
                      slug: `${generatedData.content.catalan.slug}-ca`,
                      status: "publish",
                      image_url: generatedData.image?.url,
                      image_alt: generatedData.content.catalan.title,
                      meta_description: generatedData.content.catalan.meta_description,
                      lang: "ca",
                      category_ids: categoryIds,
                      tag_ids: tagIds,
                    }),
                  });
                  const catalanResult = await catalanResp.json();
                  wpCatalan = catalanResult.success 
                    ? { success: true, postUrl: catalanResult.post_url }
                    : { success: false, error: catalanResult.error };
                } catch (e) {
                  wpCatalan = { success: false, error: String(e) };
                }
              }
            }

            results.push({
              entityName: farmacia.name,
              entityType: 'farmacia',
              success: true,
              wpSpanish,
              wpCatalan,
            });
          } catch (error) {
            console.error(`✗ Error for farmacia ${farmacia.name}:`, error);
            results.push({
              entityName: farmacia.name,
              entityType: 'farmacia',
              success: false,
              error: String(error),
            });
          }

          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    } else {
      console.log("Not first Monday, skipping farmacias");
    }

    // ========== 2. PROCESS EMPRESAS (Based on frequency) ==========
    console.log("=== Processing EMPRESAS ===");
    
    const { data: empresas, error: empresasError } = await supabase
      .from("empresas")
      .select("*")
      .eq("auto_generate", true)
      .order("publish_frequency", { ascending: true }); // daily first

    if (empresasError) {
      console.error(`Error fetching empresas: ${empresasError.message}`);
    } else {
      console.log(`Found ${empresas?.length || 0} empresas with auto_generate`);

      for (const empresa of empresas || []) {
        if (articlesGenerated >= MAX_ARTICLES_PER_RUN) {
          console.log(`Rate limit reached (${MAX_ARTICLES_PER_RUN}), stopping`);
          break;
        }

        const check = await shouldGenerateForEntity(
          supabase, empresa.id, 'empresa', empresa.publish_frequency || 'monthly',
          currentMonth, currentYear, now
        );

        if (!check.shouldGenerate) {
          console.log(`Skipping empresa ${empresa.name}: ${check.reason}`);
          continue;
        }

        // Get used topics for variety
        const usedTopics = await getUsedTopics(supabase, empresa.id, 'empresa');

        // Generate topic
        let topicTema = empresa.custom_topic;
        if (!topicTema && lovableApiKey) {
          topicTema = await generateDynamicTopic(
            lovableApiKey,
            { name: empresa.name, sector: empresa.sector, location: empresa.location },
            currentMonth, currentYear, usedTopics, now
          );
        } else if (!topicTema) {
          topicTema = `Novedades en ${empresa.sector || "servicios"} para ${MONTH_NAMES[currentMonth - 1]}`;
        }

        const topic = {
          tema: topicTema,
          keywords: [],
          pexels_query: empresa.sector ? `${empresa.sector} professional business` : "business professional"
        };

        console.log(`[Empresa] Generating for ${empresa.name} (${empresa.publish_frequency}) - Topic: ${topic.tema}`);

        try {
          const response = await fetch(generateArticleEmpresaUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              empresaId: empresa.id,
              company: {
                name: empresa.name,
                location: empresa.location,
                sector: empresa.sector,
                languages: empresa.languages,
                blog_url: empresa.blog_url,
                instagram_url: empresa.instagram_url,
                geographic_scope: empresa.geographic_scope || "local",
                include_featured_image: empresa.include_featured_image !== false,
              },
              topic: topic.tema,
              month: currentMonth,
              year: currentYear,
              usedImageUrls: [],
              autoGenerateTopic: false,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          const generatedData = await response.json();
          
          await supabase.from("articulos_empresas").insert({
            empresa_id: empresa.id,
            month: currentMonth,
            year: currentYear,
            topic: topic.tema,
            day_of_month: now.getDate(),
            week_of_month: Math.ceil(now.getDate() / 7),
            content_spanish: generatedData.content?.spanish || null,
            content_catalan: generatedData.content?.catalan || null,
            image_url: generatedData.image?.url || null,
            image_photographer: generatedData.image?.photographer || null,
            image_photographer_url: generatedData.image?.photographer_url || null,
            pexels_query: generatedData.pexels_query || topic.pexels_query,
          });

          articlesGenerated++;
          console.log(`✓ Generated article for empresa ${empresa.name}`);

          // WordPress publish
          let wpSpanish: WordPressPublishResult | undefined;
          let wpCatalan: WordPressPublishResult | undefined;

          const { data: wpSite } = await supabase
            .from("wordpress_sites")
            .select("*")
            .eq("empresa_id", empresa.id)
            .maybeSingle();

          if (wpSite && generatedData.content?.spanish) {
            const { categoryIds, tagIds } = await getTaxonomiesForPublish(
              supabase, wpSite.id,
              generatedData.content.spanish.title,
              generatedData.content.spanish.content,
              lovableApiKey
            );

            try {
              const spanishResp = await fetch(publishUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
                body: JSON.stringify({
                  empresa_id: empresa.id,
                  title: generatedData.content.spanish.title,
                  content: generatedData.content.spanish.content,
                  slug: generatedData.content.spanish.slug,
                  status: "publish",
                  image_url: generatedData.image?.url,
                  image_alt: generatedData.content.spanish.title,
                  meta_description: generatedData.content.spanish.meta_description,
                  lang: "es",
                  category_ids: categoryIds,
                  tag_ids: tagIds,
                }),
              });
              const spanishResult = await spanishResp.json();
              wpSpanish = spanishResult.success 
                ? { success: true, postUrl: spanishResult.post_url }
                : { success: false, error: spanishResult.error };
            } catch (e) {
              wpSpanish = { success: false, error: String(e) };
            }

            if (generatedData.content?.catalan) {
              try {
                const catalanResp = await fetch(publishUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
                  body: JSON.stringify({
                    empresa_id: empresa.id,
                    title: generatedData.content.catalan.title,
                    content: generatedData.content.catalan.content,
                    slug: `${generatedData.content.catalan.slug}-ca`,
                    status: "publish",
                    image_url: generatedData.image?.url,
                    image_alt: generatedData.content.catalan.title,
                    meta_description: generatedData.content.catalan.meta_description,
                    lang: "ca",
                    category_ids: categoryIds,
                    tag_ids: tagIds,
                  }),
                });
                const catalanResult = await catalanResp.json();
                wpCatalan = catalanResult.success 
                  ? { success: true, postUrl: catalanResult.post_url }
                  : { success: false, error: catalanResult.error };
              } catch (e) {
                wpCatalan = { success: false, error: String(e) };
              }
            }
          }

          results.push({
            entityName: empresa.name,
            entityType: 'empresa',
            success: true,
            wpSpanish,
            wpCatalan,
          });
        } catch (error) {
          console.error(`✗ Error for empresa ${empresa.name}:`, error);
          results.push({
            entityName: empresa.name,
            entityType: 'empresa',
            success: false,
            error: String(error),
          });
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // ========== 3. PROCESS SITES (SaaS - Based on frequency + plan limits) ==========
    console.log("=== Processing SITES (SaaS) ===");
    
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("*")
      .eq("auto_generate", true)
      .order("publish_frequency", { ascending: true });

    if (sitesError) {
      console.error(`Error fetching sites: ${sitesError.message}`);
    } else {
      console.log(`Found ${sites?.length || 0} sites with auto_generate`);

      for (const site of sites || []) {
        if (articlesGenerated >= MAX_ARTICLES_PER_RUN) {
          console.log(`Rate limit reached (${MAX_ARTICLES_PER_RUN}), stopping`);
          break;
        }

        // Check frequency
        const check = await shouldGenerateForEntity(
          supabase, site.id, 'site', site.publish_frequency || 'monthly',
          currentMonth, currentYear, now
        );

        if (!check.shouldGenerate) {
          console.log(`Skipping site ${site.name}: ${check.reason}`);
          continue;
        }

        // Check plan limits
        const limits = await checkPlanLimits(supabase, site.user_id, currentMonth, currentYear);
        
        if (!limits.withinLimits) {
          console.log(`Site ${site.name} exceeded plan limits (${limits.used}/${limits.limit})`);
          
          // Send notification email
          if (limits.userEmail) {
            try {
              await resend.emails.send({
                from: "Blooglee <onboarding@resend.dev>",
                to: [limits.userEmail],
                subject: `Límite de artículos alcanzado - ${site.name}`,
                html: `
                  <h1>Límite de artículos alcanzado</h1>
                  <p>No se ha podido generar el artículo automático para <strong>${site.name}</strong>.</p>
                  <p>Has usado <strong>${limits.used}</strong> de <strong>${limits.limit}</strong> artículos este mes.</p>
                  <p>Actualiza tu plan para generar más artículos.</p>
                  <p><a href="${PORTAL_URL}/billing">Ver planes</a></p>
                `,
              });
            } catch (e) {
              console.error("Failed to send limit exceeded email:", e);
            }
          }

          results.push({
            entityName: site.name,
            entityType: 'site',
            success: false,
            limitExceeded: true,
            error: `Límite excedido: ${limits.used}/${limits.limit}`,
          });
          continue;
        }

        // Get used topics
        const usedTopics = await getUsedTopics(supabase, site.id, 'site');

        // Generate topic
        let topicTema = site.custom_topic;
        if (!topicTema && lovableApiKey) {
          topicTema = await generateDynamicTopic(
            lovableApiKey,
            { name: site.name, sector: site.sector, location: site.location },
            currentMonth, currentYear, usedTopics, now
          );
        } else if (!topicTema) {
          topicTema = `Novedades en ${site.sector || "servicios"} para ${MONTH_NAMES[currentMonth - 1]}`;
        }

        const topic = {
          tema: topicTema,
          keywords: [],
          pexels_query: site.sector ? `${site.sector} professional business` : "business professional"
        };

        console.log(`[Site] Generating for ${site.name} (${site.publish_frequency}) - Topic: ${topic.tema}`);

        try {
          const response = await fetch(generateArticleUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              pharmacy: {
                id: site.id,
                name: site.name,
                location: site.location,
                sector: site.sector,
                languages: site.languages,
                blog_url: site.blog_url,
                instagram_url: site.instagram_url,
                geographic_scope: site.geographic_scope || "local",
              },
              topic: topic,
              month: currentMonth,
              year: currentYear,
              skipImage: site.include_featured_image === false,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          const generatedData = await response.json();
          
          await supabase.from("articles").insert({
            site_id: site.id,
            user_id: site.user_id,
            month: currentMonth,
            year: currentYear,
            topic: topic.tema,
            day_of_month: now.getDate(),
            week_of_month: Math.ceil(now.getDate() / 7),
            content_spanish: generatedData.content?.spanish || null,
            content_catalan: generatedData.content?.catalan || null,
            image_url: generatedData.image?.url || null,
            image_photographer: generatedData.image?.photographer || null,
            image_photographer_url: generatedData.image?.photographer_url || null,
            pexels_query: generatedData.pexels_query || topic.pexels_query,
          });

          articlesGenerated++;
          console.log(`✓ Generated article for site ${site.name}`);

          // WordPress publish for SaaS sites
          let wpSpanish: WordPressPublishResult | undefined;
          let wpCatalan: WordPressPublishResult | undefined;

          const { data: wpConfig } = await supabase
            .from("wordpress_configs")
            .select("*")
            .eq("site_id", site.id)
            .maybeSingle();

          if (wpConfig && generatedData.content?.spanish) {
            // For SaaS, we need to call publish differently (or create a new function)
            // For now, log that WP is configured but skip auto-publish
            console.log(`WordPress configured for site ${site.name}, auto-publish not yet implemented for SaaS`);
          }

          results.push({
            entityName: site.name,
            entityType: 'site',
            success: true,
            wpSpanish,
            wpCatalan,
          });
        } catch (error) {
          console.error(`✗ Error for site ${site.name}:`, error);
          results.push({
            entityName: site.name,
            entityType: 'site',
            success: false,
            error: String(error),
          });
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // ========== 4. GENERATE BLOOGLEE BLOG POSTS ==========
    console.log("=== Generating Blooglee Blog Posts ===");

    let blogGeneratedCount = 0;
    const blogCategories = ['Empresas', 'Agencias'];
    
    for (const blogCategory of blogCategories) {
      try {
        console.log(`Generating blog post for ${blogCategory}...`);
        
        const blogResponse = await fetch(`${supabaseUrl}/functions/v1/generate-blog-blooglee`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ category: blogCategory }),
        });

        if (blogResponse.ok) {
          const blogResult = await blogResponse.json();
          if (blogResult.success && !blogResult.skipped) {
            console.log(`✓ Generated blog post: ${blogResult.post?.title || blogCategory}`);
            blogGeneratedCount++;
          } else if (blogResult.skipped) {
            console.log(`Blog post for ${blogCategory} already exists today`);
          }
        } else {
          console.error(`Failed to generate blog post for ${blogCategory}: ${blogResponse.status}`);
        }
      } catch (e) {
        console.error(`Error generating blog post for ${blogCategory}:`, e);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Blog posts generated: ${blogGeneratedCount}`);

    // ========== 5. UPDATE SEO ASSETS ==========
    console.log("=== Updating SEO Assets ===");
    
    try {
      const seoResponse = await fetch(`${supabaseUrl}/functions/v1/update-seo-assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({}),
      });

      if (seoResponse.ok) {
        const seoResult = await seoResponse.json();
        console.log(`✓ SEO assets updated: ${seoResult.generated?.posts_count || 0} posts in sitemap`);
      } else {
        console.error(`Failed to update SEO assets: ${seoResponse.status}`);
      }
    } catch (e) {
      console.error("Error updating SEO assets:", e);
    }

    // ========== 6. SEND SEGMENTED NEWSLETTERS ==========
    console.log("=== Sending Segmented Newsletters ===");
    
    if (blogGeneratedCount > 0) {
      try {
        const newsletterResponse = await fetch(`${supabaseUrl}/functions/v1/send-newsletter`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({}),
        });

        if (newsletterResponse.ok) {
          const newsletterResult = await newsletterResponse.json();
          if (newsletterResult.skipped) {
            console.log(`Newsletter skipped: ${newsletterResult.reason}`);
          } else {
            console.log(`✓ Newsletters sent: ${newsletterResult.emailsSent || 0} emails`);
          }
        } else {
          console.error(`Failed to send newsletters: ${newsletterResponse.status}`);
        }
      } catch (e) {
        console.error("Error sending newsletters:", e);
      }
    } else {
      console.log("No blog posts generated today, skipping newsletters");
    }

    // ========== SUMMARY ==========
    const successCount = results.filter(r => r.success && !r.skippedReason).length;
    const skippedCount = results.filter(r => r.skippedReason).length;
    const failCount = results.filter(r => !r.success).length;
    const limitExceededCount = results.filter(r => r.limitExceeded).length;
    const wpPublished = results.filter(r => r.wpSpanish?.success || r.wpCatalan?.success).length;

    console.log(`=== GENERATION COMPLETE ===`);
    console.log(`Generated: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount}, Limit Exceeded: ${limitExceededCount}, WP: ${wpPublished}, Blog: ${blogGeneratedCount}`);

    // Build email
    let successTableRows = '';
    for (const result of results.filter(r => r.success && !r.skippedReason)) {
      const wpStatus = [];
      if (result.wpSpanish?.success) wpStatus.push(`<a href="${result.wpSpanish.postUrl}">ES ✓</a>`);
      if (result.wpSpanish && !result.wpSpanish.success) wpStatus.push(`ES ✗`);
      if (result.wpCatalan?.success) wpStatus.push(`<a href="${result.wpCatalan.postUrl}">CA ✓</a>`);
      if (result.wpCatalan && !result.wpCatalan.success) wpStatus.push(`CA ✗`);
      
      successTableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityType}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${wpStatus.length > 0 ? wpStatus.join(' | ') : 'No WP'}</td>
        </tr>
      `;
    }

    let failedTableRows = '';
    for (const result of results.filter(r => !r.success)) {
      failedTableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${result.entityType}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: ${result.limitExceeded ? 'orange' : 'red'};">
            ${result.limitExceeded ? '⚠️ ' : ''}${result.error || 'Unknown error'}
          </td>
        </tr>
      `;
    }

    const emailHtml = `
      <h1>Blooglee - Generación Automática</h1>
      <p>Fecha: <strong>${now.getDate()} ${MONTH_NAMES[currentMonth - 1]} ${currentYear}</strong></p>
      
      <h2>Resumen</h2>
      <ul>
        <li><strong>Artículos generados:</strong> ${successCount}</li>
        <li><strong>Omitidos (ya existían):</strong> ${skippedCount}</li>
        <li><strong>Errores:</strong> ${failCount}</li>
        <li><strong>Límite excedido:</strong> ${limitExceededCount}</li>
        <li><strong>Publicados en WordPress:</strong> ${wpPublished}</li>
      </ul>
      
      ${successCount > 0 ? `
        <h2>✓ Artículos Generados</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Entidad</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tipo</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">WordPress</th>
            </tr>
          </thead>
          <tbody>${successTableRows}</tbody>
        </table>
      ` : ''}
      
      ${failCount > 0 ? `
        <h2>✗ Errores</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Entidad</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tipo</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Error</th>
            </tr>
          </thead>
          <tbody>${failedTableRows}</tbody>
        </table>
      ` : ''}
      
      <p><a href="${PORTAL_URL}/mkpro">Acceder al portal MKPro</a></p>
      <p>Saludos,<br>Blooglee</p>
    `;

    // Only send email if something was generated or there were errors
    if (successCount > 0 || failCount > 0) {
      await resend.emails.send({
        from: "Blooglee <onboarding@resend.dev>",
        to: NOTIFICATION_EMAILS,
        subject: `Blooglee ${now.getDate()}/${currentMonth}/${currentYear} - ${successCount} generados`,
        html: emailHtml,
      });
      console.log("Notification email sent");
    } else {
      console.log("No changes, skipping notification email");
    }

    return new Response(
      JSON.stringify({
        message: "Generation complete",
        generated: successCount,
        skipped: skippedCount,
        failed: failCount,
        limitExceeded: limitExceededCount,
        wpPublished,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Fatal error:", error);

    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "Blooglee <onboarding@resend.dev>",
          to: NOTIFICATION_EMAILS,
          subject: "ERROR - Generación automática Blooglee",
          html: `
            <h1>Error en Blooglee</h1>
            <p>Se ha producido un error durante la generación automática:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${errorMessage}</pre>
            <p><a href="${PORTAL_URL}/mkpro">Acceder al portal</a></p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send error email:", emailError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
