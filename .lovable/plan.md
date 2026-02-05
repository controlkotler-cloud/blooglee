
## Plan: Optimizar SEO completo en generate-article-saas

### Problemas detectados

| Problema | Causa raíz | Impacto |
|----------|-----------|---------|
| Meta descripcion muy larga | Prompt dice "150-160 MAXIMO" pero no es estricto | Yoast naranja |
| Sin focus_keyword | El JSON de respuesta NO lo pide | Yoast sin analisis |
| Sin excerpt | El JSON de respuesta NO lo pide | Fallback a meta_description |
| Falta enlaces externos | Instruccion poco enfatica | Yoast marca falta de enlaces |

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article-saas/index.ts` | Actualizar FALLBACK_PROMPTS para incluir `focus_keyword`, `excerpt`, limitar meta_description y enfatizar enlaces externos |

### Cambios detallados

#### 1. Actualizar `FALLBACK_PROMPTS.articleSystem` (lineas 122-171)

Modificar la seccion de FORMATO DE RESPUESTA JSON para incluir:

```javascript
OPTIMIZACION SEO CRITICA (Yoast verde):

1. FOCUS KEYWORD (2-4 palabras):
   - DEBE aparecer en el slug
   - DEBE aparecer en el seo_title (idealmente al INICIO)
   - DEBE aparecer en la meta_description
   - DEBE aparecer en el primer parrafo (primeras 100 palabras)
   - DEBE aparecer en al menos 1 subtitulo H2
   - Densidad: 1-2% del texto total

2. ENLACES EXTERNOS OBLIGATORIOS:
   - INCLUYE 1-2 enlaces a fuentes de autoridad (Wikipedia, estudios, instituciones oficiales)
   - Formato: <a href="URL" target="_blank" rel="noopener">texto ancla</a>
   - NO enlaces a competidores directos

3. META DESCRIPTION:
   - MAXIMO 155 caracteres (NUNCA mas, ni un caracter mas)
   - Incluir focus_keyword
   - Terminar con CTA

FORMATO DE RESPUESTA JSON:
{
  "title": "Titulo H1 (max 70 chars, sin nombre empresa, sin año)",
  "seo_title": "SEO title (max 60 chars, EMPIEZA con focus_keyword)",
  "meta_description": "Meta descripcion (MAXIMO 155 caracteres) con focus_keyword y CTA",
  "excerpt": "Resumen breve (max 160 chars) diferente a meta_description",
  "focus_keyword": "keyword principal de 2-4 palabras",
  "slug": "url-con-focus-keyword",
  "content": "<h2>Subtitulo con focus_keyword</h2><p>Primer parrafo con focus_keyword...</p>..."
}
```

#### 2. Actualizar `FALLBACK_PROMPTS.articleUser` (lineas 172-192)

Reforzar el formato JSON y las reglas:

```javascript
TEMA: {{topic}}

TIPO DE CONTENIDO: {{pillarType}}
{{pillarDescription}}

REGLAS OBLIGATORIAS:
1. El contenido HTML NO debe contener <h1>
2. Empieza con un <h2> GANCHO diferente al titulo
3. INCLUYE 1-2 enlaces externos a fuentes de autoridad (obligatorio)
4. La meta_description NUNCA puede superar 155 caracteres
5. El focus_keyword debe aparecer en slug, seo_title, meta_description, primer parrafo y al menos 1 H2

FORMATO JSON OBLIGATORIO:
{
  "title": "Titulo H1 (max 70 chars)",
  "seo_title": "SEO title que EMPIEZA con focus_keyword (max 60 chars)",
  "meta_description": "Meta descripcion (MAXIMO 155 chars) con keyword y CTA",
  "excerpt": "Resumen diferente a meta_description (max 160 chars)",
  "focus_keyword": "keyword principal 2-4 palabras",
  "slug": "url-con-keyword-sin-espacios",
  "content": "<h2>Subtitulo con keyword</h2><p>Primer parrafo con keyword...</p>..."
}
```

#### 3. Actualizar `FALLBACK_PROMPTS.translateCatalan` (lineas 194-208)

Incluir los nuevos campos en la traduccion:

```javascript
Traduce este articulo del español al catalan.

ARTICULO:
Titulo: {{title}}
SEO Title: {{seoTitle}}
Meta: {{meta}}
Excerpt: {{excerpt}}
Focus Keyword: {{focusKeyword}}
Slug: {{slug}}
Contenido: {{content}}

RESPONDE EN JSON:
{
  "title": "Titol en catala",
  "seo_title": "SEO title en catala (max 60 chars)",
  "meta_description": "Meta descripció en catala (MAXIMO 155 chars)",
  "excerpt": "Resum en catala (max 160 chars)",
  "focus_keyword": "keyword traduïda al catala",
  "slug": "url-en-catala",
  "content": "Contingut HTML en catala"
}
```

#### 4. Actualizar la llamada de traduccion (linea 1155-1165)

Pasar los nuevos campos al prompt de traduccion:

```javascript
const catalanPrompt = await getPrompt(
  supabase,
  'saas.translate.catalan',
  {
    title: spanishArticle.title,
    seoTitle: spanishArticle.seo_title || '',
    meta: spanishArticle.meta_description,
    excerpt: spanishArticle.excerpt || spanishArticle.meta_description,
    focusKeyword: spanishArticle.focus_keyword || '',
    slug: spanishArticle.slug,
    content: spanishContentWithoutSeo
  },
  FALLBACK_PROMPTS.translateCatalan
);
```

### Resultado esperado

Tras estos cambios, los articulos generados tendran:

| Campo | Estado |
|-------|--------|
| `focus_keyword` | Generado (2-4 palabras) |
| `seo_title` | Generado (max 60 chars, empieza con keyword) |
| `meta_description` | Generado (max 155 chars) |
| `excerpt` | Generado (diferente a meta, max 160 chars) |
| Enlaces externos | 1-2 en el contenido |
| Keyword en H2 | Al menos 1 subtitulo |
| Keyword en intro | En el primer parrafo |

### Seccion tecnica

Los FALLBACK_PROMPTS se usan cuando no hay prompts personalizados en la tabla `prompts`. La consulta a la base de datos mostro que no hay prompts activos con keys `saas_article_system` o `saas_article_user`, por lo que estos fallbacks son los que se ejecutan actualmente.

La modificacion afecta a:
- Lineas 122-171: `FALLBACK_PROMPTS.articleSystem`
- Lineas 172-192: `FALLBACK_PROMPTS.articleUser`  
- Lineas 194-208: `FALLBACK_PROMPTS.translateCatalan`
- Lineas 1155-1165: Llamada a getPrompt para traduccion catalan
