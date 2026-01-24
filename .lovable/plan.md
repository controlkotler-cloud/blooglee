

## Plan: Hacer el Logo Blooglee Transparente

### Opción A: Usuario proporciona logo con fondo transparente

1. **El usuario sube una nueva versión del logo** con fondo transparente (PNG con alpha channel)
2. **Reemplazar los archivos existentes:**
   - `public/favicon.png`
   - `src/assets/blooglee-logo.png`
3. No se necesitan cambios de código adicionales

---

### Opción B: Aplicar CSS mix-blend-mode

Si no tienes el logo con fondo transparente, modificar el componente `BloogleeLogo.tsx`:

**Archivo:** `src/components/saas/BloogleeLogo.tsx`

**Cambio en la etiqueta img:**
```tsx
<img 
  src={bloogleeLogo} 
  alt="Blooglee" 
  className={`${sizeClasses[size]} object-contain mix-blend-multiply`}
/>
```

**Consideraciones:**
- Funciona bien en fondos claros y medios
- En fondos muy oscuros, el logo puede oscurecerse ligeramente
- Es una solución temporal; lo ideal es tener el PNG con transparencia real

---

### Recomendación

La **Opción A** (logo con fondo transparente) dará el mejor resultado visual. Si no tienes acceso al archivo original, la **Opción B** con `mix-blend-mode` funcionará como solución rápida.

