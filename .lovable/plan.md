

## Simplificar las imagenes generadas para Social Media

### Problema

El prompt actual de generacion de imagenes sociales es demasiado complejo y produce resultados recargados:

```
"Create a visually striking social media image in a modern 3D abstract style.
Use a gradient color palette of violet, fuchsia, and orange.
Include floating 3D geometric elements (spheres, cubes, abstract shapes)
with glass/metallic materials..."
```

Esto genera imagenes con demasiados elementos 3D, materiales metalicos, cristales, etc. Las imagenes de referencia que compartiste y las del propio blog de Blooglee son mucho mas limpias: gradientes suaves, formas abstractas minimalistas, sin exceso de elementos.

### Solucion

Reemplazar el `IMAGE_STYLE_PROMPT` en `supabase/functions/generate-social-content/index.ts` por un prompt simplificado que siga el mismo patron exitoso del blog:

**Prompt nuevo (inspirado en el del blog que ya funciona bien):**

```
Professional social media image.

STYLE:
- Abstract, minimal, clean design
- Primary gradient colors: purple (#8B5CF6) to fuchsia (#D946EF) to coral (#F97316)
- Soft flowing shapes, smooth gradients, ample negative space
- NO text, NO logos, NO letters, NO words
- NO realistic photos, NO complex 3D objects
- Simple, elegant, modern

FORMAT: Square 1:1 aspect ratio for social media

CONCEPT: {topic}
```

### Cambios clave

- Eliminar referencias a "3D geometric elements", "glass/metallic materials", "spheres, cubes"
- Anadir "minimal", "clean", "ample negative space", "smooth gradients"
- Prohibir explicitamente objetos 3D complejos
- Formato cuadrado (1:1) en lugar de generico, mas adecuado para redes sociales
- Prompt mas corto = resultados mas predecibles y limpios

### Archivo a modificar

Solo un archivo: `supabase/functions/generate-social-content/index.ts` - reemplazar la constante `IMAGE_STYLE_PROMPT` (lineas 54-58)

