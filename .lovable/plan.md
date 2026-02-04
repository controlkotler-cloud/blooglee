
## Plan: Mejoras SEO para artículos de sites (Yoast verde)

### Problemas detectados y soluciones

#### 1. H1 duplicado en el artículo

**Problema actual**: El contenido HTML generado empieza con `<h1>Título</h1>`, pero WordPress también inserta el `title` del post como H1 en la plantilla del tema. Resultado: dos H1 identicos.

**Solución**: Modificar el prompt de generacion para que el contenido empiece con un H2 diferente al titulo, y eliminar el H1 del HTML.

**Archivos a modificar**:
- Prompt `saas.article.system` en la base de datos
- Prompt `saas.article.user` en la base de datos

**Cambios en el prompt**:
```text
REGLAS DE ESTRUCTURA:
- El contenido HTML debe empezar con un <h2> introductorio DIFERENTE al titulo H1
- NO incluyas <h1> en el contenido - WordPress lo añade automaticamente desde el titulo
- El H2 inicial debe ser un gancho o resumen del articulo, NO una repeticion del titulo
```

---

#### 2. Enlace interno a la Home cuando se menciona la marca

**Problema actual**: Solo se añade un enlace al blog al final del articulo. Google puede interpretar que el blog es la pagina mas importante.

**Solucion**: Añadir logica para detectar menciones al nombre de la empresa/marca en el contenido y convertir la primera mencion en un enlace a la home.

**Archivos a modificar**:
- `supabase/functions/generate-article-saas/index.ts` (post-procesado del contenido)

**Logica a implementar**:
```javascript
// Despues de generar el articulo, buscar la primera mencion del nombre del site
// y convertirla en un enlace a la home

function addHomeLinkToContent(content: string, siteName: string, blogUrl: string): string {
  // Derivar home URL del blog URL (quitar /blog si existe)
  const homeUrl = blogUrl.replace(/\/blog\/?$/, '') || blogUrl.replace(/\/[^\/]+\/?$/, '');
  
  // Buscar primera mencion del nombre (case insensitive)
  const regex = new RegExp(`\\b(${escapeRegex(siteName)})\\b`, 'i');
  const match = content.match(regex);
  
  if (match) {
    // Reemplazar solo la primera ocurrencia
    return content.replace(regex, `<a href="${homeUrl}">${match[1]}</a>`);
  }
  return content;
}
```

---

#### 3. Meta descripcion no se publica en Yoast

**Problema actual**: El codigo envia `meta._yoast_wpseo_metadesc` pero puede que el endpoint de WordPress no acepte este formato.

**Solucion**: Verificar el formato correcto para Yoast y tambien limitar a 160 caracteres.

**Archivos a modificar**:
- `supabase/functions/publish-to-wordpress-saas/index.ts`
- Prompt `saas.article.system` (asegurar max 160 chars)

**Cambios en el edge function**:
```javascript
// Formato correcto para Yoast SEO 
if (body.meta_description) {
  // Asegurar maximo 160 caracteres
  const metaDesc = body.meta_description.substring(0, 160);
  
  postData.meta = {
    // Yoast meta description
    _yoast_wpseo_metadesc: metaDesc,
  };
}
```

---

#### 4. Meta titulo (SEO title) separado del H1

**Problema actual**: Solo se genera `title` que se usa para H1 y para meta title. Yoast permite un SEO title diferente.

**Solucion**: Añadir campo `seo_title` al JSON generado con maximo 60 caracteres optimizado para CTR.

**Archivos a modificar**:
- Prompt `saas.article.user` en la base de datos
- `supabase/functions/publish-to-wordpress-saas/index.ts`
- Tipos en `useArticlesSaas.ts`

**Nuevo formato JSON**:
```json
{
  "title": "Titulo H1 del articulo (puede ser mas largo)",
  "seo_title": "Meta titulo optimizado para Google (max 60 chars)",
  "meta_description": "Meta descripcion 150-160 caracteres",
  "slug": "url-amigable",
  "content": "<h2>Subtitulo inicial</h2><p>Contenido...</p>"
}
```

**Envio a WordPress**:
```javascript
postData.meta = {
  _yoast_wpseo_metadesc: metaDesc,
  _yoast_wpseo_title: body.seo_title || body.title
};
```

---

#### 5. Optimizaciones adicionales para Yoast SEO (semaforo verde)

Yoast evalua estos factores principales:

| Factor | Estado actual | Mejora propuesta |
|--------|---------------|------------------|
| Meta descripcion | No se publica | Corregir envio a Yoast |
| SEO title | Usa H1 | Generar separado |
| Keyword en titulo | Variable | Añadir keyword focus al prompt |
| Keyword en H2 | Variable | Instruir en prompt |
| Enlaces internos | Solo al final | Enlace a home en mencion marca |
| Enlaces externos | Ninguno | Añadir 1-2 enlaces a fuentes |
| Alt text imagenes | Solo titulo | Ya se envia, verificar |
| Longitud contenido | ~800-2500 | OK |
| Parrafos cortos | Variable | Instruir en prompt |

**Mejoras en el prompt del sistema**:
```text
OPTIMIZACION SEO (Yoast):
- Incluye la keyword principal en el primer parrafo
- Usa la keyword en al menos un H2
- Mantén los parrafos entre 2-4 oraciones para mejor legibilidad
- Incluye 1-2 enlaces externos a fuentes autoritativas del sector (ej: estudios, estadisticas)
- El primer H2 debe ser diferente al titulo pero relacionado tematicamente
```

---

### Resumen de archivos a modificar

| Archivo | Cambios |
|---------|---------|
| Base de datos: `prompts` (key: saas.article.system) | Añadir reglas H1/H2, SEO Yoast, parrafos cortos, enlaces externos |
| Base de datos: `prompts` (key: saas.article.user) | Añadir campo `seo_title` al JSON |
| `supabase/functions/generate-article-saas/index.ts` | Añadir funcion para insertar enlace a home en primera mencion de marca |
| `supabase/functions/publish-to-wordpress-saas/index.ts` | Enviar `_yoast_wpseo_title` ademas de metadesc |
| `src/hooks/useArticlesSaas.ts` | Añadir `seo_title` al tipo `ArticleContent` |

### Seccion tecnica: Flujo de cambios

```text
1. GENERACION (generate-article-saas)
   +-- Prompt pide: NO <h1>, empezar con <h2>, generar seo_title
   +-- Post-proceso: insertar enlace a home en primera mencion de marca
   +-- Guardar: content_spanish incluye seo_title

2. PUBLICACION (publish-to-wordpress-saas)
   +-- Leer seo_title del content
   +-- Enviar a WP REST API:
       - title: titulo H1
       - content: HTML sin H1, con enlace a home
       - meta._yoast_wpseo_title: seo_title
       - meta._yoast_wpseo_metadesc: meta_description (max 160)

3. RESULTADO EN WORDPRESS
   - Yoast: semaforo verde (meta title, meta desc, keyword, enlaces)
   - HTML: solo un H1 (el del tema), contenido empieza con H2
```

### Resultado esperado

- Un solo H1 por articulo (el que inserta WordPress)
- H2 introductorio diferente al titulo
- Meta descripcion visible en Yoast (max 160 chars)
- SEO title separado del H1 (max 60 chars)
- Enlace interno a la home cuando se menciona la marca
- 1-2 enlaces externos a fuentes del sector
- Parrafos cortos para mejor legibilidad
- Semaforo Yoast en verde o naranja (mejora significativa desde rojo)
