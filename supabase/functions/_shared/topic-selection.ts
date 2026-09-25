// =====================================================================
// BLOOGLEE · supabase/functions/_shared/topic-selection.ts
//
// PUNTO ÚNICO donde se decide de qué trata un artículo.
// Lo usan: generate-article-saas (cron + manual + onboarding) y suggest-topics.
//
// Principio: la diversidad NO se pide al modelo, se deriva de la cobertura
// del mapa temático del negocio. El modelo solo redacta el enunciado del
// nodo que le toca.
// =====================================================================

export interface TopicNode {
  id: string;
  axis: string;
  subtopic: string;
  search_intent: string | null;
  audience_segment: string | null;
  season: string;
  month_hint: number | null;
  priority: number;
  coverage_count: number;
  last_used_at: string | null;
}

export interface TemporalContext {
  today: string;
  month: number;
  monthName: string;
  season: string;
  forbiddenSeasons: string[];
  upcomingEvents: string[];
  daysToSeasonChange: number;
}

export interface TopicSelection {
  topic: string;
  nodeId: string | null;
  axis: string | null;
  conceptKey: string;
  source: "map" | "provided" | "composed" | "degraded";
  attempts: number;
  warnings: string[];
}

export interface SelectTopicOptions {
  supabase: any; // service-role client
  siteId: string;
  sector: string | null;
  siteName: string;
  description?: string | null;
  targetAudience?: string | null;
  tone?: string | null;
  customTopic?: string | null;
  avoidTopics?: string[];
  priorityTopics?: string[];
  prohibitedTerms?: string[];
  country?: string; // ISO-2, default ES
  providedTopic?: string | null;
  apiKey: string;
  model?: string;
  topicPromptTemplate: string; // saas.topic ya resuelto por getPrompt()
  logger?: (msg: string) => void;
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Calendario por país. Se inyectan SOLO los eventos de los próximos 45 días.
// Añadir un país = añadir una entrada, sin tocar prompts.
const EVENT_CALENDAR: Record<string, Array<{ month: number; day: number; name: string }>> = {
  ES: [
    { month: 1, day: 6, name: "Reyes" },
    { month: 2, day: 14, name: "San Valentin" },
    { month: 3, day: 19, name: "Dia del Padre" },
    { month: 5, day: 1, name: "primer domingo de mayo: Dia de la Madre" },
    { month: 6, day: 24, name: "San Juan" },
    { month: 9, day: 1, name: "vuelta al cole y regreso de vacaciones" },
    { month: 10, day: 1, name: "inicio de la campana de vacunacion de gripe" },
    { month: 10, day: 31, name: "Halloween" },
    { month: 11, day: 28, name: "Black Friday" },
    { month: 12, day: 25, name: "Navidad" },
    { month: 12, day: 31, name: "Nochevieja" },
  ],
};

// ---------------------------------------------------------------------
// CONTEXTO TEMPORAL
// Sustituye a buildSeasonalGuardrail(). Diferencias:
//  - prohibe TODAS las estaciones que no son la actual (antes la siguiente
//    quedaba fuera de la prohibición dura, y por ahí se colaba "otoño"),
//  - salvo ventana de 14 días antes del cambio de estación,
//  - el calendario de efemérides depende del país, no del prompt.
// ---------------------------------------------------------------------
export function getTemporalContext(now: Date, country = "ES"): TemporalContext {
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const year = now.getUTCFullYear();

  const boundaries = [
    { m: 3, d: 21, season: "primavera" },
    { m: 6, d: 21, season: "verano" },
    { m: 9, d: 23, season: "otono" },
    { m: 12, d: 21, season: "invierno" },
  ];

  const asNumber = month * 100 + day;
  let season = "invierno";
  if (asNumber >= 321 && asNumber < 621) season = "primavera";
  else if (asNumber >= 621 && asNumber < 923) season = "verano";
  else if (asNumber >= 923 && asNumber < 1221) season = "otono";

  // Días hasta el próximo cambio de estación.
  let daysToSeasonChange = 999;
  for (const b of boundaries) {
    const target = Date.UTC(year + (b.m * 100 + b.d < asNumber ? 1 : 0), b.m - 1, b.d);
    const diff = Math.round((target - Date.UTC(year, month - 1, day)) / 86400000);
    if (diff >= 0 && diff < daysToSeasonChange) daysToSeasonChange = diff;
  }

  const all = ["primavera", "verano", "otono", "invierno"];
  const nextSeason = all[(all.indexOf(season) + 1) % 4];
  // Solo en la recta final de la estación se permite mirar a la siguiente.
  const forbiddenSeasons =
    daysToSeasonChange <= 14 ? all.filter((s) => s !== season && s !== nextSeason) : all.filter((s) => s !== season);

  const events = (EVENT_CALENDAR[country] || EVENT_CALENDAR.ES)
    .map((e) => {
      const target = Date.UTC(year + (e.month * 100 + e.day < asNumber ? 1 : 0), e.month - 1, e.day);
      return { ...e, days: Math.round((target - Date.UTC(year, month - 1, day)) / 86400000) };
    })
    .filter((e) => e.days >= 0 && e.days <= 45)
    .sort((a, b) => a.days - b.days)
    .map((e) => `${e.name} (en ${e.days} dias)`);

  return {
    today: `${day} de ${MONTHS_ES[month - 1]} de ${year}`,
    month,
    monthName: MONTHS_ES[month - 1],
    season,
    forbiddenSeasons,
    upcomingEvents: events,
    daysToSeasonChange,
  };
}

// ---------------------------------------------------------------------
// HUELLA DE CONCEPTO
// Normaliza un enunciado a sus 3 palabras significativas, ordenadas.
// "Caída del pelo en otoño" y "Por qué se cae más el pelo en otoño"
// comparten huella; sirve para medir repetición sin listas negras.
// ---------------------------------------------------------------------
const STOPWORDS = new Set([
  "el","la","los","las","un","una","unos","unas","de","del","al","a","en","y","o","que","por","para","con","sin",
  "su","tu","mi","se","lo","es","son","como","cuando","donde","cual","cuales","mas","menos","muy","ya","si","no",
  "este","esta","estos","estas","ese","esa","hay","ser","estar","tiene","tienen","hacer","puede","pueden","debe",
  "por que","porque","guia","consejos","claves","tipos","mejor","mejores","todo","todos","toda","todas",
]);

export function normalizeConceptKey(text: string): string {
  const words = (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const unique = [...new Set(words)].sort();
  return unique.slice(0, 3).join("-") || "sin-concepto";
}

export function extractConcepts(text: string): Set<string> {
  return new Set(
    (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      // Umbral en 3, no en 4: el original dejaba fuera "pelo", "piel", "sol",
      // que son justo los conceptos que distinguen un tema de otro. Con >4,
      // "Ca\u00edda del pelo en oto\u00f1o" y "Efluvio tel\u00f3geno: por qu\u00e9 se cae m\u00e1s el
      // pelo en oto\u00f1o" solo compart\u00edan "otono" y pasaban el filtro. Con >3
      // comparten "pelo" y "otono" y se detectan.
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
}

export function isTooSimilar(
  candidate: string,
  existing: string[],
): { similar: boolean; matched?: string; score?: number } {
  const a = extractConcepts(candidate);
  if (a.size < 2) return { similar: false };

  for (const e of existing) {
    const b = extractConcepts(e);
    if (b.size < 2) continue;
    const shared = [...a].filter((w) => b.has(w));
    const score = shared.length / Math.max(a.size, b.size);
    // Umbral 0.35: el par real que se coló el 1-09 ("Caída del pelo en otoño"
    // vs "Efluvio telógeno: por qué se cae más el pelo en otoño") puntúa
    // exactamente 0.40, así que 0.4 lo detectaba por igualdad justa. Probado
    // que 0.35 no marca pares legítimos (manchas vs colágeno, tensiómetro).
    if (shared.length >= 2 && score >= 0.35) return { similar: true, matched: e, score };
  }
  return { similar: false };
}

// ---------------------------------------------------------------------
// VALIDACIÓN DE ENUNCIADO COMPLETO
// El bug de agosto (temas cortados a media palabra) se detecta de forma
// determinista: el modelo responde JSON y, si se queda sin tokens, el JSON
// no cierra. La heurística de abajo es la segunda red, no la primera.
// ---------------------------------------------------------------------
const TRAILING_PARTICLES =
  /\s(de|del|y|o|el|la|los|las|para|con|que|un|una|en|a|su|tu|al|no|si|por|como|cuando|cual|mas|sobre|entre|desde|hasta|tras)$/i;

export function isTopicComplete(topic: string): { ok: boolean; reason?: string } {
  const t = (topic || "").trim();
  if (t.length < 25) return { ok: false, reason: "demasiado corto" };
  if (t.length > 95) return { ok: false, reason: "demasiado largo" };
  if (/[:,;\-–(«"']$/.test(t)) return { ok: false, reason: "termina en signo de puntuacion" };
  if (TRAILING_PARTICLES.test(t)) return { ok: false, reason: "termina en particula" };
  if (!/\s/.test(t)) return { ok: false, reason: "una sola palabra" };
  return { ok: true };
}

// ---------------------------------------------------------------------
// SELECCIÓN DE NODO POR COBERTURA
// El orden ES la garantía de diversidad: primero lo que encaja con la
// estación, después lo menos cubierto, después lo más antiguo.
// ---------------------------------------------------------------------
export async function pickCandidateNodes(
  supabase: any,
  siteId: string,
  temporal: TemporalContext,
  limit = 6,
): Promise<TopicNode[]> {
  // Filtrar SIEMPRE por el mapa activo. Sin esto, al regenerar el mapa de un
  // sitio los nodos de la generación anterior siguen con status 'active' y
  // conviven con los nuevos: el territorio no se sustituye, se acumula.
  const { data: activeMap } = await supabase
    .from("topic_maps")
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "active")
    .maybeSingle();

  if (!activeMap) return [];

  const { data, error } = await supabase
    .from("topic_nodes")
    .select("id, axis, subtopic, search_intent, audience_segment, season, month_hint, priority, coverage_count, last_used_at")
    .eq("site_id", siteId)
    .eq("map_id", activeMap.id)
    .eq("status", "active");

  if (error || !data?.length) return [];

  const seasonRank = (n: TopicNode) => {
    if (n.month_hint === temporal.month) return 0;
    if (n.season === temporal.season) return 1;
    if (n.season === "any") return 2;
    return 3; // estación equivocada: al final, nunca se elige salvo que no quede nada
  };

  return (data as TopicNode[])
    .sort((a, b) => {
      const s = seasonRank(a) - seasonRank(b);
      if (s !== 0) return s;
      if (a.coverage_count !== b.coverage_count) return a.coverage_count - b.coverage_count;
      const at = a.last_used_at ? Date.parse(a.last_used_at) : 0;
      const bt = b.last_used_at ? Date.parse(b.last_used_at) : 0;
      if (at !== bt) return at - bt;
      return b.priority - a.priority;
    })
    .slice(0, limit);
}

// ---------------------------------------------------------------------
// COMPOSICIÓN SIN IA (sustituye al fallback de temas hardcodeados)
// Si el modelo falla, el enunciado se compone desde el propio nodo. Es
// específico del negocio por construcción, sirva el sector que sirva.
// ---------------------------------------------------------------------
export function composeTopicFromNode(node: TopicNode): string {
  const s = node.subtopic.trim().replace(/\.$/, "");
  switch (node.search_intent) {
    case "comparative":
      return `${s}: en que se diferencian y cual conviene`;
    case "transactional":
      return `${s}: como elegir sin equivocarse`;
    case "alert":
      return `${s}: senales que conviene no pasar por alto`;
    default:
      return `${s}: lo que conviene saber antes de decidir`;
  }
}

// ---------------------------------------------------------------------
// LLAMADA AL GATEWAY con red de seguridad para `response_format`.
//
// Ninguna de las 19 llamadas del repo usa `response_format`, así que no
// sabemos si el gateway lo acepta. Si lo rechaza, se reintenta sin él: el
// prompt ya pide JSON explícitamente y el parseo limpia las vallas de
// markdown. Sin esta red, un 400 se interpretaría como "el modelo no ha
// contestado" y el sistema degradaría en silencio para siempre.
// ---------------------------------------------------------------------
let gatewaySupportsJsonMode: boolean | null = null;

export async function callGateway(
  body: Record<string, unknown>,
  apiKey: string,
  log: (m: string) => void = () => {},
): Promise<Response | null> {
  const url = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  if (gatewaySupportsJsonMode !== false) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...body, response_format: { type: "json_object" } }),
      });
      if (res.ok) {
        gatewaySupportsJsonMode = true;
        return res;
      }
      if (res.status !== 400) return res; // 429, 402, 5xx: no es culpa del campo
      gatewaySupportsJsonMode = false;
      log("[gateway] response_format rechazado (400): se continua sin json mode");
    } catch (e) {
      log(`[gateway] error de red: ${e}`);
      return null;
    }
  }

  try {
    return await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    log(`[gateway] error de red: ${e}`);
    return null;
  }
}

// ---------------------------------------------------------------------
// LLAMADA AL MODELO — responde JSON para detectar truncados sin heurística
// ---------------------------------------------------------------------
async function askModelForTopic(
  opts: SelectTopicOptions,
  node: TopicNode,
  temporal: TemporalContext,
  usedTopics: string[],
  sectorSignal: string[],
  maxTokens: number,
): Promise<{ topic: string | null; truncated: boolean }> {
  const log = opts.logger || (() => {});

  const nodeBlock = [
    "NODO DEL MAPA QUE TE TOCA CUBRIR (obligatorio, no elijas otro tema):",
    `- Eje tematico: ${node.axis}`,
    `- Subtema concreto: ${node.subtopic}`,
    node.search_intent ? `- Intencion de busqueda: ${node.search_intent}` : "",
    node.audience_segment ? `- Segmento de publico: ${node.audience_segment}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const temporalBlock = [
    `CONTEXTO TEMPORAL: hoy es ${temporal.today}. Estacion actual: ${temporal.season}.`,
    `PROHIBIDO usar estas estaciones en el enunciado, ni como gancho ni como contexto: ${temporal.forbiddenSeasons.join(", ")}.`,
    temporal.upcomingEvents.length
      ? `Eventos proximos que SI puedes usar si encajan con el subtema: ${temporal.upcomingEvents.join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const dedupBlock = usedTopics.length
    ? `TITULOS RECIENTES DE ESTE MISMO NEGOCIO (no repitas su enfoque):\n${usedTopics.slice(0, 12).map((t) => `- ${t}`).join("\n")}`
    : "";

  // Señal de sector: preferencia, no prohibición.
  const sectorBlock = sectorSignal.length
    ? `Otros negocios del sector han tratado mucho estos conceptos ultimamente: ${sectorSignal.slice(0, 8).join(", ")}. Si tu subtema roza alguno, busca un angulo distinto del habitual.`
    : "";

  const prompt = [
    opts.topicPromptTemplate,
    nodeBlock,
    temporalBlock,
    dedupBlock,
    sectorBlock,
    "",
    'Responde UNICAMENTE con este JSON, sin markdown ni texto alrededor: {"topic": "el enunciado"}',
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await callGateway(
    {
      model: opts.model || "google/gemini-3.6-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: maxTokens,
    },
    opts.apiKey,
    log,
  );

  if (!res || !res.ok) {
    log(`[topic] gateway ${res?.status ?? "sin respuesta"}`);
    return { topic: null, truncated: false };
  }

  const data = await res.json();
  const finish = data.choices?.[0]?.finish_reason;
  const raw = (data.choices?.[0]?.message?.content || "").trim();

  // Un JSON que no cierra = respuesta cortada por presupuesto de tokens.
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
  } catch {
    // Sin json mode el modelo puede contestar en texto plano. Solo se
    // considera truncado si el modelo agotó tokens o si la respuesta no
    // parece un enunciado; si no, se acepta el texto tal cual.
    if (finish !== "length" && raw.length > 0 && raw.length < 140 && !raw.includes("{")) {
      log(`[topic] respuesta en texto plano aceptada: "${raw}"`);
      return { topic: raw.replace(/^["']|["']$/g, "").trim(), truncated: false };
    }
    log(`[topic] JSON invalido (finish_reason=${finish}) -> truncado`);
    return { topic: null, truncated: true };
  }

  const topic = typeof parsed?.topic === "string" ? parsed.topic.trim() : null;
  if (finish === "length") return { topic, truncated: true };
  return { topic, truncated: false };
}

// ---------------------------------------------------------------------
// ORQUESTADOR
// ---------------------------------------------------------------------
export async function selectTopic(opts: SelectTopicOptions): Promise<TopicSelection> {
  const log = opts.logger || (() => {});
  const warnings: string[] = [];
  const temporal = getTemporalContext(new Date(), opts.country || "ES");

  // Histórico del propio sitio (para dedup y para el prompt).
  const { data: recent } = await opts.supabase
    .from("articles")
    .select("topic")
    .eq("site_id", opts.siteId)
    .order("generated_at", { ascending: false })
    .limit(30);
  const usedTopics: string[] = (recent || []).map((r: any) => r.topic).filter(Boolean);

  // --- CASO 1: el tema viene dado (onboarding o petición manual) ---------
  // Antes esto se saltaba TODOS los controles. Ahora se valida y se ancla
  // al mapa igual que cualquier otro, pero nunca se rechaza al usuario.
  if (opts.providedTopic && opts.providedTopic.trim().length > 0) {
    const provided = opts.providedTopic.trim();
    const completeness = isTopicComplete(provided);
    if (!completeness.ok) warnings.push(`tema proporcionado: ${completeness.reason}`);

    const nodes = await pickCandidateNodes(opts.supabase, opts.siteId, temporal, 50);
    const match = nodes.find((n) => isTooSimilar(provided, [`${n.axis} ${n.subtopic}`]).similar) || null;

    return {
      topic: provided,
      nodeId: match?.id || null,
      axis: match?.axis || null,
      conceptKey: normalizeConceptKey(provided),
      source: "provided",
      attempts: 0,
      warnings,
    };
  }

  // --- CASO 2: selección por cobertura del mapa --------------------------
  const candidates = await pickCandidateNodes(opts.supabase, opts.siteId, temporal, 6);

  if (candidates.length === 0) {
    warnings.push("el sitio no tiene mapa tematico activo: generando en modo degradado");
    log("[topic] sin mapa: se requiere build-topic-map para este sitio");
  }

  // Señal de sector (desempate suave, nunca bloqueo).
  let sectorSignal: string[] = [];
  if (opts.sector) {
    const { data: sig } = await opts.supabase.rpc("sector_recent_concepts", {
      _sector: opts.sector,
      _days: 90,
      _exclude_site: opts.siteId,
    });
    sectorSignal = (sig || []).map((r: any) => r.concept_key);
  }

  const MAX_ATTEMPTS = 3;
  let attempts = 0;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    attempts++;
    // Cada intento cambia de nodo: no se reintenta el mismo prompt a ciegas.
    const node = candidates[i % Math.max(candidates.length, 1)] || null;
    if (!node) break;

    const maxTokens = i === 0 ? 1200 : 2500; // margen para el razonamiento del modelo
    const { topic, truncated } = await askModelForTopic(opts, node, temporal, usedTopics, sectorSignal, maxTokens);

    if (truncated) {
      warnings.push(`intento ${attempts}: respuesta truncada`);
      continue;
    }
    if (!topic) {
      warnings.push(`intento ${attempts}: sin respuesta`);
      continue;
    }

    const completeness = isTopicComplete(topic);
    if (!completeness.ok) {
      warnings.push(`intento ${attempts}: ${completeness.reason}`);
      continue;
    }

    const forbidden = temporal.forbiddenSeasons.find((s) =>
      topic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(s),
    );
    if (forbidden) {
      warnings.push(`intento ${attempts}: menciona estacion prohibida (${forbidden})`);
      continue;
    }

    const dup = isTooSimilar(topic, usedTopics);
    if (dup.similar) {
      warnings.push(`intento ${attempts}: similar a "${dup.matched}"`);
      continue;
    }

    log(`[topic] OK en intento ${attempts}: "${topic}" (eje: ${node.axis})`);
    return {
      topic,
      nodeId: node.id,
      axis: node.axis,
      conceptKey: normalizeConceptKey(topic),
      source: "map",
      attempts,
      warnings,
    };
  }

  // --- CASO 3: el modelo no ha servido. Se compone desde el nodo. --------
  // No hay listas de temas por sector: el enunciado sale del propio negocio.
  const node = candidates[0];
  if (node) {
    const composed = composeTopicFromNode(node);
    log(`[topic] compuesto desde nodo: "${composed}"`);
    return {
      topic: composed,
      nodeId: node.id,
      axis: node.axis,
      conceptKey: normalizeConceptKey(composed),
      source: "composed",
      attempts,
      warnings,
    };
  }

  // --- CASO 4: ni mapa ni modelo. Se aborta: es preferible no publicar. --
  throw new Error(
    "TOPIC_SELECTION_FAILED: el sitio no tiene mapa tematico y el modelo no ha devuelto un enunciado valido",
  );
}

// ---------------------------------------------------------------------
// Marcar nodo como usado. Llamar DESPUÉS de guardar el artículo.
// ---------------------------------------------------------------------
export async function markNodeUsed(supabase: any, nodeId: string | null): Promise<void> {
  if (!nodeId) return;
  // Incremento atómico en la base de datos: un read-modify-write desde aquí
  // pierde incrementos si el mismo sitio genera dos artículos a la vez.
  const { error } = await supabase.rpc("increment_node_coverage", { _node_id: nodeId });
  if (error) console.warn("[topic] no se pudo marcar el nodo como usado:", error.message);
}

// ---------------------------------------------------------------------
// ¿Queda territorio por cubrir? Si no, hay que ampliar el mapa.
// El llamador puede disparar build-topic-map en modo "extend".
// ---------------------------------------------------------------------
export async function mapNeedsExtension(supabase: any, siteId: string, threshold = 0.8): Promise<boolean> {
  const { data } = await supabase.from("topic_nodes").select("coverage_count").eq("site_id", siteId).eq("status", "active");
  if (!data?.length) return true;
  const covered = data.filter((n: any) => n.coverage_count > 0).length;
  return covered / data.length >= threshold;
}
