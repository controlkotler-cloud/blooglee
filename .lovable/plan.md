

# Plan: Corregir Generacion Blog + Redisenar UI Audiencias (Estilo Acroxia)

## Parte 1: Corregir Generacion de Blog

### Problema detectado
Hoy 30 de enero solo se genero 1 articulo (empresas), faltando el de "agencias".

### Solucion
Ejecutar manualmente la funcion `generate-blog-blooglee` con `category: "Agencias"` para generar el post faltante.

---

## Parte 2: Redisenar UI del Blog (Estilo Acroxia)

### Comportamiento deseado

| Estado | Que se muestra |
|--------|----------------|
| `/blog` (sin filtro) | Header generico + dos cards grandes de audiencia |
| `/blog?audiencia=empresas` | Header contextual "Para empresas" + breadcrumb + filtros categoria + articulos |
| `/blog?audiencia=agencias` | Header contextual "Para agencias" + breadcrumb + filtros categoria + articulos |

### Cambios en archivos

#### 1. BlogIndex.tsx

- Sincronizar estado `selectedAudience` con query param `?audiencia=`
- Renderizar header condicional segun audiencia seleccionada
- Agregar breadcrumb cuando hay audiencia activa
- Agregar enlace "Cambiar perfil" que vuelve a `/blog`
- Ocultar AudienceCards cuando hay audiencia seleccionada

#### 2. AudienceCards.tsx

- Mantener las cards grandes actuales (solo se muestran en vista inicial)
- Agregar navegacion con query params al hacer clic

### Estructura del nuevo header contextual

```
BLOG - AGENCIAS                                    <-- Cambiar perfil

Guias para agencias
Escalabilidad, gestion multi-cliente, workflows...

Inicio / Blog / Agencias                           <-- Breadcrumb

[Todos] [SEO] [Marketing] [Tutoriales] ...         <-- Filtros categoria

[Grid de articulos]
```

### Detalles tecnicos

El componente BlogIndex.tsx se modificara para:

1. Leer query param `audiencia` de la URL con `useSearchParams`
2. Sincronizar con el estado local
3. Renderizar header contextual cuando `audiencia` no es vacio
4. El header contextual incluira:
   - Badge "BLOG - EMPRESAS" o "BLOG - AGENCIAS"
   - Titulo grande con gradiente
   - Descripcion de la audiencia
   - Breadcrumb con navegacion
   - Enlace "Cambiar perfil" que navega a `/blog`

### AudienceCards.tsx

Se modificara para:
- Usar Link con `to="/blog?audiencia=empresas"` en lugar de `onClick`
- Las cards solo se renderizaran cuando no hay audiencia seleccionada

### Textos del header contextual

| Audiencia | Titulo | Descripcion |
|-----------|--------|-------------|
| empresas | Guias para empresas | Marketing digital, SEO, automatizacion y estrategias para hacer crecer tu negocio. |
| agencias | Guias para agencias | Escalabilidad, gestion multi-cliente, workflows y herramientas para equipos. |

### Flujo de navegacion

1. Usuario llega a `/blog` - ve header generico y 2 cards grandes
2. Click en "Para empresas" - navega a `/blog?audiencia=empresas`
3. Ve header contextual con titulo "Guias para empresas"
4. Puede filtrar por categoria (SEO, Marketing, etc)
5. Click en "Cambiar perfil" - vuelve a `/blog`

---

## Orden de implementacion

1. Ejecutar generacion manual del post de agencias
2. Modificar BlogIndex.tsx para usar query params
3. Actualizar AudienceCards.tsx para navegacion con Links
4. Crear componente AudienceHeader.tsx para el header contextual
5. Agregar breadcrumb al layout
6. Probar navegacion completa

