

## Plan: Sincronizar Categorías/Tags + SEO Footer para SaaS

### Resumen de Funcionalidades a Implementar

| Funcionalidad | Estado en MKPro | Estado en SaaS |
|---------------|-----------------|----------------|
| Sincronizar categorías/tags de WP | ✅ Funciona | ❌ No existe |
| Enviar `category_ids` y `tag_ids` al publicar | ✅ Funciona | ❌ No existe |
| Parámetro `lang` para Polylang | ✅ Funciona | ⚠️ Se envía pero sin efecto |
| Frase SEO con enlaces a blog/redes | ✅ Funciona | ❌ No existe |

---

## PARTE 1: Sincronización de Categorías y Tags

### 1.1 Nueva Tabla en Base de Datos

Crear tabla `wordpress_taxonomies_saas` para SaaS (separada de la de MKPro):

```sql
CREATE TABLE wordpress_taxonomies_saas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wordpress_config_id UUID NOT NULL REFERENCES wordpress_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taxonomy_type TEXT NOT NULL CHECK (taxonomy_type IN ('category', 'tag')),
  wp_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (wordpress_config_id, taxonomy_type, wp_id)
);

-- RLS para aislamiento multi-tenant
ALTER TABLE wordpress_taxonomies_saas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own taxonomies" ON wordpress_taxonomies_saas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 1.2 Nueva Edge Function: `sync-wordpress-taxonomies-saas`

Similar a `sync-wordpress-taxonomies` pero con validación de usuario:

- Recibe `wordpress_config_id` 
- Valida que el config pertenezca al usuario autenticado
- Obtiene categorías de `/wp-json/wp/v2/categories?per_page=100`
- Obtiene tags de `/wp-json/wp/v2/tags?per_page=100`
- Guarda en `wordpress_taxonomies_saas` con `user_id`
- Limpia taxonomías obsoletas

### 1.3 Nuevo Hook: `useWordPressTaxonomiesSaas`

En `src/hooks/useWordPressTaxonomiesSaas.ts`:

```typescript
export function useTaxonomiesSaas(wordpressConfigId: string | undefined) {
  // Obtener categorías y tags del config
}

export function useSyncTaxonomiesSaas() {
  // Invocar edge function sync-wordpress-taxonomies-saas
}
```

### 1.4 Componente: Selector de Taxonomías en Diálogo de Publicación

Modificar `WordPressPublishDialogSaas.tsx` para incluir:
- Checkboxes para seleccionar categorías
- Checkboxes para seleccionar tags
- Botón "Sincronizar" para actualizar lista desde WordPress

---

## PARTE 2: Enviar Taxonomías al Publicar

### 2.1 Modificar `publish-to-wordpress-saas`

Añadir soporte para `category_ids` y `tag_ids` en la request:

```typescript
interface PublishRequest {
  site_id: string;
  title: string;
  content: string;
  slug: string;
  status: 'publish' | 'draft' | 'future';
  date?: string;
  image_url?: string;
  image_alt?: string;
  meta_description?: string;
  lang?: 'es' | 'ca';
  category_ids?: number[];  // NUEVO
  tag_ids?: number[];       // NUEVO
}
```

Y en el `postData` enviado a WordPress:

```typescript
const postData = {
  title: body.title,
  content: body.content,
  slug: slug,
  status: body.status,
  lang: body.lang || 'es',
  categories: body.category_ids || [],  // NUEVO
  tags: body.tag_ids || [],              // NUEVO
  // ...
};
```

### 2.2 Actualizar Hook `usePublishToWordPressSaas`

Añadir `category_ids` y `tag_ids` al interface de input.

---

## PARTE 3: Frase SEO con Enlaces al Blog y Redes

### 3.1 Modificar `generate-article-saas`

Añadir el SEO footer como en MKPro después de generar el contenido español:

```typescript
// Guardar contenido español SIN SEO para traducir a catalán
const spanishContentWithoutSeoLinks = spanishArticle?.content || '';

// Añadir SEO links al contenido español
if (spanishArticle?.content) {
  const seoLinks: string[] = [];
  
  if (site.blog_url) {
    seoLinks.push(`<a href="${site.blog_url}" target="_blank" rel="noopener">nuestro blog</a>`);
  }
  if (site.instagram_url) {
    seoLinks.push(`<a href="${site.instagram_url}" target="_blank" rel="noopener">Instagram</a>`);
  }
  
  if (seoLinks.length > 0) {
    const linksText = seoLinks.join(' y ');
    const closingParagraph = `<p><strong>¿Quieres más consejos?</strong> Visita ${linksText} para descubrir más contenido de ${site.name}.</p>`;
    spanishArticle.content += closingParagraph;
  }
}
```

Y después de la traducción al catalán:

```typescript
// Añadir SEO links al catalán DESPUÉS de traducir
if (catalanArticle?.content) {
  const seoLinksCa: string[] = [];
  
  if (site.blog_url) {
    seoLinksCa.push(`<a href="${site.blog_url}" target="_blank" rel="noopener">el nostre blog</a>`);
  }
  if (site.instagram_url) {
    seoLinksCa.push(`<a href="${site.instagram_url}" target="_blank" rel="noopener">Instagram</a>`);
  }
  
  if (seoLinksCa.length > 0) {
    const linksTextCa = seoLinksCa.join(' i ');
    const closingParagraphCa = `<p><strong>Vols més consells?</strong> Visita ${linksTextCa} per descobrir més contingut de ${site.name}.</p>`;
    catalanArticle.content += closingParagraphCa;
  }
}
```

**Importante**: La traducción al catalán se hace ANTES de añadir los enlaces SEO para evitar duplicar el footer en ambos idiomas de forma incorrecta.

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/functions/sync-wordpress-taxonomies-saas/index.ts` | Edge function para sincronizar taxonomías |
| `src/hooks/useWordPressTaxonomiesSaas.ts` | Hook para gestionar taxonomías SaaS |

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| Base de datos | Crear tabla `wordpress_taxonomies_saas` con RLS |
| `supabase/functions/generate-article-saas/index.ts` | Añadir SEO footer con enlaces a blog/redes |
| `supabase/functions/publish-to-wordpress-saas/index.ts` | Añadir `category_ids` y `tag_ids` al post |
| `src/hooks/useArticlesSaas.ts` | Añadir taxonomías al interface de publicación |
| `src/components/saas/WordPressPublishDialogSaas.tsx` | UI para seleccionar categorías/tags + sincronizar |
| `supabase/config.toml` | Registrar nueva edge function |

---

## Flujo Completo

```text
┌─────────────────────────────────────────────────────────────────┐
│                    GENERACIÓN DE ARTÍCULO                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Generar artículo español                                     │
│ 2. Guardar contenido SIN enlaces SEO                            │
│ 3. Traducir a catalán (si aplica) desde contenido limpio        │
│ 4. Añadir enlaces SEO al español                                │
│ 5. Añadir enlaces SEO al catalán                                │
│ 6. Guardar artículo con ambas versiones                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PUBLICACIÓN A WORDPRESS                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Usuario abre diálogo de publicación                          │
│ 2. Se cargan taxonomías sincronizadas (si existen)              │
│ 3. Usuario selecciona idiomas + categorías + tags               │
│ 4. Se envía POST con:                                           │
│    - lang: 'es' | 'ca' (para Polylang)                          │
│    - categories: [1, 5, 12] (IDs de WP)                         │
│    - tags: [3, 7] (IDs de WP)                                   │
│ 5. WordPress asigna taxonomías y idioma al post                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ejemplo de Resultado

### Artículo Español (con SEO footer)

```html
<h2>Estrategias de marketing digital</h2>
<p>Contenido del artículo...</p>

<h2>Cómo implementar estas técnicas</h2>
<p>Más contenido...</p>

<p><strong>¿Quieres más consejos?</strong> Visita 
<a href="https://farmapro.es/blog" target="_blank">nuestro blog</a> y 
<a href="https://instagram.com/farmapro" target="_blank">Instagram</a> 
para descubrir más contenido de FarmaPro.</p>
```

### Artículo Catalán (con SEO footer)

```html
<h2>Estratègies de màrqueting digital</h2>
<p>Contingut de l'article...</p>

<h2>Com implementar aquestes tècniques</h2>
<p>Més contingut...</p>

<p><strong>Vols més consells?</strong> Visita 
<a href="https://farmapro.es/blog" target="_blank">el nostre blog</a> i 
<a href="https://instagram.com/farmapro" target="_blank">Instagram</a> 
per descobrir més contingut de FarmaPro.</p>
```

