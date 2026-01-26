

## Plan: Evitar Repetición de Temas en Artículos de Empresas

### Diagnóstico del Problema

La edge function `generate-article-empresa` **NO tiene ningún mecanismo para evitar temas duplicados**. Cuando generas o regeneras un artículo:

1. La IA genera un tema "fresco" sin saber qué temas ya se usaron
2. Para el sector "marketing" + mes "enero 2026", la IA tiende a elegir temas de tendencia como "IA generativa"
3. Resultado: cada regeneración produce variantes del mismo tema

**Evidencia en logs:**
```
AI generated topic: IA generativa en marketing: Predicciones y ROI para agencias 2026
AI generated topic: IA Generativa en Marketing: Claves para Agencias en 2026 España
```

---

### Solución Propuesta

Modificar `generate-article-empresa` para consultar y evitar temas usados anteriormente.

---

### Cambios en la Edge Function

**Archivo:** `supabase/functions/generate-article-empresa/index.ts`

#### 1. Añadir interfaz RequestBody con empresaId

```typescript
interface RequestBody {
  company: CompanyData;
  empresaId?: string;        // NUEVO: para buscar historial
  topic?: string | null;
  month: number;
  year: number;
  usedImageUrls?: string[];
  usedTopics?: string[];     // NUEVO: opcional desde frontend
  autoGenerateTopic?: boolean;
}
```

#### 2. Añadir función para obtener temas usados

```typescript
async function getUsedTopicsForEmpresa(
  supabase: SupabaseClient,
  empresaId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('articulos_empresas')
    .select('topic')
    .eq('empresa_id', empresaId)
    .order('generated_at', { ascending: false })
    .limit(50);  // Últimos 50 temas
  
  return data?.map(a => a.topic) || [];
}
```

#### 3. Modificar el prompt de generación de tema (línea ~670)

Antes:
```typescript
const topicPrompt = `Eres un experto en marketing de contenidos...
Genera UN tema de blog que:
1. Sea MUY relevante para el sector...
...
Responde SOLO con el tema...`;
```

Después:
```typescript
// Obtener temas usados si hay empresaId
let usedTopicsList: string[] = usedTopics || [];
if (empresaId && usedTopicsList.length === 0) {
  usedTopicsList = await getUsedTopicsForEmpresa(supabase, empresaId);
  console.log(`Found ${usedTopicsList.length} previously used topics`);
}

const usedTopicsSection = usedTopicsList.length > 0 
  ? `\n\n⚠️ TEMAS YA USADOS (NO REPETIR NI HACER VARIACIONES SIMILARES):\n${usedTopicsList.slice(0, 30).map((t, i) => `${i+1}. ${t}`).join('\n')}`
  : '';

const topicPrompt = `Eres un experto en marketing de contenidos para el sector "${company.sector || "servicios profesionales"}".

EMPRESA: ${company.name}
SECTOR: ${company.sector || "Servicios profesionales"}
ÁMBITO: ${company.geographic_scope === "national" ? "Nacional (España)" : company.location || "General"}
MES: ${monthNameEs} ${year}${toneHint}
${usedTopicsSection}

Genera UN tema de blog que:
1. Sea MUY relevante para el sector ${company.sector || "profesional"}
2. Tenga potencial SEO
3. Considere tendencias de ${monthNameEs} ${year}
4. NO mencione el nombre de la empresa
5. Sea útil para los clientes potenciales de este sector
6. NO sea genérico - debe ser específico del sector
7. SEA COMPLETAMENTE DIFERENTE a los temas ya usados (no variaciones del mismo tema)

Responde SOLO con el tema (máx 80 caracteres), sin explicaciones ni comillas.`;
```

---

### Cambios en el Hook del Frontend

**Archivo:** `src/hooks/useArticulosEmpresas.ts`

Añadir el `empresaId` al body de la request:

```typescript
const { data, error } = await supabase.functions.invoke("generate-article-empresa", {
  body: {
    empresaId: params.empresaId,  // NUEVO: permite a la función buscar historial
    company: {
      name: params.companyName,
      // ... resto igual
    },
    topic: params.topic || null,
    month: params.month,
    year: params.year,
    usedImageUrls: params.usedImageUrls || [],
    autoGenerateTopic: !params.topic,
  },
});
```

---

### Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-article-empresa/index.ts` | Añadir `empresaId` al request, función `getUsedTopicsForEmpresa()`, incluir temas usados en prompt |
| `src/hooks/useArticulosEmpresas.ts` | Pasar `empresaId` en el body de la llamada |

---

### Resultado Esperado

Cuando se genere un artículo para mkpro:
1. La función consultará los temas ya usados: `["IA generativa en marketing: Predicciones y ROI..."]`
2. El prompt incluirá: "NO REPETIR: 1. IA generativa en marketing..."
3. La IA generará un tema diferente como: "Automatización de email marketing", "SEO local para pymes", etc.

Esto funcionará tanto para:
- Generación manual desde el panel
- Generación automática desde el cron (que ya tiene su propia lógica pero podría unificarse)
- Cualquier frecuencia: daily, weekly, monthly

