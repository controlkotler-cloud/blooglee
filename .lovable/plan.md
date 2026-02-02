
# Plan: Corregir afirmaciones falsas sobre Blooglee en el blog

## Problema identificado

Los artículos del blog de Blooglee incluyen afirmaciones falsas sobre lo que la plataforma puede hacer. La IA inventa funcionalidades porque el prompt actual solo dice:

```
Plataforma: Blooglee (https://blooglee.com) - SaaS de automatización de blogs con IA
```

Esto es demasiado vago y la IA asume que Blooglee puede hacer cosas como:
- Analytics e informes
- Email marketing
- Gestión de redes sociales
- SEO técnico/auditorías
- Monitorización de NAP
- Landing pages
- Reporting automatizado

## Funcionalidades REALES de Blooglee (únicas permitidas)

Según `llms-full.txt`, Blooglee SOLO hace:

| Funcionalidad | Descripción |
|---------------|-------------|
| Generación de artículos | Posts de 800-1200 palabras con IA |
| Optimización SEO | Meta título, descripción, slug, estructura H1-H3 |
| Imagen destacada | Automática de Pexels/Unsplash o generada por IA |
| Publicación WordPress | Un clic, API REST nativa |
| Multi-idioma | Español, catalán, inglés |
| Multi-sitio | Dashboard centralizado, hasta 10 sitios |

## Solución en dos partes

### PARTE 1: Actualizar el prompt de generación

Modificar `supabase/functions/generate-blog-blooglee/index.ts` para incluir una definición EXACTA y RESTRICTIVA de Blooglee:

```typescript
const BLOOGLEE_DEFINITION = `
DEFINICIÓN EXACTA DE BLOOGLEE (NO INVENTAR OTRAS FUNCIONALIDADES):

Blooglee es una plataforma SaaS que hace ÚNICAMENTE esto:
1. Genera artículos de blog con IA (GPT-5, Gemini 2.5)
2. Optimiza SEO automáticamente (meta título, descripción, slug)
3. Incluye imagen destacada (Pexels, Unsplash o generada por IA)
4. Publica directamente en WordPress con un clic
5. Soporta español, catalán e inglés
6. Gestiona múltiples sitios desde un dashboard

BLOOGLEE NO HACE (no mencionar nunca):
- NO genera newsletters ni email marketing
- NO gestiona redes sociales (LinkedIn, Instagram, etc.)
- NO hace SEO técnico ni auditorías
- NO ofrece analytics ni informes de rendimiento
- NO crea landing pages
- NO hace reporting automatizado
- NO monitoriza NAP ni datos locales
- NO tiene dashboards de métricas avanzadas
- NO integra con herramientas de análisis

Cuando menciones Blooglee, hazlo SOLO en contexto de:
- Generar artículos de blog con IA
- Publicar automáticamente en WordPress
- Incluir imágenes destacadas
- Optimizar SEO básico (títulos, meta, estructura)
`;
```

### PARTE 2: Corregir los 24 posts existentes

Crear un script/edge function que:
1. Lea cada post existente
2. Identifique afirmaciones falsas sobre Blooglee
3. Reescriba los párrafos afectados manteniendo el sentido
4. Actualice el contenido en la base de datos

## Cambios técnicos

### Archivo: `supabase/functions/generate-blog-blooglee/index.ts`

**Línea ~495-502** - Añadir definición restrictiva en el prompt de contenido:

```typescript
const prompt = `Eres el mejor copywriter de España, especializado en SEO y AEO.
Escribe un artículo de blog ÉPICO y COMPLETO sobre: "${metadata.title}"

CONTEXTO:
- Fecha actual: ${monthName} de ${currentYear}
- Instagram: https://www.instagram.com/blooglee_/
- Audiencia: ${audienceContext}

${BLOOGLEE_DEFINITION}

REGLA CRÍTICA: Si mencionas Blooglee, SOLO puede ser para:
- Generar artículos de blog con IA
- Publicar en WordPress automáticamente
- Incluir imágenes destacadas
- Optimizar SEO de posts

NO INVENTES funcionalidades. Si el tema del artículo no encaja con lo que hace Blooglee, simplemente NO lo menciones o hazlo de forma muy genérica.

ESTRUCTURA OBLIGATORIA...
```

### Nueva Edge Function: `fix-blog-false-claims`

Para corregir los posts existentes, crear una función que:

```typescript
// Para cada post:
// 1. Extraer párrafos que mencionan Blooglee
// 2. Enviar a la IA con instrucciones de corrección
// 3. Actualizar el contenido
```

## Posts a corregir (24 en total)

Todos los posts publicados necesitan revisión:

1. SEO local: dispara tu negocio en 2026
2. Reporting clientes: looker studio vs. databox para agencias
3. Tutorial onboarding clientes: procesos que enamoran
4. Tutorial: IA para generar contenidos de blog automáticamente
5. SEO multicliente: auditorías escalables para agencias
6. Las 5 herramientas de marketing automation que tu pyme necesita
7. Herramientas white label: la marca de tu agencia en cada contenido
8. Optimiza tu agencia: workflow de contenido para el éxito
9. Automatiza tu marketing de contenidos: la guía esencial
10. Pricing de contenido: ¿cuánto cobrar a tus clientes?
11. Mide el ROI del marketing de contenidos: guía para pymes
12. El auge de la IA generativa en agencias de contenido
13. IA para contenido: ¿Jasper, Surfer SEO o Copy.ai? La guía 2026
14. Tutorial: gestionar múltiples blogs WordPress para agencias
15. Estrategia SEO multicliente: escala tu agencia en 2026
16. Estrategia omnicanal: el futuro del contenido para pymes
17. Marketing automation: ¿HubSpot o ActiveCampaign para tu pyme?
18. SEO local para pymes: domina tu mercado cercano
19. Automatiza tu blog WordPress: guía paso a paso para pymes
20. IA en tu negocio: automatiza el marketing y gana clientes
21. Reporting automatizado de contenido: adiós al caos manual
22. Email marketing automatizado: el arma secreta de tu PYME
23. Escala tu contenido: el modelo agencial que triunfa
24. IA para pymes: automatiza tu marketing y dispara ventas

## Resultado esperado

1. Los nuevos posts NO inventarán funcionalidades de Blooglee
2. Los posts existentes serán corregidos para eliminar falsas afirmaciones
3. Blooglee solo aparecerá mencionado en contexto de generación de blogs para WordPress

---

## Sección técnica detallada

### Constante BLOOGLEE_DEFINITION (nueva, línea ~25)

```typescript
const BLOOGLEE_DEFINITION = `
DEFINICIÓN EXACTA DE BLOOGLEE (NO INVENTAR OTRAS FUNCIONALIDADES):

Blooglee es una plataforma SaaS que hace ÚNICAMENTE esto:
1. Genera artículos de blog con IA (GPT-5, Gemini 2.5)
2. Optimiza SEO automáticamente (meta título, descripción, slug)
3. Incluye imagen destacada (Pexels, Unsplash o generada por IA)
4. Publica directamente en WordPress con un clic
5. Soporta español, catalán e inglés
6. Gestiona múltiples sitios desde un dashboard

BLOOGLEE NO HACE (no mencionar nunca):
- NO genera newsletters ni email marketing
- NO gestiona redes sociales (LinkedIn, Instagram, Facebook, etc.)
- NO hace SEO técnico ni auditorías SEO
- NO ofrece analytics ni informes de rendimiento
- NO crea landing pages
- NO hace reporting automatizado de métricas
- NO monitoriza NAP ni datos de negocio local
- NO tiene dashboards de métricas avanzadas
- NO integra con herramientas de análisis (GA4, etc.)
- NO genera contenido para redes sociales
- NO automatiza email marketing
- NO hace A/B testing
- NO ofrece CRM ni gestión de clientes

Cuando menciones Blooglee, hazlo SOLO en contexto de:
- Generar artículos de blog con IA en segundos
- Publicar automáticamente en WordPress
- Incluir imágenes destacadas sin esfuerzo
- Optimizar SEO básico (títulos, meta, estructura de encabezados)
- Gestionar múltiples blogs desde un dashboard
`;
```

### Modificación del prompt de contenido (línea ~495)

```typescript
const prompt = `Eres el mejor copywriter de España, especializado en SEO y AEO.
Escribe un artículo de blog ÉPICO y COMPLETO sobre: "${metadata.title}"

CONTEXTO:
- Fecha actual: ${monthName} de ${currentYear}
- Instagram de Blooglee: https://www.instagram.com/blooglee_/
- Audiencia: ${audienceContext}

${BLOOGLEE_DEFINITION}

REGLA CRÍTICA SOBRE MENCIONES DE BLOOGLEE:
- Si el tema del artículo es sobre blogs o contenido → menciona Blooglee como solución para generar y publicar artículos
- Si el tema NO es sobre blogs → NO menciones Blooglee o hazlo muy brevemente al final
- NUNCA atribuyas a Blooglee funcionalidades que no tiene
- Es preferible NO mencionar Blooglee a inventar lo que hace

ESTRUCTURA OBLIGATORIA (2500-3500 palabras en Markdown):
...`;
```

### Nueva Edge Function para corrección de posts

Archivo: `supabase/functions/fix-blog-false-claims/index.ts`

Esta función:
1. Recibe el ID de un post (o procesa todos)
2. Lee el contenido actual
3. Envía a la IA con instrucciones de corrección
4. Guarda el contenido corregido

El prompt de corrección será:

```typescript
const correctionPrompt = `
Tienes que corregir un artículo de blog que contiene afirmaciones FALSAS sobre Blooglee.

${BLOOGLEE_DEFINITION}

ARTÍCULO ORIGINAL:
${originalContent}

INSTRUCCIONES:
1. Identifica TODOS los párrafos que mencionan Blooglee con funcionalidades falsas
2. Reescribe esos párrafos de forma que:
   - Si la funcionalidad falsa es sobre blogs/contenido → ajusta para que sea solo generación de posts
   - Si la funcionalidad falsa NO tiene nada que ver con blogs → elimina la mención a Blooglee
3. Mantén el resto del artículo intacto
4. Asegura que el texto sigue teniendo sentido tras las correcciones

Devuelve el artículo COMPLETO corregido en Markdown.
`;
```
