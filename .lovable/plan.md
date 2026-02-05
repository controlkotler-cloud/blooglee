

## Plan: Mejorar instrucciones de enlaces externos en prompts

### Problema identificado

El LLM tiene dos comportamientos:
1. A veces acierta con URLs específicas reales (ej: `blog.hootsuite.com/best-time-to-post-on-instagram/`)
2. Otras veces inventa rutas que no existen (ej: `nielsen.com/es/insights/2023/...`)

### Solucion

Modificar las instrucciones del prompt para que el LLM:
- Si conoce la URL exacta de un recurso, la incluya
- Si no esta seguro de la ruta especifica, enlace a la HOME del dominio de la fuente
- NO hardcodear dominios para no limitar la variedad

### Cambio en prompts

**Instruccion actualizada para enlaces:**

```
Incluye 2-3 enlaces externos a fuentes de autoridad cuando menciones estadísticas, estudios o informes.
- Si conoces la URL exacta del recurso (artículo, estudio, página específica), inclúyela.
- Si NO estás seguro de la URL específica, enlaza a la página principal del dominio de esa fuente.
  Ejemplo: en lugar de inventar "nielsen.com/es/insights/2023/titulo-inventado", usa "nielsen.com"
- El texto del enlace debe ser descriptivo: "según Nielsen" con enlace a nielsen.com
```

### Archivos a modificar

| Ubicacion | Cambio |
|-----------|--------|
| Tabla `prompts` - key `saas.article.system` | Actualizar instrucciones de enlaces |
| Tabla `prompts` - key `saas.article.user` | Verificar coherencia (si aplica) |
| `generate-article/index.ts` | Actualizar prompt hardcodeado para MKPro farmacias |
| `generate-article-empresa/index.ts` | Actualizar prompt hardcodeado para MKPro empresas |

### Flujo resultante

```text
1. LLM genera articulo con enlaces
   - URLs conocidas exactas → las incluye tal cual
   - URLs dudosas → pone solo la home del dominio

2. Sistema de verificacion (ya implementado)
   - Verifica cada enlace con HEAD request
   - Elimina los que devuelvan 404
   - Las homes de dominios conocidos casi nunca fallan

3. Articulo guardado con enlaces funcionales
```

### Ejemplo practico

**Antes (LLM inventa ruta):**
```html
Según un <a href="https://www.nielsen.com/es/insights/2023/comercio-electronico">estudio de Nielsen</a>...
```
→ Da 404 → Se elimina enlace

**Despues (LLM usa home si no esta seguro):**
```html
Según un estudio de <a href="https://www.nielsen.com">Nielsen</a>...
```
→ Funciona → Se mantiene

### Nota tecnica

La verificacion de enlaces que implementamos sigue siendo util como red de seguridad: si alguna home de dominio cambia o falla, se eliminara automaticamente.

