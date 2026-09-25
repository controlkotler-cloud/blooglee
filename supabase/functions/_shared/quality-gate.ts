// =====================================================================
// BLOOGLEE · supabase/functions/_shared/quality-gate.ts
//
// Se ejecuta DESPUÉS de generar el artículo y ANTES de publicarlo.
// Devuelve un veredicto que se guarda en articles.quality_status /
// articles.quality_report. El reconciliador solo publica 'passed'.
//
// Regla de diseño: aquí solo entran comprobaciones OBJETIVAS. Nada de
// juicios editoriales — de eso se encarga el prompt de redacción.
// =====================================================================

import { isTooSimilar, isTopicComplete, type TemporalContext } from "./topic-selection.ts";

export type QualityStatus = "passed" | "held";

export interface QualityCheck {
  id: string;
  level: "hard" | "soft";
  ok: boolean;
  detail?: string;
}

export interface QualityVerdict {
  status: QualityStatus;
  score: number; // 0-100
  checks: QualityCheck[];
  failedHard: string[];
  checkedAt: string;
}

export interface ArticleShape {
  title?: string;
  seo_title?: string;
  meta_description?: string;
  excerpt?: string;
  content?: string;
  slug?: string;
}

export interface QualityGateInput {
  article: ArticleShape;
  temporal: TemporalContext;
  previousTitles: string[];
  language: "es" | "ca";
  minWords?: number;
}

const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const textOf = (html: string) =>
  (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Castellanismos frecuentes en las traducciones al catalán. Se amplía sola
// conforme aparezcan: es una lista de detección, no de sustitución.
const CASTELLANISMS_CA = [
  "descubre", "aprende", "conoce", "para el", "para la", "bienestar", "salud",
  "farmacia,", "consejos", "cuidado de", "necesidades", "calidad",
];

export function runQualityGate(input: QualityGateInput): QualityVerdict {
  const { article, temporal, previousTitles, language } = input;
  const checks: QualityCheck[] = [];

  const push = (id: string, level: "hard" | "soft", ok: boolean, detail?: string) =>
    checks.push({ id, level, ok, detail });

  const title = (article.title || "").trim();
  const seoTitle = (article.seo_title || "").trim();
  const meta = (article.meta_description || "").trim();
  const content = article.content || "";
  const plain = textOf(content);
  const words = plain ? plain.split(/\s+/).length : 0;

  // --- DUROS: bloquean la publicación ---------------------------------

  push("title_presente", "hard", title.length >= 20, title ? `${title.length} chars` : "vacio");

  const titleComplete = isTopicComplete(title);
  push("title_completo", "hard", titleComplete.ok, titleComplete.reason);

  // Calibrado con los 24 artículos del 1-09-2026: el prompt exige 120-145 y
  // 8 de 24 salieron por debajo (mínimo 105). El check duro se pone en 112
  // para retener solo lo patológico; el tramo 120-145 se avisa como blando.
  push("meta_longitud", "hard", meta.length >= 112 && meta.length <= 160, `${meta.length} chars`);
  push("meta_rango_optimo", "soft", meta.length >= 120 && meta.length <= 145, `${meta.length} chars (objetivo 120-145)`);

  push("meta_sin_elipsis", "hard", !/(\.\.\.|…)/.test(meta), meta.includes("…") ? "contiene elipsis" : undefined);

  const minWords = input.minWords ?? 350;
  push("contenido_minimo", "hard", words >= minWords, `${words} palabras (minimo ${minWords})`);

  // Estación prohibida en cualquier sitio visible. Este es el check que
  // habría parado los ocho artículos de otoño publicados el 1 de septiembre.
  const surfaces = [title, seoTitle, meta, article.slug || "", plain.slice(0, 400)].join(" ").toLowerCase();
  const surfacesFlat = stripAccents(surfaces);
  const badSeason = temporal.forbiddenSeasons.find((s) => surfacesFlat.includes(stripAccents(s)));
  push("estacion_coherente", "hard", !badSeason, badSeason ? `menciona ${badSeason} estando en ${temporal.season}` : undefined);

  // Duplicado real: se compara el TÍTULO final, no solo el enunciado interno.
  const dup = isTooSimilar(title, previousTitles);
  push("no_duplicado", "hard", !dup.similar, dup.similar ? `similar a "${dup.matched}"` : undefined);

  // HTML mínimamente sano.
  const openTags = (content.match(/<(p|h2|h3|ul|ol|li|table)\b/gi) || []).length;
  const closeTags = (content.match(/<\/(p|h2|h3|ul|ol|li|table)>/gi) || []).length;
  push("html_equilibrado", "hard", Math.abs(openTags - closeTags) <= 2, `${openTags} aperturas / ${closeTags} cierres`);

  if (language === "ca") {
    const found = CASTELLANISMS_CA.filter((w) => plain.toLowerCase().includes(w));
    push("catalan_sin_castellanismos", "hard", found.length === 0, found.length ? found.join(", ") : undefined);
  }

  // --- BLANDOS: se registran, no bloquean ------------------------------

  // Construcciones, no palabras sueltas. Medido sobre los 24 artículos del
  // 1-09-2026: "esencial" o "fundamental" a secas dan falsos positivos
  // constantes en salud ("aminoácidos esenciales", "etapas vitales"). Lo que
  // sí delata al modelo es la construcción completa.
  const aiPatterns = [
    "en la era digital", "en el mundo actual", "hoy en dia", "en el panorama",
    "es imperativo", "vision holistica", "columna vertebral",
    "en ultima instancia", "en resumen,", "en definitiva", "en conclusion",
    "sin esfuerzo", "es fundamental ", "es esencial ", "pilar fundamental",
    "juega un papel", "cabe destacar", "es importante senalar",
  ];
  const aiHits = aiPatterns.filter((p) => stripAccents(plain.toLowerCase()).includes(stripAccents(p)));
  push("sin_patrones_ia", "soft", aiHits.length < 3, aiHits.length ? aiHits.join(", ") : undefined);

  // Terminología científica corrompida por softenEmptyAdjectives: sustituye
  // "esencial" por "necesario/básico" sin mirar el contexto y convierte
  // "ácidos grasos esenciales" en "ácidos grasos necesarios". Confirmado en
  // 2 artículos reales (Bujanda, Esglesia). Check duro: en YMYL es un error
  // de contenido, no de estilo.
  // "necesarios" solo cuenta si no va seguido de "para": "nutrientes
  // necesarios para un folículo sano" es castellano legítimo; "ácidos grasos
  // necesarios y otros extractos" es una sustitución que rompió el término.
  const corrupted =
    /(aceites?|amino[aá]cidos?|[aá]cidos? grasos?|nutrientes?|minerales?|oligoelementos?)\s+(?:(?:b[aá]sic[oa]s?|principales?|primordiales?|centrales?|determinantes?)|necesari[oa]s?(?!\s+para))/i.exec(
      plain,
    );
  push("terminologia_intacta", "hard", !corrupted, corrupted ? corrupted[0] : undefined);

  const externalLinks = (content.match(/<a\s[^>]*href="https?:\/\//gi) || []).length;
  push("enlaces_externos", "soft", externalLinks >= 1, `${externalLinks} enlaces`);

  const bullets = (content.match(/<li\b/gi) || []).length;
  push("bullets_razonables", "soft", bullets <= 25, `${bullets} bullets`);

  push("h2_suficientes", "soft", (content.match(/<h2\b/gi) || []).length >= 3, undefined);

  // --- VEREDICTO --------------------------------------------------------
  const failedHard = checks.filter((c) => c.level === "hard" && !c.ok).map((c) => c.id);
  const total = checks.length;
  const passed = checks.filter((c) => c.ok).length;

  return {
    status: failedHard.length === 0 ? "passed" : "held",
    score: Math.round((passed / total) * 100),
    checks,
    failedHard,
    checkedAt: new Date().toISOString(),
  };
}

// Resumen en una línea para logs y para el email del batch.
export function verdictSummary(v: QualityVerdict): string {
  return v.status === "passed"
    ? `OK (${v.score}/100)`
    : `RETENIDO (${v.score}/100) — falla: ${v.failedHard.join(", ")}`;
}
