
# Diagnóstico: Por qué los artículos siguen siendo repetitivos

## Problemas identificados

### Problema 1: `wordpress_context` está NULL

A pesar de sincronizar WordPress, el contexto no se guardó:
```
wordpress_context: <nil>
```

La Edge Function `sync-wordpress-taxonomies-saas` tiene la lógica, pero parece que no se ejecutó correctamente o falló silenciosamente. Sin logs disponibles, no puedo confirmar qué pasó.

### Problema 2: El tema generado menciona "marzo" cuando estamos en febrero

El prompt dice "Estamos en Febrero 2026" pero la IA respondió:
```
"Farmacia del futuro: digitalización más allá de la venta online este marzo"
```

Esto indica que la IA ignora las instrucciones o el prompt no es lo suficientemente restrictivo.

### Problema 3: Ambos artículos son sobre "digitalización/tendencias/futuro"

| Fecha | Tema |
|-------|------|
| 1 Feb | "Tendencias digitales clave para farmacias este año" |
| 3 Feb | "Farmacia del futuro: digitalización más allá de la venta online" |

El pilar rotó de "educational" a "trends" pero el problema es más profundo:

**El prompt NO prohíbe explícitamente palabras genéricas como:**
- digitalización, digital, futuro, innovación, IA, inteligencia artificial, tendencias, tecnología

### Problema 4: Falta de "lista negra" de conceptos sobreusados

Para sectores como farmacias, siempre hay respuestas "fáciles" que la IA da por defecto. No hay nada que la fuerce a pensar diferente.

## Solución propuesta

### Parte 1: Añadir lista de conceptos prohibidos por sector

En la base de datos, tener una tabla o campo con palabras/conceptos que la IA NO puede usar para ese sector específico:

| Sector | Conceptos prohibidos |
|--------|----------------------|
| farmacia | digitalización, transformación digital, IA, inteligencia artificial, futuro, innovación, tecnología punta |
| marketing | viralidad, engagement, influencer, trending |
| general | IA, ChatGPT, transformación digital |

### Parte 2: Mejorar el prompt de topic con prohibiciones explícitas

Cambiar el prompt `saas.topic` para incluir:

```
⛔ PALABRAS PROHIBIDAS (NUNCA USAR EN EL TEMA):
{{prohibitedTerms}}

⛔ CONCEPTOS GENÉRICOS PROHIBIDOS:
- "digitalización", "transformación digital"
- "futuro de [sector]", "el futuro"
- "innovación", "innovador"
- "IA", "inteligencia artificial"
- "tendencias 2026", "este año"
- Cualquier buzzword tecnológico genérico

EN SU LUGAR, sé CONCRETO y PRÁCTICO:
- BIEN: "Cómo organizar el stock de medicamentos refrigerados"
- MAL: "Digitalización del inventario farmacéutico"
- BIEN: "Servicios de nutrición deportiva en tu farmacia"
- MAL: "Innovación en servicios farmacéuticos"
```

### Parte 3: Forzar especificidad en el prompt

Añadir instrucciones como:
```
El tema debe ser sobre una ACCIÓN CONCRETA o un PROBLEMA ESPECÍFICO, no sobre conceptos abstractos.

Ejemplos de temas CONCRETOS (BUENOS):
- "Cómo reducir devoluciones de productos cosméticos"
- "Consejos para atender clientes con alergias estacionales"
- "Optimiza el espacio de tu mostrador de parafarmacia"

Ejemplos de temas ABSTRACTOS (MALOS):
- "El futuro de la farmacia digital"
- "Tendencias en el sector farmacéutico"
- "La transformación del retail farmacéutico"
```

### Parte 4: Verificar y corregir sincronización de WordPress

El `wordpress_context` debería guardarse pero está NULL. Necesito verificar:
1. Si la función se ejecutó realmente
2. Si hubo algún error silencioso
3. Si hay problema con los permisos de actualización

### Parte 5: Añadir validación post-generación

Después de que la IA genere el tema, verificar que no contenga palabras prohibidas y si las contiene, regenerar con temperatura más alta o un prompt más restrictivo.

## Cambios técnicos

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-article-saas/index.ts` | Añadir lista de palabras prohibidas, validación post-generación |
| Tabla `prompts` (saas.topic) | Actualizar con sección de prohibiciones explícitas |
| Tabla `sector_contexts` (nueva o existente) | Almacenar palabras prohibidas por sector |
| `supabase/functions/sync-wordpress-taxonomies-saas/index.ts` | Añadir logging para debug y verificar guardado |

## Resultado esperado

En lugar de:
- "Farmacia del futuro: digitalización más allá de la venta online"
- "Tendencias digitales clave para farmacias"

Generar:
- "Cómo organizar tu almacén de productos termolábiles"
- "5 errores comunes al atender consultas de dermocosmética"
- "Prepara tu farmacia para la campaña de gripe de este invierno"
