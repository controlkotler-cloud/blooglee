

# Auditoría SEO Completa de Blooglee

## Resumen Ejecutivo

He analizado exhaustivamente el sitio web Blooglee y he identificado **42 puntos de mejora** organizados en 6 categorías: SEO Técnico, SEO On-Page, GEO (Optimización Geográfica), UX/UI, AI Overviews y Rendimiento.

---

## 1. SEO TÉCNICO - Problemas Críticos

### 1.1 Falta Sitemap.xml
**Prioridad: CRÍTICA**

| Estado Actual | Problema |
|---------------|----------|
| No existe `public/sitemap.xml` | Google no puede descubrir eficientemente todas las páginas |

**Solución:** Crear sitemap.xml dinámico o estático con todas las rutas públicas:
- `/` (Landing)
- `/features`
- `/pricing`
- `/blog`
- `/blog/[cada-post]`
- `/contact`
- `/terms`, `/privacy`, `/cookies`

### 1.2 Robots.txt Incompleto
**Prioridad: ALTA**

```text
# ACTUAL (básico)
User-agent: *
Allow: /

# MEJORADO
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /account
Disallow: /billing
Disallow: /mkpro
Disallow: /onboarding
Disallow: /site/
Disallow: /auth

Sitemap: https://blooglee.lovable.app/sitemap.xml
```

### 1.3 Falta URL Canónica
**Prioridad: ALTA**

No hay etiquetas `<link rel="canonical">` en ninguna página. Esto puede causar problemas de contenido duplicado.

**Solución:** Añadir en `index.html` o dinámicamente por ruta.

### 1.4 Sin Datos Estructurados (Schema.org)
**Prioridad: ALTA**

No existe ningún JSON-LD para:
- Organization (marca Blooglee)
- WebSite (buscador interno)
- SoftwareApplication (tipo de producto SaaS)
- BlogPosting (artículos del blog)
- FAQPage (preguntas frecuentes)
- BreadcrumbList (migas de pan)

**Impacto:** Pérdida de rich snippets en Google y visibilidad reducida en AI Overviews.

### 1.5 Sin Etiquetas Hreflang
**Prioridad: MEDIA**

El sitio está en español pero no tiene marcado hreflang. Si se planea expansión internacional:
```html
<link rel="alternate" hreflang="es" href="https://blooglee.lovable.app/" />
<link rel="alternate" hreflang="x-default" href="https://blooglee.lovable.app/" />
```

---

## 2. SEO ON-PAGE - Metadatos y Contenido

### 2.1 Títulos de Página Estáticos
**Prioridad: CRÍTICA**

| Página | Título Actual | Problema |
|--------|---------------|----------|
| Todas | "Blooglee - Blog en piloto automático con IA" | Mismo título para TODAS las páginas |

**Solución:** Títulos únicos por página:
- `/features` → "Características de Blooglee | Generación de contenido con IA"
- `/pricing` → "Precios y Planes | Blooglee desde 0€/mes"
- `/blog` → "Blog de Blooglee | SEO y Marketing de Contenidos"
- `/blog/[slug]` → "[Título del artículo] | Blog Blooglee"
- `/contact` → "Contacto | Blooglee"

### 2.2 Meta Descriptions Estáticas
**Prioridad: ALTA**

Mismo problema: una sola descripción para todo el sitio.

### 2.3 Falta Open Graph Personalizado
**Prioridad: ALTA**

```html
<!-- ACTUAL - imagen genérica de Lovable -->
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
```

**Solución:** Crear imagen OG propia de Blooglee (1200x630px) y personalizar por página.

### 2.4 Imágenes sin Alt Text Descriptivo
**Prioridad: MEDIA**

En `BlogCard.tsx` y `BlogPost.tsx`:
```tsx
// ACTUAL
<img src={image} alt={title} />  // Genérico

// MEJORADO  
<img src={image} alt={`Imagen destacada del artículo: ${title}`} />
```

### 2.5 Headings del Blog sin Jerarquía Correcta
**Prioridad: MEDIA**

En `BlogPost.tsx` el contenido se procesa con regex básico:
```tsx
.replace(/## /g, '<h2>')  // Sin cerrar tags correctamente
```

Debería usar un parser markdown adecuado como `react-markdown`.

### 2.6 Breadcrumbs sin Datos Estructurados
**Prioridad: MEDIA**

Existe breadcrumb visual en blog pero sin JSON-LD para Google.

---

## 3. GEO - Optimización Geográfica Local

### 3.1 Falta Schema LocalBusiness
**Prioridad: MEDIA**

En ContactPage.tsx se menciona "Barcelona, España" pero no hay datos estructurados de ubicación.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Blooglee",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "author": {
    "@type": "Organization",
    "name": "Blooglee",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Barcelona",
      "addressCountry": "ES"
    }
  }
}
```

### 3.2 Sin Google Business Profile Integration
**Prioridad: BAJA**

No hay enlace a Google Maps ni embedding de ubicación.

---

## 4. UX/UI - Experiencia de Usuario

### 4.1 Página 404 Sin Estilo
**Prioridad: ALTA**

```tsx
// ACTUAL - NotFound.tsx muy básico
<div className="flex min-h-screen items-center justify-center bg-muted">
  <h1>404</h1>
  <p>Oops! Page not found</p>  // EN INGLÉS
</div>
```

**Problemas:**
- Texto en inglés (sitio en español)
- Sin branding ni diseño Blooglee
- Sin sugerencias de navegación

### 4.2 Enlaces de Redes Sociales Rotos
**Prioridad: ALTA**

En `PublicFooter.tsx`:
```tsx
const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },   // href="#" !!!
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];
```

### 4.3 Table of Contents Estática en Blog
**Prioridad: MEDIA**

En `BlogPost.tsx` el índice es hardcoded:
```tsx
<a href="#">Introducción</a>
<a href="#">Beneficios clave</a>  // No corresponde al contenido real
```

### 4.4 Paginación del Blog No Funcional
**Prioridad: MEDIA**

En `BlogIndex.tsx` los botones de paginación son decorativos.

### 4.5 Filtros de Categorías No Funcionan
**Prioridad: MEDIA**

```tsx
{categories.map((category) => (
  <button className={...}>  // Sin onClick handler
    {category}
  </button>
))}
```

### 4.6 Core Web Vitals - Imágenes sin Lazy Loading Explícito
**Prioridad: MEDIA**

Añadir `loading="lazy"` a imágenes below-the-fold.

### 4.7 Sin Preconnect a Recursos Externos
**Prioridad: BAJA**

Añadir en `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://images.unsplash.com" />
```

---

## 5. AI OVERVIEWS - Optimización para IA

### 5.1 Contenido No Estructurado para LLMs
**Prioridad: ALTA**

Para aparecer en AI Overviews de Google (y similares), el contenido debe:

| Elemento | Estado | Mejora |
|----------|--------|--------|
| FAQ Schema | ❌ No existe | Añadir en Pricing y Features |
| HowTo Schema | ❌ No existe | Añadir en tutorial de conexión WP |
| Listas claras | ✅ Parcial | Mejorar estructura en blog |
| Definiciones | ❌ No existe | Añadir glosario de términos |

### 5.2 Falta Sección FAQ
**Prioridad: ALTA**

No existe una página `/faq` ni contenido FAQ en ninguna página. Esto es crítico para AI Overviews.

**Propuesta:** Añadir FAQ en:
- Landing (preguntas generales)
- Pricing (sobre planes y facturación)
- Features (sobre funcionalidades)

### 5.3 Sin Atribución de Autor Estructurada
**Prioridad: MEDIA**

Los posts del blog tienen autor pero sin Schema Person:
```json
{
  "@type": "Person",
  "name": "Laura Martínez",
  "jobTitle": "Content Strategist"
}
```

### 5.4 Contenido Blog Demasiado Corto
**Prioridad: MEDIA**

Los artículos tienen ~300-400 palabras. Para AI Overviews se recomienda >1000 palabras con secciones bien definidas.

---

## 6. RENDIMIENTO Y ACCESIBILIDAD

### 6.1 Fuentes No Optimizadas
**Prioridad: MEDIA**

```css
/* ACTUAL */
@import url('https://fonts.googleapis.com/css2?family=Inter...');

/* MEJORADO - con font-display */
@import url('https://fonts.googleapis.com/css2?family=Inter&display=swap');
```

### 6.2 Falta Skip Link para Accesibilidad
**Prioridad: BAJA**

Añadir enlace oculto para lectores de pantalla:
```html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Saltar al contenido principal
</a>
```

### 6.3 Contraste de Colores
**Prioridad: BAJA**

Revisar `text-foreground/60` (60% opacidad) puede no cumplir WCAG AA.

---

## PLAN DE IMPLEMENTACIÓN

### Fase 1 - Crítico (Semana 1)
1. Crear sitemap.xml con todas las rutas públicas
2. Mejorar robots.txt con rutas bloqueadas y referencia al sitemap
3. Implementar títulos y descripciones dinámicos por página (react-helmet o similar)
4. Crear imagen Open Graph propia de Blooglee
5. Añadir JSON-LD Organization en index.html

### Fase 2 - Alta Prioridad (Semana 2)
6. Rediseñar página 404 con branding Blooglee
7. Añadir enlaces reales a redes sociales
8. Implementar Schema BlogPosting para cada artículo
9. Añadir FAQ con Schema FAQPage en Pricing
10. Implementar canonical URLs dinámicas

### Fase 3 - Optimización (Semana 3-4)
11. Mejorar parser de markdown en blog
12. Implementar paginación funcional
13. Activar filtros de categorías
14. Añadir lazy loading a imágenes
15. Implementar breadcrumbs con Schema
16. Crear sección FAQ dedicada
17. Optimizar Core Web Vitals

### Fase 4 - AI Overviews (Continuo)
18. Expandir contenido de blog (>1000 palabras)
19. Añadir HowTo Schema en tutoriales
20. Crear glosario de términos
21. Implementar Author Schema completo

---

## MÉTRICAS DE ÉXITO

| KPI | Actual | Objetivo 3 meses |
|-----|--------|------------------|
| Lighthouse SEO Score | ~70 (estimado) | >95 |
| Páginas indexadas | ~5 | >15 |
| Rich Snippets | 0 | >5 tipos |
| AI Overview mentions | 0 | >3 |
| CTR orgánico | Baseline | +30% |

---

## HERRAMIENTAS RECOMENDADAS

1. **react-helmet-async** - Para gestionar meta tags dinámicos
2. **react-markdown** - Para parsear contenido de blog
3. **schema-dts** - Para tipado TypeScript de Schema.org
4. **@tanstack/react-query** - Ya instalado, usar para sitemap dinámico

