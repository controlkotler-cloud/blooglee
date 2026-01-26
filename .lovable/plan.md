

## Plan: Añadir Botón "Iniciar Sesión" para Usuarios Existentes

### Problema Actual

Solo existe el botón "Empezar gratis" que sugiere registro nuevo, pero no hay opción visible para usuarios que ya tienen cuenta y quieren iniciar sesión.

### Solución Propuesta

Añadir un enlace de texto "Iniciar sesión" junto al botón gradiente "Empezar gratis":

| Vista | Antes | Después |
|-------|-------|---------|
| Desktop | Solo "Empezar gratis" | "Iniciar sesión" (texto) + "Empezar gratis" (botón) |
| Tablet | Solo "Empezar gratis" | "Iniciar sesión" (texto) + "Empezar gratis" (botón) |
| Móvil (menú) | Solo "Empezar gratis" | "Iniciar sesión" (texto) + "Empezar gratis" (botón) |

### Diseño Visual

```text
┌─────────────────────────────────────────────────────────────────┐
│                         DESKTOP                                  │
├─────────────────────────────────────────────────────────────────┤
│ [Logo]  Características  Precios  Blog  Contacto   [Iniciar sesión] [Empezar gratis →]│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MÓVIL (menú abierto)                          │
├─────────────────────────────────────────────────────────────────┤
│ Características                                                  │
│ Precios                                                          │
│ Blog                                                             │
│ Contacto                                                         │
│ ─────────────────────────                                        │
│ Iniciar sesión                                                   │
│ [════════ Empezar gratis ════════]                               │
└─────────────────────────────────────────────────────────────────┘
```

### Cambios en `PublicNavbar.tsx`

#### Desktop/Tablet (líneas 37-48)

Añadir enlace de texto antes del botón gradiente:

```typescript
<div className="flex items-center gap-2 sm:gap-3">
  {/* NUEVO: Enlace Iniciar sesión */}
  <Link 
    to="/auth" 
    className="hidden md:block text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
  >
    Iniciar sesión
  </Link>
  
  {/* Botón gradiente existente */}
  <Link 
    to="/auth" 
    className="hidden md:flex relative group px-5 py-2.5 rounded-full ..."
  >
    Empezar gratis
  </Link>
  
  {/* Hamburguesa móvil */}
  ...
</div>
```

#### Menú Móvil (líneas 75-88)

Añadir enlace de texto antes del botón:

```typescript
{/* Separator */}
<div className="border-t border-border/50 my-1" />

{/* NUEVO: Enlace Iniciar sesión */}
<Link 
  to="/auth"
  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/50 text-center"
  onClick={() => setMobileMenuOpen(false)}
>
  Iniciar sesión
</Link>

{/* Botón gradiente existente */}
<Link 
  to="/auth" 
  className="relative group mt-1 py-3 rounded-xl ..."
>
  Empezar gratis
</Link>
```

### Comportamiento

Ambos enlaces van a `/auth`, donde:
- El formulario tiene toggle para cambiar entre "Iniciar sesión" y "Crear cuenta"
- El usuario elige el flujo que necesita

### Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/marketing/PublicNavbar.tsx` | Añadir enlace "Iniciar sesión" en desktop y menú móvil |

### Resultado

- **Usuarios nuevos**: Hacen clic en "Empezar gratis" → van a registro
- **Usuarios existentes**: Hacen clic en "Iniciar sesión" → van a login
- **Claridad**: Dos opciones claras para cada tipo de usuario

