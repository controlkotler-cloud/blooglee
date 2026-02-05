
Contexto del problema (lo que vemos ahora)
- En la UI, al generar un artículo SaaS aparece: “Failed to send a request to the Edge Function”.
- En los logs de red del navegador, la llamada POST a `.../functions/v1/generate-article-saas` termina en “Load failed”.
- En logs del backend no aparece ningún log de `generate-article-saas`, lo que suele indicar que:
  1) la función no llega a ejecutarse (preflight/CORS bloqueado), o
  2) el runtime falla al arrancar (imports inestables) antes de loguear nada.

Hallazgo clave en el código actual
- `supabase/functions/generate-article-saas/index.ts` todavía está usando imports por `https://esm.sh/...`:
  - `@supabase/supabase-js@2`
  - `resend@2.0.0`
- Además, el CORS header actual es incompleto para el SDK moderno:
  - `Access-Control-Allow-Headers` solo permite `authorization, x-client-info, apikey, content-type`
  - pero el cliente puede enviar cabeceras extra (x-supabase-client-platform, etc.) que fuerzan preflight y si no se permiten, el navegador bloquea y se ve como “Load failed”.

Objetivo
- Conseguir que `generate-article-saas` vuelva a responder correctamente desde el navegador.
- Asegurar estabilidad de build (evitar fallos intermitentes de esm.sh) y evitar bloqueos CORS.
- Aplicar el mismo criterio a las funciones web-facing relevantes para no volver a caer en el mismo error en otras rutas/acciones.

Cambios propuestos (implementación)
A) Arreglar `generate-article-saas` (el bloqueo actual)
1) Migrar imports a rutas estables (sin esm.sh)
   - Cambiar:
     - `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`
     - `import { Resend } from "https://esm.sh/resend@2.0.0";`
   - A:
     - `import { createClient } from "npm:@supabase/supabase-js@2";`
     - `import { Resend } from "npm:resend@2.0.0";`
   - Mantener el resto del código intacto.

2) Corregir CORS para llamadas desde el navegador
   - Sustituir `corsHeaders` por la versión completa que incluye todas las cabeceras típicas del cliente:
     - `authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version`
   - Asegurar que:
     - el handler `OPTIONS` devuelve `new Response('ok', { headers: corsHeaders })`
     - todas las respuestas (éxito y error) incluyen `{ ...corsHeaders, 'Content-Type': 'application/json' }`

B) Blindaje: revisar y aplicar el mismo fix a funciones que siguen con esm.sh y/o CORS corto
Según la búsqueda actual, hay varias funciones aún con `esm.sh` y/o `Access-Control-Allow-Headers` corto. Para evitar próximos “Load failed”, aplicaremos el mismo patrón (imports npm: + CORS completo) a las que:
- se llaman desde la app (navegador), o
- son críticas en flujos SaaS (p.ej. regenerar imagen, publicar, soporte, newsletter si se llama desde UI).

Archivos identificados con esm.sh / CORS corto (mínimo a revisar y normalizar):
- `supabase/functions/generate-article-saas/index.ts` (crítico, ahora mismo)
- `supabase/functions/publish-to-wordpress-saas/index.ts`
- `supabase/functions/publish-to-wordpress/index.ts` (aunque sea legacy, se usa desde UI)
- `supabase/functions/support-chatbot/index.ts`
- `supabase/functions/regenerate-image/index.ts`
- `supabase/functions/register-beta-user/index.ts`
- `supabase/functions/send-newsletter/index.ts` (si se invoca desde UI)
- `supabase/functions/subscribe-newsletter/index.ts` (si se invoca desde UI)
- `supabase/functions/generate-article/index.ts`
- `supabase/functions/generate-article-empresa/index.ts`
- `supabase/functions/generate-monthly-articles/index.ts` (si se usa en cron, igual conviene estabilidad de imports)
- `supabase/functions/generate-scheduler/index.ts`
- `supabase/functions/fix-blog-false-claims/index.ts`
- `supabase/functions/generate-blog-blooglee/index.ts`
Notas:
- Algunas usan `@supabase/supabase-js@2.49.1` en esm.sh. En Deno es preferible estandarizar a `npm:@supabase/supabase-js@2` (sin depender de CDN). Si hay necesidad estricta de versión, se puede fijar `npm:@supabase/supabase-js@2.49.1` (pero normalmente no es necesario).

C) Verificación (cómo confirmaremos que está arreglado)
1) Verificación técnica rápida (sin UI)
- Llamar a `generate-article-saas` mediante herramienta de test de funciones (autenticada) con el `siteId` actual.
- Esperado:
  - status 200 o un error “funcional” (p.ej. límite mensual), pero no “Load failed”.
  - y deben aparecer logs en el backend de `generate-article-saas`.

2) Verificación end-to-end en UI (lo que importa)
- En la site “mkpro” (SaaS):
  - Click en “Generar artículo”
  - Confirmar que:
    - el estado “generando” aparece y luego termina,
    - se crea el artículo en la lista,
    - no sale el toast “Failed to send a request…”

3) Sanidad extra: WordPress y regeneración de imagen
- Probar:
  - “Sincronizar taxonomías” (ya tocada, pero confirmamos que responde)
  - “Regenerar imagen” (usa otra función; si seguía con CORS corto o esm.sh, también quedará estable)

Riesgos / consideraciones
- Si algún sitio externo bloquea HEAD o hay timeouts, eso ya afecta a lógica de generación/verificación de enlaces, pero no debería tumbar la llamada a la función. El error actual es de transporte/ejecución.
- Este cambio no toca nada de la zona protegida (MKPro componentes/hooks). Solo funciones del backend SaaS y utilidades comunes.

Entregables concretos
- `generate-article-saas` funcionando desde navegador (sin “Load failed”).
- Imports estabilizados (npm:) y CORS completo en las funciones relevantes para UI.
- Registro de logs en backend que confirme que se ejecutan correctamente.

Secuencia de trabajo (orden)
1) Ajustar `supabase/functions/generate-article-saas/index.ts` (imports + CORS).
2) Desplegar `generate-article-saas` y test inmediato.
3) Aplicar el mismo patrón a las demás funciones detectadas con esm.sh/CORS corto (priorizando las que la UI llama).
4) Test end-to-end desde la UI (generación + publicar/regenerar/sync según aplique).
