
## Plan: Unificar Menús de Navegación Pública

### Problema Detectado

Actualmente existen **3 navegaciones diferentes** en el sitio público:

| Página | Navegación | Enlaces Desktop | Enlaces Móvil | Problema |
|--------|------------|-----------------|---------------|----------|
| `Landing.tsx` | Propia (inline) | `#features`, `#testimonials`, `#pricing` | Ídem + Iniciar | Anclas internas, sin Blog/Contacto |
| `FeaturesPage`, `Blog`, etc. | `PublicNavbar` | Características, Precios, Blog, Contacto | Ídem + Iniciar | ✅ Completo |
| `Pricing.tsx` | Propia (inline) | Características, Precios | Ídem + Iniciar | Sin Blog/Contacto, footer propio |

Además:
- **Botones duplicados**: "Iniciar sesión" (texto) + "Empezar" (gradiente) van al mismo `/auth`
- **Breakpoint `xs:` no definido**: En `tailwind.config.ts` no existe, causando problemas de clase
- **En móvil**: El botón gradiente puede solaparse visualmente con el logo

---

### Solución: Un Solo Componente `PublicNavbar`

#### Enlaces Unificados (todos los dispositivos)

```
Características → /features
Precios        → /pricing  
Blog           → /blog
Contacto       → /contact
```

#### Botones Simplificados

| Vista | Antes | Después |
|-------|-------|---------|
| Desktop | "Iniciar sesión" (texto) + "Empezar" (botón) | Solo "Empezar gratis" (botón gradiente) |
| Tablet | "Iniciar sesión" + "Empezar" | Solo "Empezar gratis" (botón gradiente) |
| Móvil (header) | "Iniciar" (botón gradiente) + hamburguesa | Solo hamburguesa |
| Móvil (menú) | Enlaces + "Iniciar sesión" | Enlaces + "Empezar gratis" (botón) |

---

### Cambios por Archivo

#### 1. `src/components/marketing/PublicNavbar.tsx`

**Modificaciones:**
- Eliminar el botón de texto "Iniciar sesión" (duplicado)
- Dejar solo el botón gradiente "Empezar gratis" en desktop/tablet
- En móvil: ocultar el botón gradiente del header (mostrar solo hamburguesa)
- En menú móvil: añadir botón gradiente al final
- Cambiar `xs:hidden` a clases estándar (sin breakpoint custom)

```typescript
// ANTES (líneas 37-54)
<Link to="/auth" className="hidden sm:block text-sm ...">Iniciar sesión</Link>
<Link to="/auth" className="relative group ...">
  <span className="hidden xs:inline">Empezar</span>
  <span className="xs:hidden">Iniciar</span>
</Link>

// DESPUÉS
<Link to="/auth" className="hidden md:flex relative group ...">
  Empezar gratis <ArrowRight />
</Link>
```

En el menú móvil:
```typescript
// ANTES
<Link to="/auth">Iniciar sesión</Link>

// DESPUÉS - botón prominente al final
<Link to="/auth" className="bg-gradient-to-r ... rounded-full py-3">
  Empezar gratis <ArrowRight />
</Link>
```

#### 2. `src/pages/Landing.tsx`

**Modificaciones:**
- Eliminar la navegación inline (líneas 106-192)
- Importar y usar `PublicNavbar` en su lugar
- Mantener los IDs de sección (`#features`, `#testimonials`) para scroll interno

```typescript
// ANTES
import { useState } from 'react';
// ... 86 líneas de navegación inline

// DESPUÉS
import { PublicNavbar } from '@/components/marketing/PublicNavbar';

const Landing = () => {
  return (
    <div className="min-h-screen ...">
      <LiquidBlobs variant="hero" />
      <PublicNavbar />
      {/* Hero Section sigue igual */}
    </div>
  );
};
```

#### 3. `src/pages/Pricing.tsx`

**Modificaciones:**
- Eliminar la navegación inline (líneas 99-175)
- Importar y usar `PublicNavbar`
- Reemplazar footer inline por `PublicFooter` o eliminar (ya está en landing)

```typescript
// ANTES
<nav className="fixed top-0 ...">
  {/* 76 líneas de navegación inline */}
</nav>

// DESPUÉS
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';

// En el return:
<PublicNavbar />
// ... contenido ...
<PublicFooter />
```

---

### Estructura Final del Navbar

```
┌─────────────────────────────────────────────────────────────┐
│                         DESKTOP (md+)                       │
├─────────────────────────────────────────────────────────────┤
│ [Logo]     Características  Precios  Blog  Contacto    [CTA]│
│ Blooglee        links                                Empezar│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         MÓVIL (<md)                         │
├─────────────────────────────────────────────────────────────┤
│ [Logo Blooglee]                                    [☰ Menú] │
├─────────────────────────────────────────────────────────────┤
│ Características                                              │
│ Precios                                                      │
│ Blog                                                         │
│ Contacto                                                     │
│ ─────────────────                                            │
│ [════ Empezar gratis ════]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### Archivos a Modificar

| Archivo | Acción | Cambios |
|---------|--------|---------|
| `src/components/marketing/PublicNavbar.tsx` | Modificar | Eliminar botón duplicado, ajustar responsive, arreglar breakpoints |
| `src/pages/Landing.tsx` | Modificar | Eliminar nav inline, importar `PublicNavbar` |
| `src/pages/Pricing.tsx` | Modificar | Eliminar nav inline, importar `PublicNavbar` y `PublicFooter` |

---

### Resultado Esperado

1. **Consistencia**: Mismo menú en todas las páginas públicas
2. **Sin duplicados**: Un solo botón CTA claro en cada vista
3. **Móvil limpio**: Logo a la izquierda, hamburguesa a la derecha (sin solapamientos)
4. **Menos código**: ~150 líneas eliminadas de código duplicado
5. **Mantenibilidad**: Cambios futuros en un solo lugar (`PublicNavbar.tsx`)
