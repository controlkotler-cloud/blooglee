

# Plan: Cambiar remitente de emails a hola@blooglee.com

## Problema actual

Ambas Edge Functions tienen hardcodeado el dominio de prueba de Resend:

| Archivo | Linea | Codigo actual |
|---------|-------|---------------|
| `send-newsletter/index.ts` | 248 | `from: "Blooglee <onboarding@resend.dev>"` |
| `subscribe-newsletter/index.ts` | 212 | `from: "Blooglee <onboarding@resend.dev>"` |

Este dominio solo permite enviar emails al propietario de la cuenta de Resend.

---

## Solucion

Cambiar ambas lineas para usar el dominio verificado:

```typescript
from: "Blooglee <hola@blooglee.com>"
```

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/send-newsletter/index.ts` | Linea 248: cambiar `onboarding@resend.dev` por `hola@blooglee.com` |
| `supabase/functions/subscribe-newsletter/index.ts` | Linea 212: cambiar `onboarding@resend.dev` por `hola@blooglee.com` |

---

## Codigo

### send-newsletter/index.ts (linea 248)

```typescript
// Antes
from: "Blooglee <onboarding@resend.dev>",

// Despues
from: "Blooglee <hola@blooglee.com>",
```

### subscribe-newsletter/index.ts (linea 212)

```typescript
// Antes
from: "Blooglee <onboarding@resend.dev>",

// Despues
from: "Blooglee <hola@blooglee.com>",
```

---

## Resultado esperado

1. Los emails de newsletter diaria llegaran a todos los suscriptores
2. Los emails de bienvenida al suscribirse llegaran correctamente
3. Los emails mostraran "Blooglee" como nombre del remitente
4. Los destinatarios veran `hola@blooglee.com` como direccion de origen

