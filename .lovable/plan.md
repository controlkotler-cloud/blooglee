

## Restaurar el formato Markdown del post Mailchimp vs ActiveCampaign

### Problema

En la corrección anterior, el contenido del post se convirtió a HTML puro (`<h2>`, `<p>`, `<ul>`, `<li>`, etc.). Sin embargo, todos los posts del blog de Blooglee se almacenan en **Markdown** (`##`, `**`, `-`, etc.) y el componente `BlogPost.tsx` se encarga de convertirlos a HTML con las clases de estilo corporativas (gradientes, callouts, tablas con bordes violeta, etc.).

Al estar en HTML crudo, el post pierde:
- Los estilos de encabezados con tipografía Sora y espaciado
- Los callouts con gradiente violeta-fucsia (`Clave:`)
- Las tablas con bordes y colores alternos
- El formato de listas con estilo corporativo
- La tabla de contenidos del sidebar (que se genera parseando headings Markdown `##` y `###`)

### Solución

Actualizar el campo `content` del post en la base de datos (tabla `blog_posts`, slug `mailchimp-activecampaign-comparativa-pymes`) reconvirtiendo todo el HTML a Markdown limpio:

- `<h2>...</h2>` a `## ...`
- `<h3>...</h3>` a `### ...`
- `<p>...</p>` a texto plano con salto de línea
- `<ul><li>...</li></ul>` a `- ...`
- `<strong>...</strong>` a `**...**`
- `<a href="...">...</a>` a `[...](...)` 
- Restaurar los callouts `Clave:` al formato `💡 **Clave:** texto`
- Restaurar las tablas al formato Markdown (`| col1 | col2 |`)
- Mantener la capitalización en sentence case ya corregida
- Mantener el contenido limpio sin artefactos de IA

### Archivos afectados

Solo la base de datos: una sentencia `UPDATE` sobre `blog_posts` para reescribir el campo `content` en Markdown.

No se modifica ningún archivo de codigo.

