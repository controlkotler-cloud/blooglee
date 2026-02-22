# Plan de Mejora de Trafico para Blooglee

## Diagnostico

Con 284 visitantes en un mes y buen engagement (5 pag/visita), el problema no es la retencion sino la **adquisicion**. El sitio funciona bien una vez llega el usuario, pero Google no lo encuentra facilmente.

---

## Fase 1: Correcciones Criticas (Impacto inmediato)

### 1.1 Corregir FAQ de la Landing

- Cambiar "GPT-5 y Gemini" por "Gemini 2.5 Flash de Google" en la FAQ
- Corregir "800-1200 palabras" por "800-2500 palabras" (el producto real soporta hasta 2500)
- Esto mejora la coherencia para AEO (ChatGPT, Perplexity, etc.)

### 1.2 Activar el boton "Ver demo"

- Convertirlo en un enlace a `/como-funciona` 
- Actualmente es un `<button>` sin funcionalidad

### 1.3 Ocultar URL de Supabase en el RSS

- Cambiar la URL del RSS en `index.html` para usar el dominio propio (`https://blooglee.com/rss.xml`)
- Configurar un redirect o proxy si es necesario

---

## Fase 2: SEO Tecnico (Impacto medio plazo)

### 2.1 Pre-renderizado para paginas criticas

- Implementar `vite-plugin-prerender` o similar para generar HTML estatico de:
  - `/` (Landing)
  - `/pricing`
  - `/features`
  - `/como-funciona`
  - `/para/clinicas`, `/para/agencias-marketing`, `/para/tiendas-online`, `/para/autonomos`
  - `/alternativas`, `/alternativas/*`
  - `/blog` (index)
  - `/blog/:slug` (cada post individual)
- Esto permite que Google indexe contenido real sin ejecutar JavaScript
- **Es la mejora con mayor impacto potencial para SEO**

### 2.2 Mejorar meta tags dinamicos

- Anadir `article:tag` con las `seo_keywords` de cada blog post
- Incluir `og:locale:alternate` para cataln si aplica
- Anadir `meta name="author"` dinamico por post

### 2.3 Sitemap dinamico mejorado

- El sitemap actual es estatico y no incluye todos los blog posts automaticamente
- Ya existe `serve-sitemap` como edge function, pero el `sitemap.xml` estatico puede estar desactualizado
- Asegurar que `robots.txt` apunta al sitemap dinamico

---

## Fase 3: Contenido y Conversion (Impacto continuo)

### 3.2 Ampliar interlinking del blog

- Los posts del blog deben enlazar a las paginas de casos de uso y features
- Anadir un sidebar o seccion "Articulos relacionados" en cada post
- Esto mejora el crawl depth y distribuye autoridad

### 3.4 Mejorar la densidad de CTAs en el blog

- Anadir un banner CTA dentro de cada post de blog (a mitad y al final)
- Actualmente los posts del blog no tienen CTAs claros hacia el producto

---


| &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| ------ | ------ | ------ | ------ |
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; | &nbsp; | &nbsp; | &nbsp; |
