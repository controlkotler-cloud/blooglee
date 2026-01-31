

# Plan: Sistema de Roles Avanzado, Usuarios Beta y Panel de Administracion

## Resumen Ejecutivo

Este plan implementa un sistema completo de gestion de usuarios con tres componentes principales:
1. Reestructuracion de roles (superadmin, mkpro_admin, beta, user)
2. Programa beta con registro especial y limites
3. Panel de administracion con gestion de usuarios y encuestas

---

## 1. Reestructuracion del Sistema de Roles

### Estado Actual
| user_id | email | rol actual |
|---------|-------|------------|
| 2840b1e0-... | control@mkpro.es | admin |
| a7041f91-... | laura@mkpro.es | mkpro_admin |

### Nuevos Roles Propuestos

| Rol | Descripcion | Permisos |
|-----|-------------|----------|
| **superadmin** | Administrador superior (tu cuenta) | Acceso completo: panel admin, MKPro, SaaS, gestion usuarios |
| **mkpro_admin** | Administrador MKPro (laura) | Solo acceso a /mkpro, sin panel admin |
| **beta** | Usuario beta (100 max) | Plan Starter gratis 3 meses, sujeto a encuestas |
| **user** | Usuario normal | Acceso SaaS segun su plan |

### Cambios en Base de Datos

```sql
-- Actualizar enum de roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'beta';

-- Migrar rol 'admin' de control@mkpro.es a 'superadmin'
UPDATE user_roles 
SET role = 'superadmin' 
WHERE user_id = '2840b1e0-0dcc-4c8f-969c-f086f4db0c90';
```

---

## 2. Programa de Usuarios Beta

### Requisitos
- Maximo 100 usuarios beta
- Plan Starter gratuito durante 3 meses desde la suscripcion
- Enlace de registro especifico: `/beta/[token]`
- Dos encuestas obligatorias

### Nueva Tabla: beta_invitations

```sql
CREATE TABLE beta_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  max_uses integer DEFAULT 100,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);
```

### Modificacion Tabla profiles

```sql
ALTER TABLE profiles ADD COLUMN is_beta boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN beta_started_at timestamptz;
ALTER TABLE profiles ADD COLUMN beta_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN beta_invitation_id uuid REFERENCES beta_invitations(id);
```

### Flujo de Registro Beta

```text
1. Usuario accede a /beta/CODIGO_UNICO
2. Sistema valida:
   - Token existe y esta activo
   - No se ha superado el limite de 100 usuarios
   - Token no ha expirado
3. Usuario completa registro normal
4. Sistema asigna automaticamente:
   - Rol: 'beta'
   - Plan: 'starter' (1 sitio, 4 posts/mes)
   - is_beta: true
   - beta_started_at: now()
   - beta_expires_at: now() + 3 meses
```

---

## 3. Sistema de Encuestas

### Nueva Tabla: surveys

```sql
CREATE TABLE surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL, -- 'wordpress_activation', 'beta_expiring'
  trigger_days_offset integer DEFAULT 0, -- dias antes/despues del evento
  questions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Nueva Tabla: survey_responses

```sql
CREATE TABLE survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  survey_id uuid NOT NULL REFERENCES surveys(id),
  responses jsonb NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, survey_id)
);
```

### Encuestas Predefinidas

**Encuesta 1: Post-activacion WordPress** (1 dia despues)
```json
{
  "questions": [
    {
      "id": "connection_experience",
      "type": "rating",
      "question": "¿Como fue la experiencia conectando tu WordPress?",
      "scale": 5
    },
    {
      "id": "had_problems",
      "type": "boolean",
      "question": "¿Tuviste algun problema durante la configuracion?"
    },
    {
      "id": "problem_description",
      "type": "text",
      "question": "Describe los problemas que encontraste",
      "conditional": "had_problems === true"
    },
    {
      "id": "setup_time",
      "type": "select",
      "question": "¿Cuanto tiempo te llevo configurar WordPress?",
      "options": ["Menos de 5 min", "5-15 min", "15-30 min", "Mas de 30 min"]
    }
  ]
}
```

**Encuesta 2: Pre-expiracion Beta** (7 dias antes de los 3 meses)
```json
{
  "questions": [
    {
      "id": "overall_experience",
      "type": "rating",
      "question": "Valoracion general de Blooglee",
      "scale": 10
    },
    {
      "id": "content_quality",
      "type": "rating",
      "question": "Calidad de los articulos generados",
      "scale": 5
    },
    {
      "id": "image_quality",
      "type": "rating",
      "question": "Calidad de las imagenes",
      "scale": 5
    },
    {
      "id": "automation_value",
      "type": "rating",
      "question": "Valor de la automatizacion",
      "scale": 5
    },
    {
      "id": "would_pay",
      "type": "boolean",
      "question": "¿Continuarias con un plan de pago?"
    },
    {
      "id": "max_price",
      "type": "select",
      "question": "¿Que precio maximo pagarias al mes?",
      "options": ["Menos de 10€", "10-20€", "20-50€", "Mas de 50€"]
    },
    {
      "id": "improvements",
      "type": "text",
      "question": "¿Que mejorarias de Blooglee?"
    }
  ]
}
```

---

## 4. Panel de Administracion

### Nueva Ruta: /admin

Solo accesible para usuarios con rol `superadmin`.

### Estructura del Panel

```text
/admin
├── Dashboard (resumen general)
├── Usuarios
│   ├── Lista de usuarios (filtros: plan, rol, fecha)
│   ├── Detalle usuario (editar plan, roles)
│   └── Usuarios beta (progreso, expiracion)
├── Encuestas
│   ├── Configuracion de encuestas
│   ├── Respuestas recibidas
│   └── Estadisticas
├── Invitaciones Beta
│   ├── Crear nueva invitacion
│   ├── Ver invitaciones activas
│   └── Estadisticas de uso
└── Sistema
    └── Logs de actividad (opcional futuro)
```

### Componentes del Panel Admin

**Vista Usuarios:**
- Tabla con: email, plan, rol, fecha registro, sitios creados, articulos generados
- Filtros: por plan, por rol, por fecha
- Acciones: cambiar plan, cambiar rol, ver detalle

**Vista Usuarios Beta:**
- Contador: X/100 usuarios beta activos
- Tabla: email, fecha inicio, dias restantes, encuestas completadas
- Alertas: usuarios proximos a expirar

**Vista Encuestas:**
- Editor de preguntas para cada encuesta
- Vista de respuestas con graficos
- Exportar respuestas a CSV

---

## 5. Archivos a Crear/Modificar

### Nuevos Archivos

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/admin/AdminDashboard.tsx` | Dashboard principal admin |
| `src/pages/admin/AdminUsers.tsx` | Gestion de usuarios |
| `src/pages/admin/AdminBetaUsers.tsx` | Usuarios beta |
| `src/pages/admin/AdminSurveys.tsx` | Configuracion encuestas |
| `src/pages/admin/AdminSurveyResponses.tsx` | Respuestas encuestas |
| `src/pages/admin/AdminBetaInvitations.tsx` | Invitaciones beta |
| `src/pages/BetaSignup.tsx` | Registro beta con token |
| `src/components/admin/AdminLayout.tsx` | Layout sidebar admin |
| `src/components/admin/UserTable.tsx` | Tabla de usuarios |
| `src/components/admin/SurveyEditor.tsx` | Editor de encuestas |
| `src/components/admin/SurveyStats.tsx` | Estadisticas encuestas |
| `src/components/saas/SurveyModal.tsx` | Modal encuesta para usuarios |
| `src/hooks/useAdminUsers.ts` | Hook gestion usuarios |
| `src/hooks/useAdminSurveys.ts` | Hook gestion encuestas |
| `src/hooks/useBetaInvitations.ts` | Hook invitaciones beta |
| `src/hooks/usePendingSurveys.ts` | Hook encuestas pendientes |

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useProfile.ts` | Anadir `useIsSuperAdmin()`, actualizar tipos |
| `src/components/ProtectedRoute.tsx` | Logica superadmin |
| `src/App.tsx` | Nuevas rutas /admin/*, /beta/:token |
| `src/pages/Auth.tsx` | Detectar registro beta |
| `src/pages/SaasDashboard.tsx` | Link al panel admin para superadmins |
| `supabase/functions/generate-monthly-articles/index.ts` | Verificar expiracion beta |

### Nuevas Edge Functions

| Funcion | Proposito |
|---------|-----------|
| `check-beta-surveys` | Cron diario para enviar encuestas pendientes |
| `admin-get-users` | API para listar usuarios (solo superadmin) |
| `admin-update-user` | API para modificar usuarios |

---

## 6. Flujo de Encuestas Automaticas

### Diagrama de Flujo

```text
Usuario Beta configura WordPress
          │
          ▼
    [1 dia despues]
          │
          ▼
   Cron detecta evento
          │
          ▼
 Marcar encuesta pendiente
          │
          ▼
Usuario entra al dashboard
          │
          ▼
    Modal encuesta aparece
          │
          ▼
   Usuario responde
          │
          ▼
 Guardar en survey_responses
```

### Disparadores de Encuestas

| Encuesta | Evento | Offset |
|----------|--------|--------|
| WordPress Setup | `wordpress_configs.created_at` | +1 dia |
| Beta Expiring | `profiles.beta_expires_at` | -7 dias |

---

## 7. Seguridad

### Politicas RLS

```sql
-- Solo superadmins pueden ver todos los usuarios
CREATE POLICY "Superadmins can view all profiles"
ON profiles FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

-- Solo superadmins pueden modificar roles
CREATE POLICY "Superadmins can manage user_roles"
ON user_roles FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Invitaciones beta son publicas para lectura (validar token)
CREATE POLICY "Anyone can validate beta invitations"
ON beta_invitations FOR SELECT
USING (true);

-- Solo superadmins pueden gestionar invitaciones
CREATE POLICY "Superadmins can manage beta invitations"
ON beta_invitations FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));
```

---

## 8. Estimacion de Trabajo

| Fase | Componentes | Complejidad |
|------|-------------|-------------|
| 1. Roles | Migracion DB, actualizar hooks | Media |
| 2. Beta | Tabla, registro, validacion | Media |
| 3. Encuestas | Tablas, editor, modal | Alta |
| 4. Panel Admin | Layout, vistas, graficos | Alta |
| 5. Automatizacion | Cron, disparadores | Media |

---

## 9. Orden de Implementacion Recomendado

1. **Fase 1**: Migracion de roles en DB + actualizar hooks
2. **Fase 2**: Panel admin basico (layout + lista usuarios)
3. **Fase 3**: Sistema beta (tabla, registro, invitaciones)
4. **Fase 4**: Sistema encuestas (tablas, editor, modal)
5. **Fase 5**: Automatizacion (cron encuestas, expiracion beta)

