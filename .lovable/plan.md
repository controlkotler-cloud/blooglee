
# ✅ COMPLETADO: Corregir Lógica de Generación para Frecuencias Diaria/Semanal

## Problema Resuelto

El cron `generate-monthly-articles` y la función manual `generate-article-saas` tenían una inconsistencia crítica que provocaba sobrescritura de artículos para frecuencias diarias/semanales.

## Cambios Implementados

### 1. `generate-monthly-articles/index.ts` - Empresas (~línea 893)
```typescript
// NUEVO: Upsert inteligente según frecuencia
if (empresa.publish_frequency === 'daily') {
  // Buscar artículo de HOY
  existingArticleQuery = existingArticleQuery.gte("generated_at", todayStart.toISOString());
} else if (empresa.publish_frequency === 'weekly') {
  // Buscar artículo de ESTA SEMANA
  existingArticleQuery = existingArticleQuery.eq("week_of_month", weekNum).eq("month", month).eq("year", year);
} else {
  // Buscar artículo de ESTE MES
  existingArticleQuery = existingArticleQuery.eq("month", month).eq("year", year);
}
```

### 2. `generate-monthly-articles/index.ts` - SaaS Sites (~línea 1144)
Misma lógica aplicada para `site.publish_frequency`.

### 3. `generate-article-saas/index.ts` (~línea 855)
Añadido upsert inteligente basado en `site.publish_frequency` para la generación manual.

## Resultado

| Frecuencia | Comportamiento |
|------------|----------------|
| `daily` | Un artículo nuevo cada día. Regenerar el mismo día → actualiza |
| `weekly` | Un artículo nuevo cada semana. Regenerar la misma semana → actualiza |
| `monthly` | Un artículo nuevo cada mes. Regenerar el mismo mes → actualiza |

- ✅ MKPro Empresas con `daily`: Cada día genera artículo nuevo
- ✅ Blooglee SaaS: Respeta la frecuencia configurada del site
- ✅ Farmacias: Mantiene lógica especial (primer lunes del mes)
- ✅ No más errores de "duplicate key"
- ✅ No más sobrescrituras accidentales
