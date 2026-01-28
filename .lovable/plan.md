
# Plan: Unificar fondo de Pricing con el resto de páginas

## Problema Detectado

La página `/pricing` usa un sistema de fondo diferente al resto de páginas públicas:

| Página | Sistema de fondo | Resultado |
|--------|------------------|-----------|
| Features, Blog, Contact | `PublicLayout` (gradiente Tailwind + LiquidBlobs) | Consistente |
| Landing | Gradiente Tailwind directo + LiquidBlobs | Consistente |
| **Pricing** | `aurora-bg aurora-bg-intense` (clases CSS) | **Diferente** |

Las clases `aurora-bg` y `aurora-bg-intense` usan pseudo-elementos CSS (::before, ::after) con gradientes radiales animados, lo que crea un efecto visual diferente y puede causar problemas de renderizado en algunos dispositivos.

## Solución

Migrar Pricing.tsx para usar `PublicLayout`, igual que FeaturesPage, ContactPage y BlogIndex.

## Cambio Único

**Archivo:** `src/pages/Pricing.tsx`

**Antes:**
```tsx
return (
  <div className="min-h-screen aurora-bg aurora-bg-intense">
    ...
    <LiquidBlobs variant="hero" />
    <PublicNavbar />
    ...
    <PublicFooter />
  </div>
);
```

**Después:**
```tsx
import { PublicLayout } from '@/components/marketing/PublicLayout';

return (
  <PublicLayout>
    ...
    {/* LiquidBlobs, Navbar y Footer ya están incluidos en PublicLayout */}
  </PublicLayout>
);
```

## Beneficios

1. **Consistencia visual** - Mismo fondo que todas las páginas públicas
2. **Mantenibilidad** - Un solo lugar para cambiar el fondo de todo el sitio
3. **Responsive** - PublicLayout ya está probado en mobile/tablet/desktop
4. **Rendimiento** - Elimina animaciones CSS complejas que pueden causar problemas

## Elementos a Eliminar de Pricing.tsx

- `<div className="min-h-screen aurora-bg aurora-bg-intense">` → Usar `<PublicLayout>`
- `<LiquidBlobs variant="hero" />` → Ya incluido en PublicLayout
- `<PublicNavbar />` → Ya incluido en PublicLayout
- `<PublicFooter />` → Ya incluido en PublicLayout

## Impacto en Responsive

El contenido interno de Pricing (cards, FAQ, toggle) no cambia. Solo se unifica el contenedor exterior, manteniendo el diseño responsive actual de las tarjetas de precios.
