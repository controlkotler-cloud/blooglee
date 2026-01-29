
# Plan: Mejorar Tooltips y Texto del Campo Usuario

## Problema 1: Tooltips inútiles

Los iconos de interrogante (?) tienen tooltips pero con información redundante:
- URL: "La dirección principal de tu WordPress" (ya lo dice el label)
- Usuario: "El usuario con el que entras a wp-admin" (ya lo dice el hint)
- Contraseña: Algo más útil pero aún básico

**Solución**: O quitar los iconos (ya que la guía expandible explica todo) o hacerlos realmente útiles con información diferenciada.

**Recomendación**: Quitar los iconos HelpCircle de los 3 campos. La guía colapsable ya proporciona toda la ayuda necesaria y los tooltips solo añaden ruido visual.

## Problema 2: Texto incorrecto sobre el usuario

**Texto actual** (línea 231 y 328):
- "Normalmente es admin o tu email"
- Placeholder: "admin o tu@email.com"

**Problema**: Lo importante no es el nombre, sino que el usuario tenga permisos de Administrador o Editor en WordPress para poder publicar posts.

**Texto corregido**:
- Guía: "El nombre de usuario de WordPress con rol de **Administrador** o **Editor** (necesario para publicar artículos)"
- Hint: "Debe tener permisos para crear y publicar entradas"
- Placeholder: "tu_usuario_wordpress"

## Cambios Específicos

### Archivo: `src/components/saas/WordPressConfigForm.tsx`

| Líneas | Cambio |
|--------|--------|
| 262-271 | Eliminar TooltipProvider completo del campo URL |
| 315-324 | Eliminar TooltipProvider completo del campo Usuario |
| 345-354 | Eliminar TooltipProvider completo del campo Contraseña |
| 231 | Cambiar texto a mencionar rol Admin/Editor |
| 328 | Cambiar placeholder a "tu_usuario_wordpress" |
| 332-334 | Cambiar hint a mencionar permisos de publicación |

### Código a eliminar (3 bloques de tooltips):

```tsx
// ELIMINAR de líneas 262-271, 315-324, 345-354:
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent>
      <p>...</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Textos a actualizar:

```tsx
// Línea 230-231 (en la guía colapsable)
<p className="text-sm text-muted-foreground">
  Un usuario con rol de <strong>Administrador</strong> o <strong>Editor</strong> en WordPress. 
  Necesita permisos para crear y publicar entradas.
</p>

// Línea 328 (placeholder del input)
placeholder="tu_usuario_wordpress"

// Líneas 332-334 (hint debajo del input)
<p className="text-xs text-muted-foreground">
  Debe tener rol de Administrador o Editor para poder publicar
</p>
```

### Import a limpiar:

```tsx
// Línea 9 - Quitar HelpCircle si ya no se usa
import { Loader2, Save, Unplug, ChevronDown, BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Línea 13 - Quitar imports de Tooltip si ya no se usan
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
```

## Resultado Esperado

1. **Sin ruido visual**: Los iconos (?) desaparecen, dejando la interfaz más limpia
2. **Información clara sobre rol**: El usuario sabe que necesita una cuenta con permisos de Admin/Editor
3. **Guía suficiente**: La sección colapsable ya explica todo lo necesario

## Alternativa (si prefieres mantener tooltips)

Si prefieres mantener los iconos (?), podemos hacerlos útiles con información diferenciada:

- **URL tooltip**: "Introduce la URL sin /wp-admin. Verificaremos que sea un WordPress válido."
- **Usuario tooltip**: "Necesitas rol de Administrador o Editor. Los roles de Suscriptor o Colaborador no funcionarán."
- **Contraseña tooltip**: "Las contraseñas de aplicación tienen formato: xxxx xxxx xxxx xxxx"

---

## Sección Técnica

### Líneas exactas a modificar:

1. **Eliminar tooltip URL**: Líneas 262-271
2. **Eliminar tooltip Usuario**: Líneas 315-324  
3. **Eliminar tooltip Contraseña**: Líneas 345-354
4. **Actualizar texto guía usuario**: Línea 231
5. **Actualizar placeholder**: Línea 328
6. **Actualizar hint**: Líneas 332-334
7. **Limpiar imports**: Línea 9 (HelpCircle) y línea 13 (Tooltip components)
