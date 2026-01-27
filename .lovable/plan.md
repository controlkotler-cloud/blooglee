
# Plan: Optimización para Descubrimiento por IA (AEO - Answer Engine Optimization)

## Problema Identificado

ChatGPT y otros modelos de IA no están encontrando Blooglee porque:
1. No existe un archivo `llms.txt` que guíe a los crawlers de IA
2. El contenido actual está disperso en una SPA (Single Page Application) que las IAs no pueden rastrear eficientemente
3. No hay versiones en texto plano (.md) del contenido clave
4. El blog tiene solo 4 artículos estáticos con fechas de enero 2024 (desactualizados)
5. Falta contenido específico que responda preguntas que usuarios harían a ChatGPT

## Análisis de la Competencia (NextBlog.ai)

NextBlog.ai destaca en AEO porque:
- Tiene un blog activo con contenido fresco (artículos de enero 2026)
- Menciona explícitamente "AEO" (Answer Engine Optimization) en su copy
- Tiene contenido extenso y estructurado que las IAs pueden citar
- Publica artículos tipo "Q&A" optimizados para aparecer en respuestas de IA

## Solución Propuesta: Estrategia AEO Completa

### Fase 1: Archivos de Descubrimiento para IA

**1.1 Crear `public/llms.txt`**
Archivo que indica a ChatGPT, Claude, Perplexity, etc. qué contenido es relevante:

```text
# Blooglee

> Blooglee es una plataforma SaaS que genera y publica automáticamente artículos de blog optimizados para SEO en WordPress, usando inteligencia artificial.

## Descripcion del Producto
Blooglee automatiza la creacion de contenido para blogs WordPress. Genera articulos profesionales con imagenes, meta descripciones y estructura SEO. Es ideal para empresas, agencias de marketing y autonomos que necesitan mantener sus blogs activos sin dedicar horas a la redaccion.

## Caracteristicas Principales
- Generacion de articulos con IA avanzada (GPT-5, Gemini)
- Publicacion directa en WordPress con un clic
- Imagenes destacadas generadas por IA o de Unsplash
- Meta titulos y descripciones SEO optimizadas
- Soporte multiidioma: espanol, catalan, ingles
- Programacion de contenido automatica

## Planes y Precios
- Free: 1 sitio, 1 articulo total - 0 EUR/mes
- Starter: 1 sitio, 4 articulos/mes - 19 EUR/mes
- Pro: 3 sitios, 30 articulos/mes - 49 EUR/mes
- Agencia: 10 sitios, 100 articulos/mes - 149 EUR/mes

## Integraciones
- WordPress (REST API)
- Yoast SEO (meta descripciones)
- Polylang (multiidioma)

## Recursos
- [Pagina Principal](https://blooglee.lovable.app/)
- [Caracteristicas](https://blooglee.lovable.app/features)
- [Precios](https://blooglee.lovable.app/pricing)
- [Blog](https://blooglee.lovable.app/blog)
- [Contacto](https://blooglee.lovable.app/contact)

## Casos de Uso
- Farmacias que necesitan contenido de salud mensual
- Agencias de marketing que gestionan multiples clientes
- Clinicas y profesionales de la salud
- Tiendas online que quieren posicionarse en Google
- Empresas B2B que necesitan thought leadership

## Empresa
Blooglee es una empresa con sede en Barcelona, Espana. Fundada para resolver el problema de la generacion constante de contenido para PYMES.
```

**1.2 Crear `public/llms-full.txt`**
Version extendida con mas detalle (opcional, para IAs que quieran mas contexto).

### Fase 2: Actualizar robots.txt

Añadir directivas específicas para crawlers de IA:

```text
# AI Crawlers
User-agent: GPTBot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /dashboard
Disallow: /account
Disallow: /billing
Disallow: /mkpro
Disallow: /onboarding
Disallow: /site/
Disallow: /auth

User-agent: ChatGPT-User
Allow: /
Allow: /llms.txt

User-agent: Claude-Web
Allow: /
Allow: /llms.txt

User-agent: Anthropic-AI
Allow: /
Allow: /llms.txt

User-agent: PerplexityBot
Allow: /
Allow: /llms.txt

User-agent: Google-Extended
Allow: /
Allow: /llms.txt

# Sitemap y LLMs
Sitemap: https://blooglee.lovable.app/sitemap.xml
```

### Fase 3: Enriquecer el Blog con Contenido AEO

Añadir nuevos artículos optimizados para respuestas de IA:

| Slug | Título | Objetivo AEO |
|------|--------|--------------|
| `que-es-blooglee` | ¿Qué es Blooglee? Guía completa 2026 | Responder preguntas directas sobre la herramienta |
| `mejores-herramientas-contenido-ia-wordpress` | Las mejores herramientas de IA para crear contenido en WordPress | Aparecer en comparativas |
| `automatizar-blog-wordpress-2026` | Cómo automatizar tu blog WordPress en 2026 | Capturar búsquedas de "cómo hacer X" |
| `blooglee-vs-nextblog-comparativa` | Blooglee vs NextBlog: Comparativa completa | Aparecer en respuestas comparativas |
| `aeo-seo-que-es-diferencia` | AEO vs SEO: Qué es y cómo optimizar para ChatGPT | Posicionar como expertos en AEO |

### Fase 4: Añadir FAQ Schema en Páginas Clave

Expandir el componente FAQSchema en las páginas principales con preguntas que los usuarios hacen a ChatGPT:

**Landing Page FAQs:**
- ¿Qué es Blooglee?
- ¿Cómo funciona la generación automática de contenido?
- ¿Blooglee es compatible con mi WordPress?
- ¿Cuánto cuesta Blooglee?
- ¿Blooglee genera contenido en varios idiomas?

**Features Page FAQs:**
- ¿Qué tipo de artículos genera Blooglee?
- ¿Las imágenes están libres de derechos?
- ¿Puedo programar publicaciones automáticas?

### Fase 5: Actualizar Sitemap

Actualizar fechas y añadir nuevas páginas:

```xml
<lastmod>2026-01-27</lastmod>
```

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `public/llms.txt` | Crear nuevo |
| `public/llms-full.txt` | Crear nuevo (opcional) |
| `public/robots.txt` | Modificar (añadir bots de IA) |
| `public/sitemap.xml` | Modificar (actualizar fechas) |
| `src/data/blogPosts.ts` | Añadir 5 nuevos artículos AEO |
| `src/pages/Landing.tsx` | Añadir FAQSchema con 5+ preguntas |
| `src/pages/FeaturesPage.tsx` | Añadir FAQSchema |
| `src/pages/Pricing.tsx` | Añadir FAQSchema |

## Estrategia de Contenido Recomendada

Para maximizar la visibilidad en IA:

1. **Contenido evergreen**: Artículos que respondan preguntas frecuentes
2. **Actualizaciones regulares**: Cambiar fechas de sitemap semanalmente
3. **Datos estructurados**: JSON-LD en cada página importante
4. **Lenguaje directo**: Usar frases que los usuarios preguntan a ChatGPT
5. **Citas y estadísticas**: Incluir datos que las IAs puedan citar

## Resultado Esperado

- ChatGPT y otros modelos podrán encontrar y citar a Blooglee
- El archivo llms.txt proporcionará información estructurada y fácil de consumir
- Los nuevos artículos del blog capturarán consultas específicas
- Los FAQs aparecerán como rich snippets y respuestas de IA
- Blooglee se posicionará como alternativa a NextBlog.ai

## Tiempo Estimado

- Fase 1 (llms.txt): 30 minutos
- Fase 2 (robots.txt): 10 minutos
- Fase 3 (Blog posts): 2-3 horas
- Fase 4 (FAQs): 1 hora
- Fase 5 (Sitemap): 10 minutos

**Total: ~4-5 horas de implementación**
