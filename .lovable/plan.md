

# Plan: Arquitectura de Crons Individuales por Entidad

## Resumen Ejecutivo

Vamos a cambiar de un cron monolitico que procesa todo junto a una arquitectura donde cada entidad (farmacia, empresa, site) tiene su propia ejecucion independiente. Esto resuelve los timeouts y permite que cada cliente reciba su email de notificacion individual.

---

## Problema Actual

1. **Un solo cron** llama a `generate-monthly-articles` que intenta procesar 31 entidades secuencialmente
2. **Timeout de 5 segundos** del `pg_net` corta la conexion antes de que termine
3. **Todo o nada**: si falla una entidad, puede afectar a las siguientes
4. **Emails mezclados**: MKPro recibe un resumen de todo, pero los usuarios SaaS no reciben nada

---

## Solucion: Cron Dispatcher + Edge Functions Independientes

### Nueva Arquitectura

```text
09:00 UTC - Cron unico (5 segundos)
    |
    v
generate-scheduler (nueva funcion)
    |
    +-- Consulta farmacias con auto_generate=true
    +-- Consulta empresas con auto_generate=true  
    +-- Consulta sites con auto_generate=true
    |
    v
Para CADA entidad que toca hoy:
    - Dispara HTTP async (fire-and-forget)
    - No espera respuesta
    |
    +---> generate-article (farmacia X) --> Email a control@mkpro.es
    +---> generate-article (farmacia Y) --> Email a control@mkpro.es
    +---> generate-article-empresa (empresa Z) --> Email a control@mkpro.es
    +---> generate-article-saas (site A) --> Email a usuario@email.com
    +---> generate-article-saas (site B) --> Email a otro@email.com
    
09:15 UTC - Cron blog Blooglee
    +---> generate-blog-blooglee (empresas)
    +---> generate-blog-blooglee (agencias)
    
09:25 UTC - Cron newsletter
    +---> send-newsletter (a suscriptores del blog)
```

### Ventajas

| Aspecto | Antes | Despues |
|---------|-------|---------|
| Timeout | 5s mata todo | Dispatcher < 5s, cada funcion corre independiente |
| Paralelismo | Secuencial (1 a 1) | Todas las entidades en paralelo |
| Emails | Resumen MKPro unico | Email individual por cliente |
| Fallos | Si falla 1, puede afectar resto | Cada entidad aislada |
| Debugging | Logs mezclados | Logs por entidad |

---

## Cambios a Realizar

### 1. Nueva Edge Function: `generate-scheduler`

Esta funcion ligera se ejecuta en menos de 5 segundos:

```typescript
// Pseudocodigo
async function handler(req) {
  const supabase = createClient(...);
  const now = new Date();
  
  // 1. Obtener todas las entidades con auto_generate
  const farmacias = await getFarmaciasToGenerate(now);
  const empresas = await getEmpresasToGenerate(now);
  const sites = await getSitesToGenerate(now);
  
  // 2. Disparar cada una SIN esperar respuesta (fire-and-forget)
  for (const farmacia of farmacias) {
    fetch(generateArticleUrl, {
      method: "POST",
      body: JSON.stringify({ pharmacyId: farmacia.id }),
    }); // No await - fire and forget
  }
  
  for (const empresa of empresas) {
    fetch(generateArticleEmpresaUrl, {
      method: "POST", 
      body: JSON.stringify({ empresaId: empresa.id }),
    }); // No await
  }
  
  for (const site of sites) {
    fetch(generateArticleSaasUrl, {
      method: "POST",
      body: JSON.stringify({ siteId: site.id }),
    }); // No await
  }
  
  // 3. Devolver inmediatamente
  return Response.json({ 
    dispatched: {
      farmacias: farmacias.length,
      empresas: empresas.length,
      sites: sites.length
    }
  });
}
```

### 2. Modificar `generate-article` (Farmacias)

Cambios necesarios:
- Aceptar `pharmacyId` como parametro para generar UNA sola farmacia
- Enviar email individual al terminar (a `controlkotler@gmail.com` para MKPro)
- Mantener compatibilidad con llamadas manuales desde el panel

### 3. Modificar `generate-article-empresa` (Empresas MKPro)

Cambios necesarios:
- Aceptar `empresaId` como parametro para generar UNA sola empresa
- Enviar email individual al terminar (a `controlkotler@gmail.com` para MKPro)

### 4. Modificar `generate-article-saas` (Sites Blooglee)

Ya tiene la logica correcta:
- Acepta `siteId`
- Ya envia email al usuario propietario del site
- Solo verificar que funciona bien con el dispatcher

### 5. Modificar SQL de Crons

```sql
-- Eliminar cron actual
SELECT cron.unschedule('generate-articles-daily');

-- Nuevo cron 1: Dispatcher a las 09:00
SELECT cron.schedule(
  'dispatch-article-generation',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gqtikajhhggyoiypkbgw.supabase.co/functions/v1/generate-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);

-- Nuevo cron 2: Blog Empresas a las 09:15
SELECT cron.schedule(
  'generate-blog-empresas',
  '15 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gqtikajhhggyoiypkbgw.supabase.co/functions/v1/generate-blog-blooglee',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
    body := '{"audience": "empresas"}'::jsonb,
    timeout_milliseconds := 180000
  );
  $$
);

-- Nuevo cron 3: Blog Agencias a las 09:17
SELECT cron.schedule(
  'generate-blog-agencias',
  '17 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gqtikajhhggyoiypkbgw.supabase.co/functions/v1/generate-blog-blooglee',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
    body := '{"audience": "agencias"}'::jsonb,
    timeout_milliseconds := 180000
  );
  $$
);

-- Nuevo cron 4: Newsletter a las 09:25
SELECT cron.schedule(
  'send-daily-newsletter',
  '25 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gqtikajhhggyoiypkbgw.supabase.co/functions/v1/send-newsletter',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
```

---

## Flujo de Emails Resultante

### MKPro (Farmacias y Empresas)

Cada vez que se genera un articulo para una farmacia o empresa MKPro:
- Email a: `controlkotler@gmail.com`
- Asunto: "Articulo generado para [Nombre Farmacia/Empresa]"
- Contenido: Titulo, resumen, link a WordPress si se publico

### Blooglee SaaS (Sites)

Cada vez que se genera un articulo para un site SaaS:
- Email a: email del usuario propietario del site
- Asunto: "Tu articulo esta listo - [Nombre Site]"
- Contenido: Titulo, resumen, link al panel

### Newsletter Suscriptores (Blog Blooglee)

A las 09:25 UTC cada dia:
- Email a: todos los suscriptores activos
- Segmentado por audiencia (Empresas o Agencias)
- Contenido: Posts del blog publicados hoy

---

## Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `supabase/functions/generate-scheduler/index.ts` | CREAR | Nueva funcion dispatcher |
| `supabase/functions/generate-article/index.ts` | MODIFICAR | Aceptar pharmacyId, enviar email individual |
| `supabase/functions/generate-article-empresa/index.ts` | MODIFICAR | Aceptar empresaId, enviar email individual |
| `supabase/functions/generate-article-saas/index.ts` | VERIFICAR | Ya tiene logica correcta |
| `supabase/functions/generate-blog-blooglee/index.ts` | VERIFICAR | Aceptar parametro audience |
| SQL Crons | EJECUTAR | Reemplazar cron unico por 4 crons especializados |
| `supabase/functions/generate-monthly-articles/index.ts` | DEPRECAR | Ya no se usara para automatizacion |

---

## Seccion Tecnica: Logica de shouldGenerate

La funcion `generate-scheduler` debe incluir la misma logica de verificacion de frecuencia que ya existe:

```typescript
async function shouldGenerateToday(
  entity: { id: string; publish_frequency: string },
  entityType: 'farmacia' | 'empresa' | 'site',
  now: Date
): Promise<boolean> {
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  
  switch (entity.publish_frequency) {
    case 'daily':
      return true;
      
    case 'daily_weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
      
    case 'weekly':
      return dayOfWeek === 1; // Lunes
      
    case 'biweekly':
      const weekNumber = Math.ceil(dayOfMonth / 7);
      return dayOfWeek === 1 && (weekNumber === 1 || weekNumber === 3);
      
    case 'monthly':
      // Primer lunes del mes
      return dayOfWeek === 1 && dayOfMonth <= 7;
      
    default:
      return false;
  }
}
```

Ademas, debe verificar que no exista ya un articulo generado hoy para esa entidad.

---

## Resultado Esperado

Despues de implementar estos cambios:

1. **09:00 UTC** - El dispatcher se ejecuta en menos de 5 segundos
2. **09:00-09:15 UTC** - Todas las entidades se generan en paralelo
3. **Cada entidad** recibe su email individual al completarse
4. **09:15-09:20 UTC** - Se generan los posts del blog Blooglee
5. **09:25 UTC** - Se envian las newsletters a suscriptores
6. **Sin timeouts** - Cada funcion corre independiente
7. **Facil debugging** - Logs separados por entidad

