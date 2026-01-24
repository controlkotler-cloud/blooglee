

## Plan: Implementar Logo Blooglee en Toda la Aplicacion

### Paso 1: Copiar el Logo a las Ubicaciones Correctas

| Origen | Destino | Proposito |
|--------|---------|-----------|
| `user-uploads://IMG_4616.png` | `public/favicon.png` | Favicon del navegador |
| `user-uploads://IMG_4616.png` | `src/assets/blooglee-logo.png` | Uso en componentes React |

---

### Paso 2: Crear Componente BloogleeLogo.tsx

**Nuevo archivo:** `src/components/saas/BloogleeLogo.tsx`

```tsx
import bloogleeLogo from '@/assets/blooglee-logo.png';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BloogleeLogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const textSizeClasses: Record<LogoSize, string> = {
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
};

export function BloogleeLogo({ 
  size = 'md', 
  showText = true, 
  className = '' 
}: BloogleeLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={bloogleeLogo} 
        alt="Blooglee" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <span className={`font-display font-bold bg-gradient-to-r 
          from-violet-600 via-fuchsia-600 to-orange-500 
          bg-clip-text text-transparent ${textSizeClasses[size]}`}>
          Blooglee
        </span>
      )}
    </div>
  );
}
```

**Caracteristicas del componente:**
- 5 tamanos predefinidos: xs, sm, md, lg, xl
- Prop `showText` para mostrar/ocultar el nombre
- Texto con gradiente de marca (violet-fuchsia-orange)
- Prop `className` para personalizacion adicional

---

### Paso 3: Actualizar index.html

**Cambios:**
- Titulo: `"Blooglee - Blog en piloto automatico con IA"`
- Description: `"Genera y publica articulos para tu blog WordPress automaticamente"`
- Author: `"Blooglee"`
- Agregar: `<link rel="icon" href="/favicon.png" type="image/png">`
- Actualizar todos los og: y twitter: meta tags

---

### Paso 4: Actualizar Landing.tsx

**Lineas 109-118 (navbar logo):**
- Importar `BloogleeLogo` desde `@/components/saas/BloogleeLogo`
- Reemplazar el div con `Wand2` por: `<BloogleeLogo size="md" />`
- Eliminar `Wand2` de las importaciones de lucide-react
- Eliminar el span con el texto "Blooglee" (ya incluido en el componente)

---

### Paso 5: Actualizar Pricing.tsx

**Navbar (lineas ~101-105):**
- Importar `BloogleeLogo`
- Reemplazar el div con `Sparkles` por: `<BloogleeLogo size="sm" />`
- Eliminar el span con texto "Blooglee"
- Eliminar `Sparkles` de importaciones si ya no se usa

---

### Paso 6: Actualizar Auth.tsx

**Loading state (lineas 94-97):**
```tsx
<BloogleeLogo size="lg" showText={false} className="animate-pulse" />
```

**Navbar (lineas 120-124):**
```tsx
<BloogleeLogo size="md" />
```

- Importar `BloogleeLogo`
- Eliminar `Sparkles` de importaciones

---

### Paso 7: Actualizar SaasDashboard.tsx

**Header (lineas 62-68):**
- Reemplazar el div con `Sparkles` y el texto por:
```tsx
<BloogleeLogo size="lg" />
```
- Eliminar el `<p>` con "Tu generador de contenido"
- Eliminar `Sparkles` de importaciones

---

### Paso 8: Actualizar Onboarding.tsx

**Header (lineas 124-128):**
```tsx
<BloogleeLogo size="lg" showText={false} />
```

**Boton final (linea 328):**
- Mantener `Sparkles` aqui ya que es un icono de accion, no el logo

---

### Resumen de Archivos

| Archivo | Accion |
|---------|--------|
| `public/favicon.png` | Crear - Copiar logo |
| `src/assets/blooglee-logo.png` | Crear - Copiar logo |
| `src/components/saas/BloogleeLogo.tsx` | Crear componente |
| `index.html` | Modificar meta tags y favicon |
| `src/pages/Landing.tsx` | Usar BloogleeLogo, eliminar Wand2 |
| `src/pages/Pricing.tsx` | Usar BloogleeLogo, eliminar Sparkles |
| `src/pages/Auth.tsx` | Usar BloogleeLogo en 2 lugares |
| `src/pages/SaasDashboard.tsx` | Usar BloogleeLogo |
| `src/pages/Onboarding.tsx` | Usar BloogleeLogo en header |

---

### Resultado Final

- Favicon mostrara la pluma Blooglee en la pestana del navegador
- Branding consistente en todas las paginas publicas y privadas
- Un solo componente controla todo el logo para facilitar mantenimiento
- Meta tags optimizados para SEO y redes sociales

