

## Lanzar 3 articulos del Hueco 4 (Tendencias)

Se invocara la edge function `generate-blog-blooglee` tres veces con los siguientes parametros:

### Articulo 9
- **forceTopic**: "Google y el contenido IA: que dice realmente Google"
- **forceThematicCategory**: "Tendencias"
- **category**: "Empresas"

### Articulo 10
- **forceTopic**: "El futuro del SEO: AEO, SGE y como preparar tu web para la busqueda con IA"
- **forceThematicCategory**: "Tendencias"
- **category**: "Empresas"

### Articulo 11
- **forceTopic**: "Content marketing en Espana: datos y tendencias del mercado hispanohablante"
- **forceThematicCategory**: "Tendencias"
- **category**: "Empresas"

### Proceso

Las 3 llamadas se lanzaran en paralelo. La generacion tarda entre 30-60 segundos por articulo (puede dar timeout HTTP pero el articulo se genera igualmente en segundo plano gracias a `EdgeRuntime.waitUntil`). Se verificara en base de datos que los 3 posts se han creado correctamente.

### Progreso total

Tras esta tanda: 11 de 13 articulos completados. Quedarian pendientes los 2 articulos en catalan del Hueco 5.

