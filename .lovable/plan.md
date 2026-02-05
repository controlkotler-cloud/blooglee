

## Plan: Corregir meta descripción Yoast y añadir campos SEO adicionales

### Diagnóstico del problema

Tras analizar los logs, el código y la documentación oficial de Yoast, he identificado la causa raíz:

| Problema | Causa |
|----------|-------|
| Meta descripción no se publica | **Yoast no expone sus campos via REST API** - su API es solo lectura (read-only) |
| SEO title no se publica | Mismo problema - requiere `register_post_meta` en WordPress |

La documentación oficial de Yoast confirma: *"The Yoast REST API is currently read-only and doesn't support POST or PUT calls to update the data."*

### Solución en dos fases

#### Fase 1: Campos nativos de WordPress (funcionan sin configuración)

WordPress tiene campos nativos que **sí funcionan** via REST API sin necesidad de snippets:

| Campo | Uso SEO | Estado actual |
|-------|---------|---------------|
| `excerpt` | Extracto/resumen del post (Yoast lo usa como fallback para meta descripción) | NO enviamos |
| `title` | Título H1 | OK |
| `content` | Contenido HTML | OK |
| `slug` | URL amigable | OK |
| `featured_media` | Imagen destacada | OK |
| `meta.alt_text` | Alt de imagen | OK |

**Acción**: Añadir el campo `excerpt` a la publicación. Yoast usa el excerpt como fallback cuando no hay meta descripción configurada manualmente.

#### Fase 2: Snippet PHP para campos de Yoast (solución completa)

Para que meta descripción y SEO title funcionen correctamente, el usuario debe añadir un snippet en su WordPress que registre los campos meta:

```php
/**
 * Blooglee - Yoast SEO API Support
 * Habilita la edición de campos Yoast via REST API
 */
add_action('init', function() {
    // Meta descripción
    register_post_meta('post', '_yoast_wpseo_metadesc', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
    
    // SEO Title
    register_post_meta('post', '_yoast_wpseo_title', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
    
    // Focus keyword
    register_post_meta('post', '_yoast_wpseo_focuskw', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
});
```

### Campos SEO adicionales a implementar

| Campo | Descripción | Beneficio SEO |
|-------|-------------|---------------|
| `excerpt` | Resumen de 150-160 caracteres | Fallback de meta descripción, mejora CTR |
| `_yoast_wpseo_focuskw` | Keyword principal del artículo | Yoast analiza densidad y ubicación |
| `_yoast_wpseo_metadesc` | Meta descripción optimizada | Snippet en Google |
| `_yoast_wpseo_title` | SEO title (diferente al H1) | Título optimizado para CTR |

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/publish-to-wordpress-saas/index.ts` | Añadir campo `excerpt`, añadir `_yoast_wpseo_focuskw` |
| `supabase/functions/generate-article-saas/index.ts` | Generar `excerpt` y `focus_keyword` en el contenido |
| `src/hooks/useArticlesSaas.ts` | Añadir tipos `excerpt` y `focus_keyword` |
| `src/components/saas/WordPressPublishDialogSaas.tsx` | Enviar `excerpt` y `focus_keyword` al publicar |
| `src/data/codeSnippets.ts` | Añadir snippet de Yoast API Support |
| Base de datos: `prompts` | Actualizar prompts para generar `excerpt` y `focus_keyword` |

### Cambios técnicos detallados

#### 1. Actualizar interfaz ArticleContent

```typescript
export interface ArticleContent {
  title: string;
  seo_title?: string;
  meta_description: string;
  excerpt?: string;           // NUEVO: resumen corto
  focus_keyword?: string;     // NUEVO: keyword principal
  slug: string;
  content: string;
}
```

#### 2. Actualizar PublishInputSaas

```typescript
export interface PublishInputSaas {
  // ... campos existentes
  excerpt?: string;           // NUEVO
  focus_keyword?: string;     // NUEVO
}
```

#### 3. Actualizar publish-to-wordpress-saas

```typescript
// Añadir excerpt (funciona nativamente)
if (body.excerpt) {
  postData.excerpt = body.excerpt;
}

// Campos Yoast (requieren snippet PHP)
if (body.meta_description || body.seo_title || body.focus_keyword) {
  const yoastMeta: Record<string, string> = {};
  
  if (body.meta_description) {
    yoastMeta._yoast_wpseo_metadesc = body.meta_description.substring(0, 160);
  }
  
  if (body.seo_title) {
    yoastMeta._yoast_wpseo_title = body.seo_title.substring(0, 60);
  }
  
  if (body.focus_keyword) {
    yoastMeta._yoast_wpseo_focuskw = body.focus_keyword;
  }
  
  postData.meta = yoastMeta;
}
```

#### 4. Actualizar prompts de generación

Añadir al JSON de salida:

```json
{
  "title": "Título H1 del artículo",
  "seo_title": "SEO title optimizado (max 60 chars)",
  "meta_description": "Meta descripción 150-160 caracteres",
  "excerpt": "Resumen corto del artículo (max 160 chars, ideal para snippet)",
  "focus_keyword": "keyword principal del artículo",
  "slug": "url-amigable",
  "content": "<h2>...</h2><p>...</p>"
}
```

#### 5. Añadir snippet de Yoast a la biblioteca

Añadir a `src/data/codeSnippets.ts`:

```typescript
{
  id: 'yoast-api-support',
  title: 'Yoast SEO - Soporte API REST',
  description: 'Habilita la edición de meta descripción, SEO title y focus keyword vía API',
  category: 'general',
  plugin: 'yoast',
  fileName: 'functions.php',
  code: `/**
 * Blooglee - Yoast SEO API Support
 * Habilita la edición de campos Yoast via REST API
 */
add_action('init', function() {
    // Meta descripción
    register_post_meta('post', '_yoast_wpseo_metadesc', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
    
    // SEO Title
    register_post_meta('post', '_yoast_wpseo_title', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
    
    // Focus keyword
    register_post_meta('post', '_yoast_wpseo_focuskw', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
});`,
  instructions: `1. Accede a tu WordPress
2. Ve a **Apariencia → Editor de temas**
3. Selecciona tu tema hijo
4. Abre **functions.php**
5. Añade el código al final
6. Guarda los cambios

⚠️ Este snippet es NECESARIO para que Blooglee pueda rellenar automáticamente:
- Meta descripción (aparece en Google)
- SEO Title (título optimizado para CTR)
- Focus Keyword (para análisis de Yoast)

Sin este snippet, Yoast ignorará estos campos.`
}
```

### Flujo de usuario actualizado

```text
1. Usuario configura WordPress en Blooglee
   |
   v
2. Sistema detecta si Yoast responde a campos meta
   |
   +-- SI: Todo funciona automáticamente
   |
   +-- NO: Mostrar aviso "Añade el snippet de Yoast para mejor SEO"
   |
   v
3. Mientras tanto, excerpt funciona siempre
   (Yoast usa excerpt como fallback de meta descripción)
```

### Resultado esperado

| Campo | Sin snippet | Con snippet |
|-------|-------------|-------------|
| Excerpt | Funciona (fallback meta desc) | Funciona |
| Meta descripción Yoast | NO funciona | Funciona |
| SEO Title Yoast | NO funciona | Funciona |
| Focus keyword | NO funciona | Funciona |
| Semáforo Yoast | Naranja (mejor que rojo) | Verde |

### Beneficios de esta solución

1. **Mejora inmediata**: El `excerpt` funciona sin configuración adicional
2. **Solución completa opcional**: El snippet PHP habilita todos los campos de Yoast
3. **UX clara**: El usuario sabe exactamente qué hacer para tener SEO perfecto
4. **Retrocompatible**: No rompe nada existente

