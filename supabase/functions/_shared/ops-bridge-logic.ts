// Lógica pura de ops-bridge (sin APIs de Deno ni imports): corre también bajo Node.

export const FRECUENCIAS = ["monthly", "biweekly", "weekly"];
export const ACCIONES_FALLO = [
  "autopublish_failed",
  "autopublish_reconcile_failed",
  "autopublish_ca_failed",
  "quality_hold",
];
const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_FALLOS = 5;

export type Valores = Record<string, unknown>;
export type Validacion = { ok: true; valores: Valores } | { ok: false; error: string };

export function validarCambios(cambios: unknown): Validacion {
  if (cambios === null || typeof cambios !== "object" || Array.isArray(cambios)) {
    return { ok: false, error: "cambios debe ser un objeto" };
  }
  const entradas = Object.entries(cambios as Record<string, unknown>);
  if (entradas.length === 0) return { ok: false, error: "cambios está vacío" };
  const valores: Valores = {};
  for (const [k, v] of entradas) {
    switch (k) {
      case "publish_frequency":
        if (typeof v !== "string" || !FRECUENCIAS.includes(v)) {
          return { ok: false, error: "publish_frequency debe ser monthly, biweekly o weekly" };
        }
        valores.publish_frequency = v;
        break;
      case "publish_day_of_month":
        if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 28) {
          return { ok: false, error: "publish_day_of_month debe ser un entero entre 1 y 28" };
        }
        valores.publish_day_of_month = v;
        break;
      case "publish_hour":
        if (typeof v !== "number" || !Number.isInteger(v) || v < 6 || v > 22) {
          return { ok: false, error: "publish_hour debe ser un entero entre 6 y 22" };
        }
        valores.publish_hour_utc = v;
        break;
      case "tone":
        if (typeof v !== "string" || v.length > 200) {
          return { ok: false, error: "tone debe ser texto de 200 caracteres como máximo" };
        }
        valores.tone = v;
        break;
      case "avoid_topics": {
        if (!Array.isArray(v) || v.length > 20) {
          return { ok: false, error: "avoid_topics debe ser una lista de 20 elementos como máximo" };
        }
        const limpio: string[] = [];
        for (const t of v) {
          if (typeof t !== "string") return { ok: false, error: "avoid_topics solo admite textos" };
          const s = t.trim();
          if (s.length > 80) return { ok: false, error: "avoid_topics: cada tema admite 80 caracteres como máximo" };
          if (s) limpio.push(s);
        }
        valores.avoid_topics = limpio;
        break;
      }
      default:
        return { ok: false, error: `campo no permitido: ${k}` };
    }
  }
  return { ok: true, valores };
}

export function fechaMadrid(now: Date): { year: number; month: number; day: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(partes.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface SitioFila {
  id: string;
  name: string;
  blog_url: string | null;
  auto_generate: boolean | null;
  publish_frequency: string | null;
  publish_day_of_month: number | null;
  publish_hour_utc: number | null;
  tone: string | null;
  avoid_topics: string[] | null;
}

export function proximoPrevisto(
  site: Pick<SitioFila, "auto_generate" | "publish_frequency" | "publish_day_of_month">,
  hayArticuloEsteMes: boolean,
  now: Date,
): string | null {
  const dia = site.publish_day_of_month;
  if (!site.auto_generate || site.publish_frequency !== "monthly" || dia === null || dia === undefined) {
    return null;
  }
  const hoy = fechaMadrid(now);
  if (hayArticuloEsteMes) {
    const y = hoy.month === 12 ? hoy.year + 1 : hoy.year;
    const m = hoy.month === 12 ? 1 : hoy.month + 1;
    return `${y}-${pad(m)}-${pad(dia)}`;
  }
  if (dia <= hoy.day) return `${hoy.year}-${pad(hoy.month)}-${pad(hoy.day)}`;
  return `${hoy.year}-${pad(hoy.month)}-${pad(dia)}`;
}

export interface Fallo {
  tipo: string;
  descripcion: string;
  fecha: string;
}

export function mergeFallos(
  logs: { action_type: string; description: string | null; created_at: string }[],
  sinPublicar: { titulo: string; generado_en: string }[],
  max = MAX_FALLOS,
): Fallo[] {
  const todos: Fallo[] = [
    ...logs.map((l) => ({ tipo: l.action_type, descripcion: l.description ?? "", fecha: l.created_at })),
    ...sinPublicar.map((a) => ({
      tipo: "sin_publicar",
      descripcion: `Artículo "${a.titulo}" generado y sin publicar`,
      fecha: a.generado_en,
    })),
  ];
  todos.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
  return todos.slice(0, max);
}

export interface ArticuloFila {
  id?: string;
  topic: string | null;
  title: string | null;
  wp_post_url: string | null;
  generated_at: string;
  generation_source: string | null;
  month: number | null;
  year: number | null;
}

export function moldearSitio(
  site: SitioFila,
  articulos: ArticuloFila[],
  logs: {
    action_type: string;
    description: string | null;
    created_at: string;
    metadata?: { article_id?: string } | null;
  }[],
  now: Date,
) {
  // Un fallo cuyo artículo acabó publicado (reintento o reconciliador) ya no es un fallo.
  const publicados = new Set(articulos.filter((a) => a.id && a.wp_post_url).map((a) => a.id));
  const vigentes = logs.filter((l) => !publicados.has(l.metadata?.article_id));
  const ordenados = [...articulos].sort((a, b) => Date.parse(b.generated_at) - Date.parse(a.generated_at));
  const tituloDe = (a: ArticuloFila) => a.title || a.topic || "";
  const ultimo = ordenados[0];
  // Mes en UTC, igual que generate-scheduler al decidir si el mes ya tiene artículo.
  const hayEsteMes = ordenados.some((a) => a.month === now.getUTCMonth() + 1 && a.year === now.getUTCFullYear());
  const desde60 = now.getTime() - 60 * DIA_MS;
  const hace2h = now.getTime() - 2 * 60 * 60 * 1000;
  const sinPublicar = ordenados
    .filter((a) => {
      const t = Date.parse(a.generated_at);
      return a.generation_source === "scheduled" && !a.wp_post_url && t < hace2h && t >= desde60;
    })
    .map((a) => ({ titulo: tituloDe(a), generado_en: a.generated_at }));
  return {
    id: site.id,
    nombre: site.name,
    blog_url: site.blog_url,
    auto_generate: site.auto_generate,
    publish_frequency: site.publish_frequency,
    publish_day_of_month: site.publish_day_of_month,
    publish_hour: site.publish_hour_utc,
    tone: site.tone,
    avoid_topics: site.avoid_topics ?? [],
    ultimo_post: ultimo
      ? {
        titulo: tituloDe(ultimo),
        url: ultimo.wp_post_url,
        generado_en: ultimo.generated_at,
        publicado: !!ultimo.wp_post_url,
      }
      : null,
    proximo_previsto: proximoPrevisto(site, hayEsteMes, now),
    fallos: mergeFallos(vigentes, sinPublicar),
  };
}
