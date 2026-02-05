

## Plan: Aplicar mejoras SEO a MKPro Empresas

### Diagnóstico confirmado

El artículo https://mkpro.es/asuntos-email-abrir-convertir/ fue generado por **MKPro Empresas** (`generate-article-empresa`), que **NO tiene implementados** los campos SEO que sí están en farmacias y SaaS:

| Campo SEO | MKPro Farmacias | MKPro Empresas | Problema |
|-----------|-----------------|----------------|----------|
| `focus_keyword` | SI genera | NO genera | Yoast no puede analizar nada |
| `seo_title` | SI genera | NO genera | Título SEO no optimizado |
| `excerpt` | SI genera | NO genera | Sin fallback para meta desc |
| Keyword en H2 | SI (prompt lo exige) | NO | Yoast marca error |
| Keyword en intro | SI (prompt lo exige) | NO | Yoast marca error |
| Keyword en slug | SI (prompt lo exige) | NO | Yoast marca error |

Aunque hayas añadido el snippet PHP de Yoast, los campos SEO nunca se envían porque:
1. La generación NO los crea
2. La publicación NO los envía aunque existieran

---

### Archivos a modificar

| Archivo | Cambios necesarios |
|---------|-------------------|
| `supabase/functions/generate-article-empresa/index.ts` | Actualizar prompts para generar `focus_keyword`, `seo_title`, `excerpt` y aplicar reglas SEO |
| `src/hooks/useArticulosEmpresas.ts` | Añadir campos SEO a la interfaz `ArticleContent` |
| `src/components/company/WordPressPublishDialogEmpresa.tsx` | Enviar `focus_keyword`, `seo_title`, `excerpt` al publicar |

---

### Cambios detallados

#### 1. Actualizar interfaz `ArticleContent` en `useArticulosEmpresas.ts`

```typescript
export interface ArticleContent {
  title: string;
  seo_title?: string;           // NUEVO
  meta_description: string;
  excerpt?: string;              // NUEVO
  focus_keyword?: string;        // NUEVO
  slug: string;
  content: string;
}
```

#### 2. Actualizar prompt en `generate-article-empresa/index.ts`

Cambiar el formato de respuesta JSON de:
```json
{
  "title": "...",
  "meta_description": "...",
  "slug": "...",
  "content": "..."
}
```

A:
```json
{
  "title": "Título H1 (máx 60 caracteres)",
  "seo_title": "SEO title que EMPIEZA con focus_keyword (máx 60 caracteres)",
  "meta_description": "Meta descripción 150-160 caracteres con focus_keyword",
  "excerpt": "Resumen breve (máx 160 caracteres, diferente a meta_description)",
  "focus_keyword": "keyword principal de 2-4 palabras",
  "slug": "url-amigable-con-focus-keyword",
  "content": "<h2>Subtítulo con focus_keyword...</h2><p>Primer párrafo con focus_keyword...</p>"
}
```

Añadir reglas SEO al prompt del sistema:
```text
REGLAS SEO CRÍTICAS PARA YOAST (semáforo verde):

1. FOCUS KEYWORD (2-4 palabras) DEBE aparecer en:
   - El slug (URL)
   - El seo_title (idealmente al INICIO)
   - La meta_description
   - El primer párrafo del contenido (primeras 50 palabras)
   - Al menos 1 subtítulo H2
   
2. DENSIDAD DE KEYWORD: 1-2% del texto total

3. SEO_TITLE: Diferente al H1, optimizado para CTR, max 60 caracteres

4. EXCERPT: Resumen diferente a meta_description, max 160 caracteres
```

#### 3. Actualizar `WordPressPublishDialogEmpresa.tsx`

Modificar la llamada a `publishMutation.mutateAsync`:

```typescript
const result = await publishMutation.mutateAsync({
  empresa_id: empresaId,
  title: content.title,
  content: content.content,
  slug: lang === "catalan" ? `${content.slug}-ca` : content.slug,
  status: status === "future" && scheduleDate ? "future" : status,
  date: status === "future" && scheduleDate ? scheduleDate.toISOString() : undefined,
  image_url: article.image_url || undefined,
  image_alt: content.focus_keyword || content.title,  // Usar keyword para alt
  meta_description: content.meta_description,
  seo_title: content.seo_title,                       // NUEVO
  focus_keyword: content.focus_keyword,               // NUEVO
  excerpt: content.excerpt || content.meta_description, // NUEVO con fallback
  lang: lang === "catalan" ? "ca" : "es",
  category_ids: selectedCategoryIds,
  tag_ids: selectedTagIds,
});
```

#### 4. Actualizar `usePublishToWordPressEmpresa.ts` (interfaz)

```typescript
export interface PublishToWordPressEmpresaInput {
  // ... campos existentes
  seo_title?: string;      // NUEVO
  focus_keyword?: string;  // NUEVO
  excerpt?: string;        // NUEVO
}
```

---

### Resultado esperado

Tras aplicar estos cambios:

| Check de Yoast | Estado esperado |
|----------------|-----------------|
| Frase clave en alt de imágenes | VERDE (usamos focus_keyword) |
| Frase clave en la introducción | VERDE (prompt lo exige) |
| Keyphrase density | VERDE/NARANJA (1-2% target) |
| Frase clave en el título SEO | VERDE (seo_title empieza con keyword) |
| Longitud de la frase clave | VERDE (2-4 palabras) |
| Frase clave en la meta descripción | VERDE (prompt lo exige) |
| Longitud de la metadescripción | VERDE (snippet PHP + excerpt fallback) |
| Frase clave en el slug | VERDE (prompt lo exige) |
| Keyphrase in subheading | VERDE (al menos 1 H2 con keyword) |
| Frase clave utilizada anteriormente | NARANJA (sin tracking - aceptable) |

---

### Nota importante

Los artículos **ya generados** no se beneficiarán de estos cambios. Solo los **nuevos artículos** generados después de la implementación tendrán los campos SEO completos. Para el artículo actual, tendrías que:
1. Regenerarlo desde MKPro
2. O editarlo manualmente en WordPress

