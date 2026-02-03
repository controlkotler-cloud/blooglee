
# Plan: Corregir sincronización y deduplicación con WordPress

## Problemas identificados

| Problema | Estado | Impacto |
|----------|--------|---------|
| `wordpress_context` está NULL | CRÍTICO | No hay datos del blog existente |
| No hay logs de sync-wordpress | ERROR | No podemos debuggear qué falló |
| `usedTopics` no incluye WordPress | BUG | Genera temas duplicados del blog real |
| Sector incorrecto en logs | MENOR | Dice "marketing" pero es farmacia |

## Parte 1: Debuggear por qué no se guarda wordpress_context

Revisar la Edge Function para encontrar dónde falla:

```typescript
// Problema potencial: el siteId puede no estar disponible
const siteId = wpConfig.site_id;

// El update puede fallar silenciosamente
const { error: contextError } = await supabase
  .from('sites')
  .update({ wordpress_context: contentAnalysis })
  .eq('id', siteId);

if (contextError) {
  console.error('Error saving wordpress_context:', contextError);
}
```

Cambios necesarios:
1. Añadir más logging antes y después del update
2. Verificar que `siteId` es correcto
3. Verificar que el update realmente se ejecuta

## Parte 2: Incluir temas de WordPress en la deduplicación

Actualmente el código solo mira `articles`:
```typescript
const { data: existingArticles } = await supabase
  .from('articles')
  .select('topic, content_spanish')
  .eq('site_id', siteId);
```

Hay que añadir los temas del contexto de WordPress:
```typescript
// Obtener temas ya usados de AMBAS fuentes
const usedTopics = [
  // 1. Artículos generados por Blooglee
  ...existingArticles.map(a => a.topic),
  
  // 2. Temas del blog WordPress existente
  ...(site.wordpress_context?.lastTopics || [])
];
```

## Parte 3: Mejorar logging de sincronización

Añadir logs explícitos en cada paso crítico:

```typescript
console.log('=== CONTENT ANALYSIS START ===');
console.log('Site ID for update:', siteId);
console.log('WordPress URL:', wpUrl);

// Después de fetch posts
console.log(`Fetched ${posts.length} posts from WordPress`);

// Antes del update
console.log('Content analysis result:', JSON.stringify(contentAnalysis));

// Después del update
if (contextError) {
  console.error('FAILED to save wordpress_context:', contextError);
} else {
  console.log('SUCCESS: wordpress_context saved to site');
}
```

## Parte 4: Verificar sector correcto

Los logs dicen:
```
Loaded 26 prohibited terms for sector marketing
```

Pero farmapro es del sector "farmacia". El código busca palabras prohibidas por sector pero usa el sector incorrecto o no lo encuentra.

Verificar que:
1. El sector del site está bien configurado
2. La tabla `sector_contexts` tiene entrada para "farmacia"
3. El matching de sector funciona correctamente

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/sync-wordpress-taxonomies-saas/index.ts` | Añadir logging detallado |
| `supabase/functions/generate-article-saas/index.ts` | Incluir lastTopics de wordpress_context en deduplicación |
| Tabla `sector_contexts` | Verificar/añadir contexto para "farmacia" |

## Cambio crítico en generate-article-saas

```typescript
// ANTES: Solo miraba articles de Blooglee
const usedTopics = existingArticles?.map(a => a.topic) || [];

// DESPUÉS: Combinar ambas fuentes
const bloogleeTopics = existingArticles?.map(a => a.topic) || [];
const wpTopics = site.wordpress_context?.lastTopics || [];
const usedTopics = [...bloogleeTopics, ...wpTopics];

console.log(`Found ${bloogleeTopics.length} Blooglee topics`);
console.log(`Found ${wpTopics.length} WordPress topics`);
console.log('Combined topics to avoid:', usedTopics.join(', '));
```

## Prueba de verificación

Después de los cambios:
1. Sincronizar WordPress para farmapro
2. Verificar en logs que wordpress_context se guardó
3. Verificar en BD que sites.wordpress_context tiene datos
4. Generar artículo y verificar que evita "escaparate" y otros temas del blog
