# ✅ COMPLETADO: Sistema de prompts dinámicos para SaaS

## Resumen de cambios realizados

### 1. Base de datos
- **Nueva tabla**: `prompt_cache_version` - Almacena versión del caché (se incrementa automáticamente con cada cambio en prompts)
- **Nuevo trigger**: `prompt_cache_invalidation` - Se dispara en INSERT/UPDATE/DELETE en tabla `prompts`
- **Nueva función**: `increment_prompt_cache_version()` - Incrementa la versión del caché

### 2. Edge Function: generate-article-saas
- **Sistema de caché global**: Los prompts se guardan en memoria (Map) y solo se recargan cuando la versión cambia
- **Función `getPrompt()`**: Consulta caché → BD → fallback hardcodeado
- **Función `substituteVariables()`**: Reemplaza `{{variable}}` por valores reales
- **5 prompts dinámicos**: topic, article.system, article.user, translate.catalan, image

### 3. Prompts insertados en BD

| Key | Propósito | Variables |
|-----|-----------|-----------|
| `saas.topic` | Generar tema del artículo | siteName, sector, description, scope, month, year, usedTopics |
| `saas.article.system` | Instrucciones del sistema para el artículo | siteName, sector, description, scope, geoContext, dateContext |
| `saas.article.user` | Prompt usuario con tema y formato JSON | topic |
| `saas.translate.catalan` | Traducir al catalán | title, meta, slug, content |
| `saas.image` | Generar imagen destacada | topic, sector, description |

## Cómo funciona ahora

```
┌─────────────────────────────────────────┐
│  Panel Admin: /admin/prompts            │
│  - Editas un prompt                     │
│  - Guardas cambios                      │
│  ↓                                      │
│  Trigger incrementa versión (ej: 4→5)   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Edge Function (siguiente ejecución)    │
│  1. Consulta versión en BD              │
│  2. Si versión ≠ caché → recarga        │
│  3. Usa prompt de BD + sustituye vars   │
│  4. Si no existe → usa fallback         │
└─────────────────────────────────────────┘
```

## Lo que puedes ajustar desde el panel

- **Longitud del artículo**: Cambia "~2000 palabras" por lo que quieras
- **Tono**: Añade instrucciones de tono al prompt de sistema
- **Estructura**: Pide FAQs, tablas comparativas, etc.
- **Reglas de capitalización**: Modifica las instrucciones
- **Formato de imagen**: Cambia los requisitos del prompt de imagen
- **Cualquier cosa**: Los prompts son texto libre editable
