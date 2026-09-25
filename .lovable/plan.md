# Diagnóstico del `shutdown` de 09:37:19Z (solo lectura, sin cambios)

## Corrección al informe anterior
La generación de prueba SÍ terminó. El artículo se guardó a las 09:39:03 con id `be16b6ff-871f-4f7c-8faf-c161e2fe4e2a`, calidad `passed` y puntuación 93. El nodo es `8cc83c66-…` y el concept_key es `atopica-brotes-corticoide`. Mi consulta anterior se lanzó a los 150 s, cuando el artículo todavía no existía.

## 1. Logs 09:35:50–09:39:11
Con las herramientas disponibles no he podido sacar la metadata completa (`reason`, `execution_id`): la consulta sobre la tabla de logs de funciones devuelve 0 filas. Los emparejamientos de abajo están deducidos por los tiempos.
- `booted` 09:31:03 → `shutdown` 09:33:23: instancia anterior.
- `booted` 09:33:59 → `shutdown` **09:37:19**: la llamada del sitio "Prueba", que devolvió 403 en 2 s. Es un cierre por inactividad de esa instancia y **no tiene nada que ver** con la generación.
- `booted` 09:35:51 → `shutdown` 09:39:11: la generación real. El reintento de 09:37:22 es de esta instancia y continuó hasta completar.

Líneas relevantes de la instancia 09:35:51 que no estaban en el informe anterior:
- 09:38:39 Spanish article parsed successfully on attempt 2
- 09:38:39 Meta description needs fix: 150 chars → regenerada, 124 chars
- 09:39:02 AI image attempt 1 response status: 200
- 09:39:03 [quality] es=OK (93/100)
- 09:39:03 Created new article be16b6ff-…
- 09:39:03 **WARNING [topic] no se pudo marcar el nodo como usado: permission denied for function increment_node_coverage**
- 09:39:04 **ERROR Http: connection closed before message completed** (el cliente ya había cortado a los 150 s)
- 09:39:04 Notification email sent to control@mkpro.es

Duración total: unos 192 s. En la base de datos no aparece ningún permiso concedido sobre `increment_node_coverage`.

## 2. Tanda del 1-sep (05:00–07:00 UTC)
No está disponible. El visor de logs solo conserva los recientes y la consulta histórica devuelve 0 filas. No puedo dar ni el número de `shutdown` ni el tiempo medio sin inventarlo.

## 3. Cómo se invoca desde la app
- `src/hooks/useArticlesSaas.ts:125`: `await supabase.functions.invoke("generate-article-saas", …)`. **Espera la respuesta.**
- `src/components/onboarding/steps/GeneratingStep.tsx:116`: la misma llamada con `await`, y también **espera**.
- `EdgeRuntime.waitUntil`: **no se usa** en ninguna función del proyecto.

La función sigue trabajando aunque el cliente corte, como se vio hoy. Pero cuando pasa de 150 s, la app muestra un error aunque el artículo acabe guardándose.

## Arreglos propuestos (solo si los apruebas)
1. Conceder permiso de ejecución de `increment_node_coverage` a `service_role` y `authenticated`, para que se cuente el uso de cada nodo. Hoy ningún nodo se marca, así que el mapa repetirá temas.
2. Generación manual en segundo plano: la función responde enseguida con `202` y termina el trabajo con `EdgeRuntime.waitUntil`. La app detecta el artículo nuevo refrescando la lista, en vez de esperar la respuesta.
