
# Plan: Corregir ultimo email con dominio @resend.dev

## Hallazgo

Existe **1 email adicional** que aun usa el dominio de prueba:

| Linea | Proposito | Estado actual |
|-------|-----------|---------------|
| 1088 | Notificacion limite alcanzado (usuarios SaaS) | `onboarding@resend.dev` |

Este email se envia a usuarios SaaS cuando su sitio intenta generar un articulo pero ha superado el limite de su plan.

## Cambio a realizar

### Archivo: supabase/functions/generate-monthly-articles/index.ts

**Linea 1087-1098:**

```typescript
// ANTES
await resend.emails.send({
  from: "Blooglee <onboarding@resend.dev>",
  to: [limits.userEmail],
  subject: `Límite de artículos alcanzado - ${site.name}`,
  html: `...`,
});

// DESPUES
await resend.emails.send({
  from: "Blooglee <hola@blooglee.com>",
  reply_to: "info@blooglee.com",
  to: [limits.userEmail],
  subject: `Límite de artículos alcanzado - ${site.name}`,
  html: `...`,
});
```

## Resumen de todos los emails corregidos

| Email | Archivo | Estado |
|-------|---------|--------|
| Newsletter diaria | send-newsletter | Ya corregido |
| Email bienvenida | subscribe-newsletter | Ya corregido |
| Notificacion admin diaria | generate-monthly-articles (L1439) | Ya corregido |
| Notificacion error fatal | generate-monthly-articles (L1471) | Ya corregido |
| **Limite alcanzado SaaS** | generate-monthly-articles (L1088) | **Pendiente** |

## Resultado final

Tras este cambio, **todos los emails del sistema** usaran el dominio verificado `hola@blooglee.com`.
