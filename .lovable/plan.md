

## Limpiar encabezados duplicados y texto residual en posts del blog

### Problema detectado

He revisado los 43 posts publicados y encontrado **3 tipos de problemas**:

1. **14 posts** empiezan con `# Título` (H1 que repite el título del artículo). Esto es malo para SEO porque el título ya se muestra como H1 en la cabecera de la pagina, y tener dos H1 confunde a Google.

2. **6 posts** empiezan con `Título: nombre del articulo` - texto residual que la IA dejo como "meta-dato" visible en el contenido.

3. **1 post** ("Las 5 excusas que los autonomos ponen para no tener blog") empieza con texto meta de la IA: "Absolutamente! Aqui tienes el articulo del blog epico..." seguido de `---`. Este texto no deberia ser visible.

### Solucion propuesta

Crear una **edge function** `clean-blog-headers` que haga una limpieza automatica de estos 3 patrones en todos los posts afectados, sin tocar el contenido real del articulo.

### Reglas de limpieza

1. Si el contenido empieza con `# Titulo...\n\n`, eliminar esa primera linea (el H1 duplicado)
2. Si el contenido empieza con `Título: ...\n\n` (una o mas veces), eliminar esas lineas
3. Si el contenido empieza con texto meta de IA (como "Absolutamente! Aqui tienes...") seguido de `---`, eliminar todo hasta despues del separador
4. Eliminar lineas vacias sobrantes al principio del contenido resultante

### Prevencion futura

Tambien se modificara la edge function `generate-blog-blooglee` para anadir un paso de post-procesado que limpie automaticamente estos patrones antes de guardar el articulo. Asi no volvera a ocurrir.

### Seccion tecnica

**Archivos nuevos:**
- `supabase/functions/clean-blog-headers/index.ts` - Edge function que:
  - Lee todos los posts publicados
  - Aplica las reglas de limpieza con regex
  - Actualiza solo los posts que cambian
  - Devuelve un resumen de posts corregidos

**Archivos modificados:**
- `supabase/functions/generate-blog-blooglee/index.ts` - Anadir funcion `cleanGeneratedContent()` que se aplica al contenido justo antes de insertarlo en la base de datos

**Ejecucion:** Tras desplegar, se invocara la funcion una vez para limpiar los posts existentes. La prevencion futura es automatica.
