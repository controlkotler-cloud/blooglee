
# Auditoria y Limpieza del SaaS Blooglee

## Resumen

Tras revisar el proyecto completo (frontend, hooks, Edge Functions y base de datos), he identificado **archivos muertos**, **componentes sin usar** y **Edge Functions huerfanas** que se pueden eliminar de forma segura para reducir el peso del proyecto y mejorar la mantenibilidad.

---

## 1. Archivos Frontend que se pueden ELIMINAR

### Paginas muertas (sin ruta en App.tsx)

| Archivo | Razon |
|---------|-------|
| `src/pages/Index.tsx` | Pagina MKPro legacy duplicada. MKPro.tsx es la copia activa usada en la ruta `/mkpro`. Index.tsx no se importa en ningun sitio. |
| `src/pages/Onboarding.tsx` (423 lineas) | Onboarding viejo de 3 pasos. Reemplazado por `OnboardingWizard`. No se importa en App.tsx ni en ningun otro archivo. |

### Componentes sin importar

| Archivo | Razon |
|---------|-------|
| `src/components/saas/ContentProfileCard.tsx` | Cero importaciones en todo el proyecto. |
| `src/components/marketing/AudienceTabs.tsx` | Cero importaciones en todo el proyecto. |

### Hooks comentados / sin uso real

| Archivo | Razon |
|---------|-------|
| `src/hooks/useOnboardingTour.ts` | Solo aparece comentado en SaasDashboard.tsx (`// import`). El tour con driver.js fue reemplazado por el wizard + checklist. |
| `src/components/saas/OnboardingTour.tsx` | Mismo caso: solo aparece comentado. |

### Datos estaticos potencialmente muertos

| Archivo | Razon |
|---------|-------|
| `src/data/blogPosts.ts` | Cero importaciones. Los blog posts ahora se leen de la tabla `blog_posts` de la BD via `useBlogPosts`. Este archivo era el listado estatico original. |

---

## 2. Edge Functions que se pueden ELIMINAR

| Funcion | Razon |
|---------|-------|
| `clean-blog-headers/` | Cero referencias en frontend ni en otras Edge Functions. Funcion de mantenimiento puntual ya ejecutada. |
| `fix-blog-false-claims/` | Cero referencias en ningun sitio. Funcion de correccion puntual ya ejecutada. |

**Nota:** `cleanup-orphan-images/` y `update-seo-assets/` SI se usan (la primera es autonoma, la segunda se llama desde `generate-monthly-articles`), asi que NO se eliminan.

**Nota sobre `serve-rss/` y `serve-sitemap/`:** Aunque no se invocan desde el frontend, son funciones que responden a peticiones externas (bots, lectores RSS). NO se eliminan.

---

## 3. Base de datos: tablas OK

Todas las tablas actuales tienen uso activo:
- Las tablas MKPro (`farmacias`, `empresas`, `articulos`, `articulos_empresas`, `wordpress_sites`, `wordpress_taxonomies`, `wordpress_site_default_taxonomies`) se usan desde MKPro.tsx y las Edge Functions protegidas.
- `wordpress_diagnostics` se usa desde el flujo de WordPress (WPUrlCheck, WordPressSetup).
- `pending_surveys` se usa desde useAdminSurveys.
- `sector_contexts` se usa desde regenerate-image.

**No hay tablas huerfanas que eliminar.**

---

## 4. Detalle tecnico de los cambios

### Paso 1: Eliminar archivos frontend muertos
- Borrar `src/pages/Index.tsx` (531 lineas de codigo MKPro duplicado)
- Borrar `src/pages/Onboarding.tsx` (423 lineas del onboarding viejo)
- Borrar `src/data/blogPosts.ts` (datos estaticos reemplazados por BD)
- Borrar `src/components/saas/ContentProfileCard.tsx`
- Borrar `src/components/marketing/AudienceTabs.tsx`
- Borrar `src/components/saas/OnboardingTour.tsx`
- Borrar `src/hooks/useOnboardingTour.ts`

### Paso 2: Limpiar imports comentados
- En `src/pages/SaasDashboard.tsx`: eliminar las 2 lineas comentadas que referencian OnboardingTour y useOnboardingTour.

### Paso 3: Eliminar Edge Functions muertas
- Borrar `supabase/functions/clean-blog-headers/`
- Borrar `supabase/functions/fix-blog-false-claims/`
- Eliminar las funciones desplegadas en el backend con la herramienta de borrado.

---

## 5. Lo que NO se toca (zona protegida MKPro)

Conforme a las reglas de arquitectura, NO se modifica nada en:
- `src/components/pharmacy/*`
- `src/components/company/*`
- Hooks MKPro (`useFarmacias`, `useArticulos`, `useEmpresas`, etc.)
- Edge Functions MKPro (`generate-article/`, `generate-article-empresa/`, etc.)
- `src/pages/MKPro.tsx`

---

## Impacto estimado

- ~1.000 lineas de codigo muerto eliminadas
- 2 Edge Functions innecesarias menos en produccion
- 7 archivos frontend eliminados
- Sin cambios funcionales: nada se rompe porque ninguno de estos archivos esta referenciado
