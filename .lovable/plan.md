
Objetivo
- Conseguir que al pulsar “Sincronizar” se ejecute de verdad la función backend `sync-wordpress-taxonomies-saas`, se guarden taxonomías y (muy importante) se persista `sites.wordpress_context` con el análisis de los últimos 15 posts.
- Confirmar que esto funciona con Contraseña de Aplicación de WordPress (sí, es el método correcto), y que el problema actual es técnico (la llamada no llega / queda bloqueada), no “falta de saber hacer la consulta”.

Hallazgos (con datos reales)
- En base de datos, el sitio `farmapro` (id `d5851bbd-...`) tiene `wordpress_context = NULL`.
- La config de WordPress existe y apunta a `https://farmapro.es` con app password guardada (wp_config_id `b76ca812-...`).
- `wordpress_taxonomies_saas` para esa config tiene solo 8 filas con `created_at = 2026-01-27`, o sea: no se está re-sincronizando ahora.
- No hay logs recientes de la función `sync-wordpress-taxonomies-saas` => indica que la función no está recibiendo requests (o están fallando antes de entrar).
- La función `sync-wordpress-taxonomies-saas` usa Basic Auth con `wp_username:wp_app_password` (esto es exactamente lo correcto para Application Passwords de WordPress). Así que “poder, puede”. El problema es que la llamada desde el navegador probablemente no está llegando por CORS/preflight.

Causa raíz más probable
- CORS incorrecto en `sync-wordpress-taxonomies-saas`.
  - Ahora mismo la función devuelve:
    - `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`
  - Pero las llamadas desde el cliente suelen incluir headers adicionales (por ejemplo `x-supabase-client-*`), lo que dispara un preflight OPTIONS que el navegador bloquea si `Access-Control-Allow-Headers` no los permite.
  - Esto encaja perfecto con:
    - “Pulsé sincronizar y no cambia nada”
    - “No hay logs de la función”
    - “wordpress_context sigue en null”

Plan de implementación (cambios concretos)

1) Arreglar CORS en `supabase/functions/sync-wordpress-taxonomies-saas/index.ts`
- Sustituir `corsHeaders` por el set recomendado (incluyendo `x-supabase-client-platform`, `x-supabase-client-runtime`, etc.).
- Cambiar handler de OPTIONS para devolver `new Response('ok', { headers: corsHeaders })` (no `null`), garantizando que el preflight siempre responde con headers válidos.
- Asegurar que TODAS las respuestas (errores incluidos) incluyen `...corsHeaders`.

2) Mejorar observabilidad (logs) en `sync-wordpress-taxonomies-saas`
- Añadir logs “checkpoint” para saber exactamente si:
  - entra en la función
  - valida el JWT y obtiene userId
  - obtiene wpConfig y siteId
  - hace fetch de categorías/tags y su status code
  - hace fetch de posts y su status code
  - hace el update en `sites` y qué devuelve `contextError`
- Importante: loggear también el `postsResponse.status` y un snippet del body si no es ok (para detectar 401/403/5xx desde WordPress).

3) Hacer que la UI refleje el resultado de sincronización de forma inequívoca
- En `useSyncTaxonomiesSaas`:
  - Mostrar en toast no solo counts, sino también `content_analyzed` y (si viene) `wordpress_context.analyzed_at`.
  - Si la respuesta trae `wordpress_context: null`, mostrar warning explícito (para que el usuario no piense que “ha sincronizado contexto” cuando solo pudo intentar taxonomías).
- En `WordPressPublishDialogSaas.tsx`:
  - Tras sincronizar, refrescar taxonomías (ya se invalida la query) pero también mostrar un pequeño “Último análisis de WordPress: …” si existe `site.wordpress_context` (esto requiere leer `site` o reconsultarlo).
  - Alternativa simple: mostrar un toast adicional “Contexto WordPress guardado” solo si `content_analyzed=true` y `wordpress_context` no es null.

4) (Opcional pero recomendado) Botón de “Sincronizar contexto WordPress” también en la configuración
- Hoy solo está en el diálogo de “Publicar en WordPress”.
- Añadir en `WordPressConfigForm` un botón “Sincronizar categorías/tags y contexto” para que el usuario pueda hacerlo sin entrar a publicar.
- Reutilizar `useSyncTaxonomiesSaas` (solo necesita el wpConfigId, que ya tenemos con `useWordPressConfig(siteId)`).

5) Validación final: confirmar que se guarda `wordpress_context` para farmapro
- Tras aplicar cambios:
  - Pulsar sincronizar
  - Ver logs en backend: “SUCCESS: wordpress_context saved to site”
  - Ver en base de datos que `sites.wordpress_context` ya no es null y contiene:
    - `lastTopics` (debería incluir “El efecto escaparate” si está en los últimos 15)
    - `avgLength`, `commonCategories`, `analyzed_at`
- Luego generar un artículo y comprobar que el generador está leyendo `wordpress_context.lastTopics` (dedupe) y evita repetir “escaparate(s)”.

Archivos a tocar
- `supabase/functions/sync-wordpress-taxonomies-saas/index.ts` (CORS + logs + robustez)
- `src/hooks/useWordPressTaxonomiesSaas.ts` (feedback de respuesta más explícito)
- `src/components/saas/WordPressPublishDialogSaas.tsx` (feedback post-sync)
- (Opcional) `src/components/saas/WordPressConfigForm.tsx` (botón sync “a mano” en configuración)

Riesgos / consideraciones
- Si WordPress bloquea `/wp-json/wp/v2/posts` por firewall/seguridad, veremos status 401/403/503 en logs. En ese caso:
  - Las taxonomías podrían seguir funcionando o no, según reglas del firewall.
  - El diagnóstico correcto será ajustar Wordfence/WAF (y lo podremos guiar con el panel de troubleshooting).
- Si el blog no es “posts” sino “custom post type”, el endpoint estándar no devolverá contenido. Pero en farmapro debería ser estándar; si no, lo detectaremos por respuesta vacía.

Criterio de éxito (lo que debe pasar para darlo por resuelto)
- Al pulsar “Sincronizar”:
  - se ejecuta la función (hay logs)
  - `wordpress_taxonomies_saas.created_at` se actualiza a “ahora”
  - `sites.wordpress_context` deja de ser NULL y contiene los últimos títulos
- Al generar el siguiente artículo:
  - no repite temas/títulos muy cercanos a “El efecto escaparate” si está en `lastTopics`.
