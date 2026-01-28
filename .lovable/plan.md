

# Plan: Unificar Cabeceras de Páginas Públicas

## Diferencias Detectadas

Analizando las cuatro páginas, he encontrado las siguientes inconsistencias en la sección superior:

| Página | Badge | Padding Superior | Container |
|--------|-------|------------------|-----------|
| **Features** (base) | `bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg` | `py-8 sm:py-12 lg:py-16` | `container mx-auto max-w-7xl` |
| **Pricing** | `badge-aurora badge-aurora-glow` (diferente) | `pt-28 sm:pt-32` (excesivo) | `max-w-4xl` (más estrecho) |
| **Blog** | Igual que Features | Igual que Features | Igual que Features |
| **Contact** | **Sin badge** | Igual que Features | Igual que Features |

## Problemas Específicos

1. **Pricing**: 
   - Usa clases CSS custom (`badge-aurora`) en lugar del estilo glass
   - Tiene `pt-28 sm:pt-32` que añade padding excesivo (la navbar ya está manejada por `PublicLayout`)
   - El contenedor es `max-w-4xl` en lugar de centrar el header dentro de uno más amplio

2. **Contact**: 
   - No tiene badge/chip superior con icono
   - El resto está bien

## Solución

Unificar todas las páginas usando exactamente el mismo patrón que **Features**:

```text
┌─────────────────────────────────────────────────────────────┐
│ <section className="container mx-auto max-w-7xl            │
│            px-4 sm:px-6 py-8 sm:py-12 lg:py-16">           │
│                                                             │
│   <div className="text-center max-w-4xl mx-auto mb-X">     │
│                                                             │
│     ┌─────────────────────────────────────┐                 │
│     │ [Icono] Badge                       │  ← Badge glass  │
│     └─────────────────────────────────────┘                 │
│                                                             │
│     <h1 className="font-display text-4xl                   │
│         sm:text-5xl lg:text-6xl font-bold mb-X">           │
│       Título con gradiente                                  │
│     </h1>                                                   │
│                                                             │
│     <p className="text-lg sm:text-xl text-foreground/60">  │
│       Subtítulo descriptivo                                 │
│     </p>                                                   │
│                                                             │
│   </div>                                                   │
│ </section>                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Cambios por Archivo

### 1. Pricing.tsx

**Línea 133:** Cambiar estructura del header

Antes:
```tsx
<section className="pt-28 sm:pt-32 pb-12 sm:pb-16 px-4">
  <div className="max-w-4xl mx-auto text-center">
    <div className="inline-flex items-center gap-2 badge-aurora badge-aurora-glow mb-6">
```

Después:
```tsx
<section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
  <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
```

### 2. ContactPage.tsx

**Línea 75:** Añadir badge con icono

Antes:
```tsx
<div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
  <h1 className="font-display ...
```

Después:
```tsx
<div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
    <Mail className="w-4 h-4 text-violet-500" />
    <span className="text-sm font-medium text-violet-600">Contacto</span>
  </div>
  
  <h1 className="font-display ...
```

### 3. BlogIndex.tsx (ya correcto)

Sin cambios necesarios - ya usa el patrón correcto.

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/Pricing.tsx` | Cambiar container y badge a estilo glass |
| `src/pages/ContactPage.tsx` | Añadir badge con icono Mail, ajustar max-w a 4xl |

## Resultado Visual

Después de los cambios, las 4 páginas tendrán:

- Mismo contenedor: `container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16`
- Mismo estilo de badge: fondo glass blanco con borde violeta y sombra
- Mismo espaciado entre elementos
- Mismo tamaño de tipografía responsive

