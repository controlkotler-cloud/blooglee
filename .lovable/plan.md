
## Plan: Sistema de Generación con Frecuencia Diferenciada y Validación de Límites

### Resumen del Problema

1. **Farmacias (MKPro)**: El cron actual funciona bien para ellas (primer lunes del mes)
2. **Empresas (MKPro)**: Tienen `publish_frequency` configurado pero el cron lo ignora
3. **Sites (SaaS)**: Aún no están integrados en el cron
4. **mkpro tiene `daily`** pero el cron solo se ejecuta mensualmente

---

## Arquitectura de la Solución

```text
+------------------+     +------------------+     +------------------+
|   FARMACIAS      |     |   EMPRESAS       |     |   SITES (SaaS)   |
|   (MKPro)        |     |   (MKPro)        |     |                  |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        v                        v                        v
  [FIXED: Primer           [DYNAMIC:               [DYNAMIC:
   lunes del mes]           daily/weekly/           segun plan +
                            monthly segun           publish_frequency]
                            config]
        |                        |                        |
        +------------------------+------------------------+
                                 |
                                 v
                    +------------------------+
                    |  CRON DIARIO 9:00 AM   |
                    |  generate-monthly-     |
                    |  articles              |
                    +------------------------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
           [Validar si toca    [Validar limites
            generar segun       del plan antes
            frecuencia]         de generar]
                    |                         |
                    +------------+------------+
                                 |
                                 v
                    +------------------------+
                    |   RATE LIMIT: 50/hora  |
                    |   (Unsplash pending)   |
                    +------------------------+
```

---

## Cambios en Base de Datos

### 1. Agregar columna `posts_limit` a profiles

```sql
ALTER TABLE profiles 
ADD COLUMN posts_limit integer NOT NULL DEFAULT 4;

-- Actualizar limites segun plan
COMMENT ON COLUMN profiles.posts_limit IS 
  'Free=1, Starter=4, Pro=30, Agency=100';
```

### 2. Agregar columnas de control de generacion a articulos_empresas

```sql
-- Ya existe day_of_month y week_of_month, usaremos esos para tracking
```

---

## Logica de Frecuencia por Entidad

### Farmacias (sin cambios)
- **Frecuencia**: Fija al primer lunes de cada mes
- **Validacion**: Verificar si ya existe articulo para month/year

### Empresas (cambio mayor)
- **daily**: Verificar si ya existe articulo HOY (generated_at >= inicio del dia)
- **weekly**: Verificar si ya existe articulo ESTA SEMANA (lunes actual)
- **monthly**: Verificar si ya existe articulo ESTE MES (como ahora)

### Sites SaaS (nueva logica)
- Igual que empresas PERO:
- **Validar limites del plan** antes de generar
- Si el usuario excede su `posts_limit` mensual, NO generar y enviar email de aviso

---

## Implementacion en generate-monthly-articles

### Nueva funcion: shouldGenerateForEntity

```typescript
async function shouldGenerateForEntity(
  supabase: SupabaseClient,
  entityId: string,
  entityType: 'farmacia' | 'empresa' | 'site',
  frequency: string,
  currentMonth: number,
  currentYear: number
): Promise<{ shouldGenerate: boolean; reason?: string }> {
  const now = new Date();
  const table = entityType === 'farmacia' ? 'articulos' 
              : entityType === 'empresa' ? 'articulos_empresas' 
              : 'articles';
  const idColumn = entityType === 'farmacia' ? 'farmacia_id'
                 : entityType === 'empresa' ? 'empresa_id'
                 : 'site_id';
  
  // FARMACIAS: Solo primer lunes del mes
  if (entityType === 'farmacia') {
    const isFirstMonday = isFirstMondayOfMonth(now);
    if (!isFirstMonday) {
      return { shouldGenerate: false, reason: 'No es el primer lunes del mes' };
    }
    // Verificar si ya existe para este mes
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(idColumn, entityId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene articulo este mes' : undefined
    };
  }
  
  // EMPRESAS y SITES: Segun frequency
  if (frequency === 'daily') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(idColumn, entityId)
      .gte('generated_at', todayStart.toISOString())
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene articulo hoy' : undefined
    };
  }
  
  if (frequency === 'weekly') {
    const weekStart = getStartOfWeek(now); // Lunes de esta semana
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq(idColumn, entityId)
      .gte('generated_at', weekStart.toISOString())
      .limit(1);
    return { 
      shouldGenerate: !data || data.length === 0,
      reason: data?.length ? 'Ya tiene articulo esta semana' : undefined
    };
  }
  
  // monthly (default)
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq(idColumn, entityId)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .limit(1);
  return { 
    shouldGenerate: !data || data.length === 0,
    reason: data?.length ? 'Ya tiene articulo este mes' : undefined
  };
}
```

### Nueva funcion: checkPlanLimits (solo para Sites SaaS)

```typescript
async function checkPlanLimits(
  supabase: SupabaseClient,
  userId: string,
  currentMonth: number,
  currentYear: number
): Promise<{ withinLimits: boolean; used: number; limit: number }> {
  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('posts_limit')
    .eq('user_id', userId)
    .single();
  
  const postsLimit = profile?.posts_limit ?? 1; // Default Free = 1
  
  // Contar articulos generados este mes para este usuario
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .eq('year', currentYear);
  
  const used = count || 0;
  
  return {
    withinLimits: used < postsLimit,
    used,
    limit: postsLimit
  };
}
```

### Nueva funcion: generateDynamicTopic (mejorada)

```typescript
async function generateDynamicTopic(
  lovableApiKey: string,
  entity: { name: string; sector: string; location: string },
  currentMonth: number,
  currentYear: number,
  usedTopics: string[]
): Promise<string> {
  // Obtener fecha real actual
  const now = new Date();
  const dayOfMonth = now.getDate();
  const dayOfWeek = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'][now.getDay()];
  
  const prompt = `Eres un experto en SEO y marketing de contenidos.
Fecha REAL de hoy: ${dayOfMonth} de ${MONTH_NAMES[currentMonth - 1]} de ${currentYear} (${dayOfWeek})

Empresa: ${entity.name}
Sector: ${entity.sector || "servicios profesionales"}
Localidad: ${entity.location || "Espana"}

TEMAS YA USADOS (NO repetir): ${usedTopics.slice(-10).join(', ') || 'ninguno'}

Genera UN tema para articulo de blog que:
1. Sea 100% relevante para el sector "${entity.sector}"
2. Considere eventos/efemerides REALES de esta fecha (${dayOfMonth}/${currentMonth}/${currentYear})
3. Tenga en cuenta tendencias actuales de ${currentYear}
4. NO sea generico - debe ser especifico y util
5. Maximo 60 caracteres
6. NO incluir nombre de empresa
7. NO repetir temas ya usados

Solo responde con el tema, sin explicaciones.`;

  // ... llamada a AI ...
}
```

---

## Cambios en el Cron Job

### Cambiar a ejecucion diaria

```sql
-- Eliminar cron actual
SELECT cron.unschedule('generate-monthly-articles');

-- Crear nuevo cron diario
SELECT cron.schedule(
  'generate-articles-daily',
  '0 9 * * *',  -- Todos los dias a las 9:00 AM
  $$
  SELECT net.http_post(
    url := 'https://gqtikajhhggyoiypkbgw.supabase.co/functions/v1/generate-monthly-articles',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Rate Limiting (50/hora Unsplash)

### Logica de control

```typescript
const MAX_ARTICLES_PER_RUN = 50; // Limite Unsplash
let articlesGenerated = 0;

// En el loop de generacion:
if (articlesGenerated >= MAX_ARTICLES_PER_RUN) {
  console.log(`Rate limit reached (${MAX_ARTICLES_PER_RUN}), stopping generation`);
  break;
}

// Prioridad de generacion:
// 1. Farmacias (primer lunes)
// 2. Empresas daily
// 3. Empresas weekly  
// 4. Sites SaaS daily
// 5. Sites SaaS weekly
// 6. Empresas monthly
// 7. Sites SaaS monthly
```

---

## Flujo de Notificaciones

### Nuevo email para limites excedidos

```typescript
async function sendLimitExceededEmail(
  resend: Resend,
  userEmail: string,
  siteName: string,
  used: number,
  limit: number
) {
  await resend.emails.send({
    from: "Blooglee <onboarding@resend.dev>",
    to: [userEmail],
    subject: `Has alcanzado tu limite de articulos - ${siteName}`,
    html: `
      <h1>Limite de articulos alcanzado</h1>
      <p>No se ha podido generar el articulo automatico para <strong>${siteName}</strong>.</p>
      <p>Has usado <strong>${used}</strong> de <strong>${limit}</strong> articulos este mes.</p>
      <p>Actualiza tu plan para generar mas articulos.</p>
      <a href="${PORTAL_URL}/billing">Ver planes</a>
    `,
  });
}
```

---

## Archivos a Modificar

1. **supabase/functions/generate-monthly-articles/index.ts**
   - Agregar `shouldGenerateForEntity()`
   - Agregar `checkPlanLimits()`
   - Agregar `generateDynamicTopic()` mejorado
   - Agregar procesamiento de Sites SaaS
   - Agregar rate limiting (50/hora)
   - Agregar notificaciones de limites

2. **Migracion SQL**
   - Agregar `posts_limit` a profiles
   - Actualizar cron job a ejecucion diaria

---

## Resumen de Reglas Finales

| Entidad | Frecuencia | Validacion | Limites |
|---------|------------|------------|---------|
| Farmacias | Fijo: 1er lunes/mes | month+year | Sin limite |
| Empresas MKPro | Configurable | Segun frequency | Sin limite |
| Sites SaaS | Configurable | Segun frequency + plan | Segun plan |

| Plan | Sites | Posts/mes |
|------|-------|-----------|
| Free | 1 | 1 |
| Starter | 1 | 4 |
| Pro | 3 | 30 |
| Agency | 10 | 100 |

---

## Orden de Implementacion

1. Migracion SQL: agregar `posts_limit` a profiles
2. Modificar edge function con nueva logica
3. Actualizar cron job a diario
4. Probar con mkpro (daily) manualmente
5. Verificar que farmacias solo generen el primer lunes
