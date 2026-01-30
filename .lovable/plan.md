

# Plan: Corregir emails de notificacion a admins

## Problema

Los emails de notificacion a administradores en `generate-monthly-articles` usan el dominio de prueba `onboarding@resend.dev` en lugar del dominio verificado `hola@blooglee.com`.

## Cambios a realizar

### Archivo: supabase/functions/generate-monthly-articles/index.ts

#### Cambio 1: Email de notificacion diaria (Linea 1439-1444)

```typescript
// ANTES
await resend.emails.send({
  from: "Blooglee <onboarding@resend.dev>",
  to: NOTIFICATION_EMAILS,
  subject: `Blooglee ${now.getDate()}/${currentMonth}/${currentYear} - ${successCount} generados`,
  html: emailHtml,
});

// DESPUES
await resend.emails.send({
  from: "Blooglee <hola@blooglee.com>",
  reply_to: "info@blooglee.com",
  to: NOTIFICATION_EMAILS,
  subject: `Blooglee ${now.getDate()}/${currentMonth}/${currentYear} - ${successCount} generados`,
  html: emailHtml,
});
```

#### Cambio 2: Email de error fatal (Linea 1471-1481)

```typescript
// ANTES
await resend.emails.send({
  from: "Blooglee <onboarding@resend.dev>",
  to: NOTIFICATION_EMAILS,
  subject: "ERROR - Generación automática Blooglee",
  html: `...`,
});

// DESPUES
await resend.emails.send({
  from: "Blooglee <hola@blooglee.com>",
  reply_to: "info@blooglee.com",
  to: NOTIFICATION_EMAILS,
  subject: "ERROR - Generación automática Blooglee",
  html: `...`,
});
```

## Resultado esperado

| Email | Antes | Despues |
|-------|-------|---------|
| Notificacion diaria | onboarding@resend.dev | hola@blooglee.com |
| Error fatal | onboarding@resend.dev | hola@blooglee.com |
| Reply-to | (ninguno) | info@blooglee.com |

Esto garantiza que todos los emails del sistema usen el dominio verificado y las respuestas lleguen al buzon correcto.

