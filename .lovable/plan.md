
# Plan: Corregir el registro de usuarios Beta

## Diagnóstico del problema

Cuando un usuario se registra via `/beta/:token`, ocurren **2 errores** en la base de datos:

| Error | Causa | Consecuencia |
|-------|-------|--------------|
| `profiles_plan_check` | Solo permite `free`, `pro`, `agency` | No se puede asignar plan `starter` |
| RLS en `user_roles` | Solo superadmins pueden insertar | El usuario no puede asignar rol `beta` a sí mismo |

**Resultado**: El usuario `controlkotler@gmail.com` quedó registrado con `is_beta: false`, `plan: free`, y sin rol `beta`.

## Solución propuesta

### Parte 1: Arreglar el CHECK constraint

Actualizar el constraint para incluir `'starter'`:

```sql
ALTER TABLE profiles DROP CONSTRAINT profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('free', 'starter', 'pro', 'agency'));
```

### Parte 2: Crear Edge Function para registro beta

Crear una Edge Function `register-beta-user` que use el `service_role` para:
1. Actualizar el perfil con datos beta (is_beta, fechas, plan)
2. Insertar el rol 'beta' en user_roles
3. Incrementar usos de la invitación

Esto evita los problemas de RLS ya que el service_role bypassa todas las políticas.

### Parte 3: Actualizar BetaSignup.tsx

Modificar el componente para:
1. Crear el usuario con `signUp` (esto ya funciona)
2. Llamar a la Edge Function para completar el registro beta

## Cambios técnicos

### 1. Migración SQL
- Actualizar `profiles_plan_check` para incluir `'starter'`

### 2. Nueva Edge Function: `register-beta-user`

```typescript
// Recibe: user_id, invitation_id
// Acciones:
// 1. Actualiza profiles con is_beta, beta_started_at, beta_expires_at, plan='starter'
// 2. Inserta rol 'beta' en user_roles
// 3. Incrementa current_uses en beta_invitations
```

### 3. Modificar BetaSignup.tsx

```typescript
// Después de signUp exitoso:
const { error } = await supabase.functions.invoke('register-beta-user', {
  body: { 
    user_id: authData.user.id, 
    invitation_id: invitation.id 
  }
});
```

### 4. Corregir usuario existente

El usuario `controlkotler@gmail.com` necesita ser corregido manualmente:

```sql
-- Actualizar perfil
UPDATE profiles SET 
  is_beta = true,
  beta_started_at = NOW(),
  beta_expires_at = NOW() + INTERVAL '3 months',
  plan = 'starter'
WHERE email = 'controlkotler@gmail.com';

-- Añadir rol beta
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'beta' FROM profiles WHERE email = 'controlkotler@gmail.com';
```

## Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Actualizar `profiles_plan_check` |
| `supabase/functions/register-beta-user/index.ts` | CREAR - Lógica de registro beta |
| `supabase/config.toml` | Añadir nueva función |
| `src/pages/BetaSignup.tsx` | Usar Edge Function en lugar de operaciones directas |

## Resultado esperado

1. El constraint permite plan `starter`
2. Los nuevos usuarios beta se registran correctamente
3. El usuario existente `controlkotler@gmail.com` aparece en el panel de beta
4. El flujo completo funciona sin errores de RLS
