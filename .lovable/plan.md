
# Plan: Mejorar el sistema de fallback de imagenes cuando falla la IA

## El problema actual

Cuando la generacion de imagen con IA falla (que ocurre con cierta frecuencia segun los logs), el sistema cae en este flujo:

1. Intenta generar imagen con IA (google/gemini-3-pro-image-preview) -- FALLA
2. Busca en Unsplash con `sectorContext.fallbackQuery` -- pero el sector "farmacia" no existe en `SECTOR_IMAGE_CONTEXTS`, asi que usa el query generico `"professional business success modern"` -- resultado: chica delante de un ordenador
3. Si Unsplash tambien falla, usa `FALLBACK_IMAGES` hardcodeadas (3 fotos genericas de oficina)

El resultado: imagenes completamente irrelevantes para el contenido del articulo.

## Solucion propuesta (3 mejoras)

### 1. Reintentar la generacion con IA antes de ir a Unsplash

En lugar de abandonar la IA al primer fallo, implementar hasta 2 reintentos con el modelo de imagen. Esto reduce drasticamente la probabilidad de caer en Unsplash.

```
Intento 1: google/gemini-3-pro-image-preview (actual)
   |-- fallo --> Intento 2: mismo modelo, prompt simplificado
                    |-- fallo --> Unsplash contextual (mejorado)
                                    |-- fallo --> sin imagen (mejor que una mala)
```

### 2. Completar SECTOR_IMAGE_CONTEXTS con los sectores que faltan

Anadir entradas para `farmacia` y otros sectores detectados por `detectSectorCategory` que no tienen contexto de imagen. Esto mejora las busquedas Unsplash cuando se usan como fallback.

Sectores que faltan en el mapa:
- `farmacia` (se detecta pero no tiene contexto de imagen)

### 3. Usar el topic del articulo como query de Unsplash (en vez del fallback generico)

Cuando se cae a Unsplash, generar un query contextual con IA basado en el topic y sector del articulo, en lugar de usar el `fallbackQuery` generico del sector. Similar a lo que ya hace `regenerate-image`.

### 4. Eliminar las FALLBACK_IMAGES estaticas -- preferir "sin imagen" a "imagen mala"

Si todo falla (IA x2 + Unsplash contextual), es mejor guardar el articulo sin imagen que entregar una foto de oficina genérica a un cliente de farmacia. El articulo sigue siendo valido y el cliente puede regenerar la imagen manualmente desde el dashboard.

## Cambios tecnicos

### Archivo: `supabase/functions/generate-article-saas/index.ts`

**A. Anadir `farmacia` a `SECTOR_IMAGE_CONTEXTS`** (linea ~661):
```typescript
farmacia: {
  examples: ["pharmacy shelves products wellness", "natural health supplements herbs", "wellness lifestyle healthy products"],
  prohibitedTerms: ["pills closeup", "medicine bottles", "hospital", "surgery", "syringes", "blood"],
  fallbackQuery: "pharmacy wellness natural health products"
},
```

**B. Modificar el bloque de imagen** (lineas ~1971-2112):
- Reintento de IA: si el primer intento falla, esperar 2 segundos y reintentar con un prompt simplificado
- Si la IA falla x2, generar un query contextual con IA para Unsplash (usando topic + sector, como hace `regenerate-image`)
- Si Unsplash falla, guardar el articulo sin imagen (`imageResult = null`) en vez de usar `FALLBACK_IMAGES`
- Eliminar el array `FALLBACK_IMAGES` (o dejarlo solo como ultimo recurso extremo)

**C. Mantener intacto `regenerate-image/index.ts`** (zona protegida MKPro) -- no se toca.

### Archivo: `supabase/functions/generate-blog-blooglee/index.ts`

Aplicar la misma logica de reintento de IA si esta funcion tambien usa el mismo patron de fallback (verificar).

## Lo que NO cambia

- La UI del dashboard (no hay cambios de frontend)
- La base de datos (no hay migraciones)
- El prompt de imagen (ya se actualizo antes)
- Las edge functions protegidas de MKPro
- El flujo de regeneracion manual (`regenerate-image`)

## Resultado esperado

- Los articulos tendran imagen generada por IA en la gran mayoria de casos (2 intentos)
- Si la IA falla definitivamente, la busqueda en Unsplash sera contextual (basada en el topic real, no en un query generico)
- Si todo falla, el articulo se guarda sin imagen en vez de con una foto irrelevante
- El cliente puede regenerar la imagen desde el preview del articulo
