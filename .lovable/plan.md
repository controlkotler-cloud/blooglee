
## Plan: Mejoras de Deduplicacion y Verificacion de Enlaces

### ✅ COMPLETADO

---

### Problema 1: Memoria de deduplicacion insuficiente para sitios diarios

**Cambio implementado en `generate-article-saas/index.ts`:**

```typescript
function getTopicsLimitForFrequency(publishFrequency: string): number {
  switch (publishFrequency) {
    case 'daily':
    case 'daily_weekdays':
      return 60; // ~2 meses de memoria para diario
    case 'weekly':
    case 'biweekly':
      return 30; // ~6-7 meses para semanal
    case 'monthly':
    default:
      return 20; // ~20 meses para mensual
  }
}
```

- ✅ `getUsedTopicsForSite()` ahora acepta límite dinámico
- ✅ La lógica de generación usa el límite según la frecuencia del site

---

### Problema 2: Enlaces externos que dan 404

**Cambio implementado:**

Nueva función `verifyAndCleanExternalLinks()` que:
1. Extrae todos los enlaces externos del HTML generado
2. Verifica cada uno con HEAD request (timeout 5s)
3. Elimina los enlaces rotos, dejando solo el texto del ancla

Integrada en el flujo antes de guardar el artículo:
```typescript
if (spanishArticle?.content) {
  spanishArticle.content = await verifyAndCleanExternalLinks(spanishArticle.content);
}
if (catalanArticle?.content) {
  catalanArticle.content = await verifyAndCleanExternalLinks(catalanArticle.content);
}
```

---

### Pendiente para consistencia (opcional)

- [ ] Aplicar mismos cambios a `generate-article/index.ts` (MKPro farmacias)
- [ ] Aplicar mismos cambios a `generate-article-empresa/index.ts` (MKPro empresas)

Estos archivos están en zona protegida. Si deseas aplicar las mejoras, indícalo explícitamente.
