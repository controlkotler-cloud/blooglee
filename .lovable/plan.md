

## Problemas detectados

### Problema 1: El nombre de la marca se usa como palabra comun
La IA esta usando "Farmactur" como si fuera un sinonimo de "farmacia" en la frase "la atencion a la Farmactur se vuelve crucial". Esto ocurre porque el prompt no le dice explicitamente a la IA que el nombre de la empresa es una marca propia y NO debe usarse como sustantivo comun.

**Solucion**: Añadir una instruccion explicita en el prompt del sistema (tanto en la tabla `prompts` de la BD como en el fallback del codigo) indicando que `{{siteName}}` es una marca comercial y NUNCA debe sustituir a sustantivos genericos del sector.

### Problema 2: Se genera doble articulo (con imagen diferente)
Los logs de produccion confirman que la edge function `generate-article-saas` se invoco **DOS veces en el mismo segundo** (10:58:10). La primera creo el articulo, la segunda lo detecto como existente y lo **sobreescribio** con contenido e imagen nuevos (lineas 2407-2420 del edge function).

La causa raiz: el `useEffect` en `GeneratingStep.tsx` con dependencia `[siteId]` puede dispararse dos veces (React StrictMode o re-render rapido). El `generatedRef` no es suficiente si ambas ejecuciones arrancan antes de que la primera termine.

**Solucion**: Añadir una bandera `isGeneratingRef` que se active ANTES de la llamada async, bloqueando cualquier invocacion concurrente.

---

## Cambios tecnicos

### 1. `src/components/onboarding/steps/GeneratingStep.tsx`
- Añadir un `isGeneratingRef` que se ponga a `true` sincronamente antes de llamar a `generateArticle()`
- En el `useEffect`, comprobar `isGeneratingRef.current` ademas de `generatedRef.current`
- Esto evita que dos ejecuciones del effect lancen la funcion en paralelo

### 2. `supabase/functions/generate-article-saas/index.ts`
- En la seccion del prompt del sistema (fallback, lineas ~86-90), añadir una regla explicita:
  > `{{siteName}}` es una MARCA COMERCIAL. Usala SOLO como nombre propio de la empresa, NUNCA como sustantivo comun ni como sustituto de palabras genericas del sector.
- Actualizar tambien la entrada `saas.article.system` en la tabla `prompts` de la BD con la misma regla

### 3. Proteccion adicional contra sobreescritura de imagen
- En la logica de upsert (lineas 2407-2420), cuando se detecta un articulo existente generado hace menos de 60 segundos, **no sobreescribirlo** sino devolver el articulo existente directamente. Esto protege contra invocaciones duplicadas accidentales.

