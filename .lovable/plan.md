

## Lanzar 3 articulos del Hueco 3 (Autonomos)

Se invocara la edge function `generate-blog-blooglee` tres veces con los siguientes parametros:

### Articulo 6
- **forceTopic**: "Marketing de contenidos para autonomos: como competir con grandes empresas"
- **forceThematicCategory**: "Marketing"
- **category**: "Empresas"

### Articulo 7
- **forceTopic**: "El blog como herramienta de captacion para freelancers: guia practica"
- **forceThematicCategory**: "Tutoriales"
- **category**: "Empresas"

### Articulo 8
- **forceTopic**: "Las 5 excusas que los autonomos ponen para no tener blog"
- **forceThematicCategory**: "Marketing"
- **category**: "Empresas"

### Proceso

Las 3 llamadas se lanzaran en paralelo. La generacion tarda entre 30-60 segundos por articulo (puede dar timeout en la respuesta HTTP pero el articulo se genera igualmente en segundo plano gracias a `EdgeRuntime.waitUntil`). Se verificara en base de datos que los 3 posts se han creado correctamente.

### Progreso total

Tras esta tanda: 8 de 13 articulos completados.

