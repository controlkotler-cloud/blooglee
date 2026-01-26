

## Plan: Corregir Prompt de Imágenes, Mayúsculas y Año en Títulos

### Resumen de Problemas Identificados

| Problema | Causa | Líneas |
|----------|-------|--------|
| Imágenes idénticas | Prompt muy específico (beige, cream, workspace) | 592-614 |
| Title Case inglés | Instrucción débil que la IA ignora | 431-432 |
| Año 2026 en títulos | Fecha en prompt interpretada como parte del título | 371, 407, 434 |

---

### Solución 1: Prompt de Imagen Dinámico por Sector

**Problema actual:**
```typescript
const imagePrompt = `Generate a professional blog header image...
STYLE:
- Soft neutral colors: beige, cream, light brown, white...
- Professional office/workspace or lifestyle setting...`;
```

**Solución - Prompt simple y adaptativo:**
```typescript
const imagePrompt = `Generate a professional blog header image.

TOPIC: "${topic}"
SECTOR: ${site.sector || "professional services"}
${site.description ? `CONTEXT: ${site.description}` : ''}

REQUIREMENTS:
- Clean, professional photograph
- Visually related to the topic and sector
- NO text, NO logos, NO faces
- Suitable for blog header, 16:9 ratio
- High quality, editorial style

Generate an image that a ${site.sector || "professional"} business would use for their blog.`;
```

**Beneficio:** La IA decidirá colores, composición y estilo según el sector automáticamente.

---

### Solución 2: Forzar Capitalización Española

**Problema actual (líneas 431-432):**
```typescript
ORTOGRAFÍA:
- Usa mayúscula solo inicial en títulos (español, no Title Case inglés)
```

La instrucción es ignorada porque está entre otras reglas.

**Solución - Instrucción enfática y separada:**
```typescript
⚠️ CAPITALIZACIÓN ESPAÑOLA OBLIGATORIA:
- SOLO la primera letra del título en mayúscula (+ nombres propios)
- INCORRECTO: "Claves Del Éxito Digital Para Farmacias"
- CORRECTO: "Claves del éxito digital para farmacias"
- Los subtítulos H2 siguen la misma regla
- NO uses Title Case inglés bajo ninguna circunstancia
```

Además, añadir instrucción en el prompt de generación de tema:
```typescript
6. Usa capitalización española (solo inicial mayúscula, no Title Case)
```

---

### Solución 3: Eliminar Año de los Títulos

**Problema actual:**
La fecha `${monthNameEs} ${year}` aparece en múltiples puntos del prompt, y la IA la interpreta como parte obligatoria del título.

**Cambios:**

1. **Prompt de generación de tema (línea 371):**
```typescript
// ANTES
MES: ${monthNameEs} ${year}

// DESPUÉS
CONTEXTO TEMPORAL: Estamos en ${monthNameEs} ${year}, considera estacionalidad si aplica.
```

2. **Reglas del tema (línea 373):**
```typescript
// AÑADIR
6. NO incluyas el año en el título
7. Evita referencias temporales explícitas (ej: "en 2026", "este año")
```

3. **Título del artículo (líneas 425-426):**
```typescript
// ANTES
- TÍTULO H1: Máximo 60 caracteres. SIN nombre de empresa.

// DESPUÉS  
- TÍTULO H1: Máximo 60 caracteres. SIN nombre de empresa. SIN año (ej: "2026").
```

4. **Fallback de tema (línea 407):**
```typescript
// ANTES
topic = `Novedades del sector ${site.sector} para ${monthNameEs} ${year}`;

// DESPUÉS
topic = `Novedades y tendencias en ${site.sector || "el sector"}`;
```

5. **Fecha contextual (línea 434):**
```typescript
// ANTES
FECHA: ${dateContext}

// DESPUÉS
CONTEXTO TEMPORAL: Hoy es ${dateContext}. Usa esta información para estacionalidad, pero NO incluyas el año en el título ni subtítulos.
```

---

### Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article-saas/index.ts` | Modificar prompts (tema, artículo, imagen) |

---

### Resultado Esperado

#### Títulos - Antes vs Después

| Antes | Después |
|-------|---------|
| "Claves Del Éxito Online Para Farmacias En 2026" | "Claves del éxito online para farmacias" |
| "Estrategia Digital Para Tu Negocio En 2026" | "Estrategia digital para impulsar tu negocio" |

#### Imágenes - Antes vs Después

| Antes | Después |
|-------|---------|
| Siempre beige/crema con escritorio | Adapta colores y escenario al sector |
| Objetos genéricos (libros, café) | Objetos relevantes al tema específico |
| Estilo "alquiler" clonado | Estilo propio según contexto |

---

### Consideraciones

- **El año sigue disponible** para la IA como contexto temporal (estacionalidad), pero con instrucciones explícitas de NO incluirlo en títulos
- **Las imágenes variarán** según sector: farmacia = tonos limpios/médicos, marketing = vibrantes, hostelería = cálidos, etc.
- **La capitalización** ahora tiene ejemplos concretos de correcto/incorrecto que la IA puede seguir

