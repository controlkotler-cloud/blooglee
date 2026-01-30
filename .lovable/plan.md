

# Plan: Actualizar API Key de Resend

## Resumen

Actualizar el secret `RESEND_API_KEY` con la nueva clave de la cuenta de Resend.

## Acciones

| Paso | Accion |
|------|--------|
| 1 | Actualizar el secret `RESEND_API_KEY` con el nuevo valor `re_KCkHLD5H_3wyLqWBY73JvabzkcK4opQcg` |
| 2 | Redesplegar las Edge Functions para que usen la nueva clave |

## Configuracion actual (se mantiene)

La configuracion del remitente ya esta correcta en el codigo:

- **Remitente:** `Blooglee <hola@blooglee.com>`
- **Edge Functions afectadas:**
  - `send-newsletter` - Newsletter diaria
  - `subscribe-newsletter` - Email de bienvenida

## Seccion Tecnica

### Secret a actualizar

```
Nombre: RESEND_API_KEY
Valor: re_KCkHLD5H_3wyLqWBY73JvabzkcK4opQcg
```

### Verificacion post-actualizacion

Tras actualizar el secret, se recomienda:
1. Suscribirse a la newsletter para probar el email de bienvenida
2. Ejecutar manualmente `send-newsletter` para verificar el envio

## Resultado esperado

Los emails se enviaran usando la nueva cuenta de Resend mientras mantienen la configuracion actual del remitente `hola@blooglee.com`.

