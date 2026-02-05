
## Plan: Corregir desajuste de respuesta entre regenerate-image y frontend

### Problema detectado
La función `regenerate-image` funciona correctamente (los logs muestran "Image regenerated successfully"), pero el frontend muestra "Error: no se obtuvo imagen".

**Causa raíz**: Desajuste en la estructura de la respuesta:

- **Backend devuelve** (línea 560):
```typescript
JSON.stringify({ image: imageData })
// Resultado: { image: { url: "...", photographer: "...", photographer_url: "..." } }
```

- **Frontend espera** (línea 301 del hook):
```typescript
if (!data?.url) throw new Error('No se obtuvo imagen');
// Espera: { url: "...", photographer: "...", photographer_url: "..." }
```

### Solución

Modificar la función `regenerate-image` para devolver el objeto directamente sin envolverlo en `image`:

**Archivo**: `supabase/functions/regenerate-image/index.ts`

**Cambio en línea 560**:
```typescript
// ANTES:
return new Response(
  JSON.stringify({ image: imageData }),
  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
);

// DESPUÉS:
return new Response(
  JSON.stringify(imageData),
  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

Esto hará que la respuesta sea directamente `{ url, photographer, photographer_url }` que es lo que espera el frontend.

### Archivos a modificar
- `supabase/functions/regenerate-image/index.ts` - Línea 560

### Validación
- Desplegar la función actualizada
- Probar el botón "Cambiar" imagen desde el preview de un artículo
- Verificar que la imagen se actualiza correctamente sin errores
