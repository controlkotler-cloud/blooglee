
He encontrado la diferencia real: mkpro y farmapro NO usan rutas distintas; ambos pasan por `generate-article-saas`. El comportamiento distinto viene de una combinación de fallos en el pipeline, no del sitio en sí.

Qué está pasando:
1. El prompt activo en la base de datos sigue desalineado:
   - `saas.article.user` todavía contiene una regla antigua del tipo “La frase final debe incluir todos los enlaces disponibles”.
   - Como los prompts de base de datos tienen prioridad sobre los del código, la IA sigue generando su propio cierre con blog/Instagram.
2. En mkpro hay artículos recientes que terminan con HTML mal cerrado:
   - El último párrafo no acaba en `</p>`.
   - Las funciones `stripAiGeneratedClosingCta`, `removeTrailingFooterCtaParagraphs` y `finalDeduplicateClosingParagraphs` solo detectan párrafos completos `<p>...</p>`, así que ese segundo cierre queda invisible y no se limpia.
3. Hay un bug lógico en la deduplicación final:
   - `finalDeduplicateClosingParagraphs` calcula qué párrafo debería conservar (`keepIdx`), pero luego en la práctica borra “todos menos el último”.
   - Eso hace que el resultado dependa del orden exacto en que la IA escribió los cierres.
4. Farmapro no “lo hace perfecto” por una lógica especial:
   - Simplemente sus posts recientes suelen llegar con HTML de cierre bien formado, por eso el post-procesado sí consigue limpiarlos.
5. mkpro además tiene menos contexto editorial configurado que farmapro (menos señales de contenido), lo que puede empujar a la IA a meter más autopromoción, pero no es la causa técnica principal.

Plan de solución definitiva:
1. Corregir los prompts activos
   - Actualizar `saas.article.system` y `saas.article.user`.
   - Eliminar cualquier instrucción que pida meter blog/Instagram en la frase final.
   - Sustituirla por una prohibición explícita del cierre promocional.
   - Forzar refresco de caché de prompts.

2. Normalizar el HTML antes de deduplicar
   - Añadir una función tipo `normalizeArticleTailHtml()` justo antes de `stripAiGeneratedClosingCta`.
   - Cerrar `<p>` abiertos al final y limpiar cola HTML rota.
   - Objetivo: que todos los cierres queden convertidos en bloques detectables.

3. Arreglar la deduplicación final
   - Hacer que `finalDeduplicateClosingParagraphs` conserve realmente `keepIdx`.
   - Si hay varios cierres candidatos, mantener solo uno.
   - Priorizar el CTA oficial con enlaces correctos.
   - Eliminar también párrafos de autopromoción de marca que terminen hablando de blog/Instagram aunque no empiecen como CTA puro.

4. Simplificar el pipeline
   - Dejar `ensureAuthorityLinks` en una única fase final.
   - Orden recomendado:
     1. `cleanMarkdownFromHtml`
     2. `normalizeArticleTailHtml`
     3. `stripAiGeneratedClosingCta`
     4. `verifyAndCleanExternalLinks`
     5. `ensureFooterLinks`
     6. `ensureAuthorityLinks`
     7. `finalDeduplicateClosingParagraphs`
   - Así el footer no dependerá de párrafos previos ya contaminados o mal cerrados.

5. Validación final
   - Probar una generación nueva para mkpro y otra para farmapro.
   - Confirmar en ambos:
     - un único cierre final
     - sin segundo párrafo con blog/Instagram
     - HTML correctamente cerrado
     - sin mezclar fuentes de autoridad con el CTA

Archivos y piezas afectadas:
- `supabase/functions/generate-article-saas/index.ts`
- prompts activos del backend: `saas.article.system` y `saas.article.user`
- `prompt_cache_version`

Resultado esperado:
- mkpro y farmapro quedarán alineados porque el cierre ya no dependerá ni del prompt antiguo ni de HTML mal cerrado.
- Habrá un único pie final con enlaces correctos, sin duplicados.
