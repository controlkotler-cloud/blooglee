
## Plan: Crear Todas las Paginas y Componentes SaaS

### Resumen

Creare 6 paginas nuevas y 5 componentes nuevos para completar la experiencia SaaS.

---

## PAGINAS (src/pages/)

### 1. SiteDetail.tsx - Pagina principal del sitio (/site/:id)

- Layout con header mostrando nombre del sitio y badges
- Tabs: "Articulos" | "Configuracion" | "WordPress"
- Estadisticas rapidas: articulos generados, ultimo articulo, estado WP
- Boton principal "Generar articulo"
- Breadcrumb: Dashboard > [Nombre sitio]
- Usa: useSites, useArticlesSaas, useWordPressConfig

### 2. SiteArticles.tsx - Lista de articulos de un sitio

- Componente embebido en SiteDetail (tab Articulos)
- Grid de ArticleCard con todos los articulos del sitio
- Filtros por mes/anio
- Selector de idioma para previsualizar (espanol/catalan)
- Acciones: ver, copiar, eliminar, publicar en WP
- Estado vacio con CTA para generar primer articulo

### 3. SiteSettings.tsx - Configuracion del sitio

- Componente embebido en SiteDetail (tab Configuracion)
- Formulario editable con campos del sitio:
  - Nombre, Sector, Ubicacion
  - Alcance geografico (local/regional/nacional/internacional)
  - Idiomas (checkbox espanol/catalan)
  - Frecuencia de publicacion
  - Tema personalizado
  - Auto-generar activado/desactivado
- Boton eliminar sitio con confirmacion
- Usa: useUpdateSite, useDeleteSite

### 4. AccountSettings.tsx - Configuracion de cuenta (/account)

- Informacion del perfil (email, plan actual)
- Estadisticas de uso: sitios usados/limite
- Seccion de seguridad (cambiar contrasena - link a Supabase)
- Zona de peligro: eliminar cuenta (placeholder)
- Usa: useProfile, useAuth

### 5. BillingPage.tsx - Facturacion (/billing)

- Plan actual con badge visual
- Comparativa de planes (Free, Starter, Pro, Agency)
- Limite de sitios actual vs usado
- Botones "Actualizar plan" (placeholder para Stripe)
- Historial de facturacion (placeholder)
- Usa: useProfile

### 6. HelpPage.tsx - Ayuda (/help)

- FAQ acordeon con preguntas frecuentes
- Como generar articulos
- Como conectar WordPress
- Como funciona la facturacion
- Enlace de contacto/soporte
- Componente estatico

---

## COMPONENTES (src/components/saas/)

### 1. ArticleCard.tsx

- Tarjeta compacta de articulo
- Muestra: titulo, fecha, imagen thumbnail
- Badges: idioma disponible, estado (borrador/publicado)
- Menu de acciones: ver, copiar, publicar, eliminar
- Props: article, onView, onCopy, onPublish, onDelete

### 2. ArticlePreviewDialog.tsx

- Dialog modal para previsualizar articulo completo
- Tabs: Espanol | Catalan
- Muestra: titulo, meta description, contenido HTML
- Imagen destacada con creditos
- Botones: Copiar, Publicar en WP, Cerrar
- Usa el patron de cierre (o) => !o && onClose()

### 3. WordPressConfigForm.tsx

- Formulario para configurar WordPress
- Campos: URL del sitio, Usuario WP, App Password
- Validacion con zod
- Boton probar conexion (placeholder)
- Boton guardar/actualizar
- Usa: useUpsertWordPressConfig

### 4. PlanBadge.tsx

- Badge visual del plan del usuario
- Colores por plan: Free (gris), Starter (azul), Pro (violeta), Agency (dorado)
- Icono Crown para planes de pago
- Props: plan, size (sm/md/lg)

### 5. UsageStats.tsx

- Componente de estadisticas de uso
- Barra de progreso: sitios usados/limite
- Articulos generados este mes
- Proxima generacion automatica
- Props: profile, sites, articles

---

## ACTUALIZACION DE RUTAS (App.tsx)

Agregar nuevas rutas protegidas:

```tsx
<Route path="/site/:id" element={<ProtectedRoute><SiteDetail /></ProtectedRoute>} />
<Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
<Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
<Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
```

---

## ACTUALIZACION SaasDashboard.tsx

- Agregar navegacion en header a /account, /billing, /help
- Hacer que SiteCard navegue a /site/:id al hacer click
- Conectar hasWordPress con useWordPressConfig real

---

## ESTRUCTURA DE ARCHIVOS FINAL

```
src/
├── pages/
│   ├── SiteDetail.tsx       (NUEVO)
│   ├── AccountSettings.tsx  (NUEVO)
│   ├── BillingPage.tsx      (NUEVO)
│   └── HelpPage.tsx         (NUEVO)
├── components/saas/
│   ├── ArticleCard.tsx           (NUEVO)
│   ├── ArticlePreviewDialog.tsx  (NUEVO)
│   ├── WordPressConfigForm.tsx   (NUEVO)
│   ├── PlanBadge.tsx             (NUEVO)
│   ├── UsageStats.tsx            (NUEVO)
│   ├── SiteArticles.tsx          (NUEVO)
│   ├── SiteSettings.tsx          (NUEVO)
│   ├── BloogleeLogo.tsx          (existente)
│   ├── SiteCard.tsx              (existente)
│   ├── LiquidBlobs.tsx           (existente)
│   └── ProductMockup.tsx         (existente)
```

---

## ORDEN DE IMPLEMENTACION

1. Componentes base: PlanBadge, UsageStats, ArticleCard
2. Formularios: WordPressConfigForm
3. Dialogs: ArticlePreviewDialog
4. Componentes de sitio: SiteArticles, SiteSettings
5. Paginas principales: SiteDetail, AccountSettings, BillingPage, HelpPage
6. Actualizar App.tsx con rutas
7. Actualizar SaasDashboard.tsx con navegacion

---

## NOTAS

- Todos los componentes usan los hooks existentes (useSites, useArticlesSaas, useWordPressConfig, useProfile)
- No se crean nuevas tablas ni edge functions (eso requiere aprobacion)
- Los botones de Stripe seran placeholders hasta que se active la integracion
- Se mantiene el patron de cierre de dialogs existente
