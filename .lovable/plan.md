

# Plan: Corregir Bug de Duplicados en Generación de Artículos

## Problema Identificado

El cron `generate-monthly-articles` hace `INSERT` directo sin verificar si ya existe un artículo para ese mes/año/empresa. Esto causa errores de "duplicate key" cuando:
1. El cron genera un artículo automáticamente
2. El usuario intenta generar manualmente el mismo mes
3. O viceversa

## Solución

Modificar `generate-monthly-articles/index.ts` para usar la misma lógica de "upsert" que tiene el hook del frontend:

### Cambio en líneas ~874-887:

**Antes:**
```typescript
await supabase.from("articulos_empresas").insert({
  empresa_id: empresa.id,
  month: currentMonth,
  year: currentYear,
  // ... resto de campos
});
```

**Después:**
```typescript
// Verificar si ya existe un artículo para este mes/año
const { data: existing } = await supabase
  .from("articulos_empresas")
  .select("id")
  .eq("empresa_id", empresa.id)
  .eq("month", currentMonth)
  .eq("year", currentYear)
  .maybeSingle();

const articleData = {
  empresa_id: empresa.id,
  month: currentMonth,
  year: currentYear,
  topic: topic.tema,
  day_of_month: now.getDate(),
  week_of_month: Math.ceil(now.getDate() / 7),
  content_spanish: generatedData.content?.spanish || null,
  content_catalan: generatedData.content?.catalan || null,
  image_url: generatedData.image?.url || null,
  image_photographer: generatedData.image?.photographer || null,
  image_photographer_url: generatedData.image?.photographer_url || null,
  pexels_query: generatedData.pexels_query || topic.pexels_query,
};

if (existing) {
  // Actualizar artículo existente
  await supabase.from("articulos_empresas")
    .update(articleData)
    .eq("id", existing.id);
  console.log(`✓ Updated existing article for empresa ${empresa.name}`);
} else {
  // Insertar nuevo artículo
  await supabase.from("articulos_empresas").insert(articleData);
  console.log(`✓ Created new article for empresa ${empresa.name}`);
}
```

### Mismo cambio para Farmacias (~líneas 690-705)

Aplicar la misma lógica de verificación/upsert para la sección de farmacias.

### Mismo cambio para Sites SaaS (~líneas 990-1010)

Aplicar la misma lógica para los sites del SaaS.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-monthly-articles/index.ts` | Cambiar INSERT por lógica upsert en 3 lugares (farmacias, empresas, sites) |

---

## Resultado Esperado

- Cuando generes manualmente → Funciona (actualiza si existe, crea si no)
- Cuando el cron genera → Funciona (actualiza si existe, crea si no)
- Sin más errores de "duplicate key"
- El usuario siempre puede regenerar el artículo del mes actual

