
Objetivo
- Arreglar el error de build (“Import … esm.sh … 500”) que está rompiendo varias funciones del backend.
- Ajustar la lógica de “verificación/limpieza” de enlaces externos para que cumpla exactamente lo que pides:
  - Si la IA pone una URL específica y esa URL falla, NO se elimina el enlace: se sustituye por el enlace a la home del dominio (https://dominio.com/).
  - Si ya era la home, se mantiene tal cual.
  - Sin hardcodear dominios concretos.

Qué ha pasado y por qué
1) Error 500 al importar desde esm.sh
- Varias funciones están importando `@supabase/supabase-js` desde `https://esm.sh/...`.
- Cuando esm.sh devuelve 500 (intermitente), el build falla y el sistema no puede ejecutar funciones como:
  - generate-article-empresa (lo muestra el error)
  - y potencialmente otras que también usan esm.sh.
- No es un bug de tu lógica de WordPress ni de los prompts: es un fallo externo del CDN de imports.

2) Por qué “no aparece el enlace a la home” aunque queríamos fallback
- En SaaS sí existe una capa de verificación de enlaces (`verifyAndCleanExternalLinks`) en `supabase/functions/generate-article-saas/index.ts`.
- La implementación actual, cuando un link falla (404/5xx/timeout), reemplaza el `<a href="...">texto</a>` por solo `texto` (elimina el enlace).
- Eso contradice lo que quieres: si falla, hay que cambiar el href a la home del dominio, no quitar el enlace.

Cambios propuestos (implementación)

A) Estabilizar imports del backend (solucionar el 500 de esm.sh)
- Cambiar los imports de `@supabase/supabase-js` desde `https://esm.sh/...` a un mecanismo más estable para Deno (por ejemplo `npm:@supabase/supabase-js@2`).
- Hacer este cambio en todas las funciones del backend que actualmente usan `https://esm.sh/@supabase/supabase-js...` para que el build no dependa de un único CDN.
- Recomendación: revisar también `resend@2.0.0` (si también viene por esm.sh) y migrarlo si procede para eliminar el mismo riesgo.

Archivos objetivo (según búsqueda actual)
- supabase/functions/generate-article-empresa/index.ts
- supabase/functions/generate-article/index.ts
- supabase/functions/generate-article-saas/index.ts
- supabase/functions/publish-to-wordpress/index.ts
- supabase/functions/publish-to-wordpress-saas/index.ts
- supabase/functions/support-chatbot/index.ts
- supabase/functions/sync-wordpress-taxonomies/index.ts
- supabase/functions/sync-wordpress-taxonomies-saas/index.ts
- supabase/functions/register-beta-user/index.ts
- supabase/functions/regenerate-image/index.ts
- supabase/functions/generate-monthly-articles/index.ts
- supabase/functions/generate-blog-blooglee/index.ts
- supabase/functions/send-newsletter/index.ts
- supabase/functions/subscribe-newsletter/index.ts
- supabase/functions/update-seo-assets/index.ts
- supabase/functions/fix-blog-false-claims/index.ts
- supabase/functions/generate-scheduler/index.ts
(la lista exacta final será “todas las que tengan ese import”, para que no quede ninguna rompiendo el build)

B) Cambiar la limpieza de enlaces para hacer “fallback a home” en vez de borrar
- Modificar `verifyAndCleanExternalLinks(htmlContent)` en:
  - supabase/functions/generate-article-saas/index.ts

Comportamiento nuevo (reglas)
1) Para cada enlace externo encontrado:
   - Si el HEAD devuelve:
     - 404, o
     - >= 500, o
     - error de red / timeout
   entonces:
   - Extraer el “origin” (protocolo + dominio) de la URL, por ejemplo:
     - https://www.nielsen.com/es/insights/...  -> https://www.nielsen.com
   - Sustituir SOLO el atributo href del `<a>` para apuntar a `origin` en vez de la URL profunda.
   - Mantener el texto del enlace (“según Nielsen”) intacto.
2) Si el enlace ya era `https://dominio.com` (sin path) o ya coincide con el origin:
   - No hacer cambios (se mantiene).
3) Si la URL es inválida y no se puede parsear:
   - Como último recurso: convertir el link en texto (para evitar dejar HTML roto), pero esto solo si de verdad no se puede obtener dominio.

Notas técnicas importantes (para que no “hardcodeemos”)
- No se añadirá lista de dominios permitidos.
- El fallback se calcula a partir del propio link que la IA haya puesto.
- Esto cumple tu objetivo: “si no existe la ruta específica, que al menos quede el enlace a la home”.

C) Mantener la mejora de prompts (sin contradecir lo anterior)
- Tus cambios recientes de prompts en MKPro (los que añadimos de “si no estás seguro usa la home”) se mantienen.
- Con el cambio de la verificación en SaaS, incluso si el modelo se equivoca y pone una ruta profunda inventada, el sistema lo “arregla” a home en vez de eliminar el enlace.

Plan de verificación (pasos que haremos al implementar)
1) Build/compilación:
- Confirmar que ya no falla el import (el error del 500 desaparece) al cambiar los imports.

2) Test funcional WordPress “Actualizar” (Health Check / Config):
- Volver a pulsar “Actualizar” en la configuración WordPress del site “mkpro”.
- Confirmar que ya no aparece “Error al verificar la conexión” por fallo de build/import.

3) Test de enlaces en artículos SaaS:
- Generar 1 artículo en el site mkpro (SaaS).
- Revisar el HTML final:
  - Debe incluir 2-3 enlaces externos.
  - Si alguno era un deep-link que fallaba, debe quedar como enlace a la home del dominio (no texto plano).

Riesgos y mitigaciones
- Algunos sitios bloquean HEAD o devuelven 403/405:
  - Mantendremos el link original si responde “ok” o si devuelve códigos no considerados “rotos”.
  - Para 403/405, normalmente no significa que el enlace “no exista”; solo que HEAD está bloqueado. En ese caso, NO deberíamos degradarlo a home ni eliminarlo.
  - Ajustaremos la condición de “roto” a: 404 y 5xx (y errores/timeout), pero NO 403/405.

Alcance (respeto a tu arquitectura)
- No se tocará nada en la zona protegida de componentes MKPro (src/components/pharmacy/*, src/components/company/*, hooks protegidos).
- Los cambios son exclusivamente en funciones del backend (supabase/functions/*) y en la función SaaS de limpieza de enlaces.

Resultado esperado
- Se elimina el error de import 500 (build estable).
- En SaaS, si un enlace profundo falla, el contenido no pierde el enlace: se convierte automáticamente a enlace a la home del dominio.
- Se mantiene la variedad de fuentes sin hardcodear dominios.
