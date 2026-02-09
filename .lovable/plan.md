

## Generador de Contenido Social - Panel Admin Blooglee

### Resumen

Ampliar el panel de administracion con un modulo de "Social Media" que genere contenido para Instagram, LinkedIn, Facebook y TikTok (sin X), con posibilidad de programar publicaciones directamente via Metricool API. Sin hashtags.

### Cambios respecto al plan anterior

- **Sin hashtags**: eliminado del esquema y de los prompts
- **Sin X (Twitter)**: solo Instagram, LinkedIn, Facebook, TikTok
- **Integracion Metricool**: publicacion programada directa desde el panel
- **Estilo visual de referencia**: las imagenes que has compartido muestran un estilo 3D abstracto con gradientes violeta/fuchsia/naranja (consistente con la marca Blooglee) y texto grande en bold. Los videos son loops cortos de motion graphics abstractos

### 1. Base de datos - Nueva tabla `social_content`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid PK | |
| blog_post_id | uuid FK nullable | Referencia al post origen |
| platform | text | instagram, linkedin, facebook, tiktok |
| content_type | text | post, story, carousel, reel_script, video_script |
| title | text | Titulo interno |
| content | text | Texto del post |
| media_prompt | text | Prompt para generar la imagen/visual |
| image_url | text nullable | URL de imagen generada |
| status | text | draft, ready, scheduled, published |
| scheduled_for | timestamptz nullable | Fecha programacion |
| metricool_post_id | text nullable | ID del post en Metricool |
| language | text | spanish, catalan, english |
| created_at | timestamptz | |

RLS: solo superadmins (mismo patron que blog_posts).

### 2. Integracion Metricool

**Autenticacion**: La API de Metricool requiere 3 parametros:
- `userToken` (header `X-Mc-Auth`)
- `userId` (query param)
- `blogId` (query param, identifica la marca)

Se almacenaran como secrets del backend:
- `METRICOOL_USER_TOKEN`
- `METRICOOL_USER_ID`  
- `METRICOOL_BLOG_ID`

**Endpoint principal**: `POST https://app.metricool.com/api/v2/scheduler/posts` para programar publicaciones con texto, imagen y fecha.

**Edge function**: `schedule-metricool-post` que recibe el contenido generado y lo envia a Metricool con la fecha de programacion.

### 3. Edge Function: `generate-social-content`

Recibe:
- `blogPostId` (opcional): adapta contenido de un post existente
- `platform`: instagram, linkedin, facebook, tiktok
- `contentType`: post, story, carousel, reel_script, video_script
- `language`: idioma destino
- `customTopic`: tema libre si no se basa en un blog post

Prompts por plataforma (sin hashtags):
- **Instagram post**: 150-250 palabras, emojis moderados, CTA, tono cercano
- **LinkedIn post**: 200-500 palabras, profesional, datos y estadisticas, CTA
- **Facebook post**: 100-300 palabras, conversacional, pregunta al final
- **TikTok script**: guion de 30-60s con escenas, texto en pantalla, narrador
- **Carousel**: 8-10 slides con titulo + texto corto por slide (JSON estructurado)
- **Story**: 5-7 slides con texto muy corto + indicacion visual
- **Reel script**: guion con escenas, transiciones, musica sugerida

Genera imagen con `google/gemini-3-pro-image-preview` en estilo 3D abstracto consistente con la marca (gradientes violeta-fuchsia-naranja, elementos 3D flotantes).

### 4. Interfaz Admin

**Nueva pagina**: `src/pages/admin/AdminSocialContent.tsx`
**Ruta**: `/admin/social`
**Menu**: Nueva entrada en AdminLayout con icono `Share2` y label "Social Media"

**Layout de la pagina:**

```text
┌─────────────────────────────────────────────┐
│  Social Media Content                       │
│  [Desde Blog Post]  [Contenido Libre]       │
├─────────────────────────────────────────────┤
│ Modo "Desde Blog Post":                     │
│  - Selector de blog post publicado          │
│  - Checkboxes de plataformas               │
│  - Selector de tipo por plataforma          │
│  - Idioma                                   │
│  - [Generar Adaptaciones]                   │
│                                             │
│ Modo "Contenido Libre":                     │
│  - Campo de tema                            │
│  - Plataforma + tipo                        │
│  - Idioma                                   │
│  - [Generar]                                │
├─────────────────────────────────────────────┤
│ Contenido Generado:                         │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │IG Post │ │LinkedIn│ │FB Post │           │
│  │ preview│ │preview │ │preview │           │
│  │[Copiar]│ │[Copiar]│ │[Copiar]│           │
│  │[Regen] │ │[Regen] │ │[Regen] │           │
│  │[Progr] │ │[Progr] │ │[Progr] │           │
│  └────────┘ └────────┘ └────────┘           │
└─────────────────────────────────────────────┘
```

**Boton "Programar"**: Abre un dialog para seleccionar fecha/hora y envia a Metricool via la edge function.

### 5. Archivos a crear

| Archivo | Proposito |
|---------|-----------|
| `src/pages/admin/AdminSocialContent.tsx` | Pagina principal social media |
| `src/components/admin/SocialContentCard.tsx` | Card de preview de cada pieza |
| `src/components/admin/SocialGeneratorForm.tsx` | Formulario de generacion |
| `src/components/admin/MetricoolScheduleDialog.tsx` | Dialog para programar en Metricool |
| `src/hooks/useAdminSocialContent.ts` | CRUD + trigger generacion |
| `supabase/functions/generate-social-content/index.ts` | Generacion IA por plataforma |
| `supabase/functions/schedule-metricool-post/index.ts` | Envio a Metricool API |

### 6. Archivos existentes a modificar

- `src/components/admin/AdminLayout.tsx`: anadir "Social Media" al array `menuItems`
- `src/App.tsx`: anadir ruta `/admin/social` protegida

### 7. Fases de implementacion

**Fase 1 (esta sesion)**: Tabla + edge function generacion + pagina admin con posts de Instagram y LinkedIn desde blog posts
**Fase 2**: Facebook, carousels, stories  
**Fase 3**: Guiones de video/reel para TikTok
**Fase 4**: Integracion Metricool (programacion directa)

### 8. Sobre Metricool

Necesitare que me proporciones 3 datos de tu cuenta Metricool:
- **userToken**: lo encuentras en Ajustes de cuenta > API
- **userId**: tu identificador de usuario
- **blogId**: el ID de tu marca (visible en la URL del navegador)

Estos se guardaran como secrets seguros del backend para que la edge function pueda hacer las llamadas.

### Nota sobre generacion de video

Actualmente la IA puede generar imagenes estaticas de alta calidad en el estilo que muestras (3D abstracto con gradientes). Para videos como los loops que has compartido, el sistema generara **guiones detallados + imagen de portada**, pero la generacion de video animado en si requeriria integracion con herramientas externas de video IA (como Runway o Pika) que podriamos evaluar en una fase posterior.

