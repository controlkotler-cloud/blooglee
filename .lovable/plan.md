

# Plan Completo: Finalizar Plan Maestro SEO + AEO

## Estado Actual

Ya completado anteriormente:
- Schemas SEO: ProductSchema, ReviewSchema, HowToSchema, SoftwareAppSchema
- Archivos AEO: llms.txt (180+ lineas), llms-full.txt (400+ lineas), ai-context.json
- robots.txt: 15+ crawlers de IA configurados
- Landing: 12 FAQs expandidas, ReviewSchema en testimonios

## Tareas Pendientes

### Tarea 1: Paginas de Casos de Uso (4 paginas nuevas)

Crear paginas dedicadas para SEO de cola larga:

| Pagina | URL | Keyword Objetivo |
|--------|-----|------------------|
| Para Clinicas | /para/clinicas | "blog automatico clinica estetica" |
| Para Agencias | /para/agencias-marketing | "automatizar blogs clientes agencia" |
| Para Ecommerce | /para/tiendas-online | "blog automatico ecommerce" |
| Para Autonomos | /para/autonomos | "blog profesional autonomo" |

**Estructura de cada pagina:**
- Hero con problema especifico del sector
- 3 casos de uso reales con resultados
- Testimonios del sector
- 5+ FAQs especificas con FAQSchema
- CTA con copy adaptado al sector
- Usa PublicLayout para consistencia visual

**Archivos a crear:**
```text
src/pages/usecases/
  Clinicas.tsx
  Agencias.tsx
  Ecommerce.tsx
  Autonomos.tsx
```

### Tarea 2: Hub de Alternativas y Comparativas (4 paginas)

Crear hub central de comparativas para captar busquedas "Blooglee vs X":

| Pagina | URL | Keyword Objetivo |
|--------|-----|------------------|
| Index | /alternativas | "alternativas blooglee" |
| NextBlog | /alternativas/nextblog | "blooglee vs nextblog" |
| Jasper | /alternativas/jasper | "blooglee vs jasper" |
| Copy.ai | /alternativas/copy-ai | "blooglee vs copy.ai" |

**Estructura de cada comparativa:**
- Tabla de caracteristicas lado a lado
- Precios comparados
- Pros y contras de cada herramienta
- Veredicto con CTA
- FAQs especificas de la comparativa

**Archivos a crear:**
```text
src/pages/alternatives/
  Index.tsx
  NextBlog.tsx
  Jasper.tsx
  CopyAi.tsx
```

### Tarea 3: Paginas Educativas (2 paginas)

**3.1 Como Funciona (/como-funciona)**
- Paso a paso visual del proceso
- Iconos animados para cada paso
- Capturas de pantalla del dashboard (mockups)
- Video explicativo (placeholder)
- FAQs del proceso
- HowToSchema JSON-LD

**3.2 Centro de Recursos (/recursos)**
- Guias descargables (lead magnets)
- Plantillas de calendario editorial
- Checklist de SEO para WordPress
- Links a articulos del blog relacionados

**Archivos a crear:**
```text
src/pages/
  HowItWorks.tsx
  Resources.tsx
```

### Tarea 4: Actualizar Rutas y Sitemap

**App.tsx - Nuevas rutas:**
```typescript
// Casos de uso
<Route path="/para/clinicas" element={<UseCaseClinicas />} />
<Route path="/para/agencias-marketing" element={<UseCaseAgencias />} />
<Route path="/para/tiendas-online" element={<UseCaseEcommerce />} />
<Route path="/para/autonomos" element={<UseCaseAutonomos />} />

// Alternativas
<Route path="/alternativas" element={<AlternativesIndex />} />
<Route path="/alternativas/nextblog" element={<AlternativeNextBlog />} />
<Route path="/alternativas/jasper" element={<AlternativeJasper />} />
<Route path="/alternativas/copy-ai" element={<AlternativeCopyAi />} />

// Educativas
<Route path="/como-funciona" element={<HowItWorks />} />
<Route path="/recursos" element={<Resources />} />
```

**Sitemap.xml - Nuevas URLs:**
```xml
<!-- Casos de uso -->
<url><loc>https://blooglee.com/para/clinicas</loc>...</url>
<url><loc>https://blooglee.com/para/agencias-marketing</loc>...</url>
<url><loc>https://blooglee.com/para/tiendas-online</loc>...</url>
<url><loc>https://blooglee.com/para/autonomos</loc>...</url>

<!-- Alternativas -->
<url><loc>https://blooglee.com/alternativas</loc>...</url>
<url><loc>https://blooglee.com/alternativas/nextblog</loc>...</url>
<url><loc>https://blooglee.com/alternativas/jasper</loc>...</url>
<url><loc>https://blooglee.com/alternativas/copy-ai</loc>...</url>

<!-- Educativas -->
<url><loc>https://blooglee.com/como-funciona</loc>...</url>
<url><loc>https://blooglee.com/recursos</loc>...</url>
```

### Tarea 5: Optimizar Features y Pricing

**FeaturesPage.tsx:**
- Anadir seccion "Integraciones" con logos (WordPress, Yoast, Polylang)
- Expandir FAQs de 4 a 8+ preguntas
- Seccion "Como funciona la IA" para responder consultas tecnicas

**Pricing.tsx:**
- Anadir ProductSchema con PriceSpecification
- Seccion "Calculadora de ahorro" (ROI vs redactor)
- Comparativa de precios vs competencia
- Mas FAQs sobre facturacion

---

## Resumen de Archivos

### Archivos Nuevos (10 paginas)
```text
src/pages/usecases/Clinicas.tsx
src/pages/usecases/Agencias.tsx
src/pages/usecases/Ecommerce.tsx
src/pages/usecases/Autonomos.tsx
src/pages/alternatives/Index.tsx
src/pages/alternatives/NextBlog.tsx
src/pages/alternatives/Jasper.tsx
src/pages/alternatives/CopyAi.tsx
src/pages/HowItWorks.tsx
src/pages/Resources.tsx
```

### Archivos a Modificar
```text
src/App.tsx (nuevas rutas)
src/pages/FeaturesPage.tsx (integraciones, FAQs)
src/pages/Pricing.tsx (ProductSchema, calculadora)
public/sitemap.xml (nuevas URLs)
```

---

## Orden de Implementacion

1. **Paso 1**: Crear paginas de casos de uso (4 archivos)
2. **Paso 2**: Crear hub de alternativas (4 archivos)
3. **Paso 3**: Crear paginas educativas (2 archivos)
4. **Paso 4**: Actualizar App.tsx con todas las rutas
5. **Paso 5**: Optimizar FeaturesPage y Pricing
6. **Paso 6**: Actualizar sitemap.xml

---

## Resultado Final

Al completar este plan:
- **10 nuevas paginas SEO** optimizadas para cola larga
- **Cobertura de keywords**: clinicas, agencias, ecommerce, autonomos
- **Comparativas**: Blooglee vs NextBlog, Jasper, Copy.ai
- **Contenido educativo**: Como funciona, Recursos
- **Schemas JSON-LD** en todas las paginas nuevas
- **Sitemap actualizado** para indexacion rapida

