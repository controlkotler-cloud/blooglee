

## Plan: Crear Páginas Públicas de Marketing y Legal

### Resumen

Creare 7 paginas publicas nuevas para completar el sitio web de Blooglee, incluyendo blog, contacto, SEO y textos legales.

---

## PAGINAS PUBLICAS (src/pages/)

### 1. ContactPage.tsx - Pagina de contacto (/contact)

- Header con titulo "Contacto" y subtitulo
- Formulario de contacto con campos:
  - Nombre (requerido)
  - Email (requerido, validado)
  - Asunto (select: Informacion general, Soporte tecnico, Facturacion, Otro)
  - Mensaje (textarea, requerido)
- Informacion de contacto lateral:
  - Email: info@blooglee.com
  - Placeholder para direccion (a completar despues)
- Validacion con zod
- Toast de confirmacion (sin backend real por ahora)
- Redes sociales (placeholders)

### 2. BlogIndex.tsx - Listado del blog (/blog)

- Header con titulo "Blog" y descripcion SEO
- Grid de articulos de ejemplo (contenido estatico inicial)
- Cada tarjeta muestra: imagen, titulo, extracto, fecha, categoria
- Filtros por categoria (placeholder)
- Paginacion (placeholder)
- Sidebar con categorias populares y newsletter signup
- CTA al final para probar Blooglee

### 3. BlogPost.tsx - Articulo individual (/blog/:slug)

- Layout de articulo con imagen destacada
- Titulo, fecha, autor, tiempo de lectura
- Contenido del articulo (markdown renderizado)
- Tabla de contenidos lateral (sticky)
- Articulos relacionados al final
- CTA para probar Blooglee
- Compartir en redes sociales
- Datos estaticos de ejemplo inicialmente

### 4. FeaturesPage.tsx - Pagina de caracteristicas (/features)

- Header hero con propuesta de valor
- Seccion detallada de cada caracteristica:
  - Generacion automatica con IA
  - Publicacion directa en WordPress
  - SEO optimizado automaticamente
  - Multiples idiomas (Espanol/Catalan)
  - Imagenes con creditos incluidos
  - Programacion de contenido
- Cada seccion con icono, titulo, descripcion e imagen/ilustracion
- CTA al final
- Comparativa con hacerlo manualmente

### 5. TermsPage.tsx - Terminos y condiciones (/terms)

- Header legal
- Contenido estatico con secciones:
  - Definiciones
  - Uso del servicio
  - Registro y cuenta
  - Planes y facturacion
  - Propiedad intelectual
  - Limitacion de responsabilidad
  - Modificaciones
  - Ley aplicable
- Ultima actualizacion
- Link a privacidad
- Email de contacto: info@blooglee.com

### 6. PrivacyPage.tsx - Politica de privacidad (/privacy)

- Header legal
- Contenido estatico con secciones:
  - Datos que recopilamos
  - Como usamos los datos
  - Cookies
  - Terceros (WordPress, servicios de IA)
  - Derechos del usuario
  - Seguridad
  - Retencion de datos
  - Cambios en la politica
- Ultima actualizacion
- Contacto: info@blooglee.com

### 7. CookiesPage.tsx - Politica de cookies (/cookies)

- Header legal
- Que son las cookies
- Tipos de cookies que usamos:
  - Esenciales (sesion, autenticacion)
  - Analiticas (placeholder)
  - Funcionales
- Como gestionar cookies
- Tabla de cookies
- Link a privacidad

---

## COMPONENTES REUTILIZABLES (src/components/marketing/)

### 1. PublicLayout.tsx

- Wrapper para paginas publicas
- Incluye navbar y footer consistentes
- Props: children, showCTA (boolean)

### 2. PublicNavbar.tsx

- Navbar para paginas publicas (diferente al dashboard)
- Logo Blooglee
- Links: Caracteristicas, Precios, Blog, Contacto
- Botones: Iniciar sesion, Empezar gratis
- Menu hamburguesa en movil

### 3. PublicFooter.tsx

- Footer reutilizable
- Logo
- Links organizados: Producto, Recursos, Legal, Contacto
- Newsletter signup (placeholder)
- Redes sociales (placeholder)
- Copyright

### 4. BlogCard.tsx

- Tarjeta de articulo de blog
- Imagen, titulo, extracto, fecha, categoria
- Hover effects
- Link al articulo

### 5. LegalLayout.tsx

- Layout especifico para paginas legales
- Sidebar con navegacion entre secciones
- Tabla de contenidos sticky
- Ultima actualizacion

---

## DATOS ESTATICOS INICIALES

### Articulos de blog de ejemplo (src/data/blogPosts.ts)

3-5 articulos estaticos sobre:
- "Como mejorar el SEO de tu blog con contenido automatizado"
- "5 beneficios de automatizar la creacion de contenido"
- "Guia: Conectar WordPress con Blooglee"
- "Por que el contenido regular mejora tu posicionamiento"

---

## ACTUALIZACION DE RUTAS (App.tsx)

```tsx
// Rutas publicas nuevas
<Route path="/contact" element={<ContactPage />} />
<Route path="/features" element={<FeaturesPage />} />
<Route path="/blog" element={<BlogIndex />} />
<Route path="/blog/:slug" element={<BlogPost />} />
<Route path="/terms" element={<TermsPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/cookies" element={<CookiesPage />} />
```

---

## ACTUALIZACION Landing.tsx

- Cambiar enlace de contacto de mailto a /contact
- Actualizar footer con nuevos links
- Anadir link a /features en la navegacion

---

## ESTRUCTURA DE ARCHIVOS FINAL

```
src/
├── pages/
│   ├── ContactPage.tsx      (NUEVO)
│   ├── FeaturesPage.tsx     (NUEVO)
│   ├── BlogIndex.tsx        (NUEVO)
│   ├── BlogPost.tsx         (NUEVO)
│   ├── TermsPage.tsx        (NUEVO)
│   ├── PrivacyPage.tsx      (NUEVO)
│   └── CookiesPage.tsx      (NUEVO)
├── components/marketing/
│   ├── PublicLayout.tsx     (NUEVO)
│   ├── PublicNavbar.tsx     (NUEVO)
│   ├── PublicFooter.tsx     (NUEVO)
│   ├── BlogCard.tsx         (NUEVO)
│   └── LegalLayout.tsx      (NUEVO)
├── data/
│   └── blogPosts.ts         (NUEVO)
```

---

## ORDEN DE IMPLEMENTACION

1. Componentes base: PublicLayout, PublicNavbar, PublicFooter
2. Paginas legales: TermsPage, PrivacyPage, CookiesPage
3. Pagina de contacto: ContactPage
4. Pagina de caracteristicas: FeaturesPage
5. Blog: BlogCard, blogPosts.ts, BlogIndex, BlogPost
6. Actualizar App.tsx con rutas
7. Actualizar Landing.tsx con nuevos enlaces

---

## NOTAS

- Todo el contenido legal es placeholder profesional (el usuario debera revisarlo con un abogado)
- El blog es estatico inicialmente, sin CMS
- El formulario de contacto muestra toast pero no envia emails (requiere backend adicional)
- Se mantiene la estetica "liquid blobs" y Aurora gradient en las paginas publicas
- Email de contacto: info@blooglee.com

