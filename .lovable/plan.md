

## Reemplazar el logo con el PNG transparente original

### Problema

El logo actual (`src/assets/blooglee-logo.png` y `public/favicon.png`) tiene fondo blanco incrustado, causando un cuadrado blanco en fondos con color o gradientes.

### Solucion

Copiar el PNG transparente que has subido a las dos ubicaciones del proyecto:

1. **`src/assets/blooglee-logo.png`** - Usado por `BloogleeLogo` y `ProductMockup` en toda la app (navbar, footer, auth, dashboard, etc.)
2. **`public/favicon.png`** - Favicon del navegador y apple-touch-icon

No hace falta modificar ningun codigo ya que ambos archivos mantienen el mismo nombre y las mismas rutas de importacion.

