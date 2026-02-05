

## Plan: Estado de generacion global y persistente para botones

### Problema identificado

Actualmente el estado de "generando" (`isGenerating`) se gestiona de forma local en cada componente:

| Ubicacion | Estado | Problema |
|-----------|--------|----------|
| `SaasDashboard` | `useState<Set<string>>(generatingIds)` | Se pierde al navegar a otra pagina |
| `SiteDetail` | `generateMutation.isPending` | Es una instancia diferente del hook, no comparte estado |
| `MKPro` | `useState<Set<string>>(generatingIds)` | Se pierde al navegar |

### Solucion propuesta

Crear un **React Context global** que mantenga el estado de las generaciones activas y lo comparta entre todas las paginas/componentes.

### Arquitectura

```text
GenerationContext (global)
    |
    +-- generatingIds: Set<string>  (IDs de sites/farmacias/empresas generando)
    |
    +-- addGenerating(id)  --> Marca como "generando"
    +-- removeGenerating(id)  --> Marca como "completado"
    +-- isGenerating(id)  --> Consulta si un ID esta generando
```

### Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `src/contexts/GenerationContext.tsx` | Context global con estado de generaciones activas |

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `src/App.tsx` | Envolver la app con `GenerationProvider` |
| `src/hooks/useArticlesSaas.ts` | Integrar con el contexto en `useGenerateArticleSaas` |
| `src/hooks/useArticulos.ts` | Integrar con el contexto en `useGenerateArticle` |
| `src/hooks/useArticulosEmpresas.ts` | Integrar con el contexto en `useGenerateArticleEmpresa` |
| `src/pages/SaasDashboard.tsx` | Usar el contexto en lugar de estado local |
| `src/pages/SiteDetail.tsx` | Usar el contexto para mostrar estado correcto |
| `src/pages/MKPro.tsx` | Usar el contexto en lugar de estado local |
| `src/components/saas/SiteCard.tsx` | Recibir `isGenerating` del contexto (ya lo recibe por props, OK) |
| `src/components/saas/SiteArticles.tsx` | Recibir `isGenerating` del contexto |

### Detalle tecnico

#### 1. GenerationContext.tsx (nuevo archivo)

```typescript
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GenerationContextType {
  generatingIds: Set<string>;
  addGenerating: (id: string) => void;
  removeGenerating: (id: string) => void;
  isGenerating: (id: string) => boolean;
  isAnyGenerating: boolean;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const addGenerating = useCallback((id: string) => {
    setGeneratingIds(prev => new Set(prev).add(id));
  }, []);

  const removeGenerating = useCallback((id: string) => {
    setGeneratingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isGenerating = useCallback((id: string) => {
    return generatingIds.has(id);
  }, [generatingIds]);

  const isAnyGenerating = generatingIds.size > 0;

  return (
    <GenerationContext.Provider value={{ 
      generatingIds, 
      addGenerating, 
      removeGenerating, 
      isGenerating, 
      isAnyGenerating 
    }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
}
```

#### 2. Modificar hooks de generacion

Cada hook de generacion llamara al contexto para marcar inicio/fin:

```typescript
// En useGenerateArticleSaas
export function useGenerateArticleSaas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addGenerating, removeGenerating } = useGeneration();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams) => {
      addGenerating(params.siteId);  // Marcar como generando
      try {
        // ... logica existente
        return data;
      } catch (error) {
        throw error;
      }
    },
    onSettled: (_, __, params) => {
      removeGenerating(params.siteId);  // Siempre limpiar al terminar
    },
    // ... resto igual
  });
}
```

#### 3. Modificar SaasDashboard

Eliminar el estado local y usar el contexto:

```typescript
// Antes
const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

// Despues
const { isGenerating } = useGeneration();

// En SiteCard
isGenerating={isGenerating(site.id)}
```

#### 4. Modificar SiteDetail

Usar el contexto para mostrar el estado real:

```typescript
const { isGenerating } = useGeneration();

// En el boton
const isCurrentlyGenerating = isGenerating(site.id);

<Button disabled={isCurrentlyGenerating}>
  {isCurrentlyGenerating ? 'Generando...' : 'Generar'}
</Button>
```

#### 5. Modificar MKPro

Igual que SaasDashboard, usar el contexto global:

```typescript
const { isGenerating, addGenerating, removeGenerating } = useGeneration();

// En PharmacyCard
isGenerating={isGenerating(pharmacy.id)}

// En CompanyCard  
isGenerating={isGenerating(company.id)}
```

### Flujo de uso

```text
Usuario en Dashboard
    |
    +-- Click "Generar" en SiteCard
    |       |
    |       +-- addGenerating(siteId) --> Set.add(siteId)
    |       +-- Boton muestra "Generando..." con spinner
    |
    +-- Usuario navega a SiteDetail
    |       |
    |       +-- isGenerating(siteId) --> true
    |       +-- Boton muestra "Generando..." (estado persistido)
    |
    +-- Usuario vuelve a Dashboard
    |       |
    |       +-- isGenerating(siteId) --> true (sigue mostrando)
    |
    +-- Generacion termina
            |
            +-- removeGenerating(siteId) --> Set.delete(siteId)
            +-- Todos los botones se actualizan automaticamente
```

### Beneficios

1. **Estado consistente**: El boton muestra "Generando" en cualquier pantalla
2. **No se pierde al navegar**: El estado vive en el contexto global
3. **Multiples generaciones**: Soporta generar varios sites/farmacias a la vez
4. **Reactivo**: Al terminar, todos los componentes se actualizan

### Consideraciones

- El estado es **en memoria**, si el usuario recarga la pagina se pierde (esto es aceptable porque la generacion ya esta en proceso en el backend)
- Para persistir entre recargas, se podria usar `sessionStorage` o una tabla en la base de datos, pero añade complejidad innecesaria
- Los hooks de generacion deben llamarse dentro del `GenerationProvider` (App.tsx lo envuelve todo)

### Resumen de cambios

| Accion | Archivo |
|--------|---------|
| CREAR | `src/contexts/GenerationContext.tsx` |
| MODIFICAR | `src/App.tsx` (añadir Provider) |
| MODIFICAR | `src/hooks/useArticlesSaas.ts` |
| MODIFICAR | `src/hooks/useArticulos.ts` |
| MODIFICAR | `src/hooks/useArticulosEmpresas.ts` |
| MODIFICAR | `src/pages/SaasDashboard.tsx` |
| MODIFICAR | `src/pages/SiteDetail.tsx` |
| MODIFICAR | `src/pages/MKPro.tsx` |

