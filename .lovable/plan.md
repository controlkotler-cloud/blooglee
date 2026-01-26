
## Plan: Añadir Regenerar Imagen + Import/Export para SaaS

### Resumen de Funcionalidades

| Funcionalidad | Estado Actual | Implementación |
|---------------|---------------|----------------|
| Botón "Cambiar imagen" en preview | ❌ No existe | Reutilizar `regenerate-image` existente |
| Import/Export sitios y artículos | ❌ No existe | Nuevo componente `SiteImportExport.tsx` |

---

## PARTE 1: Regenerar Imagen en ArticlePreviewDialog

### Análisis del MKPro (ArticlePreview.tsx)

En MKPro, el botón "Cambiar" aparece debajo de la imagen (líneas 150-166):
- Props: `onRegenerateImage` y `isRegeneratingImage`
- Botón pequeño con icono `ImagePlus`
- Invoca el edge function `regenerate-image` existente

### Cambios Necesarios

#### 1.1 Añadir hook `useRegenerateImageSaas` en `src/hooks/useArticlesSaas.ts`

```typescript
interface RegenerateImageParams {
  articleId: string;
  pexelsQuery: string;
  articleTitle?: string;
  articleContent?: string;
  companySector?: string;
  usedImageUrls?: string[];
}

export function useRegenerateImageSaas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RegenerateImageParams) => {
      const { data, error } = await supabase.functions.invoke('regenerate-image', {
        body: {
          pexelsQuery: params.pexelsQuery,
          articleTitle: params.articleTitle,
          articleContent: params.articleContent,
          companySector: params.companySector,
          usedImageUrls: params.usedImageUrls || []
        }
      });
      
      if (error) throw error;
      if (!data?.url) throw new Error('No se obtuvo imagen');
      
      // Actualizar el artículo con la nueva imagen
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          image_url: data.url,
          image_photographer: data.photographer,
          image_photographer_url: data.photographer_url
        })
        .eq('id', params.articleId);
        
      if (updateError) throw updateError;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Imagen actualizada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });
}
```

#### 1.2 Modificar `ArticlePreviewDialog.tsx`

Añadir props y botón "Cambiar imagen":

```typescript
interface ArticlePreviewDialogProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
  siteSector?: string;  // NUEVO: para contexto de imagen
}
```

En la sección de imagen (línea 93-124), añadir botón:

```typescript
{article.image_url && (
  <div className="space-y-2">
    {/* ... imagen existente ... */}
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Foto por{' '}
        <a href={article.image_photographer_url || '#'} ...>
          {article.image_photographer}
        </a>
      </p>
      {/* NUEVO: Botón cambiar imagen */}
      <Button 
        onClick={handleRegenerateImage} 
        disabled={isRegeneratingImage}
        variant="ghost"
        size="sm"
        className="text-xs"
      >
        {isRegeneratingImage ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <ImagePlus className="w-3 h-3 mr-1" />
        )}
        Cambiar
      </Button>
    </div>
  </div>
)}
```

#### 1.3 Modificar `SiteArticles.tsx`

Pasar el sector del sitio al diálogo de preview para contexto de regeneración de imagen.

---

## PARTE 2: Import/Export para SaaS

### Análisis del MKPro

`CompanyImportExport.tsx` incluye:
- **Exportar sitios a CSV**: nombre, localidad, sector, catalán, auto_generate, tema, urls
- **Importar sitios desde CSV**: con auto-detección de catalán por ubicación
- **Exportar artículos a JSON**: filtrado por mes/año

### Nuevo Componente: `src/components/saas/SiteImportExport.tsx`

Basado en `CompanyImportExport.tsx` pero adaptado para:
- Usar `Site` en lugar de `Empresa`
- Usar `Article` en lugar de `ArticuloEmpresa`
- Incluir `description` como campo opcional
- Validar contra límite de sitios del plan

#### Estructura del CSV de Sitios SaaS

```csv
nombre,localidad,sector,descripcion,catalan,generacion_automatica,tema_personalizado,url_blog,url_instagram
"Mi Negocio","Barcelona","Hostelería","Restaurante de comida italiana","sí","sí","","https://blog.com","https://instagram.com/negocio"
```

#### Funciones Principales

```typescript
// Auto-detección de catalán (reutilizar constante CATALAN_LOCATIONS)
function shouldIncludeCatalan(location: string): boolean;

// Escape/parse CSV robusto
function escapeCSV(value: string | null | undefined): string;
function parseCSVLine(line: string): string[];

// Exportar sitios
const exportSitesCSV = () => {
  const headers = ["nombre", "localidad", "sector", "descripcion", "catalan", 
                   "generacion_automatica", "tema_personalizado", "url_blog", "url_instagram"];
  // ...generar CSV con BOM para Excel
};

// Exportar artículos del mes
const exportArticlesJSON = () => {
  const monthArticles = articles.filter(a => a.month === selectedMonth && a.year === selectedYear);
  // ...generar JSON
};

// Importar sitios
const handleFileImport = (e) => {
  // Parsear CSV
  // Auto-detectar catalán
  // Validar límite de sitios del plan
  // Llamar callback de importación
};
```

#### 2.1 Hook para importar sitios masivamente

Añadir en `src/hooks/useSites.ts`:

```typescript
export function useImportSites() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sites: SiteInput[]): Promise<Site[]> => {
      if (!user?.id) throw new Error('No user logged in');
      
      const sitesToInsert = sites.map(site => ({
        user_id: user.id,
        name: site.name,
        sector: site.sector ?? null,
        description: site.description ?? null,
        location: site.location ?? null,
        geographic_scope: site.geographic_scope ?? 'local',
        languages: site.languages ?? ['spanish'],
        blog_url: site.blog_url ?? null,
        instagram_url: site.instagram_url ?? null,
        auto_generate: site.auto_generate ?? true,
        custom_topic: site.custom_topic ?? null,
        include_featured_image: site.include_featured_image ?? true,
        publish_frequency: site.publish_frequency ?? 'monthly',
      }));

      const { data, error } = await supabase
        .from('sites')
        .insert(sitesToInsert)
        .select();

      if (error) throw error;
      return data as Site[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success(`${data.length} sitios importados correctamente`);
    },
    onError: (error) => {
      console.error('Error importing sites:', error);
      toast.error('Error al importar sitios');
    },
  });
}
```

#### 2.2 Integración en el Dashboard

Añadir el componente `SiteImportExport` en `SaasDashboard.tsx` después de la lista de sitios, en una sección colapsable o siempre visible.

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/saas/SiteImportExport.tsx` | Componente import/export para sitios SaaS |

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useArticlesSaas.ts` | Añadir hook `useRegenerateImageSaas` |
| `src/hooks/useSites.ts` | Añadir hook `useImportSites` |
| `src/components/saas/ArticlePreviewDialog.tsx` | Añadir botón "Cambiar imagen" con props `siteSector` |
| `src/components/saas/SiteArticles.tsx` | Pasar `siteSector` al preview |
| `src/pages/SiteDetail.tsx` | Pasar sector al componente SiteArticles |
| `src/pages/SaasDashboard.tsx` | Integrar `SiteImportExport` |

---

## Flujo de Regeneración de Imagen

```text
Usuario hace clic en "Cambiar"
        │
        ▼
Se invoca hook useRegenerateImageSaas
        │
        ▼
Edge function regenerate-image
        │
        ▼
Busca nueva imagen en Unsplash
(usando sector del sitio como contexto)
        │
        ▼
Actualiza tabla articles con nueva URL
        │
        ▼
Invalida query cache → UI actualizada
```

---

## Flujo de Import/Export

```text
┌─────────────────────────────────────────────┐
│              EXPORTAR                        │
├─────────────────────────────────────────────┤
│ Sitios → CSV con campos completos           │
│ Artículos → JSON del mes seleccionado       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              IMPORTAR                        │
├─────────────────────────────────────────────┤
│ 1. Usuario sube archivo CSV                 │
│ 2. Parseo de líneas con soporte de comillas │
│ 3. Auto-detección de catalán por ubicación  │
│ 4. Validación: tema requerido si no auto    │
│ 5. Verificar límite de sitios del plan      │
│ 6. Inserción masiva en DB                   │
│ 7. Toast con resumen (X importados, Y auto) │
└─────────────────────────────────────────────┘
```

---

## Ejemplo de CSV para Importar

```csv
nombre,localidad,sector,descripcion,catalan,generacion_automatica,tema_personalizado,url_blog,url_instagram
"Restaurante La Plaza","Barcelona","Hostelería","Cocina mediterránea","sí","sí","","https://laplaza.es/blog",""
"Clínica Dental Sonrisa","Sabadell","Salud","Odontología general","","sí","","","https://instagram.com/clinicasonrisa"
"Taller Mecánico García","Madrid","Automoción","","no","no","Consejos de mantenimiento de coches","",""
```

Notas:
- Catalán vacío = auto-detectado (Sabadell → sí)
- Si `generacion_automatica = no`, `tema_personalizado` es obligatorio
- URLs opcionales

---

## Validaciones de Seguridad

1. **Límite de sitios**: Antes de importar, verificar que `sitios_actuales + sitios_a_importar <= sites_limit`
2. **Validación de campos**: nombre y localidad son obligatorios
3. **Sanitización**: Escapar caracteres especiales en CSV
4. **User ID**: Siempre asignar `user_id` del usuario autenticado en la inserción
