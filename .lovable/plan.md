# Plan: Múltiples Generaciones Concurrentes ✅ COMPLETADO

## Problema Resuelto

Cuando se hacía clic en "Regenerar" para una empresa y luego en otra:
- El primer botón dejaba de mostrar "Generando..."
- Parecía que había parado, pero seguía generando en segundo plano
- El usuario hacía clic otra vez pensando que falló → generaba otro artículo innecesario

## Solución Implementada

Cambio de un único ID (`generatingId`) a un **Set de IDs** (`generatingIds`) que permite trackear múltiples generaciones simultáneas.

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/pages/MKPro.tsx` | `generatingId` → `generatingIds: Set<string>` + helpers `addGeneratingId`/`removeGeneratingId` |
| `src/pages/Index.tsx` | Mismo cambio |
| `src/pages/SaasDashboard.tsx` | Añadido estado `generatingIds` + wrapper async para `handleGenerateArticle` |

## Resultado

- ✅ Puedes hacer clic en "Regenerar" en varias empresas seguidas
- ✅ TODOS los botones muestran "Generando..." mientras procesan
- ✅ Cada uno se quita del Set solo cuando SU generación termina
- ✅ No hay confusión visual ni clics duplicados accidentales
- ✅ Compatible con "Generar Todos" (el flujo sigue funcionando)
