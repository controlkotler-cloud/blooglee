

# Plan: Mejoras en Cards MKPro + Cambio de Emails a "Publicado"

## Resumen de Cambios

Vamos a implementar dos mejoras importantes:

1. **Rediseño de las tarjetas** de farmacias, empresas y sites con indicadores claros de:
   - Estado de publicación automática (Auto/Manual)
   - Estado de publicación en WordPress (Publicado/Pendiente)
   - Cards más anchas con mejor organización visual

2. **Cambio de emails de notificación**: De "Artículo Generado" a "Artículo Publicado" con el enlace directo al post en WordPress

---

## Parte 1: Nuevos Campos en Base de Datos

Añadir columnas para rastrear la URL del post publicado:

| Tabla | Nueva Columna | Tipo | Propósito |
|-------|---------------|------|-----------|
| `articulos` | `wp_post_url` | text | URL del post publicado en WordPress |
| `articulos_empresas` | `wp_post_url` | text | URL del post publicado en WordPress |
| `articles` (SaaS) | `wp_post_url` | text | URL del post publicado en WordPress |

---

## Parte 2: Rediseño de PharmacyCard

### Cambios Visuales

```text
+------------------------------------------------------------+
| 📍 Barcelona                          [Auto] [ES/CA] [WP]  |
+------------------------------------------------------------+
| Farmàcia de l'Esglèsia                                     |
|                                                            |
| Tema: Refuerza tus defensas para el invierno               |
|                                                            |
| +------------------+  +------------------+                  |
| | ✓ Generado       |  | ✓ Publicado      |                  |
| +------------------+  +------------------+                  |
|                                                            |
| [Ver] [Regenerar] [Publicar]              [Editar] [Borrar]|
+------------------------------------------------------------+
```

### Nuevos Indicadores

| Badge | Color | Significado |
|-------|-------|-------------|
| `Auto` | Verde esmeralda | Publicación automática activada |
| `Manual` | Ámbar/Naranja | Publicación manual (requiere acción) |
| `✓ Generado` | Verde | Artículo generado para el período |
| `✓ Publicado` | Azul/Violeta | Publicado en WordPress |
| `Pendiente` | Gris | Generado pero no publicado |

### Props Adicionales

```typescript
interface PharmacyCardProps {
  // ... existentes
  article: Articulo | null;
  isPublished: boolean;  // NUEVO: true si wp_post_url existe
  wpPostUrl?: string;    // NUEVO: URL del post
}
```

---

## Parte 3: Rediseño de CompanyCard

Misma estructura que PharmacyCard con los indicadores de:
- Auto/Manual (ya existe, mejorar visual)
- Generado/No generado (ya existe)
- Publicado/Pendiente (NUEVO)

---

## Parte 4: Actualización de SiteCard (SaaS)

Añadir indicador de auto_generate y estado de publicación para el último artículo.

---

## Parte 5: Cambio de Emails a "Publicado"

### Lógica Actual (Problema)

```text
1. Generar artículo con IA
2. Guardar en BD
3. Publicar en WordPress (si hay config)
4. Enviar email "Artículo Generado" ← SIEMPRE se envía aquí
```

### Nueva Lógica

```text
1. Generar artículo con IA
2. Guardar en BD
3. Publicar en WordPress (si hay config)
4. SI se publicó → Enviar email "Artículo Publicado" con URL
   SI NO se publicó → NO enviar email (o enviar aviso de fallo)
```

### Nuevo Diseño del Email

```text
+--------------------------------------------------+
|            🚀 Artículo Publicado                  |
+--------------------------------------------------+
| Se ha publicado un nuevo artículo para           |
| Farmàcia de l'Esglèsia:                          |
|                                                  |
| +----------------------------------------------+ |
| | Refuerza tus defensas para el invierno       | |
| | Descubre los mejores consejos para...        | |
| +----------------------------------------------+ |
|                                                  |
| [Ver artículo en WordPress →]                    |
|                                                  |
| MKPro - Publicación automática de contenido      |
+--------------------------------------------------+
```

---

## Archivos a Modificar

### Base de Datos (Migración)

| Acción | Descripción |
|--------|-------------|
| ALTER TABLE | Añadir `wp_post_url` a `articulos`, `articulos_empresas`, `articles` |

### Componentes UI

| Archivo | Cambios |
|---------|---------|
| `src/components/pharmacy/PharmacyCard.tsx` | Añadir badge Publicado, mejorar layout, más ancha |
| `src/components/company/CompanyCard.tsx` | Añadir badge Publicado, unificar estilo |
| `src/components/saas/SiteCard.tsx` | Añadir indicador auto_generate y publicado |

### Hooks de Datos

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useArticulos.ts` | Añadir `wp_post_url` al tipo `Articulo` |
| `src/hooks/useArticulosEmpresas.ts` | Añadir `wp_post_url` al tipo `ArticuloEmpresa` |
| `src/hooks/useArticlesSaas.ts` | Añadir `wp_post_url` al tipo |

### Edge Functions

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article/index.ts` | Guardar `wp_post_url`, cambiar email a "Publicado" |
| `supabase/functions/generate-article-empresa/index.ts` | Guardar `wp_post_url`, cambiar email a "Publicado" |
| `supabase/functions/generate-article-saas/index.ts` | Guardar `wp_post_url`, cambiar email a "Publicado" |

---

## Diseño Visual Mejorado de las Cards

### Antes (Actual)

```text
+------------------------+
| Localidad              |
| Nombre Farmacia        |
| Tema                   |
| [Generado]             |
| [Ver] [Regenerar] ...  |
+------------------------+
```

### Después (Nuevo)

```text
+----------------------------------------+
| 📍 Barcelona                   [Auto]  |
|                           [ES] [CA]    |
|----------------------------------------|
| Farmàcia de l'Esglèsia                 |
|                                        |
| 🏷️ Defensas para el invierno          |
|----------------------------------------|
| Estado:                                |
| [✓ Generado] [✓ Publicado]             |
|----------------------------------------|
| [👁️ Ver] [🔄 Regenerar]    [✏️] [🗑️]   |
+----------------------------------------+
```

### Ancho de Cards

- Actual: Grid de 3 columnas en desktop
- Nuevo: Grid de 2 columnas en desktop para cards más amplias
- Móvil: 1 columna (sin cambios)

---

## Sección Técnica

### Migración SQL

```sql
-- Añadir campo wp_post_url a las tablas de artículos
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS wp_post_url text;
ALTER TABLE articulos_empresas ADD COLUMN IF NOT EXISTS wp_post_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS wp_post_url text;
```

### Actualización del Tipo Articulo

```typescript
export interface Articulo {
  // ... campos existentes
  wp_post_url: string | null;  // NUEVO
}
```

### Lógica de Email Condicional

```typescript
// En generate-article/index.ts
if (wpPostUrl) {
  // Solo enviar email si se publicó correctamente
  await sendMKProNotification(
    pharmacy.name,
    spanishArticle.title,
    excerpt,
    wpPostUrl,
    true // isPublished = true
  );
  
  // Guardar URL en BD
  await supabase
    .from("articulos")
    .update({ wp_post_url: wpPostUrl })
    .eq("farmacia_id", farmaciaId)
    .eq("month", month)
    .eq("year", year);
}
```

### Nueva Firma de sendMKProNotification

```typescript
async function sendMKProNotification(
  entityName: string,
  articleTitle: string,
  articleExcerpt: string,
  wpUrl: string,           // Ahora obligatorio
  isPublished: boolean     // Nuevo parámetro
): Promise<void>
```

---

## Resultado Esperado

Después de implementar estos cambios:

1. **Cards más informativas**: De un vistazo sabrás si una farmacia/empresa tiene:
   - Publicación automática o manual
   - Artículo generado
   - Artículo publicado en WordPress (con link directo)

2. **Emails útiles**: Solo recibirás emails cuando el artículo esté publicado en WordPress, con el enlace directo para revisarlo

3. **Mejor UX**: Cards más anchas y organizadas con toda la información visible sin necesidad de entrar a cada cuenta

4. **Trazabilidad**: Campo `wp_post_url` en BD permite saber qué artículos están publicados y acceder a ellos directamente

