
# Plan: Sistema de Blog Interno para Blooglee + Newsletter + Automatización SEO

## Resumen Ejecutivo

Implementar un sistema completo de generación de contenido para el blog de Blooglee con tres componentes principales:

1. **Sistema de generación de posts** - 2 artículos diarios (1 empresas, 1 agencias)
2. **Newsletter con Resend** - Suscripción y envío automático
3. **Automatización SEO** - Actualización automática de sitemap.xml, llms.txt, robots.txt cuando se publique contenido nuevo

---

## Arquitectura del Sistema

```text
                    +------------------+
                    |   Cron Diario    |
                    | (9:00 AM UTC)    |
                    +--------+---------+
                             |
              +-------------+-------------+
              |                           |
    +---------v---------+       +---------v---------+
    | generate-blog-    |       | generate-blog-    |
    | article-empresas  |       | article-agencias  |
    +--------+----------+       +--------+----------+
              |                           |
              +-----------+---------------+
                          |
                +---------v----------+
                |    blog_posts      |
                |  (nueva tabla DB)  |
                +--------+-----------+
                         |
        +---------------+---------------+
        |               |               |
+-------v-------+ +-----v------+ +------v------+
| sitemap.xml   | | llms.txt   | | newsletter  |
| (dinámico)    | | (dinámico) | | (resend)    |
+---------------+ +------------+ +-------------+
```

---

## Parte 1: Base de Datos para Blog Posts

### Nueva tabla: `blog_posts`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| slug | text | URL única del post |
| title | text | Título del artículo |
| excerpt | text | Resumen (160 caracteres) |
| content | text | Contenido completo en Markdown |
| image_url | text | Imagen destacada |
| category | text | "empresas" o "agencias" |
| author_name | text | Nombre del autor |
| author_avatar | text | URL avatar |
| author_role | text | Rol del autor |
| read_time | text | "5 min", "8 min", etc. |
| published_at | timestamp | Fecha de publicación |
| is_published | boolean | Estado de publicación |
| seo_keywords | text[] | Keywords para SEO |
| created_at | timestamp | Fecha creación |

**RLS:** Lectura pública (SELECT sin auth), escritura solo service_role.

---

## Parte 2: Edge Function de Generación de Blog

### Nueva función: `generate-blog-blooglee`

Esta función generará artículos optimizados para:
- SEO tradicional (meta tags, estructura H1-H6, keywords)
- AEO (Answer Engine Optimization para LLMs)
- AI Overviews de Google

**Flujo de generación:**

1. **Detectar audiencia** (empresas o agencias según parámetro)
2. **Generar tema dinámico** basado en:
   - Tendencias actuales (fecha real)
   - Temas ya publicados (evitar duplicados)
   - Keywords con alto potencial SEO
3. **Crear contenido con IA** usando Lovable AI (google/gemini-2.5-flash):
   - Título optimizado (max 60 chars)
   - Meta description (max 160 chars)
   - Contenido estructurado con FAQs
   - Datos citables para LLMs
4. **Seleccionar imagen** de Unsplash
5. **Guardar en blog_posts**
6. **Disparar actualización de SEO assets**

### Estructura del prompt para SEO/AEO:

```text
Eres un experto en SEO y AEO (Answer Engine Optimization).
Fecha REAL de hoy: [fecha actual]
Audiencia: [empresas/agencias de marketing]

Genera un artículo de blog para Blooglee que:
1. Responda una pregunta específica que [empresas/agencias] hacen
2. Incluya datos y estadísticas citables
3. Tenga estructura FAQ al final
4. Sea útil para LLMs (ChatGPT, Claude, Perplexity)
5. Mencione Blooglee naturalmente sin ser spam
6. Longitud: 1000-1500 palabras
7. Incluya tabla comparativa o lista procesable
```

---

## Parte 3: Sistema de Newsletter con Resend

### Nueva tabla: `newsletter_subscribers`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| email | text | Email del suscriptor |
| subscribed_at | timestamp | Fecha suscripción |
| is_active | boolean | Estado activo |
| source | text | Origen (blog, landing, etc.) |
| unsubscribed_at | timestamp | Fecha baja (nullable) |

### Nueva función: `subscribe-newsletter`

- Endpoint para suscribirse desde el blog
- Validación de email
- Confirmación doble opcional
- Almacenamiento en DB

### Nueva función: `send-newsletter`

- Se ejecuta después de publicar nuevo post
- Usa Resend con template HTML
- Incluye el último artículo publicado
- Link de unsubscribe

### Componente frontend actualizado

El formulario de Newsletter en BlogIndex.tsx se conectará a la nueva Edge Function.

---

## Parte 4: Automatización de SEO Assets

### Sistema de actualización dinámica

Actualmente los archivos sitemap.xml, llms.txt y llms-full.txt son estáticos. Hay dos enfoques posibles:

**Opción A: API Route dinámica** (Recomendado)
- Crear endpoints que generen estos archivos dinámicamente
- `/api/sitemap.xml` → Lee de blog_posts y genera XML
- `/api/llms.txt` → Lee blog_posts y genera contenido

**Opción B: Edge Function post-publicación**
- Después de publicar un post, regenerar archivos estáticos
- Menos eficiente pero mantiene archivos estáticos

### Para este proyecto: Opción A - Rutas dinámicas

Crear páginas React que devuelvan contenido dinámico:
- `/sitemap` → Genera sitemap.xml dinámico con todos los posts
- `/llms` → Genera llms.txt dinámico con artículos recientes

**Nota importante:** Como Lovable usa React (SPA), necesitamos que el servidor devuelva estos archivos correctamente. La solución será:
1. Mantener un sitemap base estático
2. Crear una Edge Function `generate-seo-assets` que actualice los archivos después de cada publicación
3. Almacenar el contenido generado y servirlo

### Edge Function: `update-seo-assets`

Después de publicar un post:
1. Leer todos los posts de blog_posts
2. Generar nuevo sitemap.xml
3. Generar nuevo llms.txt con artículos recientes
4. Actualizar llms-full.txt con sección de blog
5. Almacenar en Supabase Storage (bucket público)

---

## Parte 5: Integración con Cron Existente

### Modificar `generate-monthly-articles`

Añadir una sección nueva al final del cron existente:

```typescript
// ========== 4. GENERATE BLOOGLEE BLOG POSTS ==========
console.log("=== Generating Blooglee Blog Posts ===");

// Generate 1 post for "empresas" audience
await generateBlogPost(supabase, lovableApiKey, "empresas");

// Generate 1 post for "agencias" audience  
await generateBlogPost(supabase, lovableApiKey, "agencias");

// Update SEO assets
await updateSeoAssets(supabase);

// Send newsletter if new posts
await sendNewsletterDigest(resend, supabase);
```

---

## Parte 6: Frontend - Migración a DB

### Actualizar BlogIndex.tsx y BlogPost.tsx

1. Cambiar de leer `blogPosts` estático a query de Supabase
2. Mantener compatibilidad con posts existentes (migrar a DB)
3. Hook nuevo: `useBlogPosts()`

### Nuevo hook: `useBlogPosts.ts`

```typescript
export function useBlogPosts(category?: string) {
  return useQuery({
    queryKey: ["blog_posts", category],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      
      if (category && category !== "Todos") {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
```

---

## Parte 7: Correcciones Pendientes

### Arreglar referencia al dominio viejo

En `src/pages/BlogPost.tsx` línea 87:
```typescript
// ANTES (incorrecto)
const fullUrl = `https://blooglee.lovable.app/blog/${post.slug}`;

// DESPUÉS (correcto)
const fullUrl = `https://blooglee.com/blog/${post.slug}`;
```

También en las líneas 113-114 del BreadcrumbSchema.

---

## Archivos a Crear/Modificar

### Nuevos archivos:
1. `supabase/functions/generate-blog-blooglee/index.ts` - Generación de posts
2. `supabase/functions/subscribe-newsletter/index.ts` - Suscripción newsletter
3. `supabase/functions/update-seo-assets/index.ts` - Actualización sitemap/llms
4. `src/hooks/useBlogPosts.ts` - Hook para leer posts de DB
5. `src/hooks/useNewsletterSubscribe.ts` - Hook para suscribirse

### Archivos a modificar:
1. `supabase/functions/generate-monthly-articles/index.ts` - Añadir sección blog
2. `src/pages/BlogIndex.tsx` - Usar hook de DB + form newsletter funcional
3. `src/pages/BlogPost.tsx` - Usar hook de DB + arreglar URLs
4. `src/data/blogPosts.ts` - Migrar posts existentes a DB
5. `supabase/config.toml` - Añadir nuevas funciones

### Migraciones SQL:
1. Crear tabla `blog_posts`
2. Crear tabla `newsletter_subscribers`
3. Políticas RLS para ambas tablas
4. Migrar posts estáticos existentes

---

## Flujo Completo Diario

```text
09:00 AM (Cron)
    │
    ├── Generar artículos para farmacias/empresas/sites (existente)
    │
    ├── Generar 1 post "empresas" para blog Blooglee
    │   └── Tema: "Cómo X puede ayudar a tu empresa..."
    │
    ├── Generar 1 post "agencias" para blog Blooglee
    │   └── Tema: "10 formas de escalar contenido para clientes..."
    │
    ├── Actualizar SEO assets
    │   ├── sitemap.xml (añadir nuevos posts)
    │   ├── llms.txt (añadir resumen posts recientes)
    │   └── llms-full.txt (actualizar sección blog)
    │
    └── Enviar newsletter digest (si hay suscriptores)
        └── "Nuevos artículos esta semana en Blooglee"
```

---

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Posts/semana | 0 (manual) | 14 (2/día) |
| Newsletter | No funcional | Automatizado |
| Sitemap | Estático | Dinámico |
| llms.txt | Estático | Se actualiza con posts |
| Cobertura SEO | Limitada | Empresas + Agencias |
| AEO/LLM visibility | Básica | Optimizada |

---

## Consideraciones Técnicas

1. **Rate limits:** Los 2 posts diarios no afectan a los límites de la plataforma (separados de los artículos de usuarios)

2. **Resend:** Ya está configurado el secret `RESEND_API_KEY`, se usará el mismo

3. **Contenido único:** El sistema de deduplicación evitará temas repetidos

4. **Categorías ampliadas:** Se añadirán "Empresas" y "Agencias" a las categorías del blog

5. **Compatibilidad:** Los 9 posts estáticos existentes se migrarán a la DB para mantener URLs
