

## Corregir la generacion fallida de farmapro: JSON truncado por max_tokens insuficiente

### Problema identificado

El scheduler ejecuto correctamente la generacion para farmapro a las 09:00 UTC, pero la Edge Function `generate-article-saas` fallo con este error:

```
SyntaxError: Expected ',' or '}' after property value in JSON at position 12222
Error: Failed to parse Spanish article JSON
```

Esto NO es el bug de placeholders (ese ya esta corregido). Es un problema diferente: **el articulo se trunca porque `max_tokens: 8000` es insuficiente para articulos largos**.

### Causa raiz

- Farmapro tiene `preferred_length: long` (2500 palabras)
- El contenido HTML de 2500 palabras, envuelto en un objeto JSON con campos como title, seo_title, meta_description, excerpt, slug, focus_keyword y content, puede requerir 12,000-16,000 tokens
- La funcion usa `max_tokens: 8000` fijo para todos los articulos, sin importar la longitud
- El modelo genera contenido hasta que llega al limite de tokens, cortando el JSON a mitad, produciendo JSON invalido
- El sistema de reparacion (escapeControlCharsInsideStrings) no puede arreglar JSON truncado, solo caracteres de control

### Solucion

#### Cambio 1: max_tokens dinamico segun preferred_length

En `generate-article-saas/index.ts`, cambiar el `max_tokens: 8000` fijo por un valor calculado:

- `short` (800 palabras): 6000 tokens
- `medium` (1500 palabras): 10000 tokens  
- `long` (2500 palabras): 16000 tokens

Esto se implementara anadiendo `tokens` al objeto `LENGTH_TARGETS` y usandolo en la llamada a la API.

#### Cambio 2: Retry con deteccion de JSON truncado

Anadir logica para detectar cuando el JSON esta truncado (el error contiene "Expected ',' or '}'" o el contenido no termina en `}`) y reintentar con max_tokens incrementado (+4000).

Maximo un reintento para evitar bucles infinitos.

#### Cambio 3: Aplicar lo mismo a catalan

La generacion en catalan tambien usa `max_tokens: 8000` fijo. Aplicar la misma logica dinamica.

### Archivos afectados

- `supabase/functions/generate-article-saas/index.ts`
  - Modificar `LENGTH_TARGETS` para incluir tokens recomendados
  - Actualizar las llamadas a la API de generacion espanol y catalan para usar tokens dinamicos
  - Anadir retry para JSON truncado

### Secuencia

1. Actualizar LENGTH_TARGETS con campo `maxTokens`
2. Usar `lengthTarget.maxTokens` en las llamadas a la API
3. Anadir deteccion de truncamiento + retry
4. Desplegar la funcion actualizada

