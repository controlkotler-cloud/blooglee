

## Correccion de 5 problemas criticos en Blooglee SaaS

### Resumen de problemas detectados y soluciones

---

### 1. La sincronizacion con WordPress no funciona correctamente

**Problema encontrado:** La sincronizacion manual (sync-wordpress-taxonomies-saas) analiza los ultimos 15 posts del blog y guarda el contexto en `sites.wordpress_context`. Sin embargo:
- Solo 2 de 5 sites con auto_generate tienen wordpress_context (los otros 3 tienen `null`)
- La sincronizacion solo ocurre manualmente o de forma incremental tras publicar (anade el titulo al array `lastTopics`)
- Si no se sincroniza, el generador no tiene informacion del blog existente y puede crear temas repetidos

**Solucion:** Disparar automaticamente la sincronizacion completa de WordPress 1 hora despues de cada publicacion exitosa. Implementar un trigger en `publish-to-wordpress-saas` que haga un `fire-and-forget` a `sync-wordpress-taxonomies-saas` con un delay de 1 hora (usando un campo `pending_sync_at` en la tabla `sites` y un chequeo en el scheduler).

**Alternativa mas simple (la que se implementara):** Anadir una llamada directa a `sync-wordpress-taxonomies-saas` al final de `publish-to-wordpress-saas`, justo despues de actualizar el `wordpress_context` incremental. Esto asegura que cada vez que se publica, el sistema re-analiza el blog completo.

### Detalles tecnicos - Problema 1

**Archivo:** `supabase/functions/publish-to-wordpress-saas/index.ts`

Despues de la actualizacion incremental del `wordpress_context` (lineas 304-341), anadir una llamada fire-and-forget a `sync-wordpress-taxonomies-saas` pasando el `wordpress_config_id` del site y `analyze_content: true`. Se usara el service role key para que no dependa del token del usuario.

---

### 2. La automatizacion diaria no funciona

**Problema encontrado:** Hay varios problemas:

1. **El cron solo se ejecuta a las 9:00 UTC** (`schedule: 0 9 * * *`), pero el site "mkpro" tiene `publish_hour_utc = 8`. Ese site nunca se procesa porque el scheduler mira si `currentHour === publishHour` y a las 9 UTC ya no es la hora 8.

2. **El timeout del cron es de solo 10 segundos** (10000ms). El scheduler necesita iterar por todos los sites, verificar articulos existentes y disparar generaciones. 10 segundos puede ser insuficiente.

3. **El cron deberia ejecutarse cada hora** para soportar las diferentes horas configuradas por site, pero solo se ejecuta una vez al dia a las 9:00.

4. **No hay auto-publicacion en WordPress**: El scheduler dispara `generate-article-saas` que genera el articulo pero NO lo publica automaticamente en WordPress. Los sites con `auto_generate = true` generan el contenido pero luego requieren publicacion manual.

**Solucion:**

- Cambiar el cron a ejecucion **horaria** (`0 * * * *`) con un timeout mas largo (60 segundos)
- Implementar **auto-publicacion** en `generate-article-saas`: cuando `isScheduled = true`, despues de guardar el articulo, verificar si el site tiene WordPress configurado y publicar automaticamente
- Actualizar `wp_post_url` en la tabla `articles` tras la publicacion automatica

### Detalles tecnicos - Problema 2

**Migracion SQL:** Actualizar el cron job:
```sql
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'dispatch-article-generation'),
  schedule := '0 * * * *',
  command := -- mismo comando pero con timeout_milliseconds := 60000
);
```

**Archivo:** `supabase/functions/generate-article-saas/index.ts`

Al final del handler (despues de guardar el articulo, linea ~1786), anadir bloque de auto-publicacion:
1. Si `isScheduled === true`
2. Buscar `wordpress_configs` para el `site_id` usando service role
3. Si existe config WP, llamar a `publish-to-wordpress-saas` internamente (fetch fire-and-forget al endpoint con service role)
4. Si la publicacion es exitosa, actualizar `articles.wp_post_url` con el URL del post

---

### 3. El spinner de generacion se pierde al cambiar de pantalla

**Problema encontrado:** El `GenerationContext` esta montado a nivel de App y persiste la lista de IDs generando. Sin embargo, la mutacion `useGenerateArticleSaas` se ejecuta en el componente. Si el usuario navega fuera del `SiteDetail` mientras la mutacion esta en curso, la mutacion se ejecuta en background pero:
- La invalidacion de cache (`queryClient.invalidateQueries`) puede no tener efecto visual si el usuario ya no esta en la pagina
- Aunque el spinner se mantiene gracias al contexto, la experiencia no es ideal

**Solucion:** 
- Mostrar un toast persistente al iniciar la generacion ("Generando articulo... puedes navegar libremente")
- Mantener el sistema actual de `GenerationContext` que ya funciona correctamente para el spinner
- Asegurar que `onSettled` siempre se ejecuta incluso si el componente se desmonta (ya esta implementado correctamente con el contexto global)

### Detalles tecnicos - Problema 3

**Archivo:** `src/hooks/useArticlesSaas.ts`

En `useGenerateArticleSaas`, anadir un toast informativo al inicio de `mutationFn`:
```typescript
toast.info('Generando articulo... puedes navegar libremente', { duration: 10000, id: `gen-${params.siteId}` });
```

Y en `onSettled`, cerrar ese toast:
```typescript
toast.dismiss(`gen-${params.siteId}`);
```

---

### 4. Bloquear generacion tras publicacion exitosa

**Problema encontrado:** 
- La tabla `articles` tiene un campo `wp_post_url` pero **nunca se actualiza** en el flujo SaaS (`WordPressPublishDialogSaas.tsx` no guarda el URL tras publicar, a diferencia de los dialogos de MKPro que si lo hacen)
- No hay logica que impida regenerar si ya esta publicado
- No hay restriccion de periodo (diario/semanal/mensual)

**Solucion:**
1. **Guardar `wp_post_url`** en `WordPressPublishDialogSaas.tsx` tras publicacion exitosa (como ya se hace en MKPro)
2. **Bloquear el boton "Generar articulo"** si ya existe un articulo publicado (`wp_post_url !== null`) para el periodo actual
3. Mostrar mensaje claro: "Ya tienes un articulo publicado para este periodo"
4. Permitir regenerar si el articulo NO esta publicado (para cambiar contenido que no gusta)
5. Permitir cambiar imagen solo si no esta publicado
6. **Excepcion admin**: los usuarios con rol admin no tienen bloqueo

### Detalles tecnicos - Problema 4

**Archivo:** `src/components/saas/WordPressPublishDialogSaas.tsx`

Despues de la publicacion exitosa, actualizar la base de datos:
```typescript
await supabase.from('articles').update({ wp_post_url: result.post_url }).eq('id', article.id);
queryClient.invalidateQueries({ queryKey: ['articles'] });
```

**Archivo:** `src/pages/SiteDetail.tsx`

Anadir logica para verificar si hay articulo publicado en el periodo actual:
- Obtener la frecuencia del site (`publish_frequency`)
- Buscar si algun articulo del periodo tiene `wp_post_url !== null`
- Si existe, deshabilitar boton de generar con mensaje "Publicado - proximo articulo en X"
- Si el usuario es admin (verificar con `useProfile`), no aplicar bloqueo

**Archivo:** `src/components/saas/SiteArticles.tsx`

Misma logica en el boton secundario de generar dentro de la lista de articulos.

**Archivo:** `src/components/saas/ArticlePreviewDialog.tsx`

Condicionar el boton "Cambiar imagen" a que `wp_post_url` sea null.

---

### 5. Desactivar botones de copiar texto y HTML

**Problema encontrado:** Los botones "Copiar texto" y "Copiar HTML" en `ArticlePreviewDialog` y "Copiar contenido" en `ArticleCard` permiten a usuarios en periodo de prueba generar y copiar contenido sin publicar, abusando del sistema.

**Solucion:** Eliminar ambos botones de copia para usuarios normales. Solo mantenerlos visibles para admins.

### Detalles tecnicos - Problema 5

**Archivo:** `src/components/saas/ArticlePreviewDialog.tsx`

- Eliminar los botones "Copiar texto" y "Copiar HTML" (lineas 95-102)
- Si se quiere mantener para admins, importar `useProfile` y condicionar la visibilidad

**Archivo:** `src/components/saas/ArticleCard.tsx`

- Eliminar la opcion "Copiar contenido" del DropdownMenu (lineas 64-67)
- Eliminar el prop `onCopy` y su uso

**Archivo:** `src/components/saas/SiteArticles.tsx`

- Eliminar `handleCopy` y la referencia a `onCopy` en ArticleCard

---

### Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/publish-to-wordpress-saas/index.ts` | Guardar wp_post_url + trigger sync WP |
| `supabase/functions/generate-article-saas/index.ts` | Auto-publicacion cuando isScheduled |
| `src/components/saas/WordPressPublishDialogSaas.tsx` | Guardar wp_post_url tras publicar |
| `src/components/saas/ArticlePreviewDialog.tsx` | Quitar botones copiar, condicionar cambio imagen |
| `src/components/saas/ArticleCard.tsx` | Quitar opcion copiar |
| `src/components/saas/SiteArticles.tsx` | Quitar handleCopy, bloquear generacion si publicado |
| `src/pages/SiteDetail.tsx` | Bloquear generacion si articulo publicado en periodo |
| `src/hooks/useArticlesSaas.ts` | Toast informativo durante generacion |
| Migracion SQL | Cambiar cron a horario con timeout mayor |

### Orden de implementacion

1. Migracion SQL (cron horario)
2. Edge functions (auto-publicacion + sync WP)
3. Frontend: guardar wp_post_url tras publicar
4. Frontend: bloquear generacion si publicado
5. Frontend: quitar botones copiar
6. Frontend: toast informativo de generacion
