

# Plan: Ordenar Fichas Alfabéticamente

## Situación Actual

Los tres hooks ordenan las fichas por **fecha de creación** (`created_at`):

| Hook | Línea | Orden Actual |
|------|-------|--------------|
| `useFarmacias.ts` | 25 | `.order("created_at", { ascending: true })` |
| `useEmpresas.ts` | 29 | `.order("created_at", { ascending: true })` |
| `useSites.ts` | 60 | `.order('created_at', { ascending: true })` |

## Cambio Propuesto

Cambiar el orden de `created_at` a `name` en los tres hooks:

```typescript
// ANTES
.order("created_at", { ascending: true })

// DESPUÉS
.order("name", { ascending: true })
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useFarmacias.ts` | Línea 25: ordenar por `name` |
| `src/hooks/useEmpresas.ts` | Línea 29: ordenar por `name` |
| `src/hooks/useSites.ts` | Línea 60: ordenar por `name` |

## Resultado

Las fichas aparecerán ordenadas de la A a la Z:
- **MKPro Farmacias**: Farmacia Berenguer, Farmacia Bujanda, Farmacia Cervantes...
- **MKPro Empresas**: Buena Onda Acupuntura, MKPro, Raquel Alonso...
- **SaaS Sites**: ordenados alfabéticamente por nombre del sitio

---

## Sección Técnica

### useFarmacias.ts - Línea 25

```typescript
// ANTES
.order("created_at", { ascending: true });

// DESPUÉS
.order("name", { ascending: true });
```

### useEmpresas.ts - Línea 29

```typescript
// ANTES
.order("created_at", { ascending: true });

// DESPUÉS
.order("name", { ascending: true });
```

### useSites.ts - Línea 60

```typescript
// ANTES
.order('created_at', { ascending: true });

// DESPUÉS
.order('name', { ascending: true });
```

