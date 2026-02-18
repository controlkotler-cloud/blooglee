
# Plan: Análisis Automático de Web en Onboarding

## Objetivo

Permitir que el usuario pegue la URL de su web en el onboarding y Blooglee extraiga automáticamente: sector, descripción, ubicación, tono, audiencia, keywords y pilares de contenido. El usuario revisa y confirma antes de crear el sitio.

---

## Fase 1: Backend — Edge Function `analyze-website-saas`

### Qué hace
1. Recibe `{ url: string }` del frontend (requiere JWT auth)
2. Usa **Firecrawl** (conector) para scraping → markdown + branding
3. Envía el markdown a **Gemini 2.5 Flash** con un prompt estructurado
4. Devuelve JSON tipado:

```json
{
  "business_name": "Farmacia Central",
  "sector": "farmacia",
  "description": "Farmacia especializada en dermocosmética natural...",
  "location": "Barcelona",
  "geographic_scope": "local",
  "tone": "professional",
  "target_audience": "Familias jóvenes preocupadas por la salud natural",
  "content_pillars": ["educational", "seasonal", "trends"],
  "suggested_keywords": ["dermocosmética natural", "farmacia Barcelona"],
  "languages_detected": ["spanish", "catalan"],
  "confidence": 0.85
}
```

### Archivos
- `supabase/functions/analyze-website-saas/index.ts`

### Dependencias
- Conector Firecrawl (verificar si está vinculado)
- Secret `LOVABLE_API_KEY` (ya existe)

---

## Fase 2: UI — Rediseño del Onboarding

### Nuevo flujo (4 pasos en vez de 3)

```
Paso 0 (NUEVO): "¿Tienes web?"
   ├─ Sí → Input URL + botón "Analizar" → loading animado → preview resultados
   └─ No / Saltar → Flujo manual actual (paso 1)

Paso 1: "Tu negocio" (pre-rellenado si hubo análisis)
Paso 2: "Ubicación" (pre-rellenado)
Paso 3: "Preferencias" (idiomas y frecuencia, pre-rellenado)
```

### Diseño del Paso 0 — Pantalla de análisis

#### Layout
- Card centrada como el resto del onboarding (max-w-2xl)
- Logo Blooglee arriba
- Título gradient: **"¿Tu negocio tiene web?"**
- Subtítulo: "Pega la URL y analizaremos tu web para configurar todo automáticamente"

#### Componentes
1. **Input URL** con icono Globe, estilo `input-aurora`
   - Placeholder: "https://www.tunegocio.com"
   - Validación: formato URL válido
2. **Botón "Analizar mi web ✨"** con gradiente Blooglee (violet→fuchsia→orange)
   - Estado loading: shimmer animation + texto "Analizando tu web..."
3. **Link "Prefiero hacerlo manual →"** debajo, estilo sutil muted

#### Estado de carga (mientras analiza ~10-15s)
- Reemplaza el formulario por una animación de progreso:
  - Icono Search animado con pulse
  - Steps secuenciales con checkmarks:
    1. ✅ "Conectando con tu web..."
    2. ✅ "Leyendo contenido..."
    3. ⏳ "Analizando con IA..."
    4. ○ "Preparando tu configuración..."
  - Texto inferior: "Esto suele tardar unos 10-15 segundos"

#### Resultado del análisis (preview antes de continuar)
- Card con resumen visual de lo detectado:
  - **Nombre**: texto grande con el nombre detectado
  - **Sector**: badge con emoji + sector
  - **Ubicación**: badge con pin + ciudad
  - **Tono**: badge descriptivo
  - **Keywords**: chips/tags con las keywords sugeridas (scrollable horizontal)
  - **Confianza**: indicador visual si confidence > 0.7
- Botón principal: "¡Perfecto, continuar! ✨" → pasa al paso 1 con datos pre-rellenados
- Link secundario: "Quiero ajustar algunos datos" → pasa al paso 1 con campos editables

### Refactoring de Onboarding.tsx (423 líneas → componentes)

| Archivo | Contenido |
|---------|-----------|
| `src/components/saas/onboarding/OnboardingCard.tsx` | Card wrapper con logo, step indicators, progress bar |
| `src/components/saas/onboarding/WebAnalysisStep.tsx` | Paso 0: input URL + estados loading/resultado |
| `src/components/saas/onboarding/BusinessInfoStep.tsx` | Paso 1: nombre, sector, descripción |
| `src/components/saas/onboarding/LocationStep.tsx` | Paso 2: ubicación y ámbito geográfico |
| `src/components/saas/onboarding/PreferencesStep.tsx` | Paso 3: idiomas y frecuencia |
| `src/components/saas/onboarding/AnalysisResultPreview.tsx` | Preview de resultados del análisis |
| `src/components/saas/onboarding/AnalysisLoadingState.tsx` | Animación de carga del análisis |
| `src/components/saas/onboarding/constants.ts` | SECTORS, GEOGRAPHIC_SCOPES, PUBLISH_FREQUENCIES |
| `src/hooks/useWebsiteAnalysis.ts` | Hook para llamar a la Edge Function |
| `src/pages/Onboarding.tsx` | Orquestador ligero: estado global + navegación |

---

## Fase 3: Integración de datos

### Mapeo análisis → formulario
| Campo análisis | Campo formulario | Notas |
|----------------|-----------------|-------|
| `business_name` | `name` | Pre-rellena input |
| `sector` | `sector` | Mapea a SECTORS enum, o "otro" + customSector |
| `description` | `description` | Pre-rellena textarea |
| `location` | `location` | Pre-rellena input |
| `geographic_scope` | `geographicScope` | Selecciona botón correspondiente |
| `languages_detected` | `languages` | Pre-selecciona checkboxes |

### Campos enriquecidos (guardados al crear el sitio)
| Campo análisis | Campo en tabla `sites` | Acción |
|----------------|----------------------|--------|
| `tone` | `tone` | Pasar a useCreateSite |
| `target_audience` | `target_audience` | Pasar a useCreateSite |
| `content_pillars` | `content_pillars` | Pasar a useCreateSite |
| `suggested_keywords` | (no hay columna) | Guardar en description o ignorar por ahora |

Verificar que `useCreateSite` acepta tone, target_audience y content_pillars. Si no, extender el mutation.

---

## Fase 4: Prompt de análisis

### System Prompt
```
Eres un analista experto en marketing digital y SEO español. Analizas páginas web y extraes información estructurada sobre el negocio.

REGLAS:
- Responde SOLO en JSON válido, sin markdown ni explicaciones
- Si no puedes determinar un campo con confianza, usa null
- El sector debe mapearse a uno de: farmacia, clinica_dental, clinica_estetica, fisioterapia, psicologia, nutricion, veterinaria, abogados, arquitectura, inmobiliaria, restaurante, hotel, gimnasio, ecommerce, tecnologia, marketing, consultoria, otro
- El tono debe ser: formal, casual, technical, educational
- Los pilares deben ser de: educational, trends, cases, seasonal, opinion
- Las keywords deben ser términos reales de búsqueda SEO en español, no genéricos
- geographic_scope: local, regional, national, international
- Detecta idiomas presentes: spanish, catalan
- confidence: 0.0-1.0 según cuánta información pudiste extraer
```

### User Prompt
```
Analiza esta página web y extrae la información del negocio:

URL: {{url}}

CONTENIDO:
{{markdown_content}}

Responde con este JSON:
{
  "business_name": "string",
  "sector": "string",
  "description": "string (2-3 frases: qué hace y qué lo diferencia)",
  "location": "string | null",
  "geographic_scope": "string",
  "tone": "string",
  "target_audience": "string",
  "content_pillars": ["3 pilares recomendados"],
  "suggested_keywords": ["5-8 keywords SEO"],
  "languages_detected": ["idiomas"],
  "confidence": number
}
```

---

## Orden de implementación

1. ✅ Verificar/vincular conector Firecrawl → `connect` tool
2. Crear Edge Function `analyze-website-saas`
3. Crear hook `useWebsiteAnalysis.ts`
4. Extraer constantes a `constants.ts`
5. Crear componentes de cada paso del onboarding
6. Crear `WebAnalysisStep` + `AnalysisLoadingState` + `AnalysisResultPreview`
7. Refactorizar `Onboarding.tsx` como orquestador
8. Extender `useCreateSite` para campos enriquecidos si necesario
9. Testing end-to-end

---

## Notas técnicas
- Firecrawl: usar `formats: ['markdown']`, `onlyMainContent: true`
- Timeout: ~10-15s → UX de loading con steps es crítica
- Fallback: si Firecrawl o IA falla → mensaje amigable + flujo manual
- El paso 0 es **100% opcional** — el usuario siempre puede saltar
- Rate limiting: protegido por JWT, no necesita extra
- No se modifica ninguna tabla de BD (los campos ya existen en `sites`)
