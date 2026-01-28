

# Plan: Sistema Completo de Blog Segmentado + Newsletters

## Análisis del Problema

### Estructura Actual vs Deseada

| Aspecto | Ahora | Objetivo |
|---------|-------|----------|
| **Categorías en BD** | `category` = "Empresas" o "Agencias" | Separar en `audience` + `category` |
| **Filtros en UI** | Mezcla audiencias con temas | Primero elegir audiencia, luego filtrar por tema |
| **Newsletter** | Una genérica para todos | Una para Empresas, otra para Agencias |
| **Suscripción** | Solo pide email | Pide email + tipo de audiencia |
| **Generación diaria** | ✅ Ya funciona (1 Empresas + 1 Agencias) | Añadir categoría temática variable |

### La confusión: Audiencia ≠ Categoría temática

```text
AUDIENCIA (para quién)          TEMA/CATEGORÍA (de qué)
├── Empresas (PYMEs)            ├── SEO
└── Agencias (Marketing)        ├── Marketing
                                ├── Tutoriales
                                ├── Comparativas
                                └── Producto
```

Un artículo puede ser:
- **Audiencia**: Empresas + **Tema**: SEO → "SEO local para pequeños negocios"
- **Audiencia**: Agencias + **Tema**: Tutoriales → "Cómo gestionar 10 WordPress a la vez"

---

## Solución Propuesta

### Parte 1: Actualizar Modelo de Datos

**1.1 Añadir columna `audience` a `blog_posts`**

```sql
ALTER TABLE blog_posts 
ADD COLUMN audience TEXT NOT NULL DEFAULT 'general';

-- Migrar datos existentes
UPDATE blog_posts SET audience = category WHERE category IN ('Empresas', 'Agencias');

-- Cambiar categoría a tema temático (por ahora dejar como estaba)
UPDATE blog_posts SET category = 'Marketing' WHERE audience IN ('Empresas', 'Agencias');
```

**1.2 Añadir columna `audience` a `newsletter_subscribers`**

```sql
ALTER TABLE newsletter_subscribers 
ADD COLUMN audience TEXT DEFAULT NULL;
-- NULL = interesado en ambos
-- 'empresas' = solo contenido para empresas
-- 'agencias' = solo contenido para agencias
```

### Parte 2: Actualizar Generación de Blog

**2.1 Modificar `generate-blog-blooglee/index.ts`**

- Recibir `category` (audiencia: Empresas/Agencias)
- Generar también una categoría temática (SEO, Marketing, etc.)
- Guardar ambos campos: `audience` + `category`

```typescript
// Antes
{ category: "Empresas" }

// Después  
{ 
  audience: "Empresas",
  category: await selectThematicCategory(topic) // "SEO", "Marketing", etc.
}
```

### Parte 3: Rediseñar UI del Blog

**3.1 Segmentación por audiencia (tabs o filtro principal)**

```text
┌─────────────────────────────────────────────────────────────┐
│  Blog Blooglee                                              │
│                                                             │
│  [🏢 Para Empresas]  [🏬 Para Agencias]  [📚 Todos]         │  ← Audiencia
│                                                             │
│  Filtrar por tema: [SEO] [Marketing] [Tutoriales] [...]     │  ← Categoría temática
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Post 1   │  │ Post 2   │  │ Post 3   │  │ Post 4   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**3.2 Diseño Responsive**

| Tamaño | Audiencia | Temas |
|--------|-----------|-------|
| **Mobile** | Tabs horizontales (scroll) | Dropdown compacto |
| **Tablet** | Tabs horizontales (full) | Pills horizontales |
| **Desktop** | Tabs destacados + badge | Pills horizontales con contador |

**3.3 Newsletter en Sidebar (mejorada)**

```text
┌─────────────────────────────────┐
│  📧 Newsletter                  │
│  ────────────────────────────── │
│  Soy:                           │
│  ○ Empresa/PYME                 │
│  ○ Agencia de marketing         │
│  ○ Ambos                        │
│                                 │
│  [tu@email.com                ] │
│  [     Suscribirme            ] │
└─────────────────────────────────┘
```

### Parte 4: Sistema de Newsletters Segmentadas

**4.1 Crear Edge Function `send-newsletter`**

Se ejecuta automáticamente después de generar posts del blog:

```typescript
// 1. Obtener posts publicados hoy
// 2. Para cada audiencia (Empresas, Agencias):
//    - Filtrar suscriptores de esa audiencia
//    - Obtener posts de esa audiencia
//    - Enviar email con diseño premium

const empresasPost = await getLatestPost('empresas');
const agenciasPost = await getLatestPost('agencias');

// Enviar a suscriptores de empresas
await sendToAudience('empresas', empresasPost);

// Enviar a suscriptores de agencias
await sendToAudience('agencias', agenciasPost);

// Enviar a suscriptores "ambos" (los dos posts)
await sendToAudience('both', [empresasPost, agenciasPost]);
```

**4.2 Template de Newsletter Premium**

- Diseño coherente con estética Blooglee (gradientes violet/fuchsia/coral)
- Imagen destacada del artículo
- Extracto con CTA "Leer artículo completo"
- Footer con links sociales (Instagram)
- Link de desuscripción

### Parte 5: Integrar en Cron Diario

**Flujo actualizado de `generate-monthly-articles`:**

```text
1. Generar artículos farmacias/empresas/sites
         ↓
2. Generar blog posts Blooglee
   ├── 1x Empresas (con tema aleatorio: SEO, Marketing, etc.)
   └── 1x Agencias (con tema aleatorio)
         ↓
3. Actualizar SEO assets (sitemap, llms.txt)
         ↓
4. ⭐ NUEVO: Enviar newsletters segmentadas
   ├── Newsletter Empresas → suscriptores empresas + ambos
   └── Newsletter Agencias → suscriptores agencias + ambos
```

---

## Archivos a Modificar/Crear

### Nuevos archivos

| Archivo | Propósito |
|---------|-----------|
| `supabase/functions/send-newsletter/index.ts` | Envío automatizado de newsletters |

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-blog-blooglee/index.ts` | Añadir campo `audience`, generar tema temático |
| `supabase/functions/subscribe-newsletter/index.ts` | Aceptar campo `audience` |
| `supabase/functions/generate-monthly-articles/index.ts` | Llamar a `send-newsletter` al final |
| `src/pages/BlogIndex.tsx` | Tabs de audiencia + filtros temáticos + formulario suscripción mejorado |
| `src/hooks/useBlogPosts.ts` | Filtrar por `audience` además de `category` |
| `src/hooks/useNewsletterSubscribe.ts` | Enviar `audience` en suscripción |

### Migraciones SQL

```sql
-- 1. Añadir audience a blog_posts
ALTER TABLE blog_posts ADD COLUMN audience TEXT NOT NULL DEFAULT 'general';

-- 2. Migrar datos (los posts actuales tienen la audiencia en category)
UPDATE blog_posts SET audience = 'empresas' WHERE category = 'Empresas';
UPDATE blog_posts SET audience = 'agencias' WHERE category = 'Agencias';

-- 3. Asignar categoría temática a posts existentes
UPDATE blog_posts SET category = 'Marketing' WHERE audience IN ('empresas', 'agencias');

-- 4. Añadir audience a newsletter_subscribers
ALTER TABLE newsletter_subscribers ADD COLUMN audience TEXT DEFAULT 'both';
```

---

## UI/UX Responsive Detallado

### Mobile (< 640px)

```text
┌────────────────────────────┐
│ 📚 Blog                    │
├────────────────────────────┤
│ [Empresas][Agencias][Todos]│  ← Tabs scroll horizontal
├────────────────────────────┤
│ Tema: [▼ Todos        ]    │  ← Dropdown compacto
├────────────────────────────┤
│ ┌──────────────────────┐   │
│ │ [Imagen post 1    ]  │   │  ← 1 columna
│ │ Título del post...   │   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │ [Imagen post 2    ]  │   │
│ │ Título del post...   │   │
│ └──────────────────────┘   │
├────────────────────────────┤
│ 📧 Newsletter              │  ← Al final en mobile
│ ○ Empresa ○ Agencia ○ Ambos│
│ [email@...]                │
│ [Suscribirme]              │
└────────────────────────────┘
```

### Tablet (640px - 1024px)

```text
┌──────────────────────────────────────────────────┐
│ 📚 Blog Blooglee                                 │
├──────────────────────────────────────────────────┤
│ [🏢 Empresas] [🏬 Agencias] [📚 Todos]           │
│                                                  │
│ [SEO] [Marketing] [Tutoriales] [Comparativas]    │
├──────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐                 │
│ │ Post 1      │  │ Post 2      │                 │  ← 2 columnas
│ └─────────────┘  └─────────────┘                 │
├──────────────────────────────────────────────────┤
│ 📧 Newsletter (horizontal)                       │
│ [○Empresa ○Agencia ○Ambos] [email] [Suscribir]  │
└──────────────────────────────────────────────────┘
```

### Desktop (> 1024px)

```text
┌────────────────────────────────────────────────────────────────────┐
│ 📚 Blog Blooglee                                                   │
├───────────────────────────────────────────────────────┬────────────┤
│                                                       │            │
│ [🏢 Empresas (3)] [🏬 Agencias (2)] [📚 Todos (5)]    │  📧 News   │
│                                                       │            │
│ [SEO] [Marketing] [Tutoriales] [Comparativas] [...]   │  Soy:      │
│                                                       │  ○ Empresa │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐            │  ○ Agencia │
│ │ Post 1    │ │ Post 2    │ │ Post 3    │            │  ○ Ambos   │
│ └───────────┘ └───────────┘ └───────────┘            │            │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐            │  [email]   │
│ │ Post 4    │ │ Post 5    │ │ Post 6    │            │  [Suscr.]  │
│ └───────────┘ └───────────┘ └───────────┘            │            │
└───────────────────────────────────────────────────────┴────────────┘
```

---

## Template Newsletter (Resend)

```html
<!-- Newsletter Empresas -->
<div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
  <header style="background: linear-gradient(135deg, #8B5CF6, #D946EF); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Blooglee para Empresas</h1>
    <p style="color: rgba(255,255,255,0.8);">Tu dosis semanal de marketing con IA</p>
  </header>
  
  <main style="padding: 30px;">
    <img src="[imagen_post]" style="width: 100%; border-radius: 12px;" />
    <h2 style="color: #1a1a2e;">[Título del artículo]</h2>
    <p style="color: #666;">[Extracto 150 caracteres...]</p>
    <a href="[url_post]" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
      Leer artículo completo →
    </a>
  </main>
  
  <footer style="background: #f5f5f5; padding: 20px; text-align: center;">
    <a href="https://instagram.com/blooglee_">Síguenos en Instagram</a>
    <p style="color: #999; font-size: 12px;">
      <a href="[unsubscribe_url]">Cancelar suscripción</a>
    </p>
  </footer>
</div>
```

---

## Resultado Final

| Antes | Después |
|-------|---------|
| 1 formulario newsletter genérico | 2 listas segmentadas (Empresas + Agencias) |
| No se envían newsletters | Newsletter automática diaria por audiencia |
| Categorías mezcladas (audiencia + tema) | Filtro primario (audiencia) + secundario (tema) |
| UI confusa | Tabs claros + filtros temáticos |
| Mismo contenido para todos | Contenido personalizado por audiencia |

