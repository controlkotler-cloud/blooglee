

## Verificación y fijación definitiva de dependencias

### Estado actual

- La aplicación **compila y funciona correctamente**. La landing page carga sin errores.
- No hay errores en consola (solo warnings de `postMessage` propios del entorno de preview, inofensivos).
- Las versiones de Radix UI instaladas en `node_modules` son las correctas gracias al `package-lock.json`.

### Problema pendiente

El `package.json` todavia tiene prefijos `^` en las 27 dependencias de Radix UI. Esto significa que si se borra el lockfile o se ejecuta `npm update`, se instalarian versiones incompatibles automaticamente.

### Cambios necesarios

**Archivo**: `package.json` (lineas 17-43)

Eliminar el prefijo `^` de las 27 dependencias `@radix-ui/react-*`:

```text
"@radix-ui/react-accordion": "1.2.2",
"@radix-ui/react-alert-dialog": "1.1.4",
"@radix-ui/react-aspect-ratio": "1.1.1",
"@radix-ui/react-avatar": "1.1.2",
"@radix-ui/react-checkbox": "1.1.3",
"@radix-ui/react-collapsible": "1.1.2",
"@radix-ui/react-context-menu": "2.2.4",
"@radix-ui/react-dialog": "1.1.4",
"@radix-ui/react-dropdown-menu": "2.1.4",
"@radix-ui/react-hover-card": "1.1.4",
"@radix-ui/react-label": "2.1.1",
"@radix-ui/react-menubar": "1.1.4",
"@radix-ui/react-navigation-menu": "1.2.3",
"@radix-ui/react-popover": "1.1.4",
"@radix-ui/react-progress": "1.1.1",
"@radix-ui/react-radio-group": "1.2.2",
"@radix-ui/react-scroll-area": "1.2.2",
"@radix-ui/react-select": "2.1.4",
"@radix-ui/react-separator": "1.1.1",
"@radix-ui/react-slider": "1.2.2",
"@radix-ui/react-slot": "1.1.1",
"@radix-ui/react-switch": "1.1.2",
"@radix-ui/react-tabs": "1.1.2",
"@radix-ui/react-toast": "1.2.4",
"@radix-ui/react-toggle": "1.1.1",
"@radix-ui/react-toggle-group": "1.1.1",
"@radix-ui/react-tooltip": "1.1.6",
```

### Otras dependencias revisadas

Las demas dependencias del proyecto no presentan problemas de compatibilidad:
- `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query` - Estables con `^`, sin breaking changes conocidos
- `tailwind-merge`, `clsx`, `class-variance-authority` - APIs estables
- `sonner`, `vaul`, `cmdk`, `embla-carousel-react` - Sin conflictos detectados
- `recharts`, `date-fns`, `zod`, `react-hook-form` - APIs estables

No se necesitan cambios adicionales fuera de fijar las versiones de Radix UI.

### Seccion tecnica

El cambio es puramente declarativo en `package.json`. Al eliminar `^`, npm no resolvera versiones mas recientes al ejecutar `npm install`. El `package-lock.json` se actualizara automaticamente para reflejar las versiones exactas.
