
# Plan: Arreglar la generación automática del blog de Blooglee

## Diagnóstico del problema

Los cron jobs se ejecutaron correctamente esta mañana a las 09:15 y 09:17 UTC, pero la Edge Function `generate-blog-blooglee` falló silenciosamente por un desajuste entre lo que el cron envía y lo que la función espera.

| Componente | Envía/Espera | Valor |
|------------|--------------|-------|
| Cron job | `audience` | `"empresas"` (minúsculas) |
| Edge Function | `category` | `"Empresas"` (capitalizado) |

**Error devuelto:** `Invalid category. Must be 'Empresas' or 'Agencias'`

## Solución propuesta

Modificar la Edge Function para aceptar **ambos formatos** (retrocompatibilidad) y normalizar la entrada:

1. Aceptar tanto `audience` como `category` en el body
2. Normalizar mayúsculas/minúsculas automáticamente

## Cambios requeridos

### Archivo: `supabase/functions/generate-blog-blooglee/index.ts`

**Líneas 612-616** - Cambiar la extracción y validación:

```typescript
// ANTES
const { category, force, forceThematicCategory } = await req.json();

if (!category || !['Empresas', 'Agencias'].includes(category)) {
  throw new Error("Invalid category. Must be 'Empresas' or 'Agencias'");
}

// DESPUÉS
const body = await req.json();
// Accept both 'category' and 'audience' (for backward compatibility with cron jobs)
const rawCategory = body.category || body.audience;
const force = body.force;
const forceThematicCategory = body.forceThematicCategory;

// Normalize: accept lowercase and capitalize
const normalizeCategory = (cat: string): string => {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  if (lower === 'empresas') return 'Empresas';
  if (lower === 'agencias') return 'Agencias';
  return cat;
};

const category = normalizeCategory(rawCategory);

if (!category || !['Empresas', 'Agencias'].includes(category)) {
  throw new Error("Invalid category. Must be 'Empresas' or 'Agencias'");
}
```

## Resultado esperado

Tras este cambio:
- Los cron jobs existentes funcionarán sin modificaciones
- La función aceptará `audience` o `category`
- La función aceptará `empresas`, `Empresas`, `EMPRESAS`, etc.
- Se generarán los 2 posts del blog de hoy al ejecutar manualmente

## Pasos post-implementación

1. Desplegar la Edge Function
2. Ejecutar manualmente para generar los posts de hoy:
   - `POST /generate-blog-blooglee` con `{"audience": "empresas"}`
   - `POST /generate-blog-blooglee` con `{"audience": "agencias"}`
3. Verificar que los posts aparecen en `/blog`
4. La newsletter del día siguiente incluirá estos posts
