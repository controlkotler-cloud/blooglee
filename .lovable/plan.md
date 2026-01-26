

## Plan: Mejorar Generación de Artículos con Descripción de Empresa e Imágenes con IA

### Dos Mejoras a Implementar

---

## MEJORA 1: Añadir Campo "Descripción de Empresa"

### Problema Identificado
Los artículos pueden ser genéricos cuando el sector es estándar. Ejemplo: "Marketing" → artículos demasiado amplios.

Con una descripción como "ecosistema digital de referencia para farmacias en España", la IA genera contenido mucho más enfocado.

### Solución

#### 1.1 Añadir columna a la tabla `sites`

```sql
ALTER TABLE sites ADD COLUMN description TEXT;
```

#### 1.2 Modificar Onboarding (Step 1)

Añadir un campo de texto después del sector:

```typescript
<div className="space-y-2">
  <Label htmlFor="description">Breve descripción de tu negocio (opcional)</Label>
  <Textarea
    id="description"
    placeholder="Ej: Plataforma digital para verificar contratos de alquiler..."
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className="min-h-[80px]"
  />
  <p className="text-xs text-muted-foreground">
    Una descripción ayuda a generar artículos más relevantes para tu negocio específico.
  </p>
</div>
```

#### 1.3 Modificar Edge Function

Incluir la descripción en el prompt de generación:

```typescript
const systemPrompt = `...
EMPRESA: ${site.name}
SECTOR: ${site.sector}
${site.description ? `DESCRIPCIÓN: ${site.description}` : ''}
...`;
```

---

## MEJORA 2: Generar Imágenes con IA (en lugar de Unsplash)

### Problema Identificado
Unsplash devuelve imágenes irrelevantes:
- Botes de medicamentos para artículos de estrategia
- Fachadas con texto en chino
- Brazos de robot sin contexto

### Referencia Visual (tu otro proyecto)
Las imágenes del proyecto de alquileres tienen:
- Estilo minimalista y profesional
- Tonos neutros: beige, crema, marrón suave
- Objetos de oficina/profesionales: libros, gafas, portátil, mazo
- Interior luminoso con luz natural
- Relación sutil con el tema (no literal)

### Solución: Usar Lovable AI para Generación

#### 2.1 Prompt de Generación de Imagen

```typescript
const imagePrompt = `Generate a professional blog header image.

STYLE:
- Minimalist, clean, modern
- Soft neutral colors: beige, cream, light brown, white
- Natural lighting, bright and airy interior
- NO text, NO logos, NO faces

COMPOSITION:
- Professional office/workspace setting
- Subtle objects related to the topic: ${topic}
- Books, glasses, laptop, documents, coffee cup
- Elegant and sophisticated

MOOD: Professional, trustworthy, calm, modern`;
```

#### 2.2 Llamada a la API de Generación

```typescript
const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash-image", // Nano banana
    messages: [{ role: "user", content: imagePrompt }],
    modalities: ["image", "text"]
  })
});
```

#### 2.3 Procesar la Respuesta

```typescript
const imageData = await imageResponse.json();
const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
// base64Image = "data:image/png;base64,iVBORw0KGgo..."
```

#### 2.4 Subir a Supabase Storage

```typescript
// Crear bucket 'article-images' si no existe
const fileName = `${siteId}/${articleId}.png`;
const imageBuffer = base64ToBuffer(base64Image);

const { data, error } = await supabase.storage
  .from('article-images')
  .upload(fileName, imageBuffer, { contentType: 'image/png' });

// Obtener URL pública
const publicUrl = supabase.storage.from('article-images').getPublicUrl(fileName).data.publicUrl;
```

#### 2.5 Fallback a Unsplash

Si la generación de IA falla (timeout, error), usar Unsplash como fallback.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Base de datos | Añadir columna `description` a `sites` |
| `src/pages/Onboarding.tsx` | Añadir campo de descripción |
| `src/components/saas/SiteSettings.tsx` | Añadir campo de descripción |
| `src/hooks/useSites.ts` | Incluir `description` en mutations |
| `supabase/functions/generate-article-saas/index.ts` | Usar descripción en prompt + generar imagen con IA |
| Supabase Storage | Crear bucket `article-images` con política pública |

---

## Resultado Esperado

### Antes (Unsplash)
Imágenes con:
- Botes de medicamentos
- Texto en otros idiomas
- Robots sin contexto

### Después (IA Generativa)
Imágenes con:
- Estilo consistente minimalista
- Tonos neutros profesionales
- Objetos sutiles relacionados con el tema
- Sin texto ni logos
- Aspecto editorial de alta calidad

---

## Consideraciones Técnicas

### Ventajas de Generación con IA
- Imágenes 100% relevantes al contenido
- Estilo visual consistente en todos los artículos
- Sin problemas de derechos de autor
- Sin texto en idiomas incorrectos

### Posibles Desventajas
- Más tiempo de generación (5-15 segundos adicionales)
- Costo de API (pero ya está incluido en Lovable AI)
- Tamaño de las imágenes base64 (se mitiga subiendo a storage)

### Configuración de Storage (necesaria)

```sql
-- Crear bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('article-images', 'article-images', true);

-- Política de lectura pública
CREATE POLICY "Public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'article-images');

-- Política de escritura para usuarios autenticados
CREATE POLICY "Users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'article-images');
```

