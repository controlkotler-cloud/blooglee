

## Plan: Crear Edge Function de Generación de Artículos SaaS con Bypass para Administradores

### Diagnóstico del Problema

El botón "Generar artículo" en los sitios SaaS solo muestra un toast "Generación de artículos SaaS próximamente" porque:

1. **No existe el edge function `generate-article-saas`** - solo hay un placeholder en `SiteDetail.tsx` (líneas 38-43)
2. **No hay hook para invocar la generación** - falta `useGenerateArticleSaas`
3. **No hay verificación de límites de plan** 
4. **Los administradores no tienen bypass de límites**

---

### Solución Propuesta

Crear un nuevo edge function `generate-article-saas` basado en `generate-article-empresa` pero adaptado para el modelo multi-tenant SaaS.

---

### Archivos a Crear

#### 1. Edge Function: `supabase/functions/generate-article-saas/index.ts`

Funcionalidad principal:
- Recibir `siteId` y validar que pertenece al usuario autenticado
- **Verificar rol de admin** usando `user_roles` table → si es admin, bypass de límites
- Verificar límites de plan del usuario (posts_limit en profiles)
- Contar artículos generados este mes
- Si no es admin y excede límite → error 403
- Generar tema único consultando temas usados en tabla `articles`
- Generar artículo usando Lovable AI (Google Gemini)
- Buscar imagen en Unsplash
- Guardar en tabla `articles` con `user_id` y `site_id`

```typescript
// Estructura clave de verificación de admin
async function isUserAdmin(supabase, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  return data?.some(r => r.role === 'admin') || false;
}

// En el handler principal:
const isAdmin = await isUserAdmin(supabase, user.id);

if (!isAdmin) {
  // Verificar límites de plan
  const articlesThisMonth = await countArticlesThisMonth(supabase, userId, month, year);
  const { posts_limit } = profile;
  
  if (articlesThisMonth >= posts_limit) {
    return new Response(JSON.stringify({ 
      error: "Has alcanzado tu límite mensual de artículos",
      limit: posts_limit,
      current: articlesThisMonth
    }), { status: 403 });
  }
}
// Admins continúan sin restricciones
```

---

#### 2. Hook: Actualizar `src/hooks/useArticlesSaas.ts`

Añadir mutation para generar artículos:

```typescript
interface GenerateArticleParams {
  siteId: string;
  topic?: string | null;
}

export function useGenerateArticleSaas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams) => {
      if (!user?.id) throw new Error('No user logged in');
      
      const { data, error } = await supabase.functions.invoke('generate-article-saas', {
        body: {
          siteId: params.siteId,
          topic: params.topic || null,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Artículo generado correctamente');
    },
    onError: (error: any) => {
      if (error?.message?.includes('límite')) {
        toast.error('Has alcanzado tu límite mensual de artículos');
      } else {
        toast.error('Error al generar el artículo');
      }
    }
  });
}
```

---

#### 3. Actualizar `src/pages/SiteDetail.tsx`

Reemplazar el placeholder por la llamada real:

```typescript
import { useGenerateArticleSaas } from '@/hooks/useArticlesSaas';

// En el componente:
const generateMutation = useGenerateArticleSaas();

const handleGenerateArticle = async () => {
  if (!site) return;
  generateMutation.mutate({ siteId: site.id });
};

// En el JSX:
<Button 
  onClick={handleGenerateArticle} 
  disabled={generateMutation.isPending}
>
  {generateMutation.isPending ? (
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  ) : (
    <Sparkles className="w-4 h-4 mr-2" />
  )}
  Generar artículo
</Button>
```

---

#### 4. Actualizar `src/pages/SaasDashboard.tsx`

Misma lógica para el botón de generación en las tarjetas del dashboard.

---

### Flujo de Verificación de Límites

```text
Usuario hace clic en "Generar artículo"
        │
        ▼
Edge Function recibe request con JWT
        │
        ▼
Extrae user_id del token
        │
        ▼
┌───────────────────────────────┐
│ ¿Usuario tiene rol 'admin'?  │
└───────────────────────────────┘
        │
   ┌────┴────┐
   │         │
  SÍ        NO
   │         │
   │         ▼
   │   Obtener profile.posts_limit
   │         │
   │         ▼
   │   Contar artículos del mes
   │         │
   │         ▼
   │   ┌─────────────────────────┐
   │   │ artículos >= límite?    │
   │   └─────────────────────────┘
   │         │
   │    ┌────┴────┐
   │   SÍ        NO
   │    │         │
   │    ▼         │
   │  Error 403   │
   │  "Límite     │
   │  alcanzado"  │
   │              │
   └──────────────┴──────────────┐
                                 │
                                 ▼
                         Generar artículo
                                 │
                                 ▼
                         Guardar en 'articles'
                                 │
                                 ▼
                         Respuesta exitosa
```

---

### Estructura del Edge Function

El edge function seguirá la misma estructura que `generate-article-empresa` pero adaptado:

| Aspecto | generate-article-empresa | generate-article-saas |
|---------|-------------------------|----------------------|
| Tabla destino | `articulos_empresas` | `articles` |
| ID entidad | `empresa_id` | `site_id` |
| Tabla config | `empresas` | `sites` |
| Autenticación | No validada | JWT requerido + RLS |
| Límites | No implementados | Verificación de `profiles.posts_limit` |
| Bypass admin | No aplica | Verificación de `user_roles.role = 'admin'` |

---

### Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/generate-article-saas/index.ts` | **CREAR** - Edge function completa |
| `src/hooks/useArticlesSaas.ts` | Añadir `useGenerateArticleSaas` mutation |
| `src/pages/SiteDetail.tsx` | Reemplazar placeholder por mutation real |
| `src/pages/SaasDashboard.tsx` | Actualizar `handleGenerateArticle` |
| `supabase/config.toml` | Añadir configuración del nuevo function |

---

### Beneficios para Administradores

- Los usuarios con rol `admin` en `user_roles` podrán generar artículos **sin límite**
- Ideal para testing y demostración del producto
- Los usuarios normales respetarán los límites de su plan (`free`=1, `starter`=4, `pro`=30, `agency`=100)

