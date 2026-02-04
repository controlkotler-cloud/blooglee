
## Plan: Eliminar social proof falso y optimizar tarjetas móvil

### 1. Eliminar la sección de avatares y estrellas (Primera imagen)

Esta sección en el Hero contiene datos inventados (avatares de stock, "+500 empresas") que no son reales. Se eliminará completamente.

**Líneas a eliminar**: 225-254 (Social proof - Simplified on mobile)

```jsx
// ELIMINAR COMPLETAMENTE:
{/* Social proof - Simplified on mobile */}
<div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start">
  <div className="flex -space-x-2 sm:-space-x-3">
    {[...avatares...].map(...)}
  </div>
  <div className="text-sm text-center sm:text-left">
    <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500">
      {[...Array(5)].map(...)} // Estrellas
    </div>
    <span>+500 empresas confían en nosotros</span>
  </div>
</div>
```

### 2. Optimizar la sección "Por qué funciona" para móvil (Segunda imagen)

Actualmente las tarjetas se ven bien pero hay elementos redundantes y el espaciado puede mejorarse.

#### Problemas detectados en el código actual:
- Hay un icono duplicado (líneas 427-437 tiene un icono con SVG gradient que no se usa, y líneas 438-440 tiene el icono real)
- El padding y espaciado puede optimizarse para móvil

#### Cambios en las tarjetas:

```jsx
// ANTES (con icono duplicado):
<item.icon className={`w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 ...`} style={{ stroke: 'url(#icon-gradient)' }} />
<div className="hidden">
  <svg width="0" height="0">...</svg>
</div>
<div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ...`}>
  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
</div>

// DESPUÉS (limpio, solo un icono):
<div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
</div>
```

#### Optimizaciones móvil adicionales:

| Elemento | Antes | Después |
|----------|-------|---------|
| Icono container | `w-10 h-10 sm:w-12 sm:h-12` | `w-12 h-12 sm:w-14 sm:h-14` (más grande en móvil) |
| Stat text | `text-3xl sm:text-4xl` | `text-4xl sm:text-5xl` (más impacto) |
| Card padding | `p-5 sm:p-6 lg:p-8` | `p-6 sm:p-8` (más respiración) |
| Gap entre tarjetas | `gap-4 sm:gap-6` | `gap-3 sm:gap-4 lg:gap-6` (optimizado para 2x2 móvil) |

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Landing.tsx` | Eliminar social proof (líneas 225-254) + Limpiar tarjetas "Por qué funciona" (líneas 418-451) |

### Resultado esperado

- Hero sin avatares ni estrellas inventadas (más honesto)
- Tarjetas "Por qué funciona" más limpias y con mejor legibilidad en móvil
- Iconos más grandes y estadísticas más impactantes
- Sin código SVG duplicado/muerto
