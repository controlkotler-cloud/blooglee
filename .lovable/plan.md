
# Plan: Mejorar el rendimiento de PageSpeed (74 → 90+)

## Objetivo
Mejorar las métricas de Core Web Vitals, especialmente FCP (4.0s → <1.8s) y LCP (4.3s → <2.5s).

## Cambios a implementar

### 1. Optimizar carga de fuentes (Impacto: Alto)

**Archivo:** `index.html`

Cambiar de `@import` a preload + font-display:swap para eliminar el bloqueo de renderizado.

```html
<!-- Preload crítico de fuentes -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap" media="print" onload="this.media='all'" />
```

**Archivo:** `src/index.css`

Eliminar la línea 1 con `@import` ya que las fuentes se cargarán desde HTML.

### 2. Simplificar LiquidBlobs para móviles (Impacto: Alto)

**Archivo:** `src/components/saas/LiquidBlobs.tsx`

- Reducir número de blobs en móvil (usar media query o detección)
- Eliminar filtros blur pesados en móvil
- Usar `will-change: transform` para optimizar animaciones
- Añadir `prefers-reduced-motion` para accesibilidad

```tsx
// Detectar móvil y reducir complejidad
const isMobile = window.innerWidth < 768;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Si es móvil o reduce-motion, mostrar versión simplificada
if (isMobile || prefersReducedMotion) {
  return <SimplifiedBlobs />
}
```

### 3. Optimizar imágenes del hero (Impacto: Medio)

**Archivo:** `src/pages/Landing.tsx`

Añadir dimensiones explícitas y optimizar carga:

```tsx
// Avatares con dimensiones fijas
<img
  src={src}
  alt="Usuario de Blooglee"
  width={40}
  height={40}
  loading="lazy"
  decoding="async"
  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full..."
/>
```

Para testimonios (más abajo en la página):
```tsx
<img
  src={testimonial.image}
  alt={testimonial.name}
  width={100}
  height={100}
  loading="lazy"
  decoding="async"
  ...
/>
```

### 4. Diferir animaciones no críticas (Impacto: Medio)

**Archivo:** `src/components/saas/ProductMockup.tsx`

Retrasar el inicio de animaciones hasta después del LCP:

```tsx
const [animationsReady, setAnimationsReady] = useState(false);

useEffect(() => {
  // Esperar a que pase el LCP (~2.5s) antes de iniciar animaciones
  const timer = setTimeout(() => setAnimationsReady(true), 2500);
  return () => clearTimeout(timer);
}, []);

// Solo iniciar intervalos si animationsReady es true
useEffect(() => {
  if (!animationsReady) return;
  const interval = setInterval(() => {
    setActiveArticle((prev) => (prev + 1) % mockArticles.length);
  }, 3000);
  return () => clearInterval(interval);
}, [animationsReady]);
```

### 5. Añadir CSS crítico inline (Impacto: Medio-Alto)

**Archivo:** `index.html`

Añadir estilos críticos inline en el `<head>` para el primer renderizado:

```html
<style>
  /* CSS crítico para FCP */
  body { 
    margin: 0; 
    font-family: system-ui, -apple-system, sans-serif; 
    background: hsl(40, 30%, 98%);
  }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
</style>
```

### 6. Optimizar CSS con will-change (Impacto: Bajo)

**Archivo:** `src/index.css`

Añadir hints de optimización para animaciones:

```css
.mockup-float {
  will-change: transform;
  contain: layout style paint;
}

.liquid-blob {
  will-change: transform, opacity;
}
```

## Resultado esperado

| Métrica | Antes | Después (estimado) |
|---------|-------|---------------------|
| FCP | 4.0s | ~1.5s |
| LCP | 4.3s | ~2.2s |
| Speed Index | 5.0s | ~2.5s |
| Score móvil | 74 | 88-95 |

## Notas técnicas

- Las fuentes preload eliminan ~1.5s de bloqueo
- Simplificar SVG en móvil reduce CPU y mejora paint
- Diferir animaciones permite que el contenido estático cargue primero
- `will-change` prepara la GPU para las animaciones

## Lo que no cambia

- El diseño visual de la landing
- La funcionalidad del ProductMockup
- Los efectos de LiquidBlobs en desktop
- El contenido de texto o estructura HTML
