

## Generación de 5 artículos optimizados para AI Overviews

### Contexto actual

El blog tiene **26 artículos publicados** distribuidos entre audiencias "empresas" y "agencias" con categorías temáticas rotatorias (SEO, Marketing, Tutoriales, Comparativas, Producto, Tendencias).

### Temas estratégicos propuestos

Estos temas están diseñados para **capturar AI Overviews** y responder preguntas directas que los usuarios hacen a Google/Bard/ChatGPT:

| # | Tema | Audiencia | Categoría | Intención de búsqueda |
|---|------|-----------|-----------|----------------------|
| 1 | **Precio de redactor freelance en España** | Empresas | Comparativas | "¿cuánto cobra un redactor freelance?" |
| 2 | **Cuánto cuesta mantener un blog corporativo** | Empresas | Marketing | "coste blog empresa" |
| 3 | **Tarifas agencia de contenidos: guía de precios** | Agencias | Comparativas | "tarifas agencia contenidos" |
| 4 | **ROI del content marketing: datos y métricas reales** | Empresas | SEO | "retorno inversión marketing contenidos" |
| 5 | **Tiempo de posicionamiento SEO: cuánto tarda un artículo** | Agencias | SEO | "cuánto tarda posicionar artículo" |

### Por qué estos temas funcionan para AI Overviews

1. **Responden preguntas concretas** - Los AI Overviews priorizan contenido que da respuestas directas
2. **Datos numéricos** - Precios, tiempos, porcentajes son ideales para snippets
3. **Tablas comparativas** - Fáciles de extraer para respuestas estructuradas
4. **Long-tail comercial** - Capturan usuarios en fase de decisión de compra
5. **Evergreen** - No dependen de años específicos

### Plan de ejecución

#### Paso 1: Generar 3 artículos para "Empresas"
Invocar la Edge Function `generate-blog-blooglee` tres veces con:
- `audience: "Empresas"`
- `force: true` (para saltarse la restricción de 1 por día)
- Temas forzados via prompt indirecto usando `forceThematicCategory`

#### Paso 2: Generar 2 artículos para "Agencias"
Invocar la Edge Function dos veces con:
- `audience: "Agencias"`
- `force: true`

#### Paso 3: Verificar creación
Consultar la tabla `blog_posts` para confirmar los 5 nuevos artículos.

#### Paso 4: Actualizar assets SEO
Invocar `update-seo-assets` para regenerar:
- `sitemap.xml`
- `llms.txt`
- `llms-full.txt`

### Consideraciones técnicas

- La función ya tiene deduplicación semántica (50% word overlap check)
- Rotación automática de categorías temáticas
- Generación de imágenes AI con estética Blooglee
- Límite de ~2500-3500 palabras por artículo (premium)
- Inserción automática con `is_published: true`

### Resultado esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Total artículos | 26 | 31 |
| Cobertura temas "precios" | 1 | 4 |
| Artículos con datos numéricos | ~5 | ~10 |

### Limitación actual

La Edge Function genera temas automáticamente basándose en sus pools (`EMPRESA_TOPICS`, `AGENCIA_TOPICS`). Para forzar temas específicos como "precio de redactor freelance", necesitaríamos:

**Opción A (Rápida)**: Ejecutar la función 5 veces con `force: true` y confiar en la rotación inteligente + deduplicación.

**Opción B (Precisa)**: Modificar la función para aceptar un parámetro `forceTopic` que pase el tema exacto al prompt.

### Recomendación

Usar **Opción A** ahora (generar 5 artículos con la rotación actual) y luego implementar **Opción B** si quieres control total sobre los temas específicos.

