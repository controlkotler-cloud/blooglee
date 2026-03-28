

# Plan: Eliminar definitivamente la duplicación de párrafos de cierre

## Problema raíz (análisis de los artículos generados hoy)

El pipeline tiene dos fuentes de cierre que se solapan:

1. **La IA genera su propio cierre** con menciones a "blog", "Instagram", "redes" como texto plano (sin `<a>` tags), ignorando la instrucción del prompt "NO escribas un cierre promocional".
2. **`ensureFooterLinks` añade un CTA programático** con enlaces reales al blog y redes sociales en el último párrafo.
3. **`ensureAuthorityLinks` añade un párrafo de fuentes** que luego `ensureFooterLinks` extiende con CTA de blog/redes, creando un segundo cierre.
4. **`finalDeduplicateClosingParagraphs` no detecta** los párrafos de cierre de la IA que mencionan blog/redes como texto plano sin `<a>` tags.

Resultado: 2-3 párrafos finales redundantes con menciones repetidas a blog, Instagram y redes sociales.

## Solución (3 cambios en `generate-article-saas/index.ts`)

### Cambio 1: Limpiar cierres de la IA antes del post-procesado

Crear una función `stripAiGeneratedClosingCta()` que se ejecute **justo después de parsear el JSON** (tras `cleanMarkdownFromHtml`, antes de cualquier link injection). Esta función:

- Busca en el último 30% del contenido párrafos `<p>` cortos (<400 chars) que contengan patrones de cierre de blog/redes SIN `<a>` tags reales (texto plano como "visitar nuestro blog", "seguirnos en Instagram", "nuestras redes sociales")
- Los elimina completamente, ya que el sistema inyectará su propio CTA después
- No toca párrafos que tengan enlaces `<a>` reales (esos son del post-procesado)

### Cambio 2: Mover `ensureAuthorityLinks` DESPUÉS de `ensureFooterLinks` y proteger su párrafo

Reordenar el pipeline para que la autoridad se añada después del CTA, y asegurar que `ensureFooterLinks` no inyecte CTA en el párrafo de autoridad:

```
1. verifyAndCleanExternalLinks
2. ensureFooterLinks (añade CTA al último párrafo del contenido real)
3. ensureAuthorityLinks (añade párrafo de fuentes SEPARADO, sin CTA)
```

Además, modificar `ensureFooterLinks` para que detecte si el último párrafo es un párrafo de autoridad ("Para ampliar información, consulta...") y en ese caso aplique el CTA al **penúltimo** párrafo.

### Cambio 3: Reforzar `finalDeduplicateClosingParagraphs` para detectar cierres sin links

Ampliar la detección de párrafos de cierre duplicados para que también capture párrafos que mencionan "blog", "instagram", "redes sociales" como texto plano, no solo los que tienen `<a>` tags. Si hay múltiples párrafos de cierre, conservar SOLO el que tenga `<a>` tags reales a blog/redes, eliminando los de texto plano.

### Cambio 4: Actualizar prompt en BD y código

Reforzar la instrucción en `saas.article.system` y `saas.article.user` (tanto en la BD como en `FALLBACK_PROMPTS`):

- Cambiar de "NO escribas un cierre promocional de blog/redes en el contenido" a:
  "PROHIBIDO: NO escribas ningún párrafo final que mencione blog, redes sociales, Instagram o que invite a visitar/seguir canales. El sistema lo añade automáticamente. Si lo incluyes, se generará duplicado."

## Archivos afectados

- `supabase/functions/generate-article-saas/index.ts` — nueva función + reordenar pipeline + reforzar dedup
- Migración SQL — actualizar prompts `saas.article.system` y `saas.article.user` en la tabla `prompts` + bump `prompt_cache_version`

## Resultado esperado

Un único párrafo de cierre al final con enlaces reales a blog y redes sociales, seguido opcionalmente de un párrafo de fuentes de autoridad sin CTA. Sin duplicados ni menciones redundantes.

