

## Eliminar imagenes del bucket al borrar articulos + limpiar huerfanas

### Problema

Cuando eliminas un articulo desde el dashboard, solo se borra la fila de la base de datos. La imagen asociada queda en el almacenamiento ocupando espacio innecesariamente. Con el tiempo esto acumula imagenes huerfanas.

### Solucion en 2 partes

### Parte 1: Eliminar imagen automaticamente al borrar un articulo

Modificar `useDeleteArticleSaas` en `src/hooks/useArticlesSaas.ts` para que:

1. Primero consulte el `image_url` del articulo antes de borrarlo
2. Si tiene imagen en el bucket `article-images`, extraiga la ruta del archivo desde la URL
3. Elimine el archivo del bucket con `supabase.storage.from('article-images').remove([path])`
4. Luego borre la fila del articulo como ya hace

### Parte 2: Limpiar imagenes huerfanas existentes

Crear una Edge Function `cleanup-orphan-images` que:

1. Liste todos los archivos en el bucket `article-images`
2. Recopile todas las `image_url` de las 5 tablas que usan el bucket: `articles`, `articulos`, `articulos_empresas`, `blog_posts`, `social_content`
3. Compare y elimine los archivos que no estan referenciados por ninguna tabla
4. Excluya archivos especiales como `blooglee-avatar.png`
5. Devuelva un resumen de cuantos archivos se eliminaron

Esta funcion se ejecutara una sola vez manualmente para limpiar lo acumulado.

### Detalles tecnicos

**Archivo:** `src/hooks/useArticlesSaas.ts` - funcion `useDeleteArticleSaas`

Cambiar `mutationFn` para:
```
1. Obtener image_url del articulo con SELECT
2. Si image_url contiene "article-images", extraer path relativo
3. Llamar supabase.storage.from('article-images').remove([path])
4. Borrar fila con DELETE
```

**Nuevo archivo:** `supabase/functions/cleanup-orphan-images/index.ts`

Edge Function que:
- Lista archivos recursivamente en el bucket
- Consulta todas las image_url de las 5 tablas
- Elimina archivos no referenciados
- Retorna resumen: `{ deleted: number, kept: number, errors: string[] }`

### Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useArticlesSaas.ts` | Eliminar imagen del bucket antes de borrar articulo |
| `supabase/functions/cleanup-orphan-images/index.ts` | Nueva funcion para limpieza de huerfanas |

