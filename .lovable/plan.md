

## Plan: Rediseñar BloogleeLogo con Imagotipo Más Grande y Nuevos Colores

### Cambios en el Componente BloogleeLogo

El componente `src/components/saas/BloogleeLogo.tsx` necesita estos ajustes:

---

### 1. Aumentar tamaños del imagotipo

Los tamaños actuales son pequeños. Se aumentarán proporcionalmente:

| Size | Antes | Después |
|------|-------|---------|
| xs | w-6 h-6 | w-8 h-8 |
| sm | w-8 h-8 | w-10 h-10 |
| md | w-10 h-10 | w-12 h-12 |
| lg | w-12 h-12 | w-14 h-14 |
| xl | w-16 h-16 | w-20 h-20 |

---

### 2. Actualizar gradiente del texto

Cambiar el gradiente actual (violeta → fucsia → naranja) por el de la imagen de referencia:

**Antes:**
```typescript
bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500
```

**Después (colores como en la imagen):**
```typescript
bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-500
```

Los colores exactos de la imagen de referencia:
- Inicio: Violeta/púrpura profundo (`#7C3AED` - violet-600)
- Transición: Rosa/fucsia (`#D946EF` - fuchsia-500) 
- Final: Coral/naranja (`#F97316` - orange-500)

---

### 3. Aumentar espaciado entre imagotipo y texto

Para que el logo respire mejor con el imagotipo más grande:

**Antes:**
```typescript
<div className={`flex items-center gap-2 ${className}`}>
```

**Después:**
```typescript
<div className={`flex items-center gap-3 ${className}`}>
```

---

### 4. Actualizar ProductMockup.tsx

El mockup usa su propia instancia del logo. Actualizarlo para que coincida:

```typescript
// Aumentar tamaño del imagotipo en el mockup
<img 
  src={bloogleeLogo} 
  alt="Blooglee" 
  className="w-10 h-10 object-contain"  // Antes: w-8 h-8
/>
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/saas/BloogleeLogo.tsx` | Aumentar sizeClasses, actualizar gradiente, ajustar gap |
| `src/components/saas/ProductMockup.tsx` | Aumentar tamaño del imagotipo en el mockup |

---

## Resultado Visual

- El imagotipo (pluma con estrellas) será más prominente en todas partes
- El texto "Blooglee" mantendrá el gradiente violeta → fucsia → naranja
- Los lugares con `showText={false}` solo mostrarán el imagotipo más grande
- El mockup del producto también reflejará estos cambios

