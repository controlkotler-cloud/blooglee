# Plan: Tres Correcciones - ✅ COMPLETADO

## Resumen de Cambios Implementados

### 1. ✅ "Instagram" → "Enlace a tu mejor red social"

**Formularios actualizados:**
- `src/components/pharmacy/PharmacyForm.tsx` - Label cambiado
- `src/components/company/CompanyForm.tsx` - Label cambiado  
- `src/components/saas/SiteSettings.tsx` - Label cambiado

**Footer de artículos actualizado:**
- `generate-article` - "nuestras redes sociales" (ES) / "les nostres xarxes socials" (CA)
- `generate-article-empresa` - (usa función generateClosingParagraph)
- `generate-article-saas` - "nuestras redes sociales" (ES) / "les nostres xarxes socials" (CA)

---

### 2. ✅ Laura recibe emails de notificación

**Cambio implementado:**
```typescript
// ANTES
const NOTIFICATION_EMAIL = "controlkotler@gmail.com";

// DESPUÉS
const NOTIFICATION_EMAILS = ["controlkotler@gmail.com", "laura@mkpro.es"];
```

**Archivos modificados:**
- `supabase/functions/generate-article/index.ts`
- `supabase/functions/generate-article-empresa/index.ts`

---

### 3. ✅ Error "Body already consumed" corregido

**Problema:**
El código en `generate-article-saas` llamaba a `req.json()` dos veces:
- Línea 380: para verificar scheduler mode
- Línea 441: para obtener siteId, topic, etc.

**Solución:**
Reutilizar los datos ya parseados de `requestBody`:
```typescript
// Antes
const { siteId, topic: providedTopic, month, year }: RequestBody = await req.json();

// Después  
const { siteId, topic: providedTopic, month, year } = requestBody;
```

---

## Edge Functions Desplegadas

✅ `generate-article`
✅ `generate-article-empresa`  
✅ `generate-article-saas`

---

## Verificación

Para verificar los cambios:
1. **Formularios**: Edita una farmacia/empresa/site y verifica el nuevo label
2. **Emails**: Genera un artículo en MKPro y verifica que Laura recibe el email
3. **SaaS**: Intenta generar un artículo en FarmaPro - ya no debería dar error
