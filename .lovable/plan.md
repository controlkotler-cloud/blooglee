
# Plan: Mejorar deduplicación de temas del blog Blooglee

## Problema identificado

El sistema de deduplicación actual **no funciona** porque:

1. Solo compara títulos exactos, no temas semánticos
2. El prompt solo dice "evitar" sin enforcement fuerte
3. Los topics base contienen temas duplicados (SEO local aparece 2 veces)
4. No hay bloqueo explícito de keywords repetidas

**Resultado**: 2 artículos de "SEO local" para empresas, 2 de "SEO multicliente" para agencias.

## Solución propuesta

### 1. Limpiar los topics base (eliminar duplicados)

Reducir EMPRESA_TOPICS y AGENCIA_TOPICS eliminando temas semánticamente similares:

```typescript
const EMPRESA_TOPICS = [
  "automatizar marketing contenidos pymes",
  // ELIMINAR: "SEO local para pequeñas empresas" - duplicado con posicionamiento local
  "content marketing ROI medición",
  "blog corporativo estrategia beneficios",
  "estrategia contenidos digital",
  "IA para marketing empresarial automatización",
  "posicionamiento web negocios", // Única variante de SEO
  // ... resto
];
```

### 2. Mejorar la función de deduplicación

Cambiar `getUsedBlogTopics()` para extraer también keywords, no solo títulos:

```typescript
async function getUsedBlogTopics(supabase: any, audience: string): Promise<string[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('title, seo_keywords')
    .eq('audience', audience.toLowerCase())
    .order('published_at', { ascending: false })
    .limit(30);
  
  const topics: string[] = [];
  data?.forEach((p: any) => {
    // Añadir título
    topics.push(p.title.toLowerCase());
    // Añadir keywords
    if (p.seo_keywords?.length) {
      topics.push(...p.seo_keywords.map((k: string) => k.toLowerCase()));
    }
  });
  
  return [...new Set(topics)]; // Eliminar duplicados
}
```

### 3. Reforzar el prompt con bloqueo explícito

Cambiar el prompt de generación de metadatos para ser más estricto:

```typescript
const prompt = `...
TEMAS PROHIBIDOS (NO usar bajo ninguna circunstancia):
${usedTopics.slice(0, 30).map(t => `- ${t}`).join('\n')}

Si el tema que generas es similar a alguno de los prohibidos, serás penalizado.
Busca un ángulo COMPLETAMENTE DIFERENTE dentro de la categoría ${forceCategory}.
...`;
```

### 4. Añadir detección de similitud antes de guardar

Implementar una función que rechace el contenido si es demasiado similar:

```typescript
function isTooSimilar(newTitle: string, existingTopics: string[]): boolean {
  const newWords = new Set(newTitle.toLowerCase().split(/\s+/));
  
  for (const existing of existingTopics) {
    const existingWords = new Set(existing.split(/\s+/));
    const intersection = [...newWords].filter(w => existingWords.has(w));
    const similarity = intersection.length / Math.min(newWords.size, existingWords.size);
    
    if (similarity > 0.5) {
      console.log(`Title too similar to: ${existing} (${(similarity * 100).toFixed(0)}%)`);
      return true;
    }
  }
  return false;
}
```

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-blog-blooglee/index.ts` | Lógica de deduplicación mejorada |

## Cambios específicos en el código

### Líneas 28-63: Limpiar topics duplicados

Eliminar temas semánticamente duplicados de EMPRESA_TOPICS y AGENCIA_TOPICS.

### Líneas 65-74: Mejorar getUsedBlogTopics()

Extraer también keywords además de títulos para mejor deduplicación.

### Líneas 347-382: Reforzar prompt de metadatos

Cambiar de "evitar" a "PROHIBIDOS" con lista explícita y penalización.

### Nueva función: isTooSimilar()

Añadir validación de similitud antes de guardar el post.

### Líneas 676-680: Validar antes de guardar

Implementar retry si el contenido es demasiado similar.

## Resultado esperado

- Artículos con temas realmente diferentes dentro de cada categoría
- Bloqueo de títulos con >50% de palabras compartidas
- Mejor variedad de contenido en el blog
