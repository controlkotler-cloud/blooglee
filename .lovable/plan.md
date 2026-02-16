# Generacion automatica de Social Media con cada Blog Post de Blooglee

## Resumen

Cada vez que se genere un blog post de Blooglee (para Empresas o Agencias), el sistema creara automaticamente posts adaptados para Instagram, LinkedIn, Facebook y TikTok. Se reutilizara la imagen destacada del blog, recortandola con IA al formato optimo de cada red social, y se generara el mejor copy posible incluyendo el enlace al post.

## Cambios necesarios

### 1. Modificar `generate-blog-blooglee` (Edge Function)

Despues de insertar el blog post en la base de datos (linea ~1401), anadir una llamada asincrona a una nueva funcion `generate-social-from-blog` que:

- Reciba el `blog_post_id`, titulo, excerpt, slug, imagen destacada y audiencia
- Genere contenido social para las 4 plataformas en paralelo
- No bloquee la respuesta del blog (fire-and-forget)

### 2. Crear nueva Edge Function `generate-social-from-blog`

Esta funcion:

**Recibe:** `{ blogPostId, title, excerpt, slug, imageUrl, audience }`

**Para cada plataforma (Instagram, LinkedIn, Facebook, TikTok):**

a) **Imagen adaptada:** Usa `google/gemini-2.5-flash-image` para recortar/adaptar la imagen destacada del blog al formato optimo:

- Instagram: 1080x1350 (4:5)
- LinkedIn: 1080x1350 (4:5)
- Facebook: 1080x1350 (4:5)
- TikTok: 1080x1920 (9:16)

b) **Copy optimizado:** Genera el texto adaptado al tono de cada plataforma con `google/gemini-2.5-flash`:

- Instagram: 150-250 palabras, emojis moderados, CTA visual, sin hashtags, incluye enlace en bio mention
- LinkedIn: 200-400 palabras, tono profesional, datos, CTA, incluye enlace directo al post
- Facebook: 100-250 palabras, conversacional, pregunta final, enlace directo
- TikTok: guion por escenas (30-60s), gancho fuerte, CTA

c) **Enlace del post:** `https://blooglee.com/blog/{slug}` incluido en el copy

d) **Guarda** cada post en la tabla `social_content` con estado `draft`

### 3. Anadir columna `blog_post_url` a `social_content`

Para almacenar la URL directa del blog post asociado y facilitar la futura integracion con Metricool.

### 4. Configuracion en `config.toml`

Registrar la nueva funcion `generate-social-from-blog` con `verify_jwt = false`.

### 5. Panel Admin: actualizar vista

Anadir el enlace al blog post en el `SocialContentCard` para que se vea la URL del post original.

---

## Detalles tecnicos

### Flujo de ejecucion

```text
generate-blog-blooglee
  |
  +-- Inserta blog_post en BD
  |
  +-- Fire-and-forget: POST a generate-social-from-blog
       |
       +-- Para cada plataforma (paralelo):
            |-- Adaptar imagen (AI image edit)
            |-- Generar copy (AI text)
            |-- Subir imagen a article-images/social/{platform}/
            |-- Insertar en social_content
```

### Prompt de copy social

Cada plataforma tendra un prompt especializado que incluye:

- Contexto del articulo (titulo, excerpt)
- URL del post: `https://blooglee.com/blog/{slug}`
- Audiencia (empresas o agencias) para ajustar tono
- Instrucciones de formato especificas por plataforma
- Prohibicion explicita de hashtags
- Identidad Blooglee

### Recorte de imagen con IA

Se usara el modelo `google/gemini-2.5-flash-image` en modo edicion, enviando la imagen original del blog con la instruccion de recortarla al aspect ratio de cada plataforma, manteniendo la estetica y sin anadir texto.

### Metricool (fase posterior)

La estructura queda preparada para la integracion futura con Metricool. Los campos `scheduled_for` y `metricool_post_id` ya existen en la tabla. La integracion requerira configurar los secretos `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID` y `METRICOOL_BLOG_ID`.

## Archivos afectados


| Archivo                                                 | Cambio                                            |
| ------------------------------------------------------- | ------------------------------------------------- |
| `supabase/functions/generate-social-from-blog/index.ts` | NUEVO - Funcion principal                         |
| `supabase/functions/generate-blog-blooglee/index.ts`    | Anadir fire-and-forget post-insercion             |
| `supabase/config.toml`                                  | Registrar nueva funcion                           |
| `src/components/admin/SocialContentCard.tsx`            | Mostrar enlace al blog post                       |
| Migracion SQL                                           | Anadir columna `blog_post_url` a `social_content` |
