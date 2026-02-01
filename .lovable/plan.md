

# Plan: Programacion Personalizada de Dia y Hora por Site

## Objetivo

Permitir que cada usuario seleccione de forma independiente y granular:
1. **Frecuencia** (diaria, semanal, quincenal, mensual)
2. **Dia especifico** (segun la frecuencia elegida)
3. **Hora de publicacion** (personalizada por site)

Esto distribuira la carga del sistema y evitara que todos los sites publiquen al mismo momento.

---

## Cambios en la Base de Datos

### Nuevas columnas en tabla `sites`

| Columna | Tipo | Default | Descripcion |
|---------|------|---------|-------------|
| `publish_day_of_week` | integer | NULL | 0-6 (Dom-Sab) para semanal/quincenal |
| `publish_day_of_month` | integer | NULL | 1-31 para mensual con dia fijo |
| `publish_week_of_month` | integer | NULL | 1-4 para mensual con semana especifica |
| `publish_hour_utc` | integer | 9 | Hora UTC (0-23) para publicacion |

### Logica de combinacion

- **Diario/Diario L-V**: Solo usa `publish_hour_utc`
- **Semanal**: Usa `publish_day_of_week` + `publish_hour_utc`
- **Quincenal**: Usa `publish_day_of_week` + semanas 1 y 3 + `publish_hour_utc`
- **Mensual (dia fijo)**: Usa `publish_day_of_month` + `publish_hour_utc`
- **Mensual (dia de semana)**: Usa `publish_day_of_week` + `publish_week_of_month` + `publish_hour_utc`

---

## Cambios en el Frontend

### Componente `SiteSettings.tsx`

Nueva seccion "Programacion de publicacion" con:

1. **Frecuencia** (select existente, sin cambios)

2. **Dia de publicacion** (condicional segun frecuencia):
   - Para `weekly` / `biweekly`: Select con dias de la semana (Lunes a Domingo)
   - Para `monthly`: Radio para elegir entre:
     - "Dia fijo del mes" + input numerico (1-28)
     - "Dia de la semana" + select dia + select semana (1era, 2da, 3era, 4ta)

3. **Hora de publicacion**: Select con horas (00:00 a 23:00 en bloques de 1h)
   - Mostrar hora local del usuario con conversion a UTC

---

## Cambios en el Backend

### Edge Function `generate-scheduler`

Actualizar la logica de `shouldGenerateToday` para:

1. Leer las nuevas columnas de cada site
2. Comparar con la hora actual UTC
3. Solo disparar si coincide dia Y hora

```typescript
function shouldGenerateNow(
  site: SiteWithSchedule,
  now: Date
): boolean {
  const currentHour = now.getUTCHours();
  const publishHour = site.publish_hour_utc ?? 9;
  
  // Solo generar en la hora configurada
  if (currentHour !== publishHour) {
    return false;
  }
  
  // Logica de dia segun frecuencia...
}
```

### Cron del Scheduler

Cambiar de ejecutarse 1 vez al dia (09:00) a ejecutarse **cada hora**:

```sql
-- Ejecutar cada hora en punto
SELECT cron.schedule(
  'dispatch-article-generation',
  '0 * * * *',  -- Cada hora
  ...
);
```

El scheduler verificara para cada site si coincide su `publish_hour_utc` con la hora actual.

---

## Flujo de Usuario

1. Usuario va a Configuracion del Site
2. Selecciona frecuencia (ej: "Semanal")
3. Aparece selector de dia: "Miercoles"
4. Selecciona hora: "10:00 (hora local)" -> se guarda como 9 UTC
5. El scheduler ejecuta cada hora y solo dispara este site los miercoles a las 9 UTC

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/saas/SiteSettings.tsx` | Anadir UI para dia y hora |
| `src/hooks/useSites.ts` | Anadir nuevos campos al tipo Site |
| `supabase/functions/generate-scheduler/index.ts` | Nueva logica shouldGenerateNow |
| SQL Migration | Nuevas columnas en tabla sites |
| SQL Cron Update | Cambiar de diario a cada hora |

---

## Consideraciones Adicionales

### Timezone del usuario
- Mostrar hora en timezone local del usuario
- Guardar siempre en UTC en la base de datos
- Usar `Intl.DateTimeFormat` para detectar timezone

### Valores por defecto
- Nuevos sites: hora aleatoria entre 7:00-18:00 UTC para distribuir carga
- Sites existentes: mantener 09:00 UTC como default

### Farmacias y Empresas (MKPro)
- Mantener logica actual (primer lunes del mes a las 09:00)
- No se modifican tablas protegidas

---

## Seccion Tecnica

### Estructura de datos ampliada

```typescript
interface SiteSchedule {
  publish_frequency: 'daily' | 'daily_weekdays' | 'weekly' | 'biweekly' | 'monthly';
  publish_day_of_week: number | null;    // 0-6 (Dom-Sab)
  publish_day_of_month: number | null;   // 1-31
  publish_week_of_month: number | null;  // 1-4
  publish_hour_utc: number;              // 0-23
}
```

### Logica del Scheduler

```typescript
function shouldGenerateNow(site: SiteWithSchedule, now: Date): boolean {
  const currentHour = now.getUTCHours();
  const currentDayOfWeek = now.getUTCDay();
  const currentDayOfMonth = now.getUTCDate();
  const currentWeekOfMonth = Math.ceil(currentDayOfMonth / 7);

  // Verificar hora
  if (currentHour !== (site.publish_hour_utc ?? 9)) {
    return false;
  }

  switch (site.publish_frequency) {
    case 'daily':
      return true;

    case 'daily_weekdays':
      return currentDayOfWeek >= 1 && currentDayOfWeek <= 5;

    case 'weekly':
      return currentDayOfWeek === (site.publish_day_of_week ?? 1);

    case 'biweekly':
      return currentDayOfWeek === (site.publish_day_of_week ?? 1) 
        && (currentWeekOfMonth === 1 || currentWeekOfMonth === 3);

    case 'monthly':
      if (site.publish_day_of_month) {
        // Dia fijo del mes
        return currentDayOfMonth === site.publish_day_of_month;
      } else {
        // Dia de semana especifico
        return currentDayOfWeek === (site.publish_day_of_week ?? 1)
          && currentWeekOfMonth === (site.publish_week_of_month ?? 1);
      }

    default:
      return false;
  }
}
```

### Migracion SQL

```sql
ALTER TABLE sites
ADD COLUMN publish_day_of_week integer,
ADD COLUMN publish_day_of_month integer,
ADD COLUMN publish_week_of_month integer,
ADD COLUMN publish_hour_utc integer DEFAULT 9;

-- Constraint para validar rangos
ALTER TABLE sites
ADD CONSTRAINT check_day_of_week CHECK (publish_day_of_week IS NULL OR (publish_day_of_week >= 0 AND publish_day_of_week <= 6)),
ADD CONSTRAINT check_day_of_month CHECK (publish_day_of_month IS NULL OR (publish_day_of_month >= 1 AND publish_day_of_month <= 31)),
ADD CONSTRAINT check_week_of_month CHECK (publish_week_of_month IS NULL OR (publish_week_of_month >= 1 AND publish_week_of_month <= 4)),
ADD CONSTRAINT check_hour_utc CHECK (publish_hour_utc >= 0 AND publish_hour_utc <= 23);
```

