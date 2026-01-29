

# Plan: Permitir Múltiples Generaciones Concurrentes con Indicador Visual Correcto

## Problema Actual

Cuando haces clic en "Regenerar" para una empresa y luego en otra:
- El primer botón deja de mostrar "Generando..."
- Parece que ha parado, pero sigue generando en segundo plano
- El usuario hace clic otra vez pensando que falló → genera otro artículo innecesario

**Causa técnica:**
```typescript
// Solo puede guardar UN id a la vez
const [generatingId, setGeneratingId] = useState<string | null>(null);

// Al generar una nueva empresa, sobrescribe el id anterior
setGeneratingId(company.id);  // ← El anterior desaparece
```

## Solución

Cambiar de un único ID a un **Set de IDs** que permita trackear múltiples generaciones simultáneas.

## Cambios por Archivo

### 1. `src/pages/MKPro.tsx`

**Estado actual:**
```typescript
const [generatingId, setGeneratingId] = useState<string | null>(null);
```

**Nuevo estado:**
```typescript
const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

// Helpers para añadir/quitar
const addGeneratingId = (id: string) => {
  setGeneratingIds(prev => new Set(prev).add(id));
};
const removeGeneratingId = (id: string) => {
  setGeneratingIds(prev => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
};
```

**En handleGenerateArticleEmpresa:**
```typescript
// Antes:
setGeneratingId(company.id);
// ...
setGeneratingId(null);

// Después:
addGeneratingId(company.id);
// ...
removeGeneratingId(company.id);
```

**En CompanyCard:**
```typescript
// Antes:
isGenerating={generatingId === company.id}

// Después:
isGenerating={generatingIds.has(company.id)}
```

**Lo mismo para farmacias (handleGenerateArticle, PharmacyCard).**

### 2. `src/pages/Index.tsx`

Aplicar exactamente los mismos cambios (es una copia del patrón de MKPro para la ruta legacy `/`).

### 3. `src/pages/SaasDashboard.tsx` (Blooglee)

**Problema actual:**
```typescript
isGenerating={generateMutation.isPending && generateMutation.variables?.siteId === site.id}
```
React Query solo trackea una mutación pending por hook.

**Solución:**
```typescript
const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

const handleGenerateArticle = async (siteId: string) => {
  setGeneratingIds(prev => new Set(prev).add(siteId));
  try {
    await generateMutation.mutateAsync({ siteId });
  } finally {
    setGeneratingIds(prev => {
      const next = new Set(prev);
      next.delete(siteId);
      return next;
    });
  }
};

// En SiteCard:
isGenerating={generatingIds.has(site.id)}
```

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/MKPro.tsx` | `generatingId` → `generatingIds: Set<string>` + helpers |
| `src/pages/Index.tsx` | Mismo cambio |
| `src/pages/SaasDashboard.tsx` | Añadir estado `generatingIds` + wrapper async para handleGenerateArticle |

## Resultado Esperado

- Puedes hacer clic en "Regenerar" en varias empresas seguidas
- TODOS los botones muestran "Generando..." mientras procesan
- Cada uno se quita del Set solo cuando SU generación termina
- No hay confusión visual ni clics duplicados accidentales

---

## Sección Técnica

### Por qué Set en lugar de Array

- `Set.has(id)` es O(1) vs `Array.includes(id)` que es O(n)
- Evita duplicados automáticamente
- Más semántico para "conjunto de cosas activas"

### Compatibilidad con "Generar Todos"

El flujo de `handleGenerateAll` / `handleGenerateAllEmpresas` seguirá funcionando porque:
- Antes de cada generación individual, añade el ID al Set
- Al terminar, lo quita
- El indicador de progreso general (`generatingAll`, `generationProgress`) sigue igual

