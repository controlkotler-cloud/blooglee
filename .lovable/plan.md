

## Auditoría completa de Edge Functions - Problemas y mejoras

### PROBLEMAS CRITICOS (funciones que no arrancan)

Se han detectado **4 funciones que usan `serve()` sin importarlo**, lo que causa `ReferenceError: serve is not defined` y la funcion no arranca en absoluto. Este es el **mismo error** que acabamos de arreglar en `regenerate-image`.

| Funcion | Tipo | Estado |
|---|---|---|
| `support-chatbot` | SaaS | ROTO - `serve()` sin import (linea 168) |
| `generate-article` | MKPro (protegido) | ROTO - `serve()` sin import (linea 178) |
| `generate-article-empresa` | MKPro (protegido) | ROTO - `serve()` sin import (linea 740) |
| `publish-to-wordpress` | MKPro (protegido) | ROTO - `serve()` sin import (linea 27) |

**Solucion**: Anadir `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";` al inicio de cada archivo, o migrar a `Deno.serve()` (nativo, no requiere import).

**Nota sobre zona protegida**: Las 3 funciones MKPro estan marcadas como protegidas en las reglas de arquitectura, pero actualmente estan ROTAS y no funcionan. Es necesario arreglar el import para que vuelvan a funcionar. No se cambiara ninguna logica interna.

---

### PROBLEMAS DE CORS (inconsistencias en headers)

Varias funciones tienen CORS headers incompletos (les faltan `Access-Control-Allow-Methods` y `Access-Control-Max-Age`), y devuelven `Response(null)` en vez de `Response('ok')` en el OPTIONS handler.

**Funciones con CORS incompleto** (faltan `Allow-Methods` y `Max-Age`):
- `generate-article` (MKPro)
- `generate-article-empresa` (MKPro)
- `publish-to-wordpress` (MKPro)
- `generate-blog-blooglee`
- `send-newsletter`
- `generate-monthly-articles`
- `generate-scheduler`
- `register-beta-user`

**Funciones con `Response(null)` en OPTIONS** (deberia ser `Response('ok')`):
- `generate-article`, `generate-article-empresa`, `publish-to-wordpress` (MKPro)
- `upload-wordpress-media`, `sync-wordpress-taxonomies`
- `generate-scheduler`, `generate-blog-blooglee`, `send-newsletter`
- `update-seo-assets`, `fix-blog-false-claims`, `generate-monthly-articles`

**Funcion con CORS recortado**:
- `update-seo-assets` - Le faltan los headers `x-supabase-client-platform*` y `x-supabase-client-runtime*`
- `upload-wordpress-media` - Mismo problema

---

### PLAN DE CAMBIOS

#### Paso 1: Arreglar las 4 funciones rotas (import de serve)

Para cada una, anadir al inicio del archivo:
```text
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
```

Archivos afectados:
1. `supabase/functions/support-chatbot/index.ts`
2. `supabase/functions/generate-article/index.ts`
3. `supabase/functions/generate-article-empresa/index.ts`
4. `supabase/functions/publish-to-wordpress/index.ts`

#### Paso 2: Estandarizar CORS en funciones SaaS y de marketing

Actualizar los corsHeaders para incluir `Allow-Methods` y `Max-Age` en:
1. `supabase/functions/generate-blog-blooglee/index.ts`
2. `supabase/functions/send-newsletter/index.ts`
3. `supabase/functions/update-seo-assets/index.ts`
4. `supabase/functions/upload-wordpress-media/index.ts`

Y cambiar `Response(null)` a `Response('ok')` en el handler OPTIONS de estas mismas funciones.

#### Paso 3: Estandarizar CORS en funciones MKPro (protegidas)

Mismo cambio de corsHeaders y OPTIONS handler en:
1. `supabase/functions/generate-article/index.ts`
2. `supabase/functions/generate-article-empresa/index.ts`
3. `supabase/functions/publish-to-wordpress/index.ts`
4. `supabase/functions/sync-wordpress-taxonomies/index.ts`
5. `supabase/functions/generate-monthly-articles/index.ts`
6. `supabase/functions/generate-scheduler/index.ts`
7. `supabase/functions/fix-blog-false-claims/index.ts`

**Importante**: Solo se tocan las primeras lineas (corsHeaders) y el handler OPTIONS. No se modifica ninguna logica interna.

#### Paso 4: Redesplegar todas las funciones modificadas

---

### FUNCIONES EN BUEN ESTADO (no requieren cambios)

Las siguientes funciones ya tienen la estructura correcta (`Deno.serve`, CORS completos, `Response('ok')`):
- `generate-article-saas`
- `publish-to-wordpress-saas`
- `sync-wordpress-taxonomies-saas`
- `wordpress-health-check`
- `regenerate-image` (arreglada recientemente)
- `subscribe-newsletter`
- `register-beta-user`

---

### RESUMEN DE IMPACTO

- **4 funciones completamente rotas** que no arrancan (mayor prioridad)
- **11 funciones con CORS suboptimo** que pueden fallar en ciertos navegadores/redes
- **0 cambios de logica** - solo imports, headers y OPTIONS handler

