
# Plan: Sistema de Notificaciones + Categorías de Blog

## Análisis de lo Encontrado

### 1. Email de notificación al usuario SaaS
**Estado actual**: ❌ NO existe
- Cuando `generate-article-saas` genera un artículo, **NO** se envía ningún email al usuario
- Los únicos emails que se envían son:
  - Newsletter a suscriptores
  - Notificación de límite excedido  
  - Emails a admins

**En MKPro**: Tampoco existe esta funcionalidad de forma automática.

### 2. Problema con las Categorías
**Estado actual**: Todos los posts tienen `category = "Marketing"`

El código en `generate-blog-blooglee/index.ts` (líneas 268-270) tiene:
```typescript
const validCategory = THEMATIC_CATEGORIES.includes(parsed.thematic_category) 
  ? parsed.thematic_category 
  : 'Marketing'; // ← SIEMPRE cae aquí
```

La IA genera el campo `thematic_category` pero parece que no coincide con las opciones válidas, por lo que siempre se usa "Marketing" como fallback.

### 3. Diseño de referencia (imagen)
La imagen muestra un diseño elegante con:
- Dos tarjetas grandes para elegir perfil (Inquilino / Propietario)
- Iconos distintivos
- Descripción clara de qué contenido encontrarán
- Newsletter segmentada abajo

---

## Cambios Propuestos

### Parte 1: Email de Notificación al Usuario SaaS

Cuando un artículo se genera (manual o automáticamente), enviar email al usuario:

```text
📝 Tu artículo está listo

Hola,

Se ha generado un nuevo artículo para [Nombre del Site]:

📌 "[Título del artículo]"

[Ver artículo]

Si has configurado WordPress, publica el artículo directamente desde tu panel.

---
Blooglee - Automatiza tu blog con IA
```

**Archivo a modificar**: `supabase/functions/generate-article-saas/index.ts`
- Después de guardar el artículo en la base de datos
- Obtener email del usuario desde la tabla `profiles`
- Enviar email con Resend

### Parte 2: Arreglar Sistema de Categorías Temáticas

**Problema**: La IA genera categorías que no coinciden exactamente con la lista

**Solución**:
1. Mejorar el prompt para ser más explícito
2. Añadir normalización de categorías (fuzzy matching)
3. Asegurar que cada audiencia tenga variedad

**Categorías temáticas propuestas**:
| Categoría | Descripción |
|-----------|-------------|
| SEO | Posicionamiento, keywords, técnicas SEO |
| Marketing | Estrategias, campañas, ROI |
| Tutoriales | Guías paso a paso, how-to |
| Comparativas | Análisis de herramientas, vs |
| Producto | Novedades de Blooglee |
| Tendencias | Novedades del sector, futuro |

**Archivo a modificar**: `supabase/functions/generate-blog-blooglee/index.ts`
- Línea 231-238: Hacer el prompt más explícito
- Línea 268-270: Añadir normalización

### Parte 3: Rediseño UI del Blog (inspirado en imagen)

El diseño actual tiene tabs pequeños. El diseño de referencia muestra tarjetas grandes.

**Propuesta híbrida**: Mantener la estructura actual pero mejorar visualmente:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Blog Blooglee                                                  │
│  Recursos para crecer online                                    │
│                                                                 │
│  ┌───────────────────────────┐  ┌───────────────────────────┐   │
│  │ 🏢                         │  │ 🏬                         │   │
│  │ Para empresas             │  │ Para agencias             │   │
│  │ Marketing digital, SEO,   │  │ Escalabilidad, multi-     │   │
│  │ automatización para tu    │  │ cliente, workflows y      │   │
│  │ negocio                   │  │ herramientas              │   │
│  │                           │  │                           │   │
│  │ Ver artículos →           │  │ Ver artículos →           │   │
│  └───────────────────────────┘  └───────────────────────────┘   │
│                                                                 │
│  ───── O explora todo el contenido ─────                        │
│                                                                 │
│  [SEO] [Marketing] [Tutoriales] [Comparativas] [Tendencias]     │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Post 1  │ │ Post 2  │ │ Post 3  │ │ Post 4  │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

**Archivos a modificar**:
- `src/pages/BlogIndex.tsx` - Añadir tarjetas de audiencia grandes
- `src/components/marketing/AudienceTabs.tsx` - Convertir a AudienceCards

### Parte 4: Generar Posts de Cada Categoría para Cada Audiencia

**Objetivo**: Lanzar con contenido variado

| Audiencia | SEO | Marketing | Tutoriales | Comparativas | Tendencias |
|-----------|-----|-----------|------------|--------------|------------|
| Empresas | 1 | 1 | 1 | 1 | 1 |
| Agencias | 1 | 1 | 1 | 1 | 1 |

**Total**: 10 posts (5 por audiencia, 1 por categoría)

**Proceso**:
1. Eliminar posts actuales (todos son "Marketing")
2. Generar 10 posts nuevos forzando categoría específica
3. Modificar edge function para aceptar `forceCategory` parameter

---

## Archivos a Modificar/Crear

### Edge Functions

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article-saas/index.ts` | Añadir envío de email al usuario cuando se genera artículo |
| `supabase/functions/generate-blog-blooglee/index.ts` | Mejorar prompt de categorías, añadir `forceCategory`, normalizar categorías |

### Frontend

| Archivo | Cambios |
|---------|---------|
| `src/pages/BlogIndex.tsx` | Añadir tarjetas de audiencia estilo referencia |
| `src/components/marketing/AudienceCards.tsx` | Nuevo componente con tarjetas grandes |

---

## Prompt Mejorado para Categorías

```text
CATEGORÍAS TEMÁTICAS (ELIGE EXACTAMENTE UNA):
- "SEO" → Para artículos sobre posicionamiento web, keywords, optimización técnica
- "Marketing" → Para artículos sobre estrategias, campañas, ROI, branding
- "Tutoriales" → Para guías paso a paso, how-to, configuración
- "Comparativas" → Para análisis de herramientas, X vs Y, rankings
- "Producto" → Para novedades de Blooglee, actualizaciones, casos de uso
- "Tendencias" → Para novedades del sector, predicciones, tecnologías emergentes

IMPORTANTE: El campo "thematic_category" DEBE ser EXACTAMENTE una de las palabras anteriores:
SEO, Marketing, Tutoriales, Comparativas, Producto, Tendencias
```

---

## Normalización de Categorías

```typescript
function normalizeCategory(raw: string): string {
  const normalized = raw.toLowerCase().trim();
  
  const mapping: Record<string, string> = {
    'seo': 'SEO',
    'search engine optimization': 'SEO',
    'posicionamiento': 'SEO',
    'marketing': 'Marketing',
    'marketing digital': 'Marketing',
    'estrategia': 'Marketing',
    'tutoriales': 'Tutoriales',
    'tutorial': 'Tutoriales',
    'guía': 'Tutoriales',
    'comparativas': 'Comparativas',
    'comparativa': 'Comparativas',
    'vs': 'Comparativas',
    'producto': 'Producto',
    'blooglee': 'Producto',
    'tendencias': 'Tendencias',
    'tendencia': 'Tendencias',
    'futuro': 'Tendencias',
  };
  
  return mapping[normalized] || 'Marketing';
}
```

---

## Email de Notificación (Template)

```html
<div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
  <header style="background: linear-gradient(135deg, #8B5CF6, #D946EF); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0;">📝 Tu artículo está listo</h1>
  </header>
  
  <main style="padding: 30px; background: #faf5ff;">
    <p>Hola,</p>
    <p>Se ha generado un nuevo artículo para <strong>[Site Name]</strong>:</p>
    
    <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <h2 style="color: #1a1a2e; margin: 0 0 10px 0;">[Título del Artículo]</h2>
      <p style="color: #666;">[Extracto...]</p>
    </div>
    
    <a href="[URL_SITIO]/site/[site_id]" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #D946EF); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Ver artículo en tu panel
    </a>
    
    <p style="color: #666; margin-top: 20px; font-size: 14px;">
      Si tienes WordPress configurado, puedes publicar el artículo directamente desde tu panel.
    </p>
  </main>
  
  <footer style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
    Blooglee - Automatiza tu blog con IA
  </footer>
</div>
```

---

## Resultado Final

| Antes | Después |
|-------|---------|
| No hay email al usuario SaaS | Email automático cuando se genera artículo |
| Todas las categorías = "Marketing" | 6 categorías temáticas variadas |
| Tabs pequeños para audiencia | Tarjetas visuales grandes + tabs secundarios |
| 5 posts (todos Marketing) | 10 posts (1 por categoría × 2 audiencias) |

