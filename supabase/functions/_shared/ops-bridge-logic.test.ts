import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validarCambios,
  proximoPrevisto,
  mergeFallos,
  moldearSitio,
  fechaMadrid,
} from "./ops-bridge-logic.ts";

const ok = (c: Record<string, unknown>) => validarCambios(c);

test("validarCambios: campos buenos", () => {
  const r = ok({
    publish_frequency: "weekly",
    publish_day_of_month: 15,
    publish_hour: 9,
    tone: "cercano",
    avoid_topics: [" a ", "", "b"],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.valores, {
      publish_frequency: "weekly",
      publish_day_of_month: 15,
      publish_hour_utc: 9,
      tone: "cercano",
      avoid_topics: ["a", "b"],
    });
  }
});

test("validarCambios: vacío y desconocido", () => {
  const v = ok({});
  assert.equal(v.ok, false);
  const u = ok({ nombre: "x" });
  assert.equal(u.ok, false);
  if (!u.ok) assert.match(u.error, /nombre/);
  assert.equal(validarCambios(null).ok, false);
  assert.equal(validarCambios([1]).ok, false);
});

test("validarCambios: valores malos nombran el campo", () => {
  const malos: Record<string, unknown>[] = [
    { publish_frequency: "daily" },
    { publish_day_of_month: 0 },
    { publish_day_of_month: 29 },
    { publish_day_of_month: 1.5 },
    { publish_day_of_month: "5" },
    { publish_hour: 5 },
    { publish_hour: 23 },
    { tone: 3 },
    { tone: "x".repeat(201) },
    { avoid_topics: "a" },
    { avoid_topics: Array(21).fill("a") },
    { avoid_topics: ["x".repeat(81)] },
    { avoid_topics: [1] },
  ];
  for (const m of malos) {
    const r = ok(m);
    assert.equal(r.ok, false, JSON.stringify(m));
    if (!r.ok) assert.ok(r.error.includes(Object.keys(m)[0]), r.error);
  }
});

test("validarCambios: límites aceptados", () => {
  assert.equal(ok({ publish_day_of_month: 1 }).ok, true);
  assert.equal(ok({ publish_day_of_month: 28 }).ok, true);
  assert.equal(ok({ publish_hour: 6 }).ok, true);
  assert.equal(ok({ publish_hour: 22 }).ok, true);
  assert.equal(ok({ tone: "x".repeat(200) }).ok, true);
  assert.equal(ok({ avoid_topics: [] }).ok, true);
});

const base = { auto_generate: true, publish_frequency: "monthly", publish_day_of_month: 10 };
const d = (s: string) => new Date(s);

test("fechaMadrid", () => {
  assert.deepEqual(fechaMadrid(d("2026-10-20T10:00:00Z")), { year: 2026, month: 10, day: 20 });
  // 23:30 UTC del 31 ya es 1 de noviembre en Madrid (UTC+1)
  assert.deepEqual(fechaMadrid(d("2026-10-31T23:30:00Z")), { year: 2026, month: 11, day: 1 });
});

test("proximoPrevisto: artículo este mes -> mes siguiente", () => {
  assert.equal(proximoPrevisto(base, true, d("2026-10-20T10:00:00Z")), "2026-11-10");
});
test("proximoPrevisto: sin artículo, día pasado -> hoy", () => {
  assert.equal(proximoPrevisto(base, false, d("2026-10-20T10:00:00Z")), "2026-10-20");
});
test("proximoPrevisto: sin artículo, día hoy -> hoy", () => {
  assert.equal(proximoPrevisto(base, false, d("2026-10-10T10:00:00Z")), "2026-10-10");
});
test("proximoPrevisto: sin artículo, día futuro -> ese día", () => {
  assert.equal(proximoPrevisto({ ...base, publish_day_of_month: 25 }, false, d("2026-10-20T10:00:00Z")), "2026-10-25");
});
test("proximoPrevisto: no mensual o sin día o sin auto -> null", () => {
  const n = d("2026-10-20T10:00:00Z");
  assert.equal(proximoPrevisto({ ...base, publish_frequency: "weekly" }, false, n), null);
  assert.equal(proximoPrevisto({ ...base, publish_day_of_month: null }, false, n), null);
  assert.equal(proximoPrevisto({ ...base, auto_generate: false }, false, n), null);
});
test("proximoPrevisto: diciembre -> enero", () => {
  assert.equal(proximoPrevisto(base, true, d("2026-12-15T10:00:00Z")), "2027-01-10");
});

test("mergeFallos: ordena por fecha desc y limita a 5", () => {
  const logs = Array.from({ length: 4 }, (_, i) => ({
    action_type: "autopublish_failed",
    description: `l${i}`,
    created_at: `2026-10-0${i + 1}T00:00:00Z`,
  }));
  const sin = [
    { titulo: "A", generado_en: "2026-10-09T00:00:00Z" },
    { titulo: "B", generado_en: "2026-09-30T00:00:00Z" },
  ];
  const r = mergeFallos(logs, sin);
  assert.equal(r.length, 5);
  assert.equal(r[0].tipo, "sin_publicar");
  assert.equal(r[0].fecha, "2026-10-09T00:00:00Z");
  assert.equal(r[1].descripcion, "l3");
  assert.deepEqual(mergeFallos([], []), []);
});

test("moldearSitio: forma, último post y sin_publicar", () => {
  const now = d("2026-10-20T10:00:00Z");
  const site = {
    id: "s1", name: "Farm", blog_url: "https://x", auto_generate: true,
    publish_frequency: "monthly", publish_day_of_month: 10, publish_hour_utc: 9,
    tone: "t", avoid_topics: ["a"],
  };
  const arts = [
    { topic: "Tema", title: null, wp_post_url: null, generated_at: "2026-10-10T08:00:00Z", generation_source: "scheduled", month: 10, year: 2026 },
    { topic: "Viejo", title: "Título viejo", wp_post_url: "https://x/v", generated_at: "2026-09-10T08:00:00Z", generation_source: "scheduled", month: 9, year: 2026 },
  ];
  const s = moldearSitio(site, arts, [], now);
  assert.equal(s.id, "s1");
  assert.equal(s.nombre, "Farm");
  assert.equal(s.publish_hour, 9);
  assert.deepEqual(s.ultimo_post, { titulo: "Tema", url: null, generado_en: "2026-10-10T08:00:00Z", publicado: false });
  assert.equal(s.proximo_previsto, "2026-11-10");
  assert.equal(s.fallos.length, 1);
  assert.equal(s.fallos[0].tipo, "sin_publicar");
  const vacio = moldearSitio(site, [], [], now);
  assert.equal(vacio.ultimo_post, null);
  assert.equal(vacio.proximo_previsto, "2026-10-20");
});
