
# Audit completo post-cambios: Estado de optimizacion

## Resumen ejecutivo

Despues de revisar toda la web, base de datos, edge functions y configuracion SEO, el estado general es **bueno**. Los cambios recientes se han implementado correctamente. Sin embargo, he detectado **6 problemas** que conviene corregir, ordenados por impacto.

---

## Estado actual: Lo que funciona correctamente

- **SEOHead dinamico**: Todas las 18+ paginas publicas usan el componente SEOHead con title, description, canonical, OG tags y Twitter Cards unicos
- **Sitemap dinamico** (serve-sitemap): Funciona correctamente, devuelve XML valido con todas las paginas estaticas + blog posts de la BD. Cache de 1h. Status 200.
- **RSS Feed** (serve-rss): Funciona correctamente, RSS 2.0 valido con atom:link, author, category, pubDate. Cache de 1h. Status 200.
- **Lazy loading**: Implementado en BlogCard, ArticleCard, ArticlePreviewDialog, SocialContentCard y avatar sidebar del blog. Featured image del blog NO tiene lazy (correcto para LCP).
- **Internal linking**: injectInternalLinks funciona con max 3 links, sin tocar tags `<a>` existentes
- **Headings H2/H3**: parseContent convierte correctamente markdown a HTML con IDs para ToC
- **Structured Data**: JSON-LD en index.html (SoftwareApplication + WebSite), FAQSchema en Landing/Pricing/Features, BlogPostingSchema + BreadcrumbSchema en cada post
- **robots.txt**: Completo con bots de IA, buscadores, redes sociales. Apunta al sitemap dinamico.

---

## Problemas detectados

### 1. Skip Link roto (Accesibilidad - Medio)

En `index.html` hay un skip link que apunta a `#main-content`, pero no existe ningun elemento con `id="main-content"` en toda la app. El atributo no esta en el `<main>` de `PublicLayout.tsx` ni en ninguna otra pagina.

**Solucion**: Anadir `id="main-content"` al tag `<main>` en `PublicLayout.tsx`.

---

### 2. RSS href incorrecto en index.html (SEO - Medio)

El tag RSS en `index.html` apunta a `https://blooglee.com/rss.xml`, pero el endpoint real es la edge function `serve-rss` en `https://gqtikajhhggyoiypkbgw.supabase.co/functions/v1/serve-rss`. No hay redirect ni proxy configurado, asi que los crawlers que sigan ese link obtendran un 404.

**Solucion**: O bien configurar un redirect en el hosting, o cambiar el href al endpoint real de la edge function (menos limpio pero funcional). Lo ideal seria mantener `/rss.xml` y servir el contenido a traves de una rewrite rule o redirect.

---

### 3. OG tags duplicados potenciales en index.html (SEO - Bajo)

`index.html` todavia tiene `og:site_name` y `og:locale` hardcoded. Aunque no conflictan directamente con SEOHead (que no emite esos dos), es mejor tenerlos centralizados en SEOHead para consistencia.

**Solucion**: Mover `og:site_name` y `og:locale` al componente SEOHead.

---

### 4. Landing.tsx no usa PublicLayout (Consistencia - Bajo)

Landing.tsx tiene su propia estructura con `PublicNavbar` y `PublicFooter` directamente, en vez de usar `PublicLayout`. Esto no es un bug pero rompe la consistencia y significa que si se actualiza PublicLayout (ej: anadir el `id="main-content"`), Landing no se beneficiara.

**Solucion**: Refactorizar Landing.tsx para usar PublicLayout.

---

### 5. Falta `id="main-content"` para el skip link (complementa #1)

El componente `PublicLayout.tsx` renderiza `<main>` sin ningun `id`. Esto es necesario para accesibilidad.

**Solucion**: Cambiar `<main className="relative z-10 pt-24 sm:pt-28">` a `<main id="main-content" className="relative z-10 pt-24 sm:pt-28">`.

---

### 6. Blog images: primeras 2 no deberian tener lazy loading (Rendimiento - Bajo)

El requisito era que en `/blog` las primeras 2 imagenes no tuvieran lazy loading. Actualmente, `BlogCard.tsx` aplica `loading="lazy"` a TODAS las imagenes sin distincion. El componente no recibe un indice para saber si es una de las primeras 2.

**Solucion**: Pasar una prop `priority` o `index` a BlogCard desde BlogIndex, y condicionar el `loading` attribute.

---

## Cambios propuestos

### Archivo 1: `src/components/marketing/PublicLayout.tsx`
- Anadir `id="main-content"` al tag `<main>`

### Archivo 2: `src/components/seo/SEOHead.tsx`
- Anadir `og:site_name` y `og:locale` al output dinamico

### Archivo 3: `index.html`
- Eliminar los tags hardcoded `og:site_name` y `og:locale`
- Corregir el href del RSS para que apunte al endpoint real de la edge function

### Archivo 4: `src/components/marketing/BlogCard.tsx`
- Anadir prop opcional `priority?: boolean` para controlar lazy loading

### Archivo 5: `src/pages/BlogIndex.tsx`
- Pasar `priority={true}` a las primeras 2 BlogCards para evitar lazy loading en ellas

### Archivo 6: `src/pages/Landing.tsx`
- Refactorizar para usar `PublicLayout` en vez de structure manual con NavBar/Footer

---

## Lo que NO necesita cambios

- Edge functions `serve-sitemap` y `serve-rss`: funcionan correctamente
- `robots.txt`: completo y bien estructurado
- Base de datos: RLS policies correctas, indices optimizados
- `supabase/config.toml`: todas las functions con `verify_jwt = false` correcto
- Blog rendering: parseContent, headings, ToC, internal links - todo OK
- Lazy loading en componentes SaaS/Admin - correcto
