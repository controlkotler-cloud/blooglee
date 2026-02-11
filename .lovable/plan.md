

## Ajustes finales al Master Prompt - 3 mejoras

### Problema 1: Meta description se corta en vez de generarse completa

**Causa**: El prompt ya dice "max 145 chars" pero la IA a veces genera mas y el codigo trunca por palabra. El resultado es una frase incompleta.

**Solucion**: Doble refuerzo:
1. En el prompt de la BD (`saas.article.system`), cambiar la instruccion de meta_description para ser mas explicita: "Genera una meta description COMPLETA de entre 120 y 145 caracteres. La frase debe tener sentido completo y NO debe cortarse. Si supera 145, reescribela mas corta."
2. En el user prompt (`saas.article.user`), reforzar: "Meta description: frase COMPLETA entre 120-145 chars, que tenga sentido sin cortes"
3. En el codigo, si aun supera 145, en vez de truncar, regenerar o al menos log un warning. Mantener el truncado inteligente como ultimo recurso pero con un umbral mas agresivo.

**Archivos**: UPDATE en tabla `prompts` (keys `saas.article.system` y `saas.article.user`) + `supabase/functions/generate-article-saas/index.ts`

---

### Problema 2: Falta el enlace a redes sociales en algunos articulos

**Causa**: El prompt dice "a veces invita al blog, a veces a las redes, a veces a ambos". La IA interpreta que puede omitir Instagram. Hay que hacer OBLIGATORIO incluir ambos cuando existen.

**Solucion**: Cambiar la seccion FRASE FINAL del prompt para:
- Si existen blog_url E instagram_url, la frase SIEMPRE debe incluir AMBOS enlaces
- Solo omitir uno si realmente no existe (es cadena vacia)
- Mantener la variedad en la formula de redaccion, pero no en que enlaces incluir

**Archivo**: UPDATE en tabla `prompts` (key `saas.article.system`)

---

### Problema 3: Enlaces externos demasiado genericos (Wikipedia, OMS...)

**Causa**: El prompt actual dice "SIEMPRE usa la homepage del dominio (ej: https://es.wikipedia.org)". Esto ha hecho que la IA solo use Wikipedia y OMS como fuentes genericas sin valor real.

**Solucion**: Reescribir la seccion de ENLACES EXTERNOS para:
- Permitir URLs especificas si son de dominios de confianza conocidos (NO inventar rutas, pero SI usar URLs que la IA conoce con certeza)
- Priorizar fuentes RELEVANTES al sector: blogs de referencia del sector, asociaciones profesionales, estudios publicados, medios especializados
- Prohibir expresamente Wikipedia como enlace generico sin contexto
- La funcion `verifyAndCleanExternalLinks` ya existe y reemplaza enlaces rotos por la homepage del dominio, asi que el fallback de seguridad ya esta cubierto
- Ejemplos por sector: para farmacias usar CGCOF, Portalfarma, Vademecum; para marketing usar HubSpot, Moz, Search Engine Journal

**Archivo**: UPDATE en tabla `prompts` (key `saas.article.system`)

---

### Detalle tecnico de cambios

**Tabla `prompts` - key `saas.article.system`**:

Seccion 10 (META DESCRIPTION) - cambiar a:
```
META DESCRIPTION:
- Genera una frase COMPLETA de entre 120 y 145 caracteres
- La frase DEBE tener sentido completo, sin cortes ni truncados
- Si al redactarla supera 145 caracteres, reescribela mas corta
- Incluir focus_keyword naturalmente
- PROHIBIDO usar ! ¡ ? ¿
- Tono directo y profesional, sin frases vacias
```

Seccion 11 (ENLACES EXTERNOS) - cambiar a:
```
ENLACES EXTERNOS (2 OBLIGATORIOS):
- Incluye 2 enlaces a fuentes de AUTORIDAD RELEVANTES para el sector
- Prioriza: asociaciones profesionales, blogs de referencia del sector, estudios, medios especializados
- PROHIBIDO enlazar a Wikipedia de forma generica sin contexto real
- Usa URLs especificas que conozcas con CERTEZA (ej: https://www.hubspot.es/blog, https://moz.com/blog)
- Si NO conoces la URL exacta de un articulo, enlaza a la seccion principal del sitio (ej: https://www.portalfarma.com/Paginas/default.aspx)
- NUNCA inventes rutas o slugs de articulos que no existan
- El sistema verificara los enlaces automaticamente y reemplazara los rotos
- Formato: <a href="URL" target="_blank" rel="noopener">texto ancla descriptivo</a>
- NO enlaces a competidores directos
```

Seccion 11 (FRASE FINAL) - cambiar a:
```
FRASE FINAL (OBLIGATORIA):
- El articulo DEBE terminar con una frase de cierre que incluya enlaces
- Si existen AMBOS (blogUrl e instagramUrl), la frase DEBE incluir LOS DOS enlaces
- Si solo existe uno, usa solo ese
- USA {{siteName}} (nombre de la marca), NUNCA uses {{sector}}
- Los enlaces DEBEN usar etiquetas ancla HTML, NUNCA URLs como texto plano
- VARIA la redaccion pero SIEMPRE incluye todos los enlaces disponibles
- Ejemplos:
  * "Descubre mas en el <a href='{{blogUrl}}'>blog de {{siteName}}</a> y siguenos en <a href='{{instagramUrl}}'>nuestras redes sociales</a>"
  * "En el <a href='{{blogUrl}}'>blog de {{siteName}}</a> encontraras mas contenido como este. Tambien puedes seguirnos en <a href='{{instagramUrl}}'>Instagram</a>"
- PROHIBIDO mostrar URLs como texto plano
```

**Tabla `prompts` - key `saas.article.user`**:
- Cambiar linea de meta description a: "Meta description: frase COMPLETA entre 120-145 chars, con sentido completo sin cortes, sin ! ni ?"

**Edge Function** (`supabase/functions/generate-article-saas/index.ts`):
- Sin cambios adicionales en el codigo. El truncado inteligente por palabra se mantiene como safety net.

