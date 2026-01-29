
# Plan: Corregir Boton Header Movil + Restringir Import/Export a Plan Agency

## Problema 1: Boton Cortado en Header Movil

### Analisis
En `SiteDetail.tsx` linea 95-112, el boton "Configura WP primero" tiene texto muy largo que no cabe en pantallas moviles. El header actual no gestiona bien el espacio reducido.

### Solucion
Hacer el boton responsive con texto corto en movil:
- Movil: Solo icono (Lock) + texto muy corto o solo "Configurar WP"
- Desktop: Texto completo "Configura WP primero" / "Generar articulo"

```tsx
// Texto adaptativo segun tamanio
<Button ...>
  {isGenerating ? (
    <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
  ) : canGenerate ? (
    <Sparkles className="w-4 h-4 sm:mr-2" />
  ) : (
    <Lock className="w-4 h-4 sm:mr-2" />
  )}
  <span className="hidden sm:inline">
    {isGenerating ? 'Generando...' : canGenerate ? 'Generar articulo' : 'Configura WP primero'}
  </span>
  <span className="sm:hidden">
    {isGenerating ? '...' : canGenerate ? 'Generar' : 'WP'}
  </span>
</Button>
```

### Archivo a modificar
- `src/pages/SiteDetail.tsx` (lineas 95-112)

---

## Problema 2: Import/Export Solo para Plan Agency

### Analisis
El componente `SiteImportExport` se muestra siempre en `SaasDashboard.tsx` lineas 228-235, sin importar el plan del usuario. Solo tiene sentido para el plan Agency (subidas masivas de 10+ sitios).

### Solucion
Mostrar condicionalmente solo si `plan === 'agency'`:

```tsx
{/* Import/Export section - Solo plan Agency */}
{plan === 'agency' && (
  <div className="mt-6">
    <SiteImportExport
      sites={sites}
      articles={articles}
      sitesLimit={sitesLimit}
      onImportSites={(sitesToImport) => importSitesMutation.mutate(sitesToImport)}
    />
  </div>
)}
```

### Archivo a modificar
- `src/pages/SaasDashboard.tsx` (lineas 227-235)

---

## Resumen de Cambios

| Archivo | Lineas | Cambio |
|---------|--------|--------|
| `src/pages/SiteDetail.tsx` | 95-112 | Boton responsive con texto corto en movil |
| `src/pages/SaasDashboard.tsx` | 227-235 | Mostrar import/export solo si plan === 'agency' |

## Resultado Esperado

1. **Header movil limpio**: El boton muestra texto corto "WP" o "Generar" en movil, texto completo en desktop
2. **Import/Export exclusivo**: Solo usuarios con plan Agency (149E/mes) ven la seccion de importacion masiva

---

## Seccion Tecnica

### Cambio en SiteDetail.tsx

```tsx
// Lineas 95-112 actuales
<Button 
  onClick={handleGenerateArticle} 
  disabled={isGenerating}
  className={canGenerate 
    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
    : "border-amber-500/50 text-amber-700 hover:bg-amber-50"
  }
  variant={canGenerate ? "default" : "outline"}
>
  {isGenerating ? (
    <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
  ) : canGenerate ? (
    <Sparkles className="w-4 h-4 sm:mr-2" />
  ) : (
    <Lock className="w-4 h-4 sm:mr-2" />
  )}
  {/* Texto desktop */}
  <span className="hidden sm:inline">
    {isGenerating ? 'Generando...' : canGenerate ? 'Generar articulo' : 'Configura WP primero'}
  </span>
  {/* Texto movil */}
  <span className="sm:hidden">
    {isGenerating ? '' : canGenerate ? 'Generar' : 'WP'}
  </span>
</Button>
```

### Cambio en SaasDashboard.tsx

```tsx
// Lineas 227-235 actuales
{/* Import/Export section - Solo para Agency */}
{plan === 'agency' && (
  <div className="mt-6">
    <SiteImportExport
      sites={sites}
      articles={articles}
      sitesLimit={sitesLimit}
      onImportSites={(sitesToImport) => importSitesMutation.mutate(sitesToImport)}
    />
  </div>
)}
```
