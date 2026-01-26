

## Plan: Implementar Publicación a WordPress para Sitios SaaS

### Problema Identificado

El botón "Publicar" en los artículos de SaaS muestra "Publicación en WordPress próximamente" (línea 68-71 de `SiteArticles.tsx`) porque:

1. **El edge function `publish-to-wordpress`** solo busca credenciales en `wordpress_sites` (MKPro) con `farmacia_id` o `empresa_id`
2. **Los sitios SaaS** usan la tabla `wordpress_configs` con `site_id`
3. **No existe** diálogo de publicación ni hook para invocar la función

---

### Solución

Crear un nuevo edge function `publish-to-wordpress-saas` siguiendo las reglas de separación MKPro/SaaS y un componente de diálogo de publicación.

---

### Archivos a Crear

#### 1. Edge Function: `supabase/functions/publish-to-wordpress-saas/index.ts`

Funcionalidad:
- Recibir `site_id` y validar que pertenece al usuario autenticado
- Buscar credenciales en `wordpress_configs` (tabla SaaS)
- Subir imagen destacada si existe
- Publicar artículo vía WordPress REST API
- Soportar borrador, publicación inmediata y programada

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
}
```

#### 2. Componente: `src/components/saas/WordPressPublishDialogSaas.tsx`

Basado en `WordPressPublishDialog.tsx` de farmacias pero adaptado:
- Usa `site_id` en lugar de `farmacia_id`
- Consulta `wordpress_configs` para verificar si hay WP configurado
- Selector de idiomas (español/catalán)
- Opciones de publicación: ahora, borrador, programar
- Muestra resultados con link al post publicado

#### 3. Hook: Añadir a `src/hooks/useArticlesSaas.ts`

```typescript
export function usePublishToWordPressSaas() {
  return useMutation({
    mutationFn: async (input: PublishInput) => {
      const { data, error } = await supabase.functions.invoke('publish-to-wordpress-saas', {
        body: input
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (result) => {
      toast.success('Artículo publicado en WordPress');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });
}
```

---

### Archivos a Modificar

#### 4. `src/components/saas/SiteArticles.tsx`

Reemplazar el placeholder por el diálogo real:

```typescript
// Antes (línea 68-71)
const handlePublish = (article: Article) => {
  toast.info('Publicación en WordPress próximamente');
};

// Después
const [publishArticle, setPublishArticle] = useState<Article | null>(null);

const handlePublish = (article: Article) => {
  setPublishArticle(article);
};

// En JSX, añadir el diálogo:
<WordPressPublishDialogSaas
  open={!!publishArticle}
  onClose={() => setPublishArticle(null)}
  article={publishArticle}
  siteId={siteId}
/>
```

#### 5. `src/components/saas/ArticlePreviewDialog.tsx`

Pasar `siteId` al diálogo y conectar con el diálogo de publicación.

#### 6. `supabase/config.toml`

Añadir configuración del nuevo edge function.

---

### Flujo de Publicación

```text
Usuario hace clic en "Publicar"
        │
        ▼
Abre WordPressPublishDialogSaas
        │
        ▼
Verifica si hay WordPress configurado
        │
   ┌────┴────┐
   │         │
  NO        SÍ
   │         │
   ▼         ▼
Mensaje:   Mostrar opciones:
"Configura  - Idiomas (ES/CA)
WordPress   - Publicar/Borrador/Programar
primero"    - Fecha si programar
   │         │
   │         ▼
   │    Edge Function invocado
   │         │
   │         ▼
   │    Busca credenciales en wordpress_configs
   │         │
   │         ▼
   │    Sube imagen si existe
   │         │
   │         ▼
   │    Publica vía REST API
   │         │
   │         ▼
   └─────────┴──> Muestra resultado con link
```

---

### Comparación de Tablas

| Aspecto | MKPro (Farmacias/Empresas) | SaaS |
|---------|---------------------------|------|
| Tabla credenciales | `wordpress_sites` | `wordpress_configs` |
| Campo entidad | `farmacia_id` / `empresa_id` | `site_id` |
| RLS | Sin user_id | Con user_id |
| Edge function | `publish-to-wordpress` | `publish-to-wordpress-saas` (nuevo) |

---

### Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/publish-to-wordpress-saas/index.ts` | **CREAR** |
| `src/components/saas/WordPressPublishDialogSaas.tsx` | **CREAR** |
| `src/hooks/useArticlesSaas.ts` | Añadir hook `usePublishToWordPressSaas` |
| `src/components/saas/SiteArticles.tsx` | Integrar diálogo de publicación |
| `src/components/saas/ArticlePreviewDialog.tsx` | Conectar botón "Publicar" |
| `supabase/config.toml` | Añadir función |

---

### Beneficios

- Los usuarios de SaaS podrán publicar artículos directamente a su WordPress
- Mantiene la separación con el módulo MKPro (tablas y funciones separadas)
- Soporta múltiples idiomas y programación de posts
- Verifica que WordPress esté configurado antes de mostrar opciones

