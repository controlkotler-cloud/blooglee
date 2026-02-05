

## Plan: Desplegar funciones Edge faltantes

### Problema identificado

Dos Edge Functions críticas **NO están desplegadas** a pesar de existir en el código y estar registradas en `config.toml`:

| Funcion | Estado | Error visible |
|---------|--------|---------------|
| `wordpress-health-check` | **404 NOT_FOUND** | "Error al verificar la conexión" |
| `sync-wordpress-taxonomies-saas` | **404 NOT_FOUND** | "Failed to send a request to the Edge Function" |

### Por que ocurrio

El despliegue automatico de Lovable despliega las funciones cuando hay cambios en su codigo. Las funciones `generate-article-*` se desplegaron porque les anadimos la funcion `cleanMarkdownFromHtml`, pero estas dos funciones no tenian cambios recientes y nunca fueron desplegadas.

### Solucion

Desplegar manualmente las dos funciones faltantes:

1. `wordpress-health-check` - Diagnostico de conexion WordPress
2. `sync-wordpress-taxonomies-saas` - Sincronizacion de categorias/tags

### Cambios necesarios

Ninguno en codigo. Solo despliegue de funciones existentes.

### Resultado esperado

- Boton "Actualizar WordPress" funcionara correctamente
- Boton "Sincronizar categorias" funcionara correctamente
- Ambas funciones accesibles via API

