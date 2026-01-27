

# Plan: Mejorar manejo de errores transitorios en generación de artículos MKPro

## Problema identificado
Cuando la generación de artículos falla en el primer intento pero tiene éxito en el segundo (retry), el usuario ve mensajes de error intermedios que generan confusión, aunque el proceso termine correctamente.

## Causa raíz
El error "No Spanish content received from AI" ocurrió en el primer intento (11:32:57), pero el segundo intento (11:33:11) funcionó perfectamente. El frontend muestra el error del primer intento antes de recibir el éxito del segundo.

## Solución propuesta

### Opcion A: Mejorar el retry interno en la Edge Function (Recomendado)
Añadir un retry automático DENTRO de la edge function cuando falla la generación del contenido en español, antes de devolver error al frontend.

**Archivo a modificar:** `supabase/functions/generate-article/index.ts`

```typescript
// Añadir retry para generación de contenido español
let spanishContent = null;
let retryCount = 0;
const MAX_CONTENT_RETRIES = 2;

while (!spanishContent && retryCount < MAX_CONTENT_RETRIES) {
  try {
    const response = await fetchWithRetry(...);
    spanishContent = parseResponse(response);
  } catch (error) {
    retryCount++;
    console.log(`Spanish content retry ${retryCount}/${MAX_CONTENT_RETRIES}`);
    if (retryCount >= MAX_CONTENT_RETRIES) throw error;
    await new Promise(r => setTimeout(r, 2000)); // esperar 2s antes de reintentar
  }
}
```

### Opcion B: Mejorar feedback en el frontend
Modificar el hook `useGenerateArticle` para no mostrar toasts de error cuando hay reintentos pendientes.

## Cambios técnicos detallados

### 1. Edge Function (`generate-article/index.ts`)
- Añadir variable `MAX_CONTENT_RETRIES = 2`
- Envolver la generación de contenido español en un bucle de retry
- Añadir logging para indicar "Retry X/2 for Spanish content"
- Solo lanzar error si todos los reintentos fallan

### 2. Edge Function (`generate-article-empresa/index.ts`)
- Aplicar la misma lógica de retry para empresas

## Lo que NO cambia
- La lógica de generación de artículos
- El prompt del artículo
- La generación de imágenes con IA (ya funciona bien)
- Los hooks del frontend
- La estructura de respuesta de la API

## Resultado esperado
- Los errores transitorios de la IA se manejan silenciosamente dentro de la edge function
- El usuario solo ve errores si TODOS los reintentos fallan
- Experiencia más fluida sin mensajes de error confusos

## Tiempo estimado
- 15-20 minutos de implementación
- Impacto mínimo, solo afecta al manejo de errores

