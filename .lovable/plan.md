

## Plan: Ajustar Landing Page - Eliminar Elementos Problemáticos

### Problema 1: Botones flotantes sobre el simulador (PC)

En el archivo `src/components/saas/ProductMockup.tsx`, hay 3 "pills" flotantes posicionados a la izquierda del mockup que se superponen visualmente:

```typescript
// Líneas 160-172 - ELIMINAR
<div className="absolute -left-4 top-1/4 hidden lg:block">
  {features.map((feature, i) => (
    <div className="glass-card px-4 py-2.5 rounded-full ...">
      <feature.icon className={`w-4 h-4 ${feature.color}`} />
      <span className="text-sm font-medium">{feature.text}</span>
    </div>
  ))}
</div>
```

**Solución**: Eliminar completamente esta sección. Ya están ocultos en tablet/móvil, y en PC se solapan con el simulador.

---

### Problema 2: Imagotipo en tarjeta CTA inferior

En el archivo `src/pages/Landing.tsx`, el logo flotante antes del título ocupa espacio innecesario:

```typescript
// Líneas 485-488 - ELIMINAR
<div className="inline-flex items-center justify-center mb-6 sm:mb-8 lg:mb-10 animate-float">
  <BloogleeLogo size="xl" showText={false} className="drop-shadow-2xl" />
</div>
```

**Solución**: Eliminar este bloque. El logo ya aparece en el navbar y footer, no aporta valor aquí y desplaza el texto hacia abajo.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/saas/ProductMockup.tsx` | Eliminar los feature pills flotantes (líneas 160-172) y la constante `features` que ya no se usará |
| `src/pages/Landing.tsx` | Eliminar el BloogleeLogo flotante de la sección CTA (líneas 485-488) |

---

## Resultado Visual

**En PC**:
- El simulador del producto se verá limpio sin elementos superpuestos
- La tarjeta CTA mostrará directamente el título "¿Listo para automatizar tu contenido?" sin el imagotipo encima

**En Tablet/Móvil**:
- Sin cambios visuales (los pills ya estaban ocultos)
- Más espacio vertical en la tarjeta CTA inferior

