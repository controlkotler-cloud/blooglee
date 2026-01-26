

## Plan: Actualizar Imagotipo de Blooglee en Toda la Aplicación

### Archivos Afectados

| Ubicación | Uso Actual | Cambio |
|-----------|------------|--------|
| `src/assets/blooglee-logo.png` | Logo en componente BloogleeLogo | Reemplazar con nuevo imagotipo |
| `public/favicon.png` | Favicon del navegador | Reemplazar con nuevo imagotipo |
| `src/components/saas/ProductMockup.tsx` | Usa icono Sparkles genérico | Usar el logo real importado |

---

## Cambios Detallados

### 1. Copiar nuevo imagotipo a assets

```bash
# Copiar la imagen subida a src/assets (reemplaza el logo actual)
lov-copy user-uploads://bloogleeimagotipo.png src/assets/blooglee-logo.png

# Copiar también a public para favicon
lov-copy user-uploads://bloogleeimagotipo.png public/favicon.png
```

### 2. Actualizar ProductMockup.tsx (líneas 69-74)

Actualmente usa un icono genérico de Sparkles:

```typescript
// ANTES (línea 71-72):
<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
  <Sparkles className="w-4 h-4 text-white" />
</div>
```

Cambiar para usar el logo real:

```typescript
// DESPUÉS:
import bloogleeLogo from '@/assets/blooglee-logo.png';

// En el mini header (línea 71):
<img 
  src={bloogleeLogo} 
  alt="Blooglee" 
  className="w-8 h-8 object-contain"
/>
```

---

## Resultado Visual

El nuevo imagotipo (pluma con estrellas en gradiente violeta-rosa) aparecerá en:

- Navbar pública (PublicNavbar)
- Footer público (PublicFooter)
- Header del Dashboard SaaS
- Header de Account Settings
- Simulación del producto en la Landing page (ProductMockup)
- Favicon del navegador
- Cualquier otro lugar que use el componente BloogleeLogo

---

## Archivos a Modificar

1. **Copiar imágenes**:
   - `user-uploads://bloogleeimagotipo.png` → `src/assets/blooglee-logo.png`
   - `user-uploads://bloogleeimagotipo.png` → `public/favicon.png`

2. **`src/components/saas/ProductMockup.tsx`**:
   - Importar el logo
   - Reemplazar el icono Sparkles del mini header por una imagen del logo

