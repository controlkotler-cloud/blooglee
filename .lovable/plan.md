
# Plan: Sistema de generación inteligente con contexto enriquecido

## El problema de fondo

El sistema actual es "dumb" - solo cambia variables en un prompt fijo. Esto causa:

1. **Repetitividad temática**: Siempre tiende a IA, tendencias, digitalización
2. **Falta de personalización real**: No conoce el tono, audiencia ni estilo del negocio
3. **Desperdicio de datos**: No usamos los posts existentes de WordPress ni las categorías
4. **Experiencia pobre**: El usuario no puede definir qué tipo de contenido quiere

## Solución propuesta: Contexto enriquecido en 3 capas

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        CAPA 1: PERFIL DE CONTENIDO                   │
│  (Nueva sección en configuración del sitio)                          │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ Tono de voz    │  │ Audiencia      │  │ Pilares de     │         │
│  │ - Formal       │  │ - Profesionales│  │ contenido      │         │
│  │ - Cercano      │  │ - Consumidor   │  │ - Educativo    │         │
│  │ - Técnico      │  │ - B2B / B2C    │  │ - Tendencias   │         │
│  │ - Divulgativo  │  │ - Edad aprox   │  │ - Casos éxito  │         │
│  └────────────────┘  └────────────────┘  │ - Guías        │         │
│                                          └────────────────┘         │
├──────────────────────────────────────────────────────────────────────┤
│                        CAPA 2: ANÁLISIS WORDPRESS                    │
│  (Automático al sincronizar)                                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 1. Leer últimos 10-20 posts del blog                         │    │
│  │ 2. Extraer: títulos, categorías usadas, longitud media       │    │
│  │ 3. Analizar con IA: tono detectado, temas recurrentes        │    │
│  │ 4. Guardar como "contexto_wordpress" en el sitio             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                        CAPA 3: ROTACIÓN TEMÁTICA                     │
│  (En cada generación)                                                │
│                                                                      │
│  En lugar de: "genera un tema sobre X"                              │
│  Ahora: "Esta semana toca pilar EDUCATIVO, usa categoría Y"         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Pilares rotan automáticamente:                               │    │
│  │ Semana 1 → Educativo (guías, tutoriales)                    │    │
│  │ Semana 2 → Tendencias (novedades del sector)                │    │
│  │ Semana 3 → Casos prácticos (ejemplos reales)                │    │
│  │ Semana 4 → Estacional (según época del año)                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

## Parte 1: Nuevos campos en la tabla sites

Añadir columnas para el perfil de contenido:

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `tone` | text | "formal", "casual", "technical", "educational" |
| `target_audience` | text | Descripción de audiencia objetivo |
| `content_pillars` | text[] | Array de pilares: ["educativo", "tendencias", "casos", "guias"] |
| `avoid_topics` | text[] | Temas a evitar (competencia, temas sensibles) |
| `preferred_length` | text | "short" (800), "medium" (1500), "long" (2500) |
| `wordpress_context` | jsonb | Análisis automático del blog existente |
| `last_pillar_index` | integer | Para rotar pilares automáticamente |

## Parte 2: Nueva sección en configuración del sitio

Añadir pestaña o card "Perfil de contenido" en SiteSettings:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 📝 Perfil de contenido                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Tono de voz                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ○ Formal y profesional                                      │ │
│ │ ● Cercano pero experto                                      │ │
│ │ ○ Técnico y especializado                                   │ │
│ │ ○ Divulgativo y accesible                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Audiencia objetivo                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Ej: Profesionales del sector salud, 35-55 años, interesados │ │
│ │ en mejorar su práctica diaria...                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Pilares de contenido (selecciona 2-4)                          │
│ ☑ Educativo (guías, tutoriales, how-to)                        │
│ ☑ Tendencias (novedades, innovación)                           │
│ ☐ Casos prácticos (ejemplos, testimonios)                      │
│ ☑ Estacional (adaptado a época del año)                        │
│ ☐ Opinión/Análisis (perspectivas del sector)                   │
│                                                                 │
│ Temas a evitar                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ competencia, precios, polémicas políticas...                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Longitud preferida                                              │
│ ○ Corto (~800 palabras) - Lectura rápida                       │
│ ● Medio (~1500 palabras) - Equilibrado                         │
│ ○ Largo (~2500 palabras) - SEO intensivo                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Parte 3: Análisis automático de WordPress

Nueva función `analyze-wordpress-content`:

```typescript
// Al sincronizar taxonomías O manualmente desde la UI
async function analyzeWordPressContent(wpConfig, supabase) {
  // 1. Obtener últimos 15 posts publicados
  const posts = await fetch(`${wpUrl}/wp-json/wp/v2/posts?per_page=15&status=publish`);
  
  // 2. Extraer información
  const analysis = {
    avgLength: calcularLongitudMedia(posts),
    commonCategories: extraerCategoriasMasUsadas(posts),
    titlePatterns: analizarPatronesTitulos(posts),
    lastTopics: posts.map(p => p.title.rendered).slice(0, 10)
  };
  
  // 3. Analizar con IA para detectar tono
  const toneAnalysis = await analyzeWithAI(`
    Analiza estos títulos y extractos de blog:
    ${posts.map(p => `- ${p.title.rendered}: ${p.excerpt.rendered}`).join('\n')}
    
    Responde JSON:
    {
      "detected_tone": "formal|casual|technical|educational",
      "main_themes": ["tema1", "tema2", "tema3"],
      "style_notes": "observaciones sobre el estilo"
    }
  `);
  
  // 4. Guardar en site.wordpress_context
  await supabase.from('sites').update({
    wordpress_context: { ...analysis, ...toneAnalysis, analyzed_at: new Date() }
  }).eq('id', siteId);
}
```

## Parte 4: Modificar generación de artículos

El prompt ahora usa todo este contexto:

```typescript
// En generate-article-saas
const site = await getSiteWithFullContext(siteId);

// Determinar pilar de esta semana (rotación automática)
const pillarIndex = (site.last_pillar_index + 1) % site.content_pillars.length;
const currentPillar = site.content_pillars[pillarIndex];

// Seleccionar categoría de WordPress que encaje
const wpCategory = selectCategoryForPillar(currentPillar, site.wordpress_taxonomies);

// Construir prompt con TODO el contexto
const topicPrompt = await getPrompt(supabase, 'saas.topic', {
  siteName: site.name,
  sector: site.sector,
  description: site.description,
  
  // NUEVO: Contexto enriquecido
  tone: site.tone || 'cercano',
  targetAudience: site.target_audience || '',
  currentPillar: PILLAR_DESCRIPTIONS[currentPillar],
  wpCategory: wpCategory?.name || '',
  avoidTopics: (site.avoid_topics || []).join(', '),
  
  // NUEVO: Contexto de WordPress
  existingStyle: site.wordpress_context?.style_notes || '',
  recentTopics: site.wordpress_context?.lastTopics?.join(', ') || '',
  
  // Deduplicación normal
  usedTopics: usedTopics.join(', ')
}, FALLBACK_TOPIC_PROMPT);

// Actualizar índice del pilar para próxima vez
await supabase.from('sites').update({
  last_pillar_index: pillarIndex
}).eq('id', siteId);
```

## Parte 5: Nuevos prompts dinámicos

El prompt de topic ahora es mucho más rico:

```text
Eres un experto en content marketing para el sector {{sector}}.

EMPRESA: {{siteName}}
AUDIENCIA: {{targetAudience}}
TONO: {{tone}}

PILAR DE CONTENIDO ACTUAL: {{currentPillar}}
(Los pilares rotan para dar variedad: educativo, tendencias, casos prácticos, estacional)

{{#wpCategory}}
CATEGORÍA WORDPRESS SUGERIDA: {{wpCategory}}
Intenta que el tema encaje en esta categoría.
{{/wpCategory}}

{{#existingStyle}}
ESTILO DETECTADO EN SU BLOG: {{existingStyle}}
Mantén coherencia con este estilo.
{{/existingStyle}}

TEMAS A EVITAR:
- {{avoidTopics}}
- Temas ya publicados: {{usedTopics}}
- Temas recientes de su blog: {{recentTopics}}

GENERA un tema que:
1. Encaje con el pilar "{{currentPillar}}"
2. Sea relevante para la audiencia descrita
3. Use el tono {{tone}}
4. Sea DIFERENTE a todo lo anterior
5. Tenga potencial SEO

Responde SOLO con el tema (max 80 caracteres).
```

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Añadir columnas: tone, target_audience, content_pillars, avoid_topics, preferred_length, wordpress_context, last_pillar_index |
| `src/components/saas/SiteSettings.tsx` | Añadir sección "Perfil de contenido" |
| `src/hooks/useSites.ts` | Actualizar interface Site con nuevos campos |
| `supabase/functions/generate-article-saas/index.ts` | Usar contexto enriquecido, rotación de pilares |
| `supabase/functions/sync-wordpress-taxonomies-saas/index.ts` | Añadir análisis de posts existentes |
| Tabla `prompts` | Actualizar prompts con nuevas variables |

## Resultado esperado

1. **Variedad real**: Cada semana un pilar diferente (educativo, tendencias, casos...)
2. **Personalización**: El usuario define su audiencia y tono
3. **Coherencia**: Analizamos su blog existente para mantener el estilo
4. **Categorización inteligente**: Usamos las categorías de WordPress
5. **Menos IA genérica**: No todo es "tendencias 2026" o "IA en tu sector"

## Ejemplo de diferencia

**ANTES (genérico)**:
- "IA en farmacias: personaliza la atención"
- "Tendencias digitales para farmacias"
- "IA y farmacia: el futuro"

**DESPUES (contextualizado)**:
- Semana 1 (Educativo): "Guía completa para organizar el stock de invierno"
- Semana 2 (Tendencias): "Nuevas normativas de dispensación: lo que debes saber"
- Semana 3 (Casos): "Cómo Farmacia López aumentó ventas con servicios de nutrición"
- Semana 4 (Estacional): "Prepara tu farmacia para la campaña de gripe"
