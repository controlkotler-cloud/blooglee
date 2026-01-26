

## Plan: Crear Contexto de Autenticación Compartido para Resolver Error de Creación de Sitios

### Diagnóstico del Problema

El error "No user logged in" ocurre porque:

1. El hook `useAuth` crea **estado local independiente** cada vez que se usa
2. `ProtectedRoute` tiene una instancia de `useAuth` → detecta sesión correctamente
3. `useCreateSite` (usado en Onboarding) tiene **otra instancia** → su estado puede no estar sincronizado
4. Cuando haces clic en "Finalizar", la instancia de `useCreateSite` puede no haber recibido aún el evento de auth

---

### Flujo del Problema

```text
ProtectedRoute (useAuth #1)                 Onboarding (useCreateSite → useAuth #2)
        |                                              |
   ✓ session existe                              ? session = null (race condition)
        |                                              |
   renderiza children                         "No user logged in" ❌
```

---

### Solución: AuthContext Compartido

Crear un **React Context** que mantenga el estado de autenticación en un solo lugar, y que todos los componentes consuman ese mismo estado.

---

### Cambios a Realizar

#### 1. Crear AuthContext (`src/contexts/AuthContext.tsx`)

**Nuevo archivo:**

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

#### 2. Modificar `src/App.tsx`

Envolver toda la aplicación con `AuthProvider`:

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* ... resto igual ... */}
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

---

#### 3. Actualizar `src/hooks/useAuth.ts`

Cambiar para que re-exporte desde el contexto (mantener compatibilidad):

```typescript
// Re-export from context for backward compatibility
export { useAuth } from '@/contexts/AuthContext';
```

---

#### 4. Sin cambios adicionales necesarios

Todos los archivos que actualmente usan `useAuth`:
- `src/hooks/useSites.ts`
- `src/components/ProtectedRoute.tsx`
- `src/pages/Onboarding.tsx`
- etc.

Seguirán funcionando porque el import path `@/hooks/useAuth` ahora re-exporta desde el contexto.

---

### Resultado Esperado

```text
                    AuthProvider (estado único)
                           |
            ┌──────────────┴──────────────┐
            |                              |
     ProtectedRoute                   useCreateSite
      (consume contexto)             (consume contexto)
            |                              |
       ✓ session                      ✓ session
       ✓ user.id                      ✓ user.id
```

Ahora `ProtectedRoute` y `useCreateSite` comparten el **mismo estado de autenticación**, eliminando la condición de carrera.

---

### Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/contexts/AuthContext.tsx` | **CREAR** - Nuevo contexto de autenticación |
| `src/App.tsx` | Añadir `AuthProvider` wrapper |
| `src/hooks/useAuth.ts` | Re-exportar desde el contexto |

