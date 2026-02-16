

## Mejorar verificacion de enlaces externos en todo el SaaS de Blooglee

### Situacion actual

| Edge Function | Verificacion de enlaces | Zona |
|---|---|---|
| `generate-article-saas` | Si, pero demasiado agresiva (elimina enlaces validos) | SaaS |
| `generate-blog-blooglee` | No tiene ninguna verificacion | SaaS |
| `generate-article` | No tiene (zona MKPro protegida, no se toca) | MKPro |
| `generate-article-empresa` | No tiene (zona MKPro protegida, no se toca) | MKPro |

### Cambios a realizar

#### 1. `generate-article-saas/index.ts` - Mejorar la funcion existente (lineas 939-1012)

Reescribir `verifyAndCleanExternalLinks` con logica mas inteligente:

- **User-Agent realista**: Cambiar `LinkChecker/1.0` por un User-Agent de navegador real para evitar bloqueos
- **Timeout de 5s a 8s**: Mas margen para sitios lentos
- **Si HEAD falla con error de red/timeout**: MANTENER el enlace original (no reemplazar)
- **Si HEAD devuelve 403/405**: Reintentar con GET (muchos sitios bloquean HEAD pero aceptan GET)
- **Si HEAD o GET devuelve 404/410**: Reemplazar con homepage (enlace realmente roto)
- **Cualquier otro error de red**: Mantener el enlace original tal cual

```text
LOGICA ACTUAL (agresiva):
  HEAD request 
    -> status 404 o 500+: reemplazar con homepage
    -> error de red/timeout: reemplazar con homepage  <-- PROBLEMA

LOGICA NUEVA (inteligente):
  HEAD request
    -> status 200-399: mantener enlace original
    -> status 404/410: reemplazar con homepage
    -> status 403/405: reintentar con GET
      -> GET 404/410: reemplazar con homepage
      -> GET ok o error: mantener enlace original
    -> status 500+: mantener enlace original (error temporal del servidor)
    -> error de red/timeout: MANTENER enlace original
```

#### 2. `generate-blog-blooglee/index.ts` - Anadir verificacion de enlaces

Copiar la funcion mejorada `verifyAndCleanExternalLinks` (y sus helpers `getOriginUrl`, `isHomepageUrl`) al archivo del blog de Blooglee.

Aplicarla al contenido antes de guardarlo en la base de datos, justo despues de `cleanGeneratedContent` (linea 1173):

```text
const cleanedContent = cleanGeneratedContent(blogData.content);
const verifiedContent = await verifyAndCleanExternalLinks(cleanedContent);  // NUEVO
// Usar verifiedContent en el insert
```

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `supabase/functions/generate-article-saas/index.ts` | Reescribir `verifyAndCleanExternalLinks` (lineas 939-1012) |
| `supabase/functions/generate-blog-blooglee/index.ts` | Anadir funciones `getOriginUrl`, `isHomepageUrl`, `verifyAndCleanExternalLinks` y aplicar antes del insert |

### Resultado esperado

- Los enlaces externos generados por la IA se mantendran intactos salvo que el servidor confirme explicitamente un 404
- Los sitios que bloquean bots (403) o no responden a HEAD ya no perderan sus enlaces
- El blog de Blooglee tambien tendra proteccion contra enlaces rotos
- Las funciones de MKPro no se modifican (zona protegida)
