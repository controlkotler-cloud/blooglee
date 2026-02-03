

## Problema identificado

Cuando publicas un artículo en WordPress a través de Blooglee, el `wordpress_context.lastTopics` no se actualiza. Esto significa que:

- Si sincronizas hoy y tienes posts sobre A, B, C en WordPress
- Generas y publicas un artículo D
- El sistema no sabe que D ya existe en WordPress
- Aunque D esté en la tabla `articles`, el contexto de WordPress queda desactualizado para reflejar el estado real del blog

La buena noticia: **Ya tienes una fuente de verdad más fácil** - la tabla `articles` ya guarda todos los artículos generados por Blooglee. El problema es que el contexto de WordPress (`lastTopics`) no se mantiene sincronizado automáticamente.

---

## Solución propuesta: Actualización automática tras publicar

### Opcion A: Append al publicar (recomendada - ligera y sin API calls extra)

**Cuando se publica exitosamente en WordPress:**
1. Añadir el título del artículo recién publicado al array `wordpress_context.lastTopics`
2. Mantener un máximo de 20-25 títulos (eliminar los más antiguos si se supera)
3. Actualizar `sites.wordpress_context` con el array modificado

**Ventajas:**
- No requiere llamadas adicionales a la API de WordPress
- Se ejecuta en el mismo flujo de publicación
- Mantiene el contexto siempre actualizado

**Archivo a modificar:**
- `supabase/functions/publish-to-wordpress-saas/index.ts`

### Cambios concretos

```text
1) Después de publicar exitosamente (línea ~263-270):
   - Leer el `wordpress_context` actual del site
   - Añadir el título al principio de `lastTopics`
   - Limitar a 25 elementos
   - Guardar el contexto actualizado

2) Usar service_role para el update:
   - El usuario tiene permisos sobre `sites`, pero usamos service_role 
     para garantizar que el update siempre funcione
```

### Pseudocódigo del cambio

```typescript
// Después de crear el post exitosamente
if (postResponse.ok) {
  // ... código existente ...
  
  // Actualizar wordpress_context con el nuevo título
  const supabaseService = createClient(supabaseUrl, serviceRoleKey);
  
  const { data: siteData } = await supabaseService
    .from('sites')
    .select('wordpress_context')
    .eq('id', body.site_id)
    .single();
  
  const currentContext = siteData?.wordpress_context || {};
  const currentTopics = currentContext.lastTopics || [];
  
  // Añadir nuevo título al principio, limitar a 25
  const updatedTopics = [body.title, ...currentTopics].slice(0, 25);
  
  await supabaseService
    .from('sites')
    .update({
      wordpress_context: {
        ...currentContext,
        lastTopics: updatedTopics,
        last_publish_at: new Date().toISOString()
      }
    })
    .eq('id', body.site_id);
}
```

---

## Beneficios de esta solución

| Aspecto | Antes | Después |
|---------|-------|---------|
| Sincronización | Manual | Automática tras publicar |
| Llamadas API WordPress | N/A | Ninguna extra |
| Contexto actualizado | Solo al sincronizar | Siempre al día |
| Complejidad | - | Mínima (10-15 líneas) |

---

## Alternativa descartada

**Re-sincronizar automáticamente con WordPress después de publicar:**
- Requiere llamada adicional a `/wp/v2/posts`
- Más lento y consume más recursos
- WordPress podría bloquear por rate limiting
- No aporta valor extra si ya sabemos qué publicamos

---

## Archivos a modificar

1. `supabase/functions/publish-to-wordpress-saas/index.ts` - Añadir update de contexto tras publicar

---

## Resultado esperado

Después de implementar:
1. Publicas artículo "Las mejores vitaminas para el invierno"
2. Automáticamente se añade a `wordpress_context.lastTopics`
3. La próxima generación lo detecta y evita temas similares
4. Sin necesidad de pulsar "Sincronizar" manualmente

