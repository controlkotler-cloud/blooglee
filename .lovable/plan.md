
## Objetivo (lo que está pasando ahora)
Ya no falla la generación (bien), pero sigues viendo el artículo viejo (“cookieless”) porque la UI de MKPro está eligiendo “el primer artículo que encuentre” para esa empresa dentro del mes/año, y ahora (con frecuencias daily/weekly) puede haber varios artículos en el mismo mes. Entonces:
- Se genera uno nuevo (gasta tokens/crédito)
- Pero la tarjeta/preview sigue mostrando el primero (antiguo) porque usa `.find(...)` sobre un array sin ordenar.

Esto afecta tanto a `/mkpro` (src/pages/MKPro.tsx) como al panel legacy de `/` (src/pages/Index.tsx), porque ambos hacen:
```ts
const getArticleForCompany = (empresaId) => articulosEmpresas.find(a => a.empresa_id === empresaId) || null;
```

## Causa raíz (técnica)
1) `useArticulosEmpresas(month, year)` trae una lista de artículos del mes/año, pero:
- no ordena por `generated_at`
- y la UI usa `.find(...)` (primer match)
2) Para frecuencias `daily` y `weekly`, es normal tener múltiples filas por empresa en el mismo mes/año.
3) Resultado: la UI muestra un artículo “viejo” aunque exista uno nuevo.

## Solución propuesta (sin tocar componentes protegidos)
Como `src/components/company/*` está protegido, NO cambiaremos los componentes. Arreglaremos la selección del artículo *antes* de pasarlo al `CompanyCard` / `CompanyArticlePreview`, modificando únicamente las páginas:
- `src/pages/MKPro.tsx`
- `src/pages/Index.tsx`

### 1) Seleccionar SIEMPRE el artículo “correcto” para mostrar
Crear una función helper en cada página (o una función compartida en un archivo seguro, si preferís) tipo:

**Reglas de selección (por empresa, dentro del mes/año seleccionado):**
- **monthly**: coger el más reciente del mes/año (`generated_at` DESC)
- **weekly**: coger el más reciente de `week_of_month` actual (y mes/año)
- **daily**: coger el más reciente “de hoy” (por `generated_at >= startOfToday`) y además que coincida con mes/año seleccionado

Luego, en vez de `.find`, usar:
- `filter(...)`
- ordenar por `generated_at` desc
- devolver `[0]`

Esto hace que al generar un nuevo artículo, lo que ves sea el nuevo.

### 2) Corregir el estado “✓ Generado” y el botón “Generar”
Ahora mismo `pendingEmpresasCount` y `pending` se calculan en base a “si existe algún artículo en el mes/año”, lo cual rompe el concepto de daily/weekly:
- En daily, si generaste el día 1, la UI creerá que “ya está generado” todo el mes.

Vamos a cambiar el cálculo para que sea “existe artículo para ESTE periodo”:
- daily: existe artículo de hoy
- weekly: existe artículo de esta semana (week_of_month actual)
- monthly: existe artículo del mes

Así:
- si hoy todavía no se generó, sale botón “Generar”
- si ya se generó hoy, sale “Ver / Regenerar”

### 3) (Opcional pero recomendado) Mostrar “Última generación: …”
Sin tocar componentes protegidos, podemos añadir en la página (no en la tarjeta) información de depuración simple, o ajustar el “onPreview” para que siempre abra el último.

## Pasos de implementación (orden)
1) Leer y confirmar en `src/pages/MKPro.tsx` y `src/pages/Index.tsx` dónde se calcula:
   - `getArticleForCompany`
   - `pendingEmpresasCount`
   - `handleGenerateAllEmpresas` (lista `pending`)
2) Implementar helper `getCompanyArticleForPeriod(company, articulosEmpresas, selectedMonth, selectedYear)` con:
   - cálculo de `todayStart`
   - cálculo de `weekOfMonth = Math.ceil(day/7)`
   - filtrado por empresa + reglas arriba
   - orden por `generated_at` desc
3) Reemplazar usos:
   - `getArticleForCompany(...)` => usar el helper con `company`
   - `pendingEmpresasCount` => basado en `!getCompanyArticleForPeriod(company, ...)`
   - `pending` en `handleGenerateAllEmpresas` idem
4) Verificar que `onPreview` abre el artículo devuelto por el helper (el más reciente correcto).

## Cómo validaremos que no vuelves a “quemar tokens”
Checklist rápido:
1) En MKPro, para la empresa “mkpro”:
   - Generar artículo
   - Debe verse inmediatamente el nuevo (título/tema diferente al cookieless)
2) Volver a generar el mismo día:
   - Debe actualizar (Regenerar) o mantener “Ver/Regenerar” pero mostrando el nuevo contenido, sin quedarse “clavado” en el viejo
3) Si la empresa es daily:
   - mañana debería aparecer “Generar” (si no hay artículo de mañana) y al generar, ver el de mañana.

## Riesgos / notas
- Esto no cambia la generación ni la BD: solo corrige qué registro se muestra.
- No tocamos `src/components/company/*` (protegido).
- Si queréis navegar histórico (ver los artículos antiguos del mes), eso sería una mejora adicional (lista de artículos por empresa con selector), pero primero arreglamos “mostrar el último correcto”.

## Resultado esperado
- Dejas de ver el post “cookieless” cuando ya se generó uno nuevo.
- No se vuelve a gastar crédito “a ciegas” porque lo generado se refleja en UI correctamente.
- Daily/weekly/mensual se comportan como negocio: se genera cuando toca y lo ves cuando toca.
