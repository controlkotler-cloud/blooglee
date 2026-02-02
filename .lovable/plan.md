

# Plan: Añadir Publicación Automática a WordPress en Edge Functions

## Problema Detectado

La prueba de hoy reveló que:
- Los articulos se generaron correctamente
- Los emails de notificacion llegaron
- PERO los posts NO se publicaron en WordPress

**Causa raiz**: Las funciones `generate-article` y `generate-article-empresa` que usa el `generate-scheduler` NO incluyen la logica de publicacion a WordPress. Solo:
1. Generan el articulo con IA
2. Lo guardan en la base de datos
3. Envian email de notificacion

La funcion `generate-monthly-articles` SI tiene la logica de publicacion, pero el scheduler moderno usa las funciones individuales por separado.

## Solucion Propuesta

Añadir la logica de publicacion automatica a WordPress en las funciones `generate-article` y `generate-article-empresa` cuando se ejecutan en modo programado (`isScheduled: true`).

---

## Cambios Necesarios

### 1. Modificar `generate-article/index.ts`

Añadir despues de guardar el articulo en la BD (linea ~919):

```typescript
// Si tiene WordPress configurado, publicar automaticamente
if (isScheduled && farmaciaId && spanishArticle) {
  const { data: wpSite } = await supabase
    .from("wordpress_sites")
    .select("*")
    .eq("farmacia_id", farmaciaId)
    .maybeSingle();

  if (wpSite) {
    // Obtener taxonomias
    const { categoryIds, tagIds } = await getTaxonomiesForPublish(...);
    
    // Publicar en español
    await fetch(`${SUPABASE_URL}/functions/v1/publish-to-wordpress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({
        farmacia_id: farmaciaId,
        title: spanishArticle.title,
        content: spanishArticle.content,
        slug: spanishArticle.slug,
        status: "publish",
        image_url: imageData?.url,
        image_alt: spanishArticle.title,
        meta_description: spanishArticle.meta_description,
        lang: "es",
        category_ids: categoryIds,
        tag_ids: tagIds,
      }),
    });

    // Si hay catalan, publicar tambien
    if (catalanArticle) {
      await fetch(publishUrl, {
        // ... datos en catalan con slug-ca
      });
    }
  }
}
```

### 2. Modificar `generate-article-empresa/index.ts`

Mismo patron: buscar `wordpress_sites` por `empresa_id` y publicar automaticamente.

---

## Flujo Corregido

```text
generate-scheduler (cron cada hora)
         |
         v
    +----+----+
    |         |
    v         v
generate-article    generate-article-empresa
    |                       |
    v                       v
1. Generar con IA    1. Generar con IA
2. Guardar en BD     2. Guardar en BD
3. Enviar email      3. Enviar email
4. [NUEVO] Publicar WP   4. [NUEVO] Publicar WP
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article/index.ts` | Añadir logica de publicacion a WordPress |
| `supabase/functions/generate-article-empresa/index.ts` | Añadir logica de publicacion a WordPress |

---

## Publicacion Manual de los Articulos de Hoy

Ademas de corregir el codigo, puedo ejecutar la publicacion manual de los articulos generados hoy que no se publicaron:

1. Obtener todos los articulos de febrero 2026 de farmacias
2. Para cada uno que tenga WordPress configurado, llamar a `publish-to-wordpress`
3. Hacer lo mismo para empresas

---

## Seccion Tecnica

### Logica de Taxonomias

Necesitamos añadir una funcion helper para seleccionar categorias/tags:

```typescript
async function getTaxonomiesForPublish(
  supabase: any,
  wpSiteId: string,
  articleTitle: string,
  articleContent: string
): Promise<{ categoryIds: number[]; tagIds: number[] }> {
  const { data: taxonomies } = await supabase
    .from("wordpress_taxonomies")
    .select("wp_id, name, taxonomy_type")
    .eq("wordpress_site_id", wpSiteId);

  if (!taxonomies?.length) return { categoryIds: [], tagIds: [] };

  const categories = taxonomies.filter(t => t.taxonomy_type === "category");
  const tags = taxonomies.filter(t => t.taxonomy_type === "tag");

  // Usar primera categoria disponible o seleccion por IA
  const categoryIds = categories.length > 0 ? [categories[0].wp_id] : [];
  const tagIds = tags.length > 0 ? [tags[0].wp_id] : [];

  return { categoryIds, tagIds };
}
```

### Notificacion Mejorada con URL de WordPress

El email de notificacion ya tiene placeholder para `wpUrl`, lo usaremos para incluir el link al post publicado:

```typescript
await sendMKProNotification(
  pharmacy.name,
  spanishArticle.title,
  excerpt,
  wpResult?.post_url || pharmacy.blog_url  // URL del post publicado
);
```

---

## Resultado Esperado

Despues de implementar estos cambios:

1. El proximo primer lunes del mes, los articulos se generaran Y publicaran automaticamente
2. Los emails incluiran el link directo al post en WordPress
3. Los articulos de hoy se pueden publicar manualmente ejecutando un script

