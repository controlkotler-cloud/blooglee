

## Plan: Actualizar el imagotipo de Blooglee en toda la web

### Problema actual
El favicon en `public/favicon.png` es el de Lovable (no el de Blooglee), y necesitas que el logo que has subido (la pluma con estrellas y gradiente violeta-fucsia) aparezca en todas partes.

### Archivos a actualizar

| Ubicación | Uso actual | Acción |
|-----------|------------|--------|
| `src/assets/blooglee-logo.png` | Componente BloogleeLogo (navbar, footer, auth, dashboard) | Reemplazar con el nuevo logo |
| `public/favicon.png` | Favicon en pestañas del navegador + SEO schemas | Reemplazar con el nuevo logo |
| `public/favicon.ico` | Favicon para navegadores legacy | Reemplazar con el nuevo logo |

### Lugares donde se mostrará el nuevo logo

El componente `BloogleeLogo` se usa en **13 archivos**:

1. **PublicNavbar.tsx** - Navbar de todas las páginas públicas
2. **PublicFooter.tsx** - Footer de todas las páginas públicas
3. **Auth.tsx** - Página de login/registro
4. **Waitlist.tsx** - Página de lista de espera
5. **Onboarding.tsx** - Onboarding de nuevos usuarios
6. **SaasDashboard.tsx** - Dashboard principal
7. **SiteDetail.tsx** - Detalle de sitio
8. **AccountSettings.tsx** - Configuración de cuenta
9. **HelpPage.tsx** - Página de ayuda
10. **BillingPage.tsx** - Página de facturación
11. **AdminLayout.tsx** - Layout del panel admin
12. **ProductMockup.tsx** - Mockup animado de la landing

### También afecta al SEO

El favicon se referencia en:
- `index.html` - `<link rel="icon" href="/favicon.png">`
- `index.html` - JSON-LD schema (`"logo": "https://blooglee.com/favicon.png"`)
- `src/components/seo/JsonLd.tsx` - Schema Organization
- `src/components/seo/SoftwareAppSchema.tsx` - Schema SoftwareApplication

### Pasos de implementación

1. **Copiar el nuevo logo** desde `user-uploads://logo_blooglee.jpeg` a:
   - `src/assets/blooglee-logo.png` (para el componente React)
   - `public/favicon.png` (para el favicon y SEO)
   
2. **Añadir soporte para Apple** en `index.html`:
   ```html
   <link rel="apple-touch-icon" href="/favicon.png">
   ```

### Resultado esperado

- El logo de la pluma con estrellas aparecerá en:
  - La pestaña del navegador (favicon)
  - La navbar de todas las páginas
  - El footer
  - Las páginas de auth, dashboard, onboarding, etc.
  - Los schemas SEO que Google lee
  - Los resultados de búsqueda de Google (tras re-indexación)

### Nota sobre Google

Después de publicar, Google puede tardar **días o semanas** en actualizar el favicon en sus resultados de búsqueda. Puedes acelerar esto solicitando una re-indexación en Google Search Console.

