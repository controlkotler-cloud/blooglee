

## Correcciones al Master Prompt - 4 bugs detectados

### Problema 1: WordPress topics no se usan para evitar repeticiones
**Diagnostico**: Los topics de WordPress SI se cargan (hay 10 topics sincronizados en farmapro), y SI se incluyen en la variable `{{usedTopics}}` del prompt de generacion de tema. El sistema funciona correctamente en el codigo (lineas 1122-1133). Sin embargo, solo se pasan los primeros 5 topics de WP al prompt como "temas recientes del blog" (`wpRecentTopics`), lo cual es poco. Ademas, en la seccion `{{usedTopics}}` solo se muestran 40 de los combinados.

**Solucion**: Aumentar la visibilidad de los topics WP en el prompt:
- Cambiar `slice(0, 5)` a `slice(0, 15)` para mostrar mas temas recientes del WP
- Aumentar el limite de 40 a 60 en la lista combinada de temas a evitar

**Archivo**: `supabase/functions/generate-article-saas/index.ts` (linea 1086 y 1137)

---

### Problema 2: Enlaces externos no funcionan
**Diagnostico**: Los enlaces externos dependen 100% de la IA. El prompt dice "Si conoces la URL EXACTA, usala. Si NO, enlaza SOLO a la homepage del dominio". El problema es que la IA inventa URLs que no existen. Hay una funcion `verifyAndCleanExternalLinks` (linea 836) que deberia validarlos y reemplazar los rotos por la homepage del dominio, pero necesito verificar si se esta llamando correctamente.

**Solucion**: 
- Verificar que `verifyAndCleanExternalLinks` se ejecuta sobre el contenido final
- Reforzar el prompt para que la IA use SIEMPRE la homepage del dominio (ej: `https://www.who.int`) en vez de inventar URLs profundas
- Actualizar el prompt en la BD

**Archivo**: `supabase/functions/generate-article-saas/index.ts` + UPDATE en tabla `prompts`

---

### Problema 3: Frase final usa sector en vez de nombre y muestra URLs en crudo
**Diagnostico**: El prompt en la BD (lineas 97-103) tiene estos ejemplos:
```
"Para mas consejos de {{sector}}, visita {{blogUrl}}"
"Si te ha gustado, siguenos en {{instagramUrl}} para mas contenido"
```
Dos problemas claros:
1. Usa `{{sector}}` ("consultoria de marketing para farmacias") en vez de `{{siteName}}` ("farmapro")
2. Las URLs se muestran como texto plano (https://farmapro.es/blog/) en vez de como enlaces HTML con texto ancla legible ("nuestro blog", "nuestras redes sociales")

**Solucion**: Reescribir la seccion FRASE FINAL del prompt para:
- Usar `{{siteName}}` en vez de `{{sector}}`
- Instruir que los enlaces se presenten con texto ancla descriptivo, NO como URL cruda
- Ejemplos corregidos:
  * "Visita el <a href='{{blogUrl}}'>blog de {{siteName}}</a> para mas contenido como este"
  * "Siguenos en <a href='{{instagramUrl}}'>nuestras redes sociales</a> para estar al dia"

**Archivo**: UPDATE en tabla `prompts` (key `saas.article.system`)

---

### Problema 4: Meta description en espanol truncada con "..."
**Diagnostico**: En la linea 1488 del codigo, si la meta description supera 145 caracteres se trunca asi:
```javascript
spanishArticle.meta_description.substring(0, 142) + '...';
```
Esto produce una meta description cortada artificialmente que se ve incompleta.

**Solucion**: Cambiar la logica de truncado para:
- Genera una metadescripción de 145 caracteres o menos, sin recortar
- NO anadir "..."

**Archivo**: `supabase/functions/generate-article-saas/index.ts` (linea 1488)

---

### Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-article-saas/index.ts` | Linea 1086: slice(0,15). Linea 1137: limite 60. Linea 1488: truncado inteligente por palabra. Verificar llamada a verifyAndCleanExternalLinks |
| Tabla `prompts` (BD) | UPDATE key `saas.article.system`: reescribir seccion FRASE FINAL con siteName y enlaces HTML con ancla. Reforzar seccion ENLACES EXTERNOS para usar solo homepages |

