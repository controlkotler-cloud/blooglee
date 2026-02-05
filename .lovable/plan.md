
Objetivo: que “Publicar artículo” desde el dashboard SaaS deje de fallar “en inmediato” y que no volvamos a entrar en un bucle de arreglos parciales. Lo vamos a atacar como un problema de fiabilidad de llamadas al backend (CORS/preflight + observabilidad + hardening), no como un caso aislado.

---

## 1) Diagnóstico con lo que ya sabemos (por qué vuelve a fallar)
- El fallo es **SaaS (dashboard)** y ocurre **inmediato**.
- En estos casos, lo más típico es que el navegador **bloquea la petición antes de llegar** a la función (preflight CORS / headers / métodos permitidos). Eso explica que:
  - No aparezcan logs recientes de la función.
  - El error sea genérico (“Failed to send a request…”).
- La función `publish-to-wordpress-saas` **sí está viva** (he verificado que responde con `400` si le mandas `{}`), por lo que no es un 404 de despliegue como la vez anterior.
- En el código actual de `publish-to-wordpress-saas`:
  - Tiene `Access-Control-Allow-Origin` y `Access-Control-Allow-Headers` correctos.
  - **No define `Access-Control-Allow-Methods`**.
  - El handler de `OPTIONS` devuelve `new Response(null, { headers })` (sin body “ok”).
  - Aunque a veces funciona, algunos entornos/navegadores/proxies son estrictos y exigen `Allow-Methods` + respuesta explícita “ok”, o fallan “en inmediato”.

Conclusión: necesitamos **hardening CORS** (no solo en una función) + **telemetría clara** para que la próxima vez sepamos el motivo exacto en 30 segundos.

---

## 2) Cambios a implementar (en orden)
### A. Endurecer CORS de `publish-to-wordpress-saas` (prioridad 1)
1) Añadir a `corsHeaders`:
   - `Access-Control-Allow-Methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS"`
   - (Opcional recomendado) `Access-Control-Max-Age: "86400"` para reducir preflights repetidos.
2) Cambiar el preflight:
   - `if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });`
3) Asegurar que **todas** las respuestas (incluidas 4xx/5xx) devuelven los CORS headers (ya se hace, pero lo verificaremos tras tocarlo).

Resultado esperado: la petición ya no falla “inmediato” por preflight, y la UI llega a ejecutar la lógica.

---

### B. Auditoría rápida de CORS en TODAS las funciones llamadas desde UI (prioridad 2)
Para “repasar todo para que no falle nada más”, el patrón correcto es **estandarizar**. Hay funciones con headers incompletos (por ejemplo `update-seo-assets` y `sync-wordpress-taxonomies` legacy usan allow-headers recortado), y aunque no sean del flujo de publicar SaaS, son bombas de tiempo.

Acción:
1) Identificar funciones “UI-facing” (mínimo):
   - `publish-to-wordpress-saas`
   - `generate-article-saas`
   - `sync-wordpress-taxonomies-saas`
   - `wordpress-health-check`
   - `support-chatbot`
   - `subscribe-newsletter`
   - (y cualquier otra invocada desde `supabase.functions.invoke(...)` en frontend)
2) En todas ellas:
   - Misma constante `corsHeaders` completa (incluyendo headers de Supabase JS modernos).
   - `Access-Control-Allow-Methods` + `OPTIONS` devolviendo `'ok'`.

Resultado esperado: se reduce drásticamente la probabilidad de “Failed to send a request…” en cualquier parte.

---

### C. Mejorar el error reporting en el frontend (prioridad 3)
Ahora mismo, en `usePublishToWordPressSaas` se hace:
- `supabase.functions.invoke(...)`
- si `error` → `throw new Error(error.message || 'Error al publicar')`

Problema: cuando el error es de red/CORS, el mensaje suele ser demasiado genérico y no nos dice si fue:
- preflight bloqueado
- timeout
- DNS
- 401/403
- 500 del backend

Acción:
1) En `usePublishToWordPressSaas`:
   - Detectar errores tipo `TypeError: Failed to fetch` / “Load failed” / “NetworkError”.
   - Mostrar toast específico: “No se pudo conectar con el servidor (bloqueo CORS o red). Reintenta y si persiste revisa extensiones / red corporativa.”
   - Loggear en `console.error` un objeto enriquecido (incluyendo `error`, `cause` si existe).
2) En `WordPressPublishDialogSaas`:
   - Si falla, mostrar un bloque UI pequeño con “Detalles técnicos” (colapsable) para copiar/pegar: timestamp, siteId, idioma, status.

Resultado esperado: si algo vuelve a fallar, tendremos señal clara sin adivinar.

---

### D. Observabilidad mínima en backend (prioridad 4)
Acción:
1) En `publish-to-wordpress-saas`:
   - Loggear `req.method`, `origin`, y `access-control-request-headers` cuando sea `OPTIONS`.
   - Loggear un `requestId` (UUID corto) para correlacionar logs de un intento concreto.
2) En los puntos críticos:
   - Antes/después del fetch a WordPress posts
   - Cuando WordPress devuelva error, log del status y un extract del body (ya se hace bastante bien).

Resultado esperado: si hay un problema real de WordPress (403 Wordfence, REST deshabilitada, credenciales, etc.), lo veremos claro.

---

## 3) Validación (checklist de “ya no falla”)
1) Probar publicar desde SaaS con:
   - “Publicar ahora”
   - “Borrador”
   - “Programar” (con fecha)
   - Con y sin imagen destacada
2) Probar con categorías/tags seleccionados y sin seleccionar.
3) Confirmar:
   - No aparece el error inmediato.
   - Si WordPress rechaza algo, el mensaje que ve el usuario es entendible (y en logs queda el detalle).
4) (Opcional) Probar desde móvil / ventana incógnito para descartar extensiones.

---

## 4) Archivos que tocaré (respetando tus reglas de arquitectura)
SaaS / públicos (permitido):
- `supabase/functions/publish-to-wordpress-saas/index.ts` (hardening CORS + logs)
- `src/hooks/useArticlesSaas.ts` (mejor diagnóstico de errores de red/CORS en `usePublishToWordPressSaas`)
- (si aplica) otras funciones SaaS/públicas invocadas desde UI para estandarizar CORS

No tocaré (protegido):
- `src/components/pharmacy/*`, `src/components/company/*`
- hooks protegidos MKPro
- funciones MKPro legacy excepto si son estrictamente necesarias y están fuera de la “zona protegida” (en principio, no)

---

## 5) Dos aclaraciones críticas (para que el arreglo sea definitivo)
- Este plan arregla el **fallo inmediato** (CORS/preflight) y mejora diagnósticos.
- Si después de esto falla, lo normal sería ya un error “real” de WordPress (plugins tipo Wordfence, REST bloqueada, permisos, app passwords), y con la observabilidad propuesta lo veremos en el primer intento.

