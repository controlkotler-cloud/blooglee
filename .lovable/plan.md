
## Plan: Arreglar la función regenerate-image

### Problema detectado
La función `regenerate-image` falla con:
```
ReferenceError: serve is not defined
```

**Causa raíz**: En la línea 338 usa `serve(async (req) => {` pero NO tiene el import de `serve`. Le falta:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
```

Además, el handler de OPTIONS devuelve `new Response(null, ...)` en vez de `new Response('ok', ...)` que es el estándar que aplicamos a las demás funciones.

---

### Cambios a implementar

**Archivo**: `supabase/functions/regenerate-image/index.ts`

1. **Añadir el import de serve** al inicio del archivo:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
```

2. **Estandarizar corsHeaders** (añadir Allow-Methods y Max-Age):
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

3. **Cambiar el handler de OPTIONS** (línea 339-341):
```typescript
if (req.method === "OPTIONS") {
  return new Response('ok', { headers: corsHeaders });
}
```

---

### Validación
- Desplegar la función actualizada
- Probar el botón "Cambiar" imagen desde el preview de un artículo en el dashboard SaaS
- Verificar que genera una nueva imagen sin errores

---

### Nota importante
El error `serve is not defined` es un error de compilación que impide que la función se ejecute en absoluto. Por eso devuelve "Failed to send a request to the Edge Function" - la función ni siquiera arranca.
