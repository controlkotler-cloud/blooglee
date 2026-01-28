
# Plan: Posts de Blog Blooglee de Clase Mundial

## Diagnóstico del Problema Actual

### ❌ Lo que tenemos ahora:
| Aspecto | Estado Actual | Problema |
|---------|--------------|----------|
| **Longitud** | 1000-1500 palabras | Muy corto para SEO competitivo |
| **Imágenes** | Unsplash genérico | Fotos de stock aburridas, sin identidad |
| **Enlaces internos** | Solo mención al blog | No hay interlinking con /features, /pricing, /contact |
| **Redes sociales** | Ninguno | Instagram existe pero no se enlaza |
| **Estructura SEO** | Básica | Sin tablas comparativas elaboradas, sin datos destacados |
| **AEO/LLM** | Limitado | FAQ básica, sin datos citables estructurados |
| **Formato visual** | Markdown simple | Sin callouts, sin destacados, sin rich content |

### ✅ Lo que deberíamos tener:
| Aspecto | Objetivo | Beneficio |
|---------|----------|-----------|
| **Longitud** | 2500-3500 palabras | Contenido exhaustivo que rankea |
| **Imágenes** | AI (gemini-3-pro-image-preview) | Imágenes únicas con estética Blooglee (gradientes violet/coral) |
| **Enlaces internos** | 5-8 enlaces por post | Mejora SEO interno y navegación |
| **Redes sociales** | Footer con Instagram | Fidelización y comunidad |
| **Estructura SEO** | Tablas, listas, datos, estadísticas | Featured snippets, AI Overviews |
| **AEO/LLM** | FAQ extensa + datos citables | Aparecer en ChatGPT, Claude, Perplexity |
| **Formato visual** | Callouts, citas, key takeaways | Experiencia premium |

---

## Arquitectura de la Solución

```text
generate-blog-blooglee/index.ts MEJORADO
    │
    ├─1. CONTENIDO PREMIUM
    │   ├── 2500-3500 palabras (no 1000-1500)
    │   ├── Datos y estadísticas inventados pero citables
    │   ├── 5-8 enlaces internos automáticos
    │   ├── FAQ extensa (5-7 preguntas)
    │   └── Callouts y key takeaways
    │
    ├─2. IMÁGENES CON IA
    │   ├── google/gemini-3-pro-image-preview
    │   ├── Prompt con estética Blooglee (gradientes purple/fuchsia/coral)
    │   ├── Upload a article-images bucket
    │   └── Fallback a Unsplash si falla
    │
    ├─3. INTERLINKING
    │   ├── /features → cuando se mencione funcionalidades
    │   ├── /pricing → cuando se hable de costes
    │   ├── /blog → siempre
    │   ├── /auth → CTAs de registro
    │   └── Instagram (https://www.instagram.com/blooglee_/)
    │
    └─4. OPTIMIZACIÓN AEO
        ├── Estructura pregunta-respuesta clara
        ├── Definiciones citables
        ├── Datos numéricos específicos
        └── Marcado semántico (H2, H3 bien estructurados)
```

---

## Cambios Técnicos Detallados

### 1. Nuevo Prompt de Generación (generate-blog-blooglee)

El prompt actual pide 1000-1500 palabras con contenido básico. El nuevo prompt será:

```text
Eres el mejor copywriter de España especializado en SEO, AEO y marketing de contenidos.
Tu misión: Crear EL MEJOR artículo de blog jamás escrito sobre este tema.

CONTEXTO BLOOGLEE:
- Blooglee es una plataforma SaaS española de automatización de blogs con IA
- URL: https://blooglee.com
- Instagram: https://www.instagram.com/blooglee_/
- Competimos con NextBlog.ai y queremos demostrar que nuestro contenido es SUPERIOR

AUDIENCIA: [empresas/agencias]

REQUISITOS DEL ARTÍCULO ÉPICO:

1. LONGITUD: 2500-3500 palabras OBLIGATORIO
2. TÍTULO: Máximo 60 caracteres, keyword principal, SIN año
3. EXCERPT: 155 caracteres, hook irresistible

4. ESTRUCTURA DE CONTENIDO:
   - Introducción gancho (150 palabras)
   - 4-6 secciones H2 profundas
   - Subsecciones H3 donde aplique
   - KEY TAKEAWAYS en cada sección (formato: "💡 Clave: ...")
   - Al menos 2 tablas comparativas
   - Al menos 2 listas con bullets
   - FAQ extensa (5-7 preguntas frecuentes)
   - Conclusión con CTA

5. DATOS Y ESTADÍSTICAS (inventados pero realistas):
   - Incluir al menos 5 datos porcentuales específicos
   - Citar "según datos de Blooglee" o "un estudio de 2026"
   - Usar números concretos (no "muchos" sino "el 73%")

6. ENLACES INTERNOS OBLIGATORIOS (usar Markdown):
   - Mencionar [funcionalidades de Blooglee](/features) al menos 1 vez
   - Mencionar [planes de Blooglee](/pricing) si se habla de costes
   - Mencionar [nuestro blog](/blog) en contexto de aprendizaje
   - CTA final a [Prueba Blooglee gratis](/auth)

7. REDES SOCIALES:
   - Incluir al final: "Síguenos en [Instagram](https://www.instagram.com/blooglee_/)"

8. OPTIMIZADO PARA LLMs:
   - Respuestas directas a preguntas comunes
   - Definiciones claras al inicio de cada concepto
   - Datos citables y estructurados
   - Párrafos de 2-4 líneas máximo
```

### 2. Generación de Imágenes con IA

Reemplazar Unsplash por imágenes generadas con IA que:
- Tengan la estética de Blooglee (gradientes violet → fuchsia → coral)
- Sean abstractas/conceptuales (no genéricos de oficina)
- Representen el tema del artículo

```typescript
const imagePrompt = `Create a professional blog header image.

STYLE REQUIREMENTS:
- Modern, abstract, conceptual design
- Gradient colors: purple (#8B5CF6) to fuchsia (#D946EF) to coral (#F97316)
- NO text, NO logos, NO human faces
- Professional, tech-forward aesthetic
- Suitable for SaaS marketing blog

TOPIC: "${topic}"
SECTOR: ${category === 'Empresas' ? 'business/SME' : 'marketing agencies'}

Create an image that represents digital transformation and content automation.`;
```

### 3. Estructura de Contenido Rica

Añadir elementos HTML especiales que se rendericen en BlogPost.tsx:

```html
<!-- Key Takeaway Box -->
<div class="blooglee-callout">
  <span class="callout-icon">💡</span>
  <p><strong>Clave:</strong> El 78% de las empresas que automatizan su blog ven un ROI positivo en 3 meses.</p>
</div>

<!-- Stats Highlight -->
<div class="blooglee-stat">
  <span class="stat-number">340%</span>
  <span class="stat-label">incremento medio en tráfico orgánico</span>
</div>
```

### 4. Footer Social con Instagram

Cada artículo terminará con:

```markdown
---

**¿Te ha gustado este artículo?** 

Síguenos en [Instagram](https://www.instagram.com/blooglee_/) para más consejos de marketing y contenido.

[Prueba Blooglee gratis](/auth) y automatiza tu blog hoy.
```

---

## Archivos a Modificar

### 1. `supabase/functions/generate-blog-blooglee/index.ts`
- Nuevo prompt épico de 2500-3500 palabras
- Añadir generación de imagen con IA (google/gemini-3-pro-image-preview)
- Upload de imagen a storage bucket
- Fallback a Unsplash
- Incluir enlaces internos obligatorios en el prompt
- Incluir Instagram en footer

### 2. `src/pages/BlogPost.tsx`
- Mejorar parseContent() para soportar callouts y stats boxes
- Renderizar enlaces internos correctamente (no como externos)
- Añadir estilos para elementos destacados

### 3. `src/pages/BlogIndex.tsx`  
- Añadir categorías "Empresas" y "Agencias" al filtro

---

## Prompt de Imagen Detallado

Para que las imágenes tengan identidad Blooglee:

```text
Create a stunning, professional blog header image.

VISUAL STYLE:
- Abstract, modern, conceptual design
- Primary colors: vibrant purple (#8B5CF6), magenta/fuchsia (#D946EF), warm coral (#F97316)
- Gradient flow from purple to coral
- Geometric shapes, flowing lines, or abstract patterns
- High contrast, professional aesthetic
- Clean, minimal, tech-forward look

COMPOSITION:
- 16:9 aspect ratio (landscape)
- Main visual elements centered or rule-of-thirds
- Ample negative space for potential text overlay
- NO text in the image itself
- NO logos or branding
- NO realistic human faces

TOPIC REPRESENTATION: [topic]
MOOD: Professional, innovative, trustworthy, forward-thinking

This image is for a SaaS blog about content automation and digital marketing.
Create something that feels premium and cutting-edge.
```

---

## Resultado Esperado

| Antes | Después |
|-------|---------|
| 1000-1500 palabras | 2500-3500 palabras |
| Imágenes Unsplash genéricas | Imágenes AI con estética Blooglee |
| Sin enlaces internos | 5-8 enlaces a /features, /pricing, /blog, /auth |
| Sin redes sociales | Footer con Instagram |
| FAQ de 3-4 preguntas | FAQ de 5-7 preguntas |
| Sin datos citables | 5+ estadísticas concretas |
| Formato básico | Callouts, tablas, destacados |

---

## Flujo de Ejecución

```text
1. Generar tema único (deduplicado)
         ↓
2. Generar contenido premium (2500-3500 palabras)
   - Incluir enlaces internos
   - Incluir estadísticas
   - Incluir FAQs extensas
   - Incluir callouts
         ↓
3. Generar imagen con gemini-3-pro-image-preview
   - Prompt con estética Blooglee
   - Colores: purple → fuchsia → coral
         ↓
4. Upload imagen a article-images bucket
   (fallback: Unsplash si falla)
         ↓
5. Añadir footer social (Instagram)
         ↓
6. Insertar en blog_posts
         ↓
7. Trigger update-seo-assets
```

---

## Consideraciones

1. **Coste de imagen AI**: ~$0.002-0.003 por imagen (marginal)
2. **Tiempo de generación**: Aumentará de ~15s a ~45s por la imagen AI + contenido más largo
3. **Storage**: Las imágenes se guardan en `article-images` bucket (ya existe)
4. **Retroactividad**: Los posts existentes seguirán con imágenes Unsplash (no se modifican)
