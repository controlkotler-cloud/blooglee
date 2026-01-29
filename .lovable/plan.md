

# Plan: Corregir Lógica de Generación para Frecuencias Diaria/Semanal

## Problema Identificado

El cron `generate-monthly-articles` tiene una **inconsistencia crítica**:

| Componente | Qué hace | Correcto? |
|------------|----------|-----------|
| `shouldGenerateForEntity()` | Verifica por día/semana/mes según frecuencia | ✅ |
| Upsert al guardar | SIEMPRE busca por `month/year` | ❌ |

### Consecuencia del Bug

Para una empresa con `publish_frequency: 'daily'`:
- Día 26: Genera artículo → INSERT (OK)
- Día 27: `shouldGenerateForEntity` dice "no hay artículo hoy" → genera
- Día 27: Upsert busca `month=1, year=2026` → **SOBRESCRIBE el artículo del día 26** ❌

**El artículo del día anterior se pierde.**

Para una empresa con `publish_frequency: 'monthly'`:
- Funciona correctamente (un artículo por mes)

---

## Solución

### Regla de negocio correcta:

| Frecuencia | Lógica de upsert |
|------------|------------------|
| `daily` | Buscar por `day_of_month + month + year` (o `generated_at >= hoy`) |
| `weekly` | Buscar por `week_of_month + month + year` |
| `monthly` | Buscar por `month + year` |

### Cambios en `generate-monthly-articles/index.ts`

**Para Empresas (~líneas 893-900):**

```typescript
// ANTES (incorrecto):
const { data: existingArticle } = await supabase
  .from("articulos_empresas")
  .select("id")
  .eq("empresa_id", empresa.id)
  .eq("month", currentMonth)
  .eq("year", currentYear)
  .maybeSingle();

// DESPUÉS (correcto):
let existingArticleQuery = supabase
  .from("articulos_empresas")
  .select("id")
  .eq("empresa_id", empresa.id);

if (empresa.publish_frequency === 'daily') {
  // Para diario: buscar artículo de HOY específicamente
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  existingArticleQuery = existingArticleQuery.gte("generated_at", todayStart.toISOString());
} else if (empresa.publish_frequency === 'weekly') {
  // Para semanal: buscar artículo de ESTA SEMANA
  existingArticleQuery = existingArticleQuery
    .eq("week_of_month", Math.ceil(now.getDate() / 7))
    .eq("month", currentMonth)
    .eq("year", currentYear);
} else {
  // Para mensual: buscar artículo de ESTE MES
  existingArticleQuery = existingArticleQuery
    .eq("month", currentMonth)
    .eq("year", currentYear);
}

const { data: existingArticle } = await existingArticleQuery.maybeSingle();
```

**Para Sites SaaS (~líneas 1144-1151):**

Aplicar la misma lógica usando `site.publish_frequency`.

---

## También corregir: generate-article-saas (manual)

El hook manual del SaaS hace INSERT directo sin verificación:

```typescript
// Línea 872-876 en generate-article-saas/index.ts
const { data: savedArticle, error: saveError } = await supabase
  .from('articles')
  .insert(articleData)  // ❌ Sin upsert
  .select()
  .single();
```

### Corrección:

```typescript
// Verificar si ya existe artículo para hoy (o este mes según frecuencia)
const { data: site } = await supabase
  .from('sites')
  .select('publish_frequency')
  .eq('id', siteId)
  .single();

let existingQuery = supabase.from('articles').select('id').eq('site_id', siteId);

if (site?.publish_frequency === 'daily') {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  existingQuery = existingQuery.gte('generated_at', todayStart.toISOString());
} else {
  existingQuery = existingQuery.eq('month', month).eq('year', year);
}

const { data: existing } = await existingQuery.maybeSingle();

if (existing) {
  // Actualizar
  await supabase.from('articles').update(articleData).eq('id', existing.id);
} else {
  // Insertar
  await supabase.from('articles').insert(articleData);
}
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-monthly-articles/index.ts` | Upsert inteligente según frecuencia (empresas y sites) |
| `supabase/functions/generate-article-saas/index.ts` | Añadir upsert según frecuencia |

---

## Resultado Esperado

| Frecuencia | Comportamiento |
|------------|----------------|
| `daily` | Un artículo nuevo cada día, regenerar el mismo día actualiza |
| `weekly` | Un artículo nuevo cada semana, regenerar la misma semana actualiza |
| `monthly` | Un artículo nuevo cada mes, regenerar el mismo mes actualiza |

- **MKPro (mkpro con daily)**: Cada día genera un artículo nuevo, sin sobrescribir los anteriores
- **Blooglee SaaS**: Mismo comportamiento según la frecuencia configurada del site
- **Farmacias**: Mantiene comportamiento actual (primer lunes del mes)

---

## Resumen de la Corrección

1. **Cron `generate-monthly-articles`**: Upsert inteligente según frecuencia
2. **Manual `generate-article-saas`**: Añadir upsert para evitar duplicados al regenerar
3. **NO tocar farmacias**: Su lógica especial del primer lunes se mantiene igual

