

# Plan: Corregir manualmente los posts con afirmaciones falsas de Blooglee

## Diagnóstico del problema

La Edge Function `fix-blog-false-claims` **no funcionó correctamente**. Al revisar los posts actuales, encontré que siguen conteniendo afirmaciones falsas como:

| Post | Afirmación Falsa | Por qué es Falso |
|------|-----------------|------------------|
| SEO Local | "Análisis predictivo - Anticipar demanda local" | Blooglee NO hace análisis predictivo |
| SEO Local | "Monitorización de NAP" | Blooglee NO monitoriza datos de negocio local |
| SEO Local | "Auditoría de citas NAP" | Blooglee NO hace auditorías SEO |
| SEO Local | "Optimizar para fragmentos destacados" | Blooglee NO tiene optimización especial para snippets |
| Reporting | "proponer ideas basadas en datos del informe" | Blooglee NO analiza datos ni métricas |
| Reporting | "Sugerir los próximos pasos basándose en datos" | Blooglee NO hace recomendaciones basadas en analytics |

## Causa raíz

El modelo de IA (Gemini 2.5 Flash) devuelve el contenido casi idéntico sin realizar las correcciones, y la función lo marca como "skipped" al comparar strings.

## Solución propuesta

### Parte 1: Mejorar la Edge Function de corrección

Cambiar el modelo y reforzar el prompt para que sea más agresivo:

1. **Usar GPT-5 en lugar de Gemini Flash** para correcciones (mejor seguimiento de instrucciones complejas)
2. **Añadir ejemplos concretos de corrección** en el prompt
3. **Forzar la actualización** incluso si el contenido parece similar (eliminar la comparación exacta)
4. **Procesar post por post** para evitar timeouts y mejorar la precisión

### Parte 2: Correcciones específicas a aplicar

El prompt incluirá ejemplos concretos de cómo corregir:

```
EJEMPLO DE CORRECCIÓN:

ORIGINAL (INCORRECTO):
"Con Blooglee puedes monitorizar tus citas NAP y obtener alertas 
cuando haya inconsistencias"

CORREGIDO:
"Existen herramientas especializadas que permiten monitorizar 
citas NAP. Por otro lado, Blooglee puede ayudarte a generar 
artículos de blog que refuercen tu presencia local con contenido 
optimizado para tu zona geográfica."

ORIGINAL (INCORRECTO):
"Blooglee ofrece análisis predictivo para anticipar la demanda local"

CORREGIDO:
"Para análisis predictivo de demanda local, existen herramientas 
especializadas de SEO. Blooglee complementa estas estrategias 
permitiéndote generar artículos de blog localizados que posicionan 
tu negocio en búsquedas geográficas."
```

### Parte 3: Lista de términos prohibidos

Añadir validación post-corrección que detecte términos que NUNCA deben aparecer junto a "Blooglee":

- "newsletter"
- "email marketing"
- "redes sociales" / "social media"
- "analytics" / "métricas"
- "informes" / "reports" / "reporting"
- "NAP" / "citas"
- "auditoría"
- "predictivo"
- "landing page"
- "CRM"
- "A/B testing"

## Cambios técnicos

### Archivo: `supabase/functions/fix-blog-false-claims/index.ts`

**Cambios principales:**

1. **Línea 111**: Cambiar modelo de `google/gemini-2.5-flash` a `openai/gpt-5`
2. **Línea 58-101**: Expandir el prompt con ejemplos concretos de corrección
3. **Línea 212-217**: Eliminar la comparación exacta de strings - siempre guardar
4. **Nueva función**: Añadir validación post-corrección para detectar términos prohibidos junto a "Blooglee"
5. **Nuevo parámetro**: Añadir `forceUpdate=true` para forzar actualización incluso en posts ya procesados

### Archivo: `supabase/functions/generate-blog-blooglee/index.ts`

Reforzar aún más el `BLOOGLEE_DEFINITION` con ejemplos concretos de lo que NO decir:

```typescript
const BLOOGLEE_DEFINITION = `
// ... definición existente ...

EJEMPLOS DE FRASES PROHIBIDAS:
- "Blooglee analiza tus métricas" ✗
- "Blooglee monitoriza tu NAP" ✗
- "Blooglee te envía newsletters" ✗
- "Blooglee gestiona tus redes sociales" ✗
- "Blooglee hace auditorías SEO" ✗
- "Blooglee ofrece reporting automatizado" ✗

EJEMPLOS DE FRASES CORRECTAS:
- "Blooglee genera artículos de blog optimizados para SEO" ✓
- "Blooglee publica automáticamente en WordPress" ✓
- "Blooglee incluye imágenes destacadas de Pexels/Unsplash" ✓
- "Blooglee soporta español, catalán e inglés" ✓
`;
```

## Resultado esperado

1. Todos los 24 posts serán corregidos eliminando afirmaciones falsas
2. Las menciones de Blooglee solo hablarán de:
   - Generación de artículos de blog con IA
   - Publicación automática en WordPress
   - Imágenes destacadas
   - Optimización SEO básica (títulos, meta, estructura)
   - Gestión multi-sitio y multi-idioma
3. Los nuevos posts generados no incluirán funcionalidades inventadas

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/fix-blog-false-claims/index.ts` | Mejorar prompt, cambiar modelo, forzar actualización |
| `supabase/functions/generate-blog-blooglee/index.ts` | Reforzar BLOOGLEE_DEFINITION con ejemplos |

