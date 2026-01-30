

# Plan: Generar 11 PDFs de Lead Magnets y Configurar Storage

## Resumen

Voy a crear el sistema completo de PDFs descargables para los lead magnets, excluyendo el "Calendario Editorial 2026 - Autonomos" como solicitaste.

## PDFs a Generar (11 de 12)

| # | Recurso | Archivo |
|---|---------|---------|
| 1 | Calendario Editorial 2026 (General) | `calendario-editorial-2026.html` |
| 2 | Calendario Editorial 2026 - Clinicas | `calendario-editorial-clinicas-2026.html` |
| 3 | Calendario Editorial 2026 - Agencias | `calendario-editorial-agencias-2026.html` |
| 4 | Calendario Editorial 2026 - Ecommerce | `calendario-editorial-ecommerce-2026.html` |
| 5 | 50 Ideas de Posts (General) | `50-ideas-posts-blog.html` |
| 6 | 50 Ideas de Posts - Clinicas | `50-ideas-posts-clinicas.html` |
| 7 | 50 Ideas de Posts - Agencias | `50-ideas-posts-agencias.html` |
| 8 | 50 Ideas de Posts - Ecommerce | `50-ideas-posts-ecommerce.html` |
| 9 | 50 Ideas de Posts - Autonomos | `50-ideas-posts-autonomos.html` |
| 10 | Checklist SEO On-Page | `checklist-seo-on-page.html` |
| 11 | Plantilla Tareas Redactar | `plantilla-tareas-redactar.html` |

## Estrategia de Implementacion

Los PDFs se generaran como archivos HTML estaticos en `/public/resources/` con:
- Estilos inline (colores Blooglee: violeta, fucsia, naranja)
- Logo de Blooglee
- Tipografias Sora (titulos) e Inter (cuerpo) via Google Fonts
- Optimizados para imprimir a PDF desde el navegador

## Contenido Detallado por PDF

### Calendarios Editoriales (5 archivos)

Cada calendario incluira:
- Tabla mes a mes con fechas clave del sector
- Temas sugeridos por temporada
- Iconos y colores por tipo de fecha
- Notas con tips de optimizacion

### Listas de 50 Ideas (5 archivos)

Cada lista incluira:
- 50 ideas organizadas en 5 categorias de 10
- Cada idea con titulo + descripcion breve
- Indicador de dificultad (facil/medio/avanzado)
- Tips de SEO para cada categoria

### Checklist SEO On-Page

25 puntos verificables organizados en:
- Contenido (8 puntos)
- Tecnico (8 puntos)
- Imagenes (5 puntos)
- Schema/Social (4 puntos)

### Plantilla Tareas Redactar

Tabla comparativa que muestra:
- Tareas manuales vs automatizadas
- Tiempo por tarea
- Calculo de ahorro mensual/anual
- CTA para probar Blooglee

## Seccion Tecnica

### Paso 1: Crear carpeta de recursos

Crear `/public/resources/` con los 11 archivos HTML.

### Paso 2: Actualizar leadMagnets.ts

Cambiar `fileName` por rutas que apunten a `/resources/[archivo].html`.

### Paso 3: Actualizar LeadMagnetModal

Modificar `handleDownload` para abrir los HTML en nueva pestana (el usuario puede imprimir a PDF).

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `public/resources/calendario-editorial-2026.html` | Calendario general |
| `public/resources/calendario-editorial-clinicas-2026.html` | Calendario clinicas |
| `public/resources/calendario-editorial-agencias-2026.html` | Calendario agencias |
| `public/resources/calendario-editorial-ecommerce-2026.html` | Calendario ecommerce |
| `public/resources/50-ideas-posts-blog.html` | 50 ideas general |
| `public/resources/50-ideas-posts-clinicas.html` | 50 ideas clinicas |
| `public/resources/50-ideas-posts-agencias.html` | 50 ideas agencias |
| `public/resources/50-ideas-posts-ecommerce.html` | 50 ideas ecommerce |
| `public/resources/50-ideas-posts-autonomos.html` | 50 ideas autonomos |
| `public/resources/checklist-seo-on-page.html` | Checklist 25 puntos |
| `public/resources/plantilla-tareas-redactar.html` | Plantilla ROI |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/data/leadMagnets.ts` | Actualizar fileName a rutas .html |
| `src/components/marketing/LeadMagnetModal.tsx` | Modificar handleDownload para abrir en nueva pestana |

## Resultado

- 11 recursos descargables con contenido real y util
- Identidad visual Blooglee en todos los documentos
- Sistema de descarga funcional tras suscripcion
- Los usuarios pueden guardar como PDF desde el navegador

