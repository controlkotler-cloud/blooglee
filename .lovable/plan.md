

# Plan: Tres Correcciones - Instagram/Redes, Emails Laura y Error SaaS

## Resumen de los Tres Problemas

### 1. Cambiar "Instagram" por "Enlace a tu mejor red social"
- **Ubicación**: Formularios de configuración de farmacias, empresas y sites
- **También**: Cambiar el pie de los artículos de "Instagram" a "Redes sociales"

### 2. Laura no recibe emails individuales de publicación
- **Problema**: Las funciones `generate-article` y `generate-article-empresa` envían emails solo a `controlkotler@gmail.com`
- **Causa**: La constante `NOTIFICATION_EMAIL` está configurada como un solo email, no como array
- **Solución**: Cambiar a array `NOTIFICATION_EMAILS = ["controlkotler@gmail.com", "laura@mkpro.es"]`

### 3. Error "Body already consumed" en generate-article-saas
- **Causa**: El código llama a `req.json()` DOS veces:
  - Línea 380: `const requestBody = await req.json()` (para verificar scheduler mode)
  - Línea 441: `const { siteId, topic, ... } = await req.json()` (para obtener datos)
- **Solución**: Usar los datos ya parseados de la primera llamada

---

## Parte 1: Cambios en Formularios y Artículos

### Archivos UI a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/pharmacy/PharmacyForm.tsx` | Cambiar label "Instagram" → "Enlace a tu mejor red social" |
| `src/components/company/CompanyForm.tsx` | Cambiar label "URL de Instagram" → "Enlace a tu mejor red social" |
| `src/components/saas/SiteSettings.tsx` | Cambiar label "URL de Instagram" → "Enlace a tu mejor red social" |

### Edge Functions a Modificar (Footer de artículos)

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-article/index.ts` | Cambiar texto "Instagram" → "Redes sociales" en footer |
| `supabase/functions/generate-article-empresa/index.ts` | Cambiar texto "Instagram" → "Redes sociales" en footer |
| `supabase/functions/generate-article-saas/index.ts` | Cambiar texto "Instagram" → "Redes sociales" en footer |

Cambio específico en los prompts de generación:

```text
ANTES:
- Síguenos en Instagram: ${instagramUrl}

DESPUÉS:
- Síguenos en redes sociales: ${instagramUrl}
```

---

## Parte 2: Añadir laura@mkpro.es a Notificaciones

### Cambio en generate-article/index.ts

```typescript
// ANTES (línea 11)
const NOTIFICATION_EMAIL = "controlkotler@gmail.com";

// DESPUÉS
const NOTIFICATION_EMAILS = ["controlkotler@gmail.com", "laura@mkpro.es"];
```

Y en la función `sendMKProNotification`, cambiar:

```typescript
// ANTES
await resend.emails.send({
  from: "Blooglee <hola@blooglee.com>",
  to: [NOTIFICATION_EMAIL],
  ...
});

// DESPUÉS
await resend.emails.send({
  from: "Blooglee <hola@blooglee.com>",
  to: NOTIFICATION_EMAILS,
  ...
});
```

### Mismo cambio en generate-article-empresa/index.ts

Aplicar exactamente el mismo patrón: convertir `NOTIFICATION_EMAIL` a `NOTIFICATION_EMAILS` array.

---

## Parte 3: Corregir Error "Body already consumed"

### Problema en generate-article-saas/index.ts

El código actual:

```typescript
// Línea 380 - Primera lectura del body
const requestBody: RequestBody = await req.json();
const { isScheduled, userId: schedulerUserId } = requestBody;

// ... más código ...

// Línea 441 - Segunda lectura (ERROR!)
const { siteId, topic: providedTopic, month, year }: RequestBody = await req.json();
```

### Solución

Usar los datos ya parseados de `requestBody`:

```typescript
// Línea 380 - Única lectura del body
const requestBody: RequestBody = await req.json();
const { isScheduled, userId: schedulerUserId, siteId, topic: providedTopic, month, year } = requestBody;

// ... eliminar la segunda llamada a req.json() ...
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/pharmacy/PharmacyForm.tsx` | Label: "Instagram" → "Enlace a tu mejor red social" |
| `src/components/company/CompanyForm.tsx` | Label: "URL de Instagram" → "Enlace a tu mejor red social" |
| `src/components/saas/SiteSettings.tsx` | Label: "URL de Instagram" → "Enlace a tu mejor red social" |
| `supabase/functions/generate-article/index.ts` | 1. NOTIFICATION_EMAILS array, 2. Footer "Redes sociales" |
| `supabase/functions/generate-article-empresa/index.ts` | 1. NOTIFICATION_EMAILS array, 2. Footer "Redes sociales" |
| `supabase/functions/generate-article-saas/index.ts` | 1. Fix Body already consumed, 2. Footer "Redes sociales" |

---

## Resultado Esperado

1. **Formularios**: Los campos mostrarán "Enlace a tu mejor red social" en lugar de "Instagram"
2. **Artículos**: El pie mostrará "Síguenos en redes sociales" en lugar de "Instagram"
3. **Emails**: Tanto controlkotler@gmail.com como laura@mkpro.es recibirán notificaciones de cada artículo publicado
4. **SaaS**: El site FarmaPro podrá generar artículos sin el error de Edge Function

---

## Sección Técnica

### PharmacyForm.tsx - Líneas 218-228

```typescript
// ANTES
<Label htmlFor="instagram-url" className="flex items-center gap-1">
  <Instagram className="w-3 h-3" />
  Instagram
</Label>

// DESPUÉS
<Label htmlFor="instagram-url" className="flex items-center gap-1">
  <Link2 className="w-3 h-3" />
  Enlace a tu mejor red social
</Label>
```

### CompanyForm.tsx - Líneas 390-399

```typescript
// ANTES
<Label htmlFor="instagramUrl">URL de Instagram</Label>

// DESPUÉS
<Label htmlFor="instagramUrl">Enlace a tu mejor red social</Label>
```

### SiteSettings.tsx - Líneas 541-548

```typescript
// ANTES
<Label htmlFor="instagram_url">URL de Instagram</Label>

// DESPUÉS
<Label htmlFor="instagram_url">Enlace a tu mejor red social</Label>
```

### Footer de Artículos (en prompts de las 3 Edge Functions)

Buscar y reemplazar en las secciones del prompt que generan el footer:

```text
ANTES:
Instagram: ${instagram_url}
o
Síguenos en Instagram

DESPUÉS:
Redes sociales: ${instagram_url}
o
Síguenos en redes sociales
```

