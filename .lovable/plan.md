

## Plan: Corregir errores de tipos en componentes Radix UI

### Problema

Las versiones de los paquetes Radix UI en `package.json` usan el prefijo `^` (caret), lo que permite que se instalen versiones menores mas recientes automaticamente. Las versiones mas recientes de Radix UI han eliminado `className` de los tipos de sus componentes, lo que rompe todos los componentes shadcn/ui que dependen de pasar `className` como prop.

Esto afecta a **todos** los componentes UI del proyecto: alert-dialog, avatar, label, progress, scroll-area, separator, slider, switch, checkbox, tabs, radio-group, toggle, accordion, context-menu, dropdown-menu, select, toast, tooltip, hover-card, popover, dialog, navigation-menu, collapsible, y menubar.

### Solucion

Fijar las versiones de todos los paquetes `@radix-ui/*` a versiones exactas compatibles (sin el prefijo `^`), de modo que no se actualicen automaticamente a versiones que rompen la API.

### Cambios

**Archivo**: `package.json`

Cambiar todas las dependencias de Radix UI de versiones con `^` a versiones exactas fijadas:

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

Estas son las ultimas versiones estables que mantienen compatibilidad con `className` en los tipos de componentes (la API que usa shadcn/ui).

### Impacto

- No se modifica ningun componente de codigo
- No se toca ninguna logica
- Solo se fijan versiones en `package.json` para evitar que se instalen versiones incompatibles
- El proyecto volvera a compilar correctamente

