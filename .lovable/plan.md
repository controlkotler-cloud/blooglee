

## Plan: Permitir a Admins Acceso Libre a Dashboard y MKPro

### Problema Actual

La lógica en `ProtectedRoute.tsx` fuerza a todos los usuarios con rol `admin` o `mkpro_admin` a ir siempre a `/mkpro`, sin poder acceder al dashboard SaaS.

```
Flujo actual:
Usuario con mkpro_admin → SIEMPRE redirigido a /mkpro
Usuario sin sites → SIEMPRE redirigido a /onboarding
```

### Solución Propuesta

Cambiar la lógica para que los admins tengan **acceso libre** a todas las rutas protegidas, sin redirecciones forzadas.

```
Flujo nuevo:
Usuario admin → Puede navegar libremente (dashboard, mkpro, site/:id, etc.)
Usuario normal sin sites → Redirigido a /onboarding
Usuario normal con sites → Acceso a dashboard y sites
```

---

## Cambios en ProtectedRoute.tsx

### Lógica Actual (líneas 27-38)
```typescript
// MKPro admins should go to /mkpro, not onboarding
if (isMKProAdmin) {
  if (location.pathname !== '/mkpro') {
    navigate('/mkpro', { replace: true });
  }
  return;
}

// Regular users without sites go to onboarding
if (sites?.length === 0 && location.pathname !== '/onboarding') {
  navigate('/onboarding', { replace: true });
}
```

### Lógica Nueva
```typescript
// Admins have free access to all protected routes
if (isAdmin) {
  // No forced redirects - admins can go anywhere
  return;
}

// MKPro-only admins (not full admins) go to /mkpro
if (isMKProAdmin && !isAdmin) {
  if (location.pathname !== '/mkpro') {
    navigate('/mkpro', { replace: true });
  }
  return;
}

// Regular users without sites go to onboarding
if (sites?.length === 0 && location.pathname !== '/onboarding') {
  navigate('/onboarding', { replace: true });
}
```

---

## Cambios en useProfile.ts

Agregar un nuevo hook `useIsAdmin` para distinguir entre:
- `admin`: Acceso total a todo (dashboard SaaS + MKPro)
- `mkpro_admin`: Solo acceso a MKPro

```typescript
export function useIsAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  
  const isAdmin = roles.some(r => r.role === 'admin');
  
  return { isAdmin, isLoading };
}

// Modificar useIsMKProAdmin para excluir admins
export function useIsMKProAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  
  const isMKProAdmin = roles.some(r => r.role === 'mkpro_admin');
  const isAdmin = roles.some(r => r.role === 'admin');
  
  return { 
    isMKProAdmin, 
    isAdmin,
    canAccessMKPro: isMKProAdmin || isAdmin,
    isLoading 
  };
}
```

---

## Cambio de Rol en Base de Datos

Tu usuario actual (`control@mkpro.es`) tiene rol `mkpro_admin`. Para tener acceso libre a todo, necesitas el rol `admin`:

```sql
-- Opción 1: Cambiar el rol existente a admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = '2840b1e0-0dcc-4c8f-969c-f086f4db0c90';

-- Opción 2: Agregar rol admin adicional (mantener mkpro_admin)
INSERT INTO user_roles (user_id, role)
VALUES ('2840b1e0-0dcc-4c8f-969c-f086f4db0c90', 'admin');
```

---

## Actualización del Dashboard SaaS

En `SaasDashboard.tsx`, agregar acceso directo a MKPro para admins:

```typescript
// Ya existe en el menú, pero asegurar que esté visible:
{canAccessMKPro && (
  <DropdownMenuItem onClick={() => navigate('/mkpro')}>
    MKPro Admin
  </DropdownMenuItem>
)}
```

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useProfile.ts` | Agregar `useIsAdmin`, modificar `useIsMKProAdmin` |
| `src/components/ProtectedRoute.tsx` | Nueva lógica de redirección para admins |
| Base de datos | Cambiar/agregar rol `admin` a tu usuario |

---

## Resultado Final

| Rol | Acceso Dashboard SaaS | Acceso MKPro | Requiere Sites |
|-----|----------------------|--------------|----------------|
| `admin` | Si | Si | No |
| `mkpro_admin` | No | Si | N/A |
| `user` | Si | No | Si (o va a onboarding) |

Tu usuario con rol `admin` podrá:
- Acceder a `/dashboard` sin tener sitios
- Acceder a `/mkpro` cuando lo necesites
- Navegar libremente por todas las rutas protegidas

