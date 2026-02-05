

## Plan: Ajustar meta descripciones (sin exclamaciones, sin adornos, mas intencion)

### Problema actual
Las meta descripciones generadas pueden incluir:
- Exclamaciones (!) e interrogaciones (?)
- Frases tipo CTA generico ("Descubre mas")
- Adornos que no aportan valor SEO

### Archivos a modificar

#### 1. `supabase/functions/generate-article-saas/index.ts`

**Lineas 183-186** - Instrucciones META DESCRIPTION:
```text
// ANTES:
3. META DESCRIPTION:
   - EXACTAMENTE 140-150 caracteres (NUNCA más de 150)
   - Incluir focus_keyword
   - Terminar con CTA

// DESPUES:
3. META DESCRIPTION:
   - MAXIMO 145 caracteres (nunca superar 150)
   - Incluir focus_keyword de forma natural
   - Tono directo y profesional, SIN exclamaciones (!) ni interrogaciones (?)
   - Sin adornos ni frases vacias (evitar "Descubre", "No te pierdas", etc.)
   - Foco en beneficio concreto o propuesta de valor clara
```

**Linea 211** - Ejemplo JSON:
```text
// ANTES:
"meta_description": "Meta descripción (140-150 caracteres EXACTOS) con focus_keyword y CTA"

// DESPUES:
"meta_description": "Meta descripción directa (max 145 chars) con focus_keyword, sin ! ni ?"
```

**Linea 231** - Regla en prompt user:
```text
// ANTES:
4. La meta_description debe tener EXACTAMENTE 140-150 caracteres (NUNCA más de 150)

// DESPUES:
4. La meta_description: maximo 145 caracteres, tono directo, SIN exclamaciones ni interrogaciones
```

**Linea 240** - Ejemplo JSON user:
```text
// ANTES:
"meta_description": "Meta descripción (140-150 chars EXACTOS) con keyword y CTA"

// DESPUES:
"meta_description": "Descripcion directa (max 145 chars) con keyword, sin signos de exclamacion"
```

**Linea 260** - Traduccion catalan:
```text
// ANTES:
- La meta_description NO puede superar 155 caracteres

// DESPUES:
- La meta_description: maximo 145 caracteres, sin ! ni ?, tono directo
```

**Linea 267** - Ejemplo catalan:
```text
// ANTES:
"meta_description": "Meta descripció en català (MÀXIM 155 chars)"

// DESPUES:
"meta_description": "Meta descripció directa (max 145 chars), sense ! ni ?"
```

#### 2. `supabase/functions/generate-blog-blooglee/index.ts`

**Linea 513** - Regla excerpt:
```text
// ANTES:
- El excerpt debe tener máximo 155 caracteres

// DESPUES:
- El excerpt: maximo 145 caracteres, tono directo, SIN exclamaciones ni interrogaciones
```

**Linea 532** - Ejemplo JSON:
```text
// ANTES:
"excerpt": "Meta description atractiva (max 155 chars)"

// DESPUES:
"excerpt": "Meta description directa (max 145 chars), sin ! ni ?, enfoque en beneficio concreto"
```

### Resumen de cambios

| Aspecto | Antes | Despues |
|---------|-------|---------|
| Limite caracteres | 150-155 | 145 max |
| Exclamaciones | Permitidas | Prohibidas |
| Interrogaciones | Permitidas | Prohibidas |
| CTAs genericos | "Terminar con CTA" | Beneficio concreto |
| Tono | "Atractivo" | "Directo y profesional" |

### Funciones afectadas
- `generate-article-saas` (articulos SaaS multi-tenant)
- `generate-blog-blooglee` (blog publico de Blooglee)

### Notas
- Las funciones de zona protegida MKPro (`generate-article`, `generate-article-empresa`) NO se modifican segun las reglas de arquitectura
- Los cambios solo afectan a los prompts de generacion, no a la logica de truncado posterior

