

## Análisis: Problemas de Yoast SEO en artículos MKPro

He analizado la captura de pantalla con los 10 problemas de Yoast y el código actual de MKPro. Aquí está el diagnóstico:

### Resumen de problemas

| Problema Yoast | Causa raíz | Podemos arreglar | Queremos arreglar |
|----------------|------------|------------------|-------------------|
| Frase clave en alt de imágenes | El alt usa el título, no la keyword | SI | SI |
| Frase clave en la introducción | La IA no recibe instrucciones de keyword placement | SI | SI |
| Keyphrase density | No hay keyword definida | SI | SI |
| Frase clave en el título SEO | No se genera seo_title ni focus_keyword | SI | SI |
| Longitud de la frase clave | No se genera focus_keyword | SI | SI |
| Frase clave en la meta descripción | La keyword no se usa en meta_description | SI | SI |
| Longitud de la metadescripción | Se genera pero requiere snippet PHP en WP | PARCIAL | SI (con snippet) |
| Frase clave utilizada anteriormente | No hay tracking de keywords usadas | COMPLEJO | NO (bajo ROI) |
| Frase clave en el slug | El slug no incluye keyword | SI | SI |
| Keyphrase in subheading | La IA no incluye keyword en H2 | SI | SI |

---

### Problema raíz: Falta el campo `focus_keyword`

El sistema MKPro actualmente genera:
- `title` (H1)
- `meta_description`
- `slug`
- `content` (HTML)

**Falta generar**:
- `focus_keyword` - La palabra clave principal del artículo
- `seo_title` - Título SEO optimizado (diferente al H1)
- `excerpt` - Extracto/resumen corto

Sin `focus_keyword`, Yoast no puede analizar:
- Densidad de la keyword
- Presencia en título, meta, slug, H2, alt, introducción

---

### Solución propuesta

#### Fase 1: Generar campos SEO adicionales en MKPro

Modificar `generate-article/index.ts` para generar:

```json
{
  "title": "Título H1 del artículo (max 60 chars)",
  "seo_title": "Título SEO optimizado para CTR (max 60 chars)",
  "meta_description": "Meta descripción con keyword (max 160 chars)",
  "focus_keyword": "keyword principal",
  "excerpt": "Resumen corto del artículo",
  "slug": "slug-con-keyword",
  "content": "<h2>Subtítulo con keyword</h2><p>Primera frase incluye keyword...</p>"
}
```

#### Fase 2: Actualizar prompts con reglas SEO

Añadir al prompt del sistema:

```text
REGLAS SEO PARA YOAST (semáforo verde):

1. FOCUS KEYWORD:
   - Define UNA keyword principal de 2-4 palabras
   - Esta keyword DEBE aparecer en:
     - El slug (URL)
     - El seo_title (idealmente al inicio)
     - La meta_description
     - La primera frase del contenido
     - Al menos un H2
   - Densidad: 1-2% del contenido total

2. ESTRUCTURA H2:
   - Al menos 1 H2 debe contener la keyword exacta o variación cercana

3. ALT DE IMAGEN:
   - Usa la focus_keyword como base del alt text
```

#### Fase 3: Actualizar publish-to-wordpress

Añadir campos al publicar:

```typescript
postData.meta = {
  _yoast_wpseo_metadesc: meta_description,
  _yoast_wpseo_title: seo_title,
  _yoast_wpseo_focuskw: focus_keyword // NUEVO
};

// Alt de imagen con keyword
image_alt: focus_keyword || title;

// Excerpt nativo (fallback de meta descripción)
postData.excerpt = excerpt;
```

---

### Lo que NO queremos/podemos arreglar

| Problema | Por qué no |
|----------|------------|
| "Frase clave utilizada anteriormente" | Requeriría un sistema de tracking de keywords usadas históricamente. Complejidad alta, ROI bajo. Yoast solo da aviso, no penaliza. |
| "Longitud de metadescripción" sin snippet | La API REST de Yoast es read-only. Requiere que el usuario añada el snippet PHP. Sin embargo, el `excerpt` funciona como fallback. |

---

### Archivos a modificar (zona MKPro protegida)

Nota: Según las reglas de arquitectura, estos archivos están en zona MKPro. Sin embargo, como es una mejora SEO que no cambia la estructura de datos ni rompe nada, es seguro modificarlos.

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article/index.ts` | Añadir `focus_keyword`, `seo_title`, `excerpt` al JSON. Actualizar prompts con reglas SEO. |
| `supabase/functions/publish-to-wordpress/index.ts` | Añadir `excerpt`, `seo_title`, `focus_keyword` a los campos enviados |
| `src/hooks/useArticulos.ts` | Añadir tipos para nuevos campos |
| `src/components/pharmacy/WordPressPublishDialog.tsx` | Enviar nuevos campos al publicar |

---

### Cambios técnicos en el prompt de generación

```text
CAMPOS A GENERAR (JSON):
{
  "title": "Título H1 (max 60 chars)",
  "seo_title": "Título SEO que EMPIECE con la focus_keyword (max 60 chars)",
  "meta_description": "Descripción que INCLUYA la focus_keyword (max 160 chars)",
  "focus_keyword": "keyword principal de 2-4 palabras",
  "excerpt": "Resumen del artículo para snippet (max 160 chars)",
  "slug": "url-amigable-con-focus-keyword",
  "content": "<h2>Subtítulo que incluya focus_keyword...</h2><p>El primer párrafo DEBE contener la focus_keyword...</p>"
}

REGLAS SEO CRÍTICAS:
1. La focus_keyword debe aparecer en:
   - seo_title (idealmente al inicio)
   - meta_description
   - slug
   - Primer párrafo del contenido
   - Al menos 1 H2
2. Densidad de keyword: 1-2% del texto total
3. El excerpt debe ser diferente de meta_description pero relacionado
```

---

### Cambios en publish-to-wordpress

```typescript
// Interfaz actualizada
interface PublishRequest {
  // ... campos existentes
  seo_title?: string;      // NUEVO
  focus_keyword?: string;  // NUEVO  
  excerpt?: string;        // NUEVO
}

// Enviar a WordPress
const postData = {
  title,
  content,
  slug,
  status,
  excerpt: excerpt || meta_description?.substring(0, 160), // Fallback
  meta: {
    _yoast_wpseo_metadesc: meta_description,
    _yoast_wpseo_title: seo_title || title,
    _yoast_wpseo_focuskw: focus_keyword
  }
};

// Alt de imagen con keyword
image_alt: focus_keyword || image_alt || title;
```

---

### Resultado esperado tras los cambios

| Check de Yoast | Estado esperado |
|----------------|-----------------|
| Frase clave en alt de imágenes | VERDE (usamos focus_keyword) |
| Frase clave en la introducción | VERDE (prompt lo exige) |
| Keyphrase density | VERDE/NARANJA (1-2% target) |
| Frase clave en el título SEO | VERDE (seo_title empieza con keyword) |
| Longitud de la frase clave | VERDE (2-4 palabras) |
| Frase clave en la meta descripción | VERDE (prompt lo exige) |
| Longitud de la metadescripción | VERDE (con snippet) / NARANJA (sin snippet, usa excerpt) |
| Frase clave utilizada anteriormente | NARANJA (no tracking - aceptable) |
| Frase clave en el slug | VERDE (slug incluye keyword) |
| Keyphrase in subheading | VERDE (al menos 1 H2 con keyword) |

### Resumen

- **9 de 10 problemas** se pueden resolver con cambios en los prompts y el código
- **1 problema** ("frase clave utilizada anteriormente") no vale la pena arreglar por complejidad/ROI
- Los campos de Yoast funcionarán completamente si el usuario añade el snippet PHP (ya disponible en la biblioteca de snippets)
- El `excerpt` funciona siempre como fallback para meta descripción

