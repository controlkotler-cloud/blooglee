
Objetivo: solucionar el error “Failed to send a request to the Edge Function” al publicar artículos (SaaS y/o MKPro) sin tocar nada “protegido” que ya funciona, y dejar el sistema más robusto para que estos fallos no reaparezcan “de la nada”.

## Diagnóstico (confirmado)
He comprobado desde el backend que estas funciones NO están disponibles ahora mismo (devuelven 404):
- `publish-to-wordpress-saas` → 404 NOT_FOUND (esto explica el error al publicar en Blooglee SaaS)
- `publish-to-wordpress` → 404 NOT_FOUND (esto afectaría a MKPro si intentas publicar desde el panel legacy)

Esto significa que el frontend intenta invocar la función, pero el backend responde “no existe”, y la librería lo muestra como “Failed to send a request…”.

## Causa probable
Despliegues incompletos / inconsistentes: algunas funciones sí están desplegadas (por ejemplo `wordpress-health-check`, `sync-wordpress-taxonomies-saas`, `generate-article-saas`), pero las funciones de publicación no lo están en este momento.

No hace falta cambiar lógica de publicación todavía: primero hay que restaurar la disponibilidad de las funciones.

## Cambios a realizar (mínimos y seguros)
### 1) Desplegar funciones faltantes (sin tocar código)
Desplegar explícitamente estas funciones existentes:
- `publish-to-wordpress-saas`
- `publish-to-wordpress`

Esto debería restaurar inmediatamente:
- Publicación SaaS (desde /dashboard/site/:id, etc.)
- Publicación MKPro (si aplica)

### 2) Verificación técnica (para no ir a ciegas)
Tras desplegar:
- Verificar que ya no responden 404:
  - Llamada de prueba a `/publish-to-wordpress-saas` (esperable: 401/405/400 según método/body, pero NO 404)
  - Llamada de prueba a `/publish-to-wordpress` (mismo criterio: NO 404)
- Revisar logs de funciones para confirmar que las peticiones llegan.

### 3) Verificación funcional en UI (pasos concretos)
En el flujo real del usuario:
- Ir a SaaS → abrir un artículo → “Publicar en WordPress”
- Confirmar que el error cambia de “Failed to send a request…” a:
  - publicación correcta, o
  - un error “real” de WordPress (credenciales/permisos), que ya sería otro tema distinto.

## Medida preventiva (para evitar futuros sustos)
Una mejora pequeña y limpia (sin romper nada) para una siguiente iteración:
- Añadir una comprobación en el cliente (antes de publicar) que detecte 404 y muestre un mensaje claro tipo:
  “La función de publicación no está disponible. Reintenta en 1 minuto o avisa a soporte.”
Esto evita la sensación de “todo explota sin cambios” y acelera diagnóstico.

(La parte preventiva la dejo como opcional; primero arreglamos el bloqueo.)

## Impacto y seguridad
- No se modifica ninguna tabla ni RLS.
- No se toca nada de `src/components/pharmacy/*` ni `src/components/company/*`.
- No se cambia lógica de negocio: solo se restablece la disponibilidad de las funciones de publicación.

## Criterio de éxito
- Al pulsar “Publicar”, desaparece el error genérico “Failed to send a request…”.
- Las funciones `publish-to-wordpress-saas` y `publish-to-wordpress` dejan de devolver 404.
