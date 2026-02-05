

## Plan: Optimizar Yoast SEO con 4 mejoras clave

### Problemas identificados

| Problema | Causa raiz | Archivo afectado |
|----------|-----------|------------------|
| Enlace de marca va al articulo en vez de HOME | `addHomeLinkToContent()` usa `blog_url` en lugar de extraer la home correctamente | `generate-article-saas/index.ts` linea 1259-1299 |
| Meta descripcion supera 155 chars | El prompt dice "MAXIMO 155" pero la IA no siempre cumple. Necesita validacion | `generate-article-saas/index.ts` prompts |
| Keyphrase density muy baja (1 vez) | Prompt pide 1-2% pero no especifica MINIMO 3-5 menciones explicitas | `generate-article-saas/index.ts` prompts |
| Frase clave no en todos los H2 | Prompt solo pide "al menos 1 H2", Yoast quiere mas | `generate-article-saas/index.ts` prompts |
| Sin preguntas PAA integradas | No existe logica para generar H2 en formato pregunta estilo Google PAA | Nueva funcionalidad |

---

### Cambios detallados

#### 1. Corregir enlace a HOME (no al articulo)

**Archivo:** `supabase/functions/generate-article-saas/index.ts`  
**Lineas:** 1259-1299 (funcion `addHomeLinkToContent`)

El problema es que la logica actual intenta derivar la home de `blog_url`, pero puede fallar. La solucion es extraer SIEMPRE el dominio raiz:

```javascript
function addHomeLinkToContent(content: string, siteName: string, blogUrl: string | null): string {
  if (!blogUrl || !siteName) return content;
  
  // SIEMPRE usar el dominio raiz como home
  let homeUrl: string;
  try {
    const url = new URL(blogUrl);
    homeUrl = `${url.protocol}//${url.host}`;
  } catch {
    return content;
  }
  
  console.log(`Adding home link: ${siteName} -> ${homeUrl}`);
  
  // ... resto igual
}
```

---

#### 2. Meta descripcion estricta de 150 caracteres

**Archivo:** `supabase/functions/generate-article-saas/index.ts`  
**Cambios en `FALLBACK_PROMPTS.articleSystem` y `articleUser`:**

Cambiar de:
```
"meta_description": "Meta descripción (MÁXIMO 155 caracteres)"
```

A:
```
"meta_description": "Meta descripción (EXACTAMENTE 140-150 caracteres, NUNCA más de 150)"
```

Ademas, anadir validacion post-generacion que trunca si supera 155:

```javascript
// Despues de parsear spanishArticle
if (spanishArticle.meta_description && spanishArticle.meta_description.length > 155) {
  spanishArticle.meta_description = spanishArticle.meta_description.substring(0, 152) + '...';
  console.log("Meta description truncated to 155 chars");
}
```

---

#### 3. Aumentar keyphrase density (minimo 5 menciones)

**Archivo:** `supabase/functions/generate-article-saas/index.ts`  
**Cambios en `FALLBACK_PROMPTS.articleSystem`:**

Modificar la seccion de FOCUS KEYWORD:

```text
1. FOCUS KEYWORD (2-4 palabras):
   - DEBE aparecer MINIMO 5 VECES en el texto completo
   - Distribuir uniformemente: intro, mitad, final (no todo junto)
   - DEBE aparecer en el seo_title (al INICIO)
   - DEBE aparecer en la meta_description
   - DEBE aparecer en el primer parrafo (primeras 100 palabras)
   - DEBE aparecer en AL MENOS 2 subtitulos H2 o H3
   - Usa SINONIMOS de la keyword en otras secciones para distribucion uniforme
```

---

#### 4. Frase clave en multiples H2/H3

Ya incluido en el cambio anterior: cambiar de "al menos 1 H2" a "AL MENOS 2 subtitulos H2 o H3".

---

#### 5. Integrar preguntas estilo Google PAA como H2

Esta es la mejora mas interesante. No necesitamos una API externa, podemos instruir a la IA para que genere H2 en formato pregunta basandose en el tema.

**Archivo:** `supabase/functions/generate-article-saas/index.ts`  
**Cambios en `FALLBACK_PROMPTS.articleSystem`:**

Anadir nueva regla:

```text
5. PREGUNTAS PAA (People Also Ask):
   - INCLUYE al menos 1-2 subtitulos H2 en FORMATO PREGUNTA
   - Estas preguntas deben ser las que los usuarios buscan en Google sobre el tema
   - Ejemplos de formato: "¿Por qué...?", "¿Cómo...?", "¿Cuál es...?", "¿Qué significa...?"
   - Responde la pregunta en el parrafo siguiente (2-4 oraciones)
   - Esto mejora posicionamiento en featured snippets de Google
```

**Ejemplo de output esperado:**

```html
<h2>Cómo optimizar textos para Google en 2024</h2>
<p>Contenido...</p>

<h2>¿Por qué mi web no aparece en los resultados de Google?</h2>
<p>Existen varias razones por las que tu pagina puede no aparecer en Google. La mas comun es...</p>

<h2>¿Qué factores afectan al posicionamiento SEO?</h2>
<p>Los principales factores incluyen...</p>
```

---

### Resumen de cambios en el prompt

El `articleSystem` actualizado incluira:

```text
OPTIMIZACION SEO CRITICA (Yoast verde OBLIGATORIO):

1. FOCUS KEYWORD (2-4 palabras):
   - DEBE aparecer MINIMO 5 VECES en el texto completo
   - Distribuir uniformemente: intro, mitad, final
   - DEBE aparecer en el seo_title (al INICIO)
   - DEBE aparecer en la meta_description
   - DEBE aparecer en el primer parrafo (primeras 100 palabras)
   - DEBE aparecer en AL MENOS 2 subtitulos H2 o H3
   - Usa SINONIMOS de la keyword en otras secciones

2. ENLACES EXTERNOS OBLIGATORIOS:
   - INCLUYE 1-2 enlaces a fuentes de autoridad
   - Formato: <a href="URL" target="_blank" rel="noopener">texto ancla</a>

3. META DESCRIPTION:
   - EXACTAMENTE 140-150 caracteres (NUNCA mas de 150)
   - Incluir focus_keyword
   - Terminar con CTA

4. PARRAFOS Y LEGIBILIDAD:
   - Parrafos de 2-4 oraciones
   - Transiciones entre secciones

5. PREGUNTAS PAA (People Also Ask):
   - INCLUYE 1-2 subtitulos H2 en FORMATO PREGUNTA
   - Formato: "¿Por qué...?", "¿Cómo...?", "¿Cuál es...?"
   - Responde la pregunta en 2-4 oraciones
   - Mejora featured snippets de Google

FORMATO DE RESPUESTA JSON:
{
  "title": "Titulo H1 (max 70 chars)",
  "seo_title": "SEO title que EMPIEZA con focus_keyword (max 60 chars)",
  "meta_description": "Meta descripcion (140-150 chars exactos)",
  "excerpt": "Resumen diferente a meta (max 160 chars)",
  "focus_keyword": "keyword 2-4 palabras",
  "slug": "url-con-keyword",
  "content": "<h2>Subtitulo con keyword</h2>...<h2>¿Pregunta PAA?</h2><p>Respuesta...</p>"
}
```

---

### Viabilidad de las preguntas PAA

**Opcion A (recomendada):** Instruir a la IA para generar preguntas relevantes basandose en el tema. Es viable porque:
- Gemini conoce los patrones de busqueda comunes
- No requiere API externa
- No tiene coste adicional
- Funciona para cualquier idioma

**Opcion B (futuro):** Usar una SERP API (SerpWow, SERPHouse, Apify) para extraer las preguntas reales de Google. Esto seria mas preciso pero:
- Requiere API key adicional
- Tiene coste por consulta
- Anade latencia al proceso

Recomiendo empezar con Opcion A y evaluar si los resultados son satisfactorios.

---

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article-saas/index.ts` | Actualizar prompts, corregir home link, anadir validacion meta |

---

### Resultado esperado tras los cambios

| Check de Yoast | Estado actual | Estado esperado |
|----------------|---------------|-----------------|
| Keyphrase density | ROJO (1 vez) | VERDE (5+ veces) |
| Distribucion de frase clave | ROJO (desigual) | VERDE (uniforme) |
| Frase clave en titulo SEO | ROJO (incompleto) | VERDE (al inicio) |
| Frase clave en subtitulos | ROJO (insuficiente) | VERDE (2+ H2) |
| Longitud meta descripcion | NARANJA (158 chars) | VERDE (150 chars) |
| Enlace interno a home | ROJO (al articulo) | VERDE (a home) |

