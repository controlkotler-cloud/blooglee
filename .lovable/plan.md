

## Corregir el post MKPro y el bug crítico en `cleanMarkdownFromHtml`

### Problema identificado

El artículo recién generado ("¿Es rentable externalizar la gestión de redes sociales?") tiene todo el contenido HTML corrupto. Los tags HTML como `<h2>`, `<p>`, `<ul>` han sido reemplazados por texto visible como `%%HTML<em>TAG</em>0%%`.

### Causa raíz (Bug critico)

En la Edge Function `generate-article-saas`, la funcion `cleanMarkdownFromHtml` tiene un bug en el formato de los placeholders:

1. **Paso 1**: Extrae todas las etiquetas HTML y las reemplaza con `%%HTML_TAG_0%%`, `%%HTML_TAG_1%%`, etc.
2. **Paso 2**: Aplica limpieza de markdown, incluyendo la conversion de `_texto_` a `<em>texto</em>` (itálica).
3. **El bug**: El `_TAG_` dentro del placeholder coincide con el regex de italicas, y se convierte en `<em>TAG</em>`.
4. **Resultado**: `%%HTML_TAG_0%%` se corrompe a `%%HTML<em>TAG</em>0%%`.
5. **Paso 3**: El regex de restauracion busca `%%HTML_TAG_(\d+)%%` pero ya no lo encuentra porque esta corrupto.
6. Todo el HTML del articulo queda destruido y se guarda corrupto en la base de datos.

### Solucion (2 partes)

#### Parte 1: Corregir el bug en la Edge Function

**Archivo**: `supabase/functions/generate-article-saas/index.ts`

Cambiar el formato del placeholder de `%%HTML_TAG_X%%` (que contiene underscores vulnerables) a `%%HTMLTAG-X%%` (con guion, que ningun regex de markdown puede corromper):

```text
Linea 184: %%HTML_TAG_${tags.length - 1}%%  -->  %%HTMLTAG${tags.length - 1}%%
Linea 201: /%%HTML_TAG_(\d+)%%/g            -->  /%%HTMLTAG(\d+)%%/g
```

#### Parte 2: Regenerar el contenido del articulo corrupto

Ejecutar la Edge Function `generate-article-saas` nuevamente para el site MKPro, o actualizar manualmente el campo `content_spanish` del articulo (ID: `0a5d5222-541d-41bf-ad37-130db5cf83a7`) con contenido HTML limpio.

La opcion mas segura es primero desplegar el fix y despues regenerar el articulo para que se genere correctamente.

### Detalles tecnicos

- **Bug location**: `supabase/functions/generate-article-saas/index.ts`, lineas 176-206
- **Articulo afectado**: ID `0a5d5222-541d-41bf-ad37-130db5cf83a7`, site MKPro
- **Titulo del articulo**: "¿Es rentable externalizar la gestion de redes sociales? Un analisis"
- **Impacto**: Cualquier articulo cuyo contenido HTML pase por `cleanMarkdownFromHtml` queda corrupto si contiene etiquetas HTML (que es siempre, ya que el prompt pide contenido en HTML)

### Secuencia de implementacion

1. Corregir los placeholders en `cleanMarkdownFromHtml` (cambiar underscores por guion)
2. Desplegar la Edge Function actualizada
3. Eliminar el articulo corrupto de la base de datos
4. Notificar al usuario para que regenere el articulo desde el dashboard

