
# Plan: Actualizar todas las referencias de dominio a blooglee.com

## Resumen del problema
El dominio `blooglee.com` ya está configurado y es el principal, pero quedan 116 referencias al dominio anterior (`blooglee.lovable.app`) repartidas en 9 archivos del proyecto.

## Archivos a actualizar

| Archivo | Referencias | Cambio |
|---------|-------------|--------|
| `index.html` | 12 | URLs en canonical, hreflang, Open Graph, Twitter Cards, JSON-LD |
| `src/components/seo/SEOHead.tsx` | 2 | Constante `BASE_URL` |
| `src/components/seo/JsonLd.tsx` | 4 | URLs en schemas de Organization y Publisher |
| `public/llms.txt` | 9 | URL oficial y enlaces a recursos |
| `public/llms-full.txt` | 3 | URLs de contacto y ayuda |
| `public/robots.txt` | 1 | Comentario de cabecera |
| `src/data/blogPosts.ts` | ~85 | Enlaces dentro del contenido de los artículos |

## Cambios detallados

### 1. index.html (archivo raíz)
Actualizar todas las URLs hardcodeadas:
- `<link rel="canonical">`
- `<link rel="alternate" hreflang>`
- `<meta property="og:image">`
- `<meta property="og:url">`
- `<meta name="twitter:image">`
- JSON-LD `url`, `logo`, `target` para SearchAction

### 2. SEOHead.tsx
Cambiar la constante:
```typescript
const BASE_URL = 'https://blooglee.com';
```

### 3. JsonLd.tsx
Actualizar URLs en:
- `url: 'https://blooglee.com'`
- `logo: 'https://blooglee.com/favicon.png'`
- Publisher logo URL

### 4. public/llms.txt
Actualizar:
- URL oficial
- Todos los enlaces a recursos (features, pricing, blog, contact, terms, privacy)

### 5. public/llms-full.txt
Actualizar:
- URL de contacto Web
- URL de ayuda

### 6. public/robots.txt
Actualizar comentario de cabecera (ya se actualizó el Sitemap anteriormente)

### 7. src/data/blogPosts.ts
Actualizar todos los enlaces dentro del contenido de los artículos:
- CTAs con enlaces a blooglee.com
- Referencias al sitio en tutoriales
- Cualquier mención a la URL

## Lo que no cambia
- La estructura de archivos
- La lógica de los componentes
- Las rutas de la aplicación
- Configuración de Supabase

## Resultado esperado
- Todas las URLs apuntan a `blooglee.com`
- SEO consistente con el dominio principal
- Open Graph y Twitter Cards funcionan correctamente
- Los archivos llms.txt usan el dominio correcto para que las IAs encuentren Blooglee
- Google Search Console indexa el dominio correcto
