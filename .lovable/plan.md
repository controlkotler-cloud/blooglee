
Problema identificado
- La función `sync-wordpress-taxonomies-saas` aún tiene el import antiguo de esm.sh en la línea 1
- Este import no se actualizó durante el cambio anterior (se cambió solo parcialmente)
- Por eso da "Failed to send a request to the Edge Function": el build falla al intentar importar desde esm.sh

Cambio necesario
Archivo: `supabase/functions/sync-wordpress-taxonomies-saas/index.ts`

Línea 1 actual:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```

Cambiar a:
```typescript
import { createClient } from "npm:@supabase/supabase-js@2";
```

Verificación
- Tras el cambio, la función se desplegará automáticamente
- Probar "Sincronizar" en la configuración de WordPress de Farmacia Daries
- Debería completar sin error

Alcance
- Solo se modifica 1 línea en 1 archivo
- Respeta la arquitectura (no toca zona protegida MKPro)
