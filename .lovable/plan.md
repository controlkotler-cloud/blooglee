
## Plan: Corregir las 10 funciones que fallan o tienen riesgo

### Problema
Durante los cambios anteriores, se quitaron los imports de `serve` de varias funciones pero no se actualizó la llamada a `Deno.serve()`. Esto causa `ReferenceError: serve is not defined` en 6 funciones.

### Cambios necesarios

#### Grupo A: Cambiar `serve(handler)` a `Deno.serve(handler)` (6 funciones)

| Archivo | Cambio |
|---------|--------|
| `generate-blog-blooglee/index.ts` | Línea 957: `serve(handler);` → `Deno.serve(handler);` |
| `send-newsletter/index.ts` | Línea 305: `serve(handler);` → `Deno.serve(handler);` |
| `subscribe-newsletter/index.ts` | Línea 310: `serve(handler);` → `Deno.serve(handler);` |
| `generate-monthly-articles/index.ts` | Línea 1494: `serve(handler);` → `Deno.serve(handler);` |
| `generate-scheduler/index.ts` | Línea 423: `serve(handler);` → `Deno.serve(handler);` |
| `fix-blog-false-claims/index.ts` | Línea 337: `serve(handler);` → `Deno.serve(handler);` |

#### Grupo B: Migrar de esm.sh a npm: + actualizar serve (4 funciones)

| Archivo | Cambios |
|---------|---------|
| `sync-wordpress-taxonomies/index.ts` | Línea 1-2: Cambiar imports esm.sh → npm:, `serve()` → `Deno.serve()` |
| `upload-wordpress-media/index.ts` | Línea 1: Quitar import serve, `serve()` → `Deno.serve()` |
| `wordpress-health-check/index.ts` | Línea 1: Quitar import serve, `serve()` → `Deno.serve()` |
| `update-seo-assets/index.ts` | Línea 1-2: Cambiar imports esm.sh → npm:, quitar import serve, `serve()` → `Deno.serve()` |

### Detalle técnico de cada cambio

**Patrón estándar final para todas las funciones:**
```typescript
// Imports (sin esm.sh, sin serve)
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS completo
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ... código ...

// Handler nativo de Deno
Deno.serve(handler);
// O directamente:
Deno.serve(async (req) => { ... });
```

### Verificación post-cambio
1. Generar un artículo en mkpro (ya debería funcionar desde el fix anterior)
2. Probar suscripción a newsletter (subscribe-newsletter)
3. Probar sincronización de taxonomías en Farmacia Daries

### Riesgo
- Bajo: Solo se cambia el método de arranque del servidor, la lógica interna no se toca
- Las funciones no llamadas desde UI (cron jobs) también se benefician de estabilidad de imports
