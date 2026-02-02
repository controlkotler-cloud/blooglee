

# Plan: Actualizar precios y planes para el lanzamiento de Blooglee

## Resumen de cambios

| Plan | Antes | Después |
|------|-------|---------|
| **Free** | 1 artículo total | 1 mes gratis, hasta 4 artículos/mes |
| **Starter** | SEO completo | SEO avanzado + Soporte por email |
| **Pro** | 49€/39€ | Oferta lanzamiento: 29€ mensual / 39€ anual + Todo lo de Starter |
| **Agencia** | API access, White-label disponible | White-label (sin "disponible"), Soporte prioritario, sin API |

## Cambios detallados por archivo

### 1. `src/pages/Pricing.tsx` - Página de precios pública

**Plan Free (líneas 59-78)**
```
Antes:
- "1 artículo publicado"
- Limitación: "Solo primer artículo"

Después:
- "1 mes gratis de prueba"
- "Hasta 4 artículos/mes"
- Sin limitación visible
- CTA: "Empezar gratis"
```

**Plan Starter (líneas 80-98)**
```
Después:
- "SEO avanzado" (antes: "SEO completo")
- "Soporte por email" (ya lo tiene, mantener)
```

**Plan Pro (líneas 99-118)**
```
Después:
- Añadir badge "Oferta lanzamiento"
- Precio mensual: 29€ (antes 49€) - mostrar 49€ tachado
- Precio anual: 39€/mes (antes también 39€, mantener)
- Añadir "Todo lo incluido en Starter"
- "Hasta 3 sitios web"
- "Hasta 30 artículos/mes"
- Mantener popular: true
```

**Plan Agencia (líneas 119-139)**
```
Después:
- "Soporte prioritario" (antes: "Soporte dedicado")
- "White-label" (antes: "White-label disponible")
- ELIMINAR: "API access"
- Añadir nota: "¿Más de 10 sitios? Contacta ventas"
```

**FAQs (líneas 9-46)**
```
Actualizar respuestas:
- "¿Qué incluye el plan gratuito?": 1 mes gratis, hasta 4 artículos
- "¿Puedo probar antes de pagar?": 1 mes gratis con funcionalidades completas
- Añadir nueva FAQ: "¿Cómo funciona el período de prueba?"
- Añadir nueva FAQ: "¿Qué pasa después del mes gratis?"
```

**pricingPlans para SEO (líneas 49-54)**
```
Actualizar datos para schema:
- Free: "1 mes gratis, 4 artículos/mes"
- Pro: precio 29 (oferta)
```

### 2. `src/pages/BillingPage.tsx` - Página de facturación del dashboard

**Actualizar array plans (líneas 12-53)**
```
- Free: "1 mes gratis", "Hasta 4 artículos/mes"
- Starter: añadir "SEO avanzado", "Soporte por email"
- Pro: mostrar oferta, "Todo lo de Starter"
- Agency: cambiar "Soporte prioritario", "White-label", quitar "API access"
```

### 3. `supabase/functions/support-chatbot/index.ts` - Bloobot

**Actualizar SYSTEM_PROMPT (líneas 43-64)**
```
Añadir sección de PLANES Y PRECIOS:

PLANES DE BLOOGLEE:
- Free: 1 mes gratis de prueba con hasta 4 artículos/mes. Sin tarjeta de crédito.
- Starter (19€/mes o 15€/mes anual): 1 sitio, 4 artículos/mes, SEO avanzado, soporte por email
- Pro (29€/mes oferta o 39€/mes anual): Hasta 3 sitios, 30 artículos/mes, todo lo de Starter, soporte prioritario
- Agencia (149€/mes o 119€/mes anual): Hasta 10 sitios, artículos ilimitados, white-label, soporte prioritario

REGLAS SOBRE PLANES:
- Todos los usuarios empiezan con el plan Free de 1 mes
- Después del mes gratuito, deben actualizar al plan seleccionado
- Si quieren Pro o Agencia antes del mes, pueden actualizar anticipadamente
- Para más de 10 sitios, deben contactar ventas en hola@blooglee.com
```

## Diseño visual de la oferta Pro

Para destacar la oferta de lanzamiento en el plan Pro:

```tsx
{/* Badge de oferta */}
<div className="absolute -top-4 right-4 z-10">
  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg animate-pulse">
    🎉 Oferta lanzamiento
  </div>
</div>

{/* Precio con tachado */}
<div className="mb-6">
  <div className="flex items-baseline gap-2">
    <span className="text-lg line-through text-foreground/40">49€</span>
    <span className="text-5xl font-display font-bold text-foreground">29€</span>
    <span className="text-foreground/50 text-sm">/mes</span>
  </div>
</div>
```

## FAQs actualizadas

```typescript
const pricingFaqs = [
  {
    question: '¿Qué incluye el plan gratuito?',
    answer: 'El plan Free te da 1 mes gratis con acceso completo: 1 sitio web, hasta 4 artículos con imagen destacada y SEO optimizado. No requiere tarjeta de crédito.',
  },
  {
    question: '¿Cómo funciona el período de prueba?',
    answer: 'Todos los usuarios empiezan con el plan Free de 1 mes gratis. Durante este período puedes generar hasta 4 artículos. Al finalizar el mes, puedes actualizar al plan que prefieras.',
  },
  {
    question: '¿Puedo actualizar mi plan antes de que termine el mes gratis?',
    answer: 'Sí, si necesitas más artículos o sitios antes de que termine tu mes gratuito, puedes actualizar a Pro o Agencia en cualquier momento.',
  },
  {
    question: '¿Qué pasa si necesito más de 10 sitios?',
    answer: 'El plan Agencia incluye hasta 10 sitios. Si necesitas más, contacta con nuestro equipo en hola@blooglee.com para un plan personalizado.',
  },
  // ... resto de FAQs actualizadas
];
```

## Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Pricing.tsx` | Precios, features, FAQs, oferta Pro |
| `src/pages/BillingPage.tsx` | Array de planes sincronizado |
| `supabase/functions/support-chatbot/index.ts` | SYSTEM_PROMPT con info de planes |

## Resultado esperado

1. Página de precios con nueva estructura de planes
2. Oferta de lanzamiento visible en Pro (29€ con 49€ tachado)
3. FAQs actualizadas explicando el mes gratis
4. Bloobot conoce los nuevos planes y puede responder preguntas
5. Consistencia entre página pública y dashboard

