

## Plan Completo para Proyecto Blooglee - Paquete de Implementación

Te preparo un paquete completo y organizado para que copies al proyecto **blooglee**. Dado que ya copiaste la Fase 1 (Guidelines) y Fase 2 (Migración SQL), ahora necesitas:

---

### MENSAJE 1: Para copiar a Blooglee (después de que aplique las migraciones)

```
# Fase 3: Edge Functions Adaptadas para SaaS Multi-tenant

Implementa las siguientes Edge Functions adaptadas al nuevo esquema con `site_id` en lugar de `farmacia_id`/`empresa_id`. Todas deben:
- Usar CORS headers estándar
- Validar user_id cuando sea necesario
- Usar la tabla `sites` en lugar de `farmacias`/`empresas`
- Usar la tabla `articles` en lugar de `articulos`/`articulos_empresas`
- Usar `wordpress_configs` en lugar de `wordpress_sites`

## 1. generate-article (Crear nueva)

Función que genera un artículo para un site usando IA:

**Entrada:**
- site_id: UUID del sitio
- month: número del mes
- year: número del año
- usedImageUrls?: array de URLs ya usadas
- autoGenerateTopic?: boolean
- skipImage?: boolean

**Lógica:**
1. Obtener site de la tabla `sites` (name, sector, location, geographic_scope, languages, blog_url, instagram_url)
2. Generar tema con IA si autoGenerateTopic=true
3. Generar artículo español con Lovable AI Gateway (google/gemini-3-flash-preview)
4. Si languages incluye 'catalan', generar versión catalana
5. Si !skipImage, buscar imagen en Unsplash evitando usedImageUrls
6. Devolver { content: { spanish, catalan? }, image?, topic }

## 2. publish-to-wordpress (Crear nueva)

Función para publicar a WordPress:

**Entrada:**
- site_id: UUID del sitio
- title, content, slug, status, date?, image_url?, meta_description?, lang?, category_ids?, tag_ids?

**Lógica:**
1. Obtener credenciales de `wordpress_configs` WHERE site_id = ?
2. Si hay image_url, subirla con upload-wordpress-media
3. POST a /wp-json/wp/v2/posts con auth Basic

## 3. sync-wordpress-taxonomies (Crear nueva)

**Entrada:** wordpress_config_id

**Lógica:**
1. Obtener credenciales de `wordpress_configs`
2. GET /wp-json/wp/v2/categories y /wp-json/wp/v2/tags
3. Upsert en `wordpress_taxonomies`

## 4. regenerate-image (Crear nueva)

**Entrada:** pexelsQuery, usedImageUrls?, articleTitle?, articleContent?, siteSector?

**Lógica:**
1. Detectar categoría del sector
2. Buscar/crear contexto en `sector_contexts`
3. Generar query con IA si hay título/contenido
4. Buscar en Unsplash evitando URLs usadas

## 5. upload-wordpress-media (Crear nueva)

**Entrada:** site_url, wp_username, wp_app_password, image_url, image_alt?, image_title?

**Lógica:**
1. Descargar imagen de la URL
2. POST a /wp-json/wp/v2/media con FormData

---

Los secretos necesarios ya deberían estar disponibles en Lovable Cloud:
- LOVABLE_API_KEY (ya configurado automáticamente)
- UNSPLASH_ACCESS_KEY (necesito configurarlo)
- RESEND_API_KEY (para emails, opcional)

¿Puedes crear estas 5 Edge Functions? Empieza con generate-article que es la más compleja.
```

---

### MENSAJE 2: Después de las Edge Functions, para el Frontend

```
# Fase 4: Frontend - Páginas y Componentes

Ahora crea la estructura del frontend:

## Páginas a crear:

### 1. /auth - Login/Registro
- Formulario de email + password
- Toggle entre login y registro
- Auto-confirm habilitado
- Redirección a /onboarding si es nuevo usuario
- Redirección a / si ya tiene sites

### 2. /onboarding - Wizard para nuevos usuarios
Pasos:
1. Nombre del sitio + sector (select con opciones comunes + "Otro")
2. Ámbito geográfico (local/regional/nacional) + ubicación si aplica
3. Idiomas (español obligatorio, catalán opcional)
4. WordPress opcional (URL + usuario + app password)
5. Resumen y crear

### 3. / - Dashboard principal
- Lista de sites del usuario (máximo según plan)
- Botón "+ Añadir sitio" (deshabilitado si alcanzó límite)
- Para cada site: card con nombre, sector, último artículo
- Botón "Generar artículo" por site
- Botón "Ver artículos" que abre modal/página con historial

### 4. /site/:id - Detalle del sitio
- Editar configuración del site
- Configurar WordPress
- Ver/gestionar artículos generados
- Publicar a WordPress

## Hooks necesarios:

- useAuth() - ya existe, adaptar
- useSites() - CRUD de sites con user_id = auth.uid()
- useArticles(siteId) - artículos de un site
- useWordPressConfig(siteId) - configuración WP
- useWordPressTaxonomies(configId) - taxonomías

## Componentes compartidos:
- SiteCard - card de un sitio
- ArticleCard - card de un artículo
- ArticlePreview - vista previa con español/catalán
- WordPressPublishDialog - diálogo de publicación
- TaxonomySelector - selector de categorías/tags

Empieza creando las páginas /auth y /onboarding, después el dashboard.
```

---

### Resumen del flujo de implementación en Blooglee:

1. **Ya hecho:** Copiar Guidelines al Knowledge del proyecto
2. **Ya hecho:** Mensaje Fase 2 (ejecutará migración SQL + RLS + trigger)
3. **Siguiente:** Mensaje Fase 3 (Edge Functions una a una)
4. **Después:** Mensaje Fase 4 (Frontend)
5. **Final:** Conectar Stripe para planes de suscripción

### Notas importantes:

- El nuevo esquema usa **`site_id`** y **`user_id`** en lugar de `farmacia_id`/`empresa_id`
- Las tablas tienen **RLS basado en `auth.uid() = user_id`**
- El `sector` permite cualquier valor (no solo "farmacia")
- Los límites de sites se controlan por el campo `plan` en `profiles`
