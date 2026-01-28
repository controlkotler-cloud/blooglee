
# Plan: Corregir Fechas y Contenido a 2026

## Problema Identificado

Los 5 posts del blog insertados durante la migración tienen:
1. **Fechas de publicación en enero 2025** (hace 1 año)
2. **Títulos que mencionan "2025"** (3 de 5 posts)

| Slug | Fecha Actual | Año en Título |
|------|--------------|---------------|
| que-es-blooglee | 2025-01-15 | No |
| blooglee-vs-nextblog | 2025-01-14 | Sí (2025) |
| como-automatizar-blog-empresa | 2025-01-13 | Sí (2025) |
| seo-para-pymes-guia-2025 | 2025-01-12 | Sí (2025) |
| ia-generativa-marketing-contenidos | 2025-01-11 | No |

## Solución

### Parte 1: Actualizar datos existentes en la base de datos

Ejecutar SQL para corregir:

```sql
-- Actualizar fechas de publicación a enero 2026
UPDATE blog_posts 
SET published_at = published_at + INTERVAL '1 year'
WHERE published_at < '2026-01-01';

-- Actualizar títulos que mencionan 2025
UPDATE blog_posts 
SET title = REPLACE(title, '2025', '2026'),
    slug = REPLACE(slug, '2025', '2026')
WHERE title LIKE '%2025%' OR slug LIKE '%2025%';

-- Actualizar contenido que mencione 2025 de forma específica
UPDATE blog_posts 
SET content = REPLACE(content, 'en 2025', 'en 2026')
WHERE content LIKE '%en 2025%';
```

### Parte 2: Reforzar el prompt de generación

Modificar `generate-blog-blooglee/index.ts` para añadir restricción explícita sobre el año:

```typescript
const prompt = `...
FECHA REAL: ${dayOfMonth} de ${MONTH_NAMES[currentMonth - 1]} de ${currentYear}

IMPORTANTE:
- El año actual es ${currentYear}, NO menciones años anteriores
- Evita poner el año en títulos (ej: "Guía 2026") - el contenido es atemporal
- Si mencionas fechas, usa ${currentYear}
...`;
```

### Parte 3: Verificar la función de generación futura

El archivo `generate-blog-blooglee/index.ts` ya usa `new Date()` para obtener la fecha actual, lo cual es correcto. Solo necesitamos:

1. Añadir instrucciones más explícitas en el prompt para evitar mencionar años pasados
2. Añadir una restricción de "no poner año en títulos" para contenido evergreen

## Archivos a Modificar

1. **SQL ejecutado manualmente**: Actualizar registros existentes
2. **`supabase/functions/generate-blog-blooglee/index.ts`**: Reforzar prompt con restricciones temporales

## Resultado

| Antes | Después |
|-------|---------|
| Fechas 2025-01-11 a 2025-01-15 | Fechas 2026-01-11 a 2026-01-15 |
| "Comparativa completa 2025" | "Comparativa completa 2026" |
| "blog de tu empresa en 2025" | "blog de tu empresa en 2026" |
| "SEO para PYMEs: Guía 2025" | "SEO para PYMEs: Guía 2026" |
