

# Plan: Ayuda Contextual Integrada para Configuracion de WordPress

## El Problema Actual

El formulario de WordPress solo tiene un enlace externo (linea 95-103 en `WordPressConfigForm.tsx`) que:
- Va a documentacion en ingles de WordPress
- No explica que usuario usar
- No muestra paso a paso como crear la contrasena de aplicacion
- No tiene ningun contexto visual

## La Solucion: Guia Integrada Paso a Paso

Transformar el formulario para incluir ayuda contextual activa con:

1. **Seccion de ayuda expandible** arriba del formulario con pasos visuales
2. **Tooltips en cada campo** explicando que poner
3. **Indicadores numerados** (1, 2, 3) junto a cada campo
4. **Collapsible con capturas** mostrando donde encontrar cada dato en WordPress

## Diseno Visual Propuesto

```text
┌─────────────────────────────────────────────────────────────────┐
│  Configuracion de WordPress                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📘 Como configurar WordPress (expandible)                 │   │
│  │ ─────────────────────────────────────────────────────────│   │
│  │                                                           │   │
│  │  Paso 1: URL del sitio                                    │   │
│  │  → La direccion de tu WordPress (ej: https://miweb.com)   │   │
│  │                                                           │   │
│  │  Paso 2: Usuario de WordPress                             │   │
│  │  → El usuario con el que accedes a wp-admin               │   │
│  │  → Normalmente es "admin" o tu email                      │   │
│  │                                                           │   │
│  │  Paso 3: Contrasena de aplicacion                         │   │
│  │  → NO es tu contrasena normal de WordPress                │   │
│  │  → Es una clave especial que debes crear:                 │   │
│  │    1. Ve a tu WordPress → Usuarios → Perfil               │   │
│  │    2. Baja hasta "Contrasenas de aplicacion"              │   │
│  │    3. Pon un nombre (ej: "Blooglee")                      │   │
│  │    4. Clic en "Anadir nueva contrasena"                   │   │
│  │    5. Copia la clave que aparece (solo se ve una vez!)    │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1  URL del sitio                                    (i) │    │
│  │    [https://tu-sitio.com                              ] │    │
│  │    La direccion principal de tu WordPress               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 2  Usuario de WordPress                             (i) │    │
│  │    [admin                                             ] │    │
│  │    El usuario con el que entras a wp-admin              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 3  Contrasena de aplicacion                         (i) │    │
│  │    [xxxx xxxx xxxx xxxx                    ] [Mostrar]  │    │
│  │    La clave que creaste en Usuarios → Perfil            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [💾 Guardar configuracion]                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes a Crear/Modificar

### Archivo Principal
`src/components/saas/WordPressConfigForm.tsx`

### Cambios Especificos

1. **Anadir seccion de ayuda colapsable** al inicio del formulario
2. **Reemplazar labels simples** por labels con numero + icono de ayuda
3. **Anadir texto de ayuda debajo de cada input** (hint text)
4. **Mejorar placeholders** para ser mas descriptivos

## Implementacion Detallada

### Nueva Estructura del Formulario

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, ChevronDown, BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Seccion de ayuda expandible
<Collapsible defaultOpen={!config}>
  <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-violet-50 rounded-lg hover:bg-violet-100">
    <BookOpen className="w-5 h-5 text-violet-600" />
    <span className="font-medium text-violet-900">Como configurar WordPress</span>
    <ChevronDown className="w-4 h-4 ml-auto text-violet-600" />
  </CollapsibleTrigger>
  <CollapsibleContent className="p-4 space-y-4 bg-violet-50/50 rounded-b-lg">
    {/* Paso 1 */}
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">1</div>
      <div>
        <p className="font-medium">URL del sitio</p>
        <p className="text-sm text-muted-foreground">La direccion de tu WordPress (ej: https://miweb.com)</p>
      </div>
    </div>
    
    {/* Paso 2 */}
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">2</div>
      <div>
        <p className="font-medium">Usuario de WordPress</p>
        <p className="text-sm text-muted-foreground">El usuario con el que accedes a tu panel de administracion (wp-admin). Normalmente es "admin" o tu email.</p>
      </div>
    </div>
    
    {/* Paso 3 - El mas importante */}
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">3</div>
      <div>
        <p className="font-medium">Contrasena de aplicacion</p>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>No es tu contrasena normal</strong>. Es una clave especial que debes crear:
        </p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
          <li>Ve a tu WordPress → <strong>Usuarios → Perfil</strong></li>
          <li>Baja hasta la seccion "<strong>Contrasenas de aplicacion</strong>"</li>
          <li>Escribe un nombre (ej: "Blooglee")</li>
          <li>Clic en "<strong>Anadir nueva contrasena</strong>"</li>
          <li>Copia la clave que aparece (solo se muestra una vez)</li>
        </ol>
      </div>
    </div>
  </CollapsibleContent>
</Collapsible>

// Campos con numeros y hints
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">1</span>
    <Label htmlFor="site_url">URL del sitio</Label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>La direccion principal de tu WordPress</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
  <Input ... />
  <p className="text-xs text-muted-foreground">
    Ejemplo: https://miweb.com (sin /wp-admin)
  </p>
</div>
```

### Estados del Componente

- **Sin configuracion**: Guia expandida por defecto, ayuda visual prominente
- **Con configuracion**: Guia colapsada, formulario mas limpio

## Resumen de Cambios

| Elemento | Cambio |
|----------|--------|
| Ayuda colapsable | Nueva seccion arriba del formulario con los 3 pasos explicados |
| Labels | Numeros visuales (1, 2, 3) + iconos de ayuda |
| Hints | Texto descriptivo debajo de cada campo |
| Placeholders | Ejemplos mas claros |
| Tooltips | Explicacion rapida en hover/tap |
| Estado inicial | Guia expandida si no hay config previa |

## Archivo a Modificar

- `src/components/saas/WordPressConfigForm.tsx`

## Resultado Esperado

1. **Usuario nuevo ve la guia expandida** con los 3 pasos claros
2. **Cada campo tiene contexto** - sabe exactamente que poner
3. **El paso 3 (contrasena)** tiene instrucciones detalladas paso a paso
4. **No necesita salir de la app** para entender que hacer
5. **Usuarios que ya configuraron** ven el formulario limpio con guia colapsada

---

## Seccion Tecnica

### Imports a Anadir

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, ChevronDown, BookOpen } from 'lucide-react';
```

### Logica de Estado Inicial

```typescript
const [helpOpen, setHelpOpen] = useState(!config);

// Colapsar ayuda cuando ya hay config guardada
useEffect(() => {
  if (config) setHelpOpen(false);
}, [config]);
```

### Estructura de Componente Completa

El formulario tendra esta estructura:
1. Card con header
2. Seccion de ayuda colapsable (Collapsible)
3. Formulario con campos numerados y hints
4. Botones de accion

