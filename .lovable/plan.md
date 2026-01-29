

# Plan: Corregir Contenido MKPro + Añadir Campo "Audiencia Objetivo" a Empresas

## Resumen del Problema

La IA genera artículos "para agencias de marketing" porque el campo `sector` de MKPro es "Agencia de marketing". Pero MKPro **ES** una agencia que quiere atraer **clientes** (B2B, autónomos, pymes, empresas), no escribir contenido para otras agencias.

Falta un campo `description` o `target_audience` en la tabla `empresas` que especifique para quién escribe la empresa.

---

## Solución en 3 Pasos

### Paso 1: Añadir campo `description` a tabla `empresas`

Igual que existe en la tabla `sites` del SaaS:

```sql
ALTER TABLE empresas ADD COLUMN description TEXT;

-- Actualizar MKPro con su descripción correcta
UPDATE empresas 
SET description = 'MKPro es una agencia de marketing digital que ayuda a autónomos, pymes y empresas B2B a crecer online. Nuestro blog busca atraer clientes potenciales ofreciéndoles consejos prácticos de marketing, SEO, redes sociales y estrategias digitales para hacer crecer sus negocios.'
WHERE name ILIKE '%mkpro%';
```

### Paso 2: Modificar `generate-article-empresa` para usar `description`

Actualizar la Edge Function para:

1. Recibir el campo `description` de la empresa
2. Incluirlo en el prompt como contexto de audiencia objetivo

**Cambios en el prompt del sistema:**

Antes:
```
SOBRE LA EMPRESA:
- Nombre: ${company.name}
- Sector: ${company.sector}
- Ámbito geográfico: ...
```

Después:
```
SOBRE LA EMPRESA:
- Nombre: ${company.name}
- Sector: ${company.sector}
- Ámbito geográfico: ...
- DESCRIPCIÓN Y AUDIENCIA: ${company.description || "No especificada"}

IMPORTANTE: Si hay descripción, el artículo debe estar orientado a la audiencia objetivo descrita, 
NO a otros profesionales del mismo sector.
```

### Paso 3: Borrar artículo de hoy y generar uno nuevo

1. **Borrar** el artículo de hoy (29 Enero - "Metaverso y marketing: Claves para agencias")
2. **Generar** un nuevo artículo con la descripción correcta

---

## Ejemplo de Contenido Correcto para MKPro

Con la descripción: "MKPro ayuda a autónomos, pymes y empresas B2B a crecer online..."

**Temas correctos que atraerían clientes:**
- "5 errores de marketing digital que frenan el crecimiento de tu pyme"
- "Por qué tu negocio necesita una estrategia de contenidos en 2026"
- "Guía SEO local para autónomos: aumenta tu visibilidad"
- "Cómo medir el ROI de tu inversión en marketing digital"
- "Estrategias de captación de leads para empresas B2B"

**vs. Temas incorrectos (escritos para agencias):**
- "Metaverso y marketing: Claves para agencias"
- "Inbound Marketing en agencias"
- "Retos para agencias en 2026"

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Base de datos | Añadir columna `description` a `empresas` |
| `generate-monthly-articles/index.ts` | Pasar `description` en el payload |
| `generate-article-empresa/index.ts` | Usar `description` en el prompt |
| UI MKPro (CompanyForm.tsx) | Añadir campo para editar descripción (opcional) |

---

## Cambios en `generate-article-empresa/index.ts`

### 1. Actualizar interface `CompanyData`:

```typescript
interface CompanyData {
  name: string;
  location?: string | null;
  sector?: string | null;
  description?: string | null;  // NUEVO
  languages?: string[];
  blog_url?: string | null;
  instagram_url?: string | null;
  geographic_scope?: string;
  include_featured_image?: boolean;
}
```

### 2. Actualizar prompt del sistema (línea ~772):

```typescript
const audienceContext = company.description 
  ? `\n\nAUDIENCIA OBJETIVO (MUY IMPORTANTE):
${company.description}

El artículo debe estar escrito PARA ATRAER a esta audiencia, no para otros profesionales del sector ${company.sector}.
Por ejemplo, si eres una agencia de marketing, escribe para tus CLIENTES POTENCIALES, no para otras agencias.`
  : "";

const systemPrompt = `Eres un redactor experto en marketing de contenidos...

SOBRE LA EMPRESA:
- Nombre: ${company.name}
- Sector: ${company.sector || "Servicios profesionales"}
- Ámbito geográfico: ${company.geographic_scope === "national" ? "Nacional" : company.location}
${audienceContext}

TU MISIÓN:
Generar un artículo que ATRAIGA CLIENTES para ${company.name}...`;
```

### 3. Actualizar prompt de generación de tema (línea ~714):

```typescript
const audienceHint = company.description 
  ? `\nAUDIENCIA OBJETIVO: ${company.description.substring(0, 200)}...`
  : "";

const topicPrompt = `Eres un experto en marketing de contenidos...

EMPRESA: ${company.name}
SECTOR: ${company.sector}${audienceHint}

Genera UN tema de blog que:
1. Sea útil para la AUDIENCIA OBJETIVO de la empresa (sus clientes potenciales)
2. NO sea contenido dirigido a otros profesionales del sector
...`;
```

---

## Cambios en `generate-monthly-articles/index.ts`

### En el bucle de empresas (línea ~840):

Antes:
```typescript
company: {
  name: empresa.name,
  location: empresa.location,
  sector: empresa.sector,
  // ... otros campos
}
```

Después:
```typescript
company: {
  name: empresa.name,
  location: empresa.location,
  sector: empresa.sector,
  description: empresa.description,  // NUEVO
  // ... otros campos
}
```

---

## Acciones Inmediatas

1. Crear migración SQL para añadir `description` a `empresas`
2. Actualizar descripción de MKPro con audiencia correcta
3. Modificar `generate-article-empresa` para usar descripción
4. Modificar `generate-monthly-articles` para pasar descripción
5. Borrar artículo de hoy de MKPro
6. Generar nuevo artículo con audiencia correcta

---

## Resultado Esperado

Después de aplicar estos cambios:

| Antes | Después |
|-------|---------|
| "Metaverso para agencias" | "Por qué tu pyme necesita presencia digital en 2026" |
| "Retos para agencias 2026" | "5 estrategias de marketing que aumentarán tus ventas" |
| "Inbound para agencias" | "Cómo atraer más clientes con marketing de contenidos" |

El contenido estará orientado a **atraer clientes para MKPro**, no a informar a otras agencias.

