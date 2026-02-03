
Problema real (y por qué “vuelve a salir lo mismo”)
- El error “Failed to parse Spanish article JSON” sigue apareciendo porque el cambio de sanitización que hicimos es incorrecto: estamos reemplazando TODOS los saltos de línea del JSON por el texto literal “\\n” de forma global.
- En JSON, los saltos de línea fuera de strings son whitespace válido. Pero si los conviertes globalmente a “\\n”, el JSON pasa a empezar así:
  - Antes: `{<newline>  "title": ... }` (válido)
  - Ahora: `{\\n  "title": ... }` (inválido, porque `\` justo después de `{` no es whitespace)
- Esto encaja exactamente con el log: `Expected property name or '}' in JSON at position 1` (posición 1 = segundo carácter, que se convierte en `\`).

Objetivo del arreglo
1) Volver a un parseo “normal” cuando el JSON es correcto.
2) Solo “arreglar” (escapar) caracteres de control cuando estén dentro de strings (donde sí rompen JSON: el caso “Bad control character in string literal…”).
3) Hacerlo igual para Español y Catalán.
4) Añadir logs útiles para que, si vuelve a fallar, sepamos qué carácter está rompiendo y dónde.

Cambios propuestos (implementación)
A) Corregir el sanitizado del JSON (generate-article-saas)
Archivo: `supabase/functions/generate-article-saas/index.ts`

1) Revertir el reemplazo global de `\n`, `\r`, `\t`
- Eliminar estas líneas del flujo actual:
  - `.replace(/\r\n/g, '\\n')`
  - `.replace(/\r/g, '\\n')`
  - `.replace(/\n/g, '\\n')`
  - `.replace(/\t/g, '\\t')`
- Motivo: rompen JSON válido convirtiendo whitespace real en caracteres `\` `n`.

2) Añadir una función helper “state machine” para reparar SOLO dentro de strings
- Implementar una función local, por ejemplo:
  - `function escapeControlCharsInsideStrings(input: string): string`
- Lógica:
  - Recorrer el string carácter a carácter.
  - Mantener estados:
    - `inString` (true/false) cuando estamos dentro de `"..."`.
    - `escaped` (true/false) para manejar `\"` y `\\`.
  - Cuando `inString === true`:
    - Si aparece `\n` (newline real) => convertir a `\\n`
    - Si aparece `\r` => `\\r`
    - Si aparece `\t` => `\\t`
    - Si aparece cualquier control char 0x00-0x1F (excepto los anteriores) => eliminarlo o convertirlo a `\\u00XX` (recomendación: convertir a `\\u00XX` para conservar contenido sin romper JSON).
  - Cuando `inString === false`:
    - No tocar `\n`, `\r`, `\t` (son whitespace válido en JSON).
    - Opcional: eliminar BOM/ZWSP (ver siguiente punto).

3) Limpiar caracteres invisibles comunes que también rompen el parse
- Antes de intentar parsear:
  - Eliminar BOM `\uFEFF` y zero-width spaces (`\u200B`, `\u200C`, `\u200D`) si aparecen (estos no son “control chars” ASCII y pueden colarse).
- Ejemplo: `input.replace(/[\uFEFF\u200B\u200C\u200D]/g, '')`

4) Estrategia de parse “en dos intentos”
- Intento 1 (rápido y seguro): `JSON.parse(jsonStringCleaned)`
- Si falla:
  - Loggear:
    - el mensaje del error
    - un preview de los primeros ~200 chars
    - (muy importante) el carácter y código en la posición indicada por el error si podemos inferirlo (en especial para el caso “Bad control character…”)
  - Intento 2: `JSON.parse(escapeControlCharsInsideStrings(jsonStringCleaned))`
- Si vuelve a fallar:
  - Lanzar el error actual “Failed to parse Spanish article JSON” pero con logs mejores (para cerrar el caso definitivamente).

B) Aplicar exactamente el mismo fix a Catalán
- Ahora mismo Catalán usa el mismo reemplazo global de newlines y tiene el mismo riesgo (aunque lo veas menos porque a veces ni entra por idiomas).
- Reutilizar el mismo helper y la misma estrategia de 2 intentos.

C) (Opcional) Mejorar extracción del JSON (sin tocar el comportamiento actual)
- La extracción actual:
  - quita fences ```json y ```
  - coge substring desde primera `{` a última `}`
- Mantenerlo, pero añadir un log (solo en error) de:
  - `firstBrace`, `lastBrace`, `jsonString.length`
  - para confirmar que realmente estamos cortando bien.

Validación (cómo sabremos que está arreglado)
1) Generar artículo en farmapro (mismo flujo actual).
2) Esperado:
  - desaparece el error “Expected property name…”
  - se guarda el artículo en `articles`
  - si vuelve a ocurrir “Bad control character in string literal…”, el intento 2 lo corregirá y se generará igualmente.
3) Revisar logs:
  - Debe aparecer “Spanish article generated successfully”.
  - Si hay reparación, añadiremos un log tipo: “JSON parse failed on first attempt; applying string-only escaping and retrying”.

Riesgos / notas
- Este cambio no afecta a MKPro (solo SaaS, función `generate-article-saas`).
- No cambia el contenido que devuelve la IA; solo hace el parser robusto sin convertir whitespace válido en texto literal.
- Si el modelo empieza a devolver comillas tipográficas o JSON “casi” válido, seguiremos necesitando que el prompt fuerce JSON estricto; pero el bug actual es 100% del sanitizado global.

Archivos afectados
- `supabase/functions/generate-article-saas/index.ts` (único necesario para corregir este error)

Pruebas rápidas después del cambio
- Probar 2-3 generaciones seguidas:
  - una sin catalán (si el site no lo usa)
  - una con catalán (si el site tiene catalán activo)
- Confirmar que no se rompe el resto del flujo (imagen, guardado en DB, UI).

Siguientes mejoras recomendadas (cuando esto esté estable)
- Ajustar el prompt para exigir “JSON sin code fences y sin texto extra”, reduciendo necesidad de reparación.
- Añadir un test automatizado (Deno) para el helper de parse con inputs rotos típicos (newlines dentro de strings, tabs, BOM).
