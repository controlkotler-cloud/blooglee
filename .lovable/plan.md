
# Plan: Corregir Actualización del Estado "Publicado" + Diagnóstico Error 401

## Problemas Identificados

### Problema 1: Error 401 en dos farmacias
- **Farmacias afectadas**: "Farmacia de Reboreda" (mascercadeti.net) y "Farmàcia La Sínia" (farmacialasinia.es)
- **Causa**: Error HTTP 401 en `upload-wordpress-media` indica credenciales de WordPress inválidas o expiradas
- **Solución**: Debes revisar y actualizar las credenciales de WordPress (username y Application Password) para estas dos farmacias

### Problema 2: El estado "Publicado" no se actualiza tras publicación manual
- **Causa**: El componente `WordPressPublishDialog` llama a `publish-to-wordpress` y muestra el resultado, pero NO actualiza el campo `wp_post_url` en la tabla `articulos`
- **Resultado**: Las cards siguen mostrando "Sin publicar" aunque el post existe en WordPress
- **Solución**: Añadir lógica para actualizar `wp_post_url` en la base de datos después de una publicación exitosa

---

## Cambios Necesarios

### 1. Actualizar `WordPressPublishDialog.tsx`

Después de publicar exitosamente, actualizar el artículo en la base de datos:

```typescript
// Después de publicación exitosa
if (results.spanish?.success && results.spanish.post_url) {
  await supabase
    .from("articulos")
    .update({ wp_post_url: results.spanish.post_url })
    .eq("id", article.id);
}
```

### 2. Actualizar `WordPressPublishDialogEmpresa.tsx`

Mismo patrón para empresas:

```typescript
// Después de publicación exitosa
if (results.spanish?.success && results.spanish.post_url) {
  await supabase
    .from("articulos_empresas")
    .update({ wp_post_url: results.spanish.post_url })
    .eq("id", article.id);
}
```

### 3. Invalidar Cache de React Query

Para que las cards se actualicen inmediatamente sin recargar la página:

```typescript
// Añadir invalidación del cache
queryClient.invalidateQueries({ queryKey: ["articulos"] });
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/pharmacy/WordPressPublishDialog.tsx` | Guardar `wp_post_url` en BD + invalidar cache |
| `src/components/company/WordPressPublishDialogEmpresa.tsx` | Guardar `wp_post_url` en BD + invalidar cache |

---

## Sobre el Error 401

El error en "Farmacia de Reboreda" y "Farmàcia La Sínia" es un problema de configuración, no de código:

1. Las credenciales de WordPress almacenadas están incorrectas o han caducado
2. Posiblemente el Application Password fue revocado o cambiado en WordPress
3. El plugin de seguridad (como Wordfence) podría estar bloqueando la API

**Acción requerida**: Editar estas dos farmacias en MKPro y actualizar las credenciales de WordPress con un Application Password válido.

---

## Flujo Corregido

```text
Usuario pulsa "Publicar"
         |
         v
WordPressPublishDialog
         |
         v
Llama a publish-to-wordpress Edge Function
         |
         v
Si éxito:
  1. Mostrar resultado al usuario ✓ (ya funciona)
  2. [NUEVO] Guardar wp_post_url en articulos
  3. [NUEVO] Invalidar cache de React Query
         |
         v
La card se actualiza y muestra "Publicado" con el link
```

---

## Sección Técnica

### Código de Actualización

```typescript
// En WordPressPublishDialog.tsx, dentro de handlePublish()
try {
  for (const lang of selectedLanguages) {
    // ... código existente de publicación ...
    results[lang] = result;
  }

  setPublishResults(results);
  
  // NUEVO: Guardar URL en base de datos
  if (results.spanish?.success && results.spanish.post_url) {
    const { error: updateError } = await supabase
      .from("articulos")
      .update({ wp_post_url: results.spanish.post_url })
      .eq("id", article.id);
    
    if (updateError) {
      console.error("Error updating wp_post_url:", updateError);
    }
    
    // Invalidar cache para que las cards se actualicen
    queryClient.invalidateQueries({ queryKey: ["articulos"] });
  }
} catch (error) {
  // Error handling...
}
```

### Props Necesarios

El componente ya recibe el `article` completo con su `id`, así que no necesitamos cambiar las props.

### Dependencias

Necesitamos añadir:
- `useQueryClient` de `@tanstack/react-query`
- `supabase` de `@/integrations/supabase/client`

---

## Resultado Esperado

Después de implementar estos cambios:

1. Cuando publiques manualmente un artículo, la card mostrará inmediatamente el badge "Publicado" con el enlace
2. El campo `wp_post_url` quedará guardado en la base de datos para futuras referencias
3. No necesitarás recargar la página para ver el estado actualizado
4. Las farmacias con error 401 seguirán fallando hasta que actualices sus credenciales de WordPress
