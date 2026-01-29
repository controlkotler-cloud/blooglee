

# Plan: Añadir Frecuencias Diarias a Blooglee SaaS

## Resumen

Añadir dos nuevas opciones de frecuencia de publicación a Blooglee SaaS:
- **Diario (7 días)**: genera un artículo todos los días
- **Diario laborable (L-V)**: genera un artículo solo de lunes a viernes

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/saas/SiteSettings.tsx` | Añadir opciones `daily` y `daily_weekdays` al selector de frecuencia |
| `src/pages/Onboarding.tsx` | Añadir las mismas opciones al flujo de creación de sitio |
| `supabase/functions/generate-monthly-articles/index.ts` | Añadir lógica para `daily_weekdays` (saltar sábado/domingo) |
| `src/lib/articleSelectionHelpers.ts` | Actualizar la lógica de selección para soportar `daily_weekdays` |

## Cambios Detallados

### 1. SiteSettings.tsx (líneas 228-233)

**Opciones actuales:**
```tsx
<SelectItem value="weekly">Semanal</SelectItem>
<SelectItem value="biweekly">Quincenal</SelectItem>
<SelectItem value="monthly">Mensual</SelectItem>
```

**Nuevas opciones:**
```tsx
<SelectItem value="daily">Diario (todos los días)</SelectItem>
<SelectItem value="daily_weekdays">Diario (L-V)</SelectItem>
<SelectItem value="weekly">Semanal</SelectItem>
<SelectItem value="biweekly">Quincenal</SelectItem>
<SelectItem value="monthly">Mensual</SelectItem>
```

### 2. Onboarding.tsx

Añadir selector de frecuencia en el paso 3 o 4 del onboarding, con las mismas opciones.

### 3. generate-monthly-articles/index.ts

En la función `shouldGenerateForEntity`, añadir caso para `daily_weekdays`:

```typescript
if (frequency === 'daily_weekdays') {
  const dayOfWeek = now.getDay(); // 0=Dom, 6=Sáb
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { shouldGenerate: false, reason: 'Fin de semana - no se genera' };
  }
  // Mismo check que 'daily' para hoy
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const { data } = await supabase...
}
```

### 4. articleSelectionHelpers.ts

Actualizar `getCompanyArticleForPeriod` para tratar `daily_weekdays` igual que `daily` en términos de selección de artículo:

```typescript
if (frequency === "daily" || frequency === "daily_weekdays") {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  filtered = filtered.filter((a) => new Date(a.generated_at) >= todayStart);
}
```

## Resultado Esperado

- En la configuración de sitio aparecen las 5 frecuencias
- En el onboarding se puede elegir cualquier frecuencia
- El cron genera artículos diarios (7 días o L-V según configuración)
- La UI muestra correctamente el artículo del día actual

## Sección Técnica

### Valores de frecuencia soportados

| Valor | Descripción | Cuándo genera |
|-------|-------------|---------------|
| `daily` | Diario todos los días | Cada día a las 09:00 |
| `daily_weekdays` | Diario laborable | Lunes a Viernes a las 09:00 |
| `weekly` | Semanal | 1 vez por semana (lunes) |
| `biweekly` | Quincenal | Cada 2 semanas |
| `monthly` | Mensual | 1 vez al mes |

### No se requieren cambios de base de datos

La columna `publish_frequency` ya es de tipo `text`, por lo que acepta cualquier valor string sin necesidad de migración.

