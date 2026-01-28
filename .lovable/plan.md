

# Plan: Corregir Bug de Generación para Empresas

## Problema Identificado

En `supabase/functions/generate-monthly-articles/index.ts`, las empresas están usando la Edge Function equivocada y el formato de payload incorrecto:

### Bug 1: URL Incorrecta (línea 591 + 840)

```typescript
// Línea 591 - Se define UNA sola URL para todos
const generateArticleUrl = `${supabaseUrl}/functions/v1/generate-article`;

// Línea 840 - Las empresas usan esta misma URL (incorrecta)
const response = await fetch(generateArticleUrl, { ... });
```

**Debería ser**: `generate-article-empresa` para empresas

### Bug 2: Payload Incorrecto (líneas 846-861)

```typescript
body: JSON.stringify({
  pharmacy: {  // ← INCORRECTO: debería ser "company"
    id: empresa.id,
    name: empresa.name,
    location: empresa.location,
    sector: empresa.sector,
    // ...
  },
```

**Resultado**: La Edge Function `generate-article` (diseñada para farmacias) recibe los datos de empresa bajo la clave `pharmacy`, y su prompt incluye contexto de salud farmacéutica.

## Solución

### Cambio 1: Añadir URL específica para empresas

**Línea 592** - Añadir nueva constante:

```typescript
const generateArticleUrl = `${supabaseUrl}/functions/v1/generate-article`;
const generateArticleEmpresaUrl = `${supabaseUrl}/functions/v1/generate-article-empresa`;  // NUEVO
const publishUrl = `${supabaseUrl}/functions/v1/publish-to-wordpress`;
```

### Cambio 2: Usar URL y payload correcto para empresas

**Líneas 840-861** - Cambiar la llamada:

Antes:
```typescript
const response = await fetch(generateArticleUrl, {
  method: "POST",
  headers: { ... },
  body: JSON.stringify({
    pharmacy: {
      id: empresa.id,
      name: empresa.name,
      ...
    },
    topic: topic,
    ...
  }),
});
```

Después:
```typescript
const response = await fetch(generateArticleEmpresaUrl, {  // URL correcta
  method: "POST",
  headers: { ... },
  body: JSON.stringify({
    company: {  // Clave correcta
      id: empresa.id,
      name: empresa.name,
      location: empresa.location,
      sector: empresa.sector,
      languages: empresa.languages,
      blog_url: empresa.blog_url,
      instagram_url: empresa.instagram_url,
      geographic_scope: empresa.geographic_scope || "local",
      include_featured_image: empresa.include_featured_image !== false,
    },
    topic: topic.tema,  // Solo el texto del tema
    month: currentMonth,
    year: currentYear,
    autoGenerateTopic: false,  // Ya generamos el tema arriba
  }),
});
```

## Verificación del formato esperado por generate-article-empresa

Revisando el hook `useArticulosEmpresas.ts`, el formato correcto es:

```typescript
{
  empresaId: string,  // Para historial de temas
  company: {
    name, location, sector, languages, blog_url, instagram_url, 
    geographic_scope, include_featured_image
  },
  topic: string | null,
  month: number,
  year: number,
  usedImageUrls: string[],
  autoGenerateTopic: boolean
}
```

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-monthly-articles/index.ts` | Línea 592: Añadir `generateArticleEmpresaUrl` |
| `supabase/functions/generate-monthly-articles/index.ts` | Líneas 840-861: Usar URL y payload correctos |

## Resultado Esperado

Después de este fix:

- **Farmacias**: Seguirán usando `generate-article` con prompt de salud/farmacia
- **Empresas**: Usarán `generate-article-empresa` con prompt genérico que respeta el sector real
- **mkpro**: Recibirá artículos de "Agencia de marketing" sin menciones a farmacias

