
# Plan: Implementar generación de imágenes con IA en MKPro

## Objetivo
Actualizar las Edge Functions de MKPro (`generate-article` y `generate-article-empresa`) para que usen el modelo `google/gemini-3-pro-image-preview` para generar imágenes, igual que en Blooglee.

## Cambios a realizar

### 1. `supabase/functions/generate-article/index.ts` (Farmacias)

**Reemplazar la sección de generación de imagen (lineas 530-698)** con la nueva lógica:

- Importar `createClient` de Supabase al inicio del archivo
- Crear el prompt de imagen basado en el tema y sector (farmacia/salud)
- Llamar a `google/gemini-3-pro-image-preview` con `modalities: ["image", "text"]`
- Extraer la imagen base64 del response
- Subir al bucket `article-images` en Supabase Storage
- Si falla la IA, usar Unsplash como fallback (mantener lógica actual)

### 2. `supabase/functions/generate-article-empresa/index.ts` (Empresas)

**Reemplazar la sección de generación de imagen (lineas 994-1098)** con la misma lógica:

- Importar (ya tiene) `createClient` de Supabase
- Crear el prompt de imagen adaptado al sector de la empresa
- Llamar a `google/gemini-3-pro-image-preview`
- Subir imagen al storage
- Fallback a Unsplash si falla

## Detalles tecnicos

### Estructura del prompt de imagen
```
Generate a professional blog header image.

TOPIC: "${topic}"
SECTOR: ${sector || "health/pharmacy"}
CONTEXT: Professional pharmacy/healthcare content

REQUIREMENTS:
- Clean, professional photograph
- Visually related to the topic and sector
- NO text, NO logos, NO faces
- Suitable for blog header, 16:9 ratio
- High quality, editorial style
```

### Estructura de la llamada a la API
```typescript
const imageResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-pro-image-preview",
    messages: [{ role: "user", content: imagePrompt }],
    modalities: ["image", "text"]
  }),
});
```

### Extraccion y subida de imagen
```typescript
const base64Image = message?.images?.[0]?.image_url?.url;
if (base64Image) {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  const fileName = `${entityId}/${timestamp}-${topic.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
  
  await supabaseAdmin.storage
    .from('article-images')
    .upload(fileName, imageBuffer, { contentType: 'image/png', upsert: true });
}
```

## Flujo resultante

```text
+------------------+
|  Generar imagen  |
+------------------+
         |
         v
+----------------------------------+
|  Llamar gemini-3-pro-image      |
|  con prompt del articulo         |
+----------------------------------+
         |
    ¿Exito?
    /      \
  Si        No
   |         |
   v         v
+--------+  +------------------+
| Subir  |  | Fallback:        |
| a      |  | Buscar en        |
| Storage|  | Unsplash         |
+--------+  +------------------+
   |              |
   v              v
+----------------------------------+
|  Retornar URL de imagen          |
+----------------------------------+
```

## Archivos a modificar
- `supabase/functions/generate-article/index.ts`
- `supabase/functions/generate-article-empresa/index.ts`

## Lo que NO cambia
- La logica de generacion de articulos
- La estructura de respuesta de la API
- Los hooks del frontend (`useArticulos.ts`, `useArticulosEmpresas.ts`)
- Los componentes de preview

## Resultado esperado
Las imagenes generadas en MKPro usaran IA de alta calidad en lugar de fotos de stock de Unsplash, con un fallback automatico a Unsplash si la IA falla.
