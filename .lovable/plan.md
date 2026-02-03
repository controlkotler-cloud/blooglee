

# Plan: Hacer funcionar los prompts del panel admin (de verdad)

## El problema real

La Edge Function `generate-article-saas` tiene TODO hardcodeado:

| Ubicación en código | Qué hace | Líneas |
|---------------------|----------|--------|
| Líneas 517-534 | Prompt para generar TEMA | Hardcodeado |
| Líneas 566-596 | Prompt SISTEMA para artículo | Hardcodeado |
| Líneas 598-608 | Prompt USUARIO para artículo | Hardcodeado |
| Líneas 688-702 | Prompt traducción CATALÁN | Hardcodeado |
| Líneas 788-801 | Prompt generación IMAGEN | Hardcodeado |

Los prompts en la tabla `prompts` con keys `generate-article-saas.system.es` y `generate-article-saas.topic` **nunca se consultan**.

## Solución propuesta

### Parte 1: Sistema de caché de prompts

En lugar de consultar la BD en cada ejecución, mantener los prompts en memoria y solo recargar cuando cambien:

```
┌─────────────────────────────────────────────────────────────┐
│  Panel Admin: Editar prompt                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Al guardar cambios:                                     ││
│  │ 1. Actualiza tabla prompts                              ││
│  │ 2. Actualiza tabla prompt_cache_version (incrementa)    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Edge Function: generate-article-saas                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. Consulta version en prompt_cache_version             ││
│  │ 2. Si version cambió → Recarga prompts de BD            ││
│  │ 3. Si no → Usa prompts en memoria (Map global)          ││
│  │ 4. Fallback hardcodeado si prompt no existe             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Parte 2: Crear tabla de versión de caché

Nueva tabla simple para saber cuándo recargar:

```sql
CREATE TABLE prompt_cache_version (
  id integer PRIMARY KEY DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
```

### Parte 3: Trigger para actualizar versión

Cuando se modifica un prompt, incrementar automáticamente la versión:

```sql
CREATE OR REPLACE FUNCTION increment_prompt_cache_version()
RETURNS trigger AS $$
BEGIN
  UPDATE prompt_cache_version SET 
    version = version + 1,
    updated_at = now()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_updated
AFTER INSERT OR UPDATE OR DELETE ON prompts
FOR EACH STATEMENT
EXECUTE FUNCTION increment_prompt_cache_version();
```

### Parte 4: Modificar Edge Function

Implementar caché en memoria con invalidación por versión:

```typescript
// Cache global (persiste entre ejecuciones en el mismo worker)
const promptCache: Map<string, string> = new Map();
let cacheVersion: number = 0;

async function getPrompt(
  supabase: any, 
  key: string, 
  variables: Record<string, string>,
  fallback: string
): Promise<string> {
  // 1. Verificar si caché está actualizada
  const { data: versionData } = await supabase
    .from('prompt_cache_version')
    .select('version')
    .eq('id', 1)
    .single();
  
  const currentVersion = versionData?.version || 0;
  
  // 2. Si versión cambió, limpiar caché
  if (currentVersion !== cacheVersion) {
    promptCache.clear();
    cacheVersion = currentVersion;
    console.log(`Prompt cache invalidated, new version: ${cacheVersion}`);
  }
  
  // 3. Si está en caché, usar
  if (promptCache.has(key)) {
    let content = promptCache.get(key)!;
    return substituteVariables(content, variables);
  }
  
  // 4. Si no, cargar de BD
  const { data } = await supabase
    .from('prompts')
    .select('content')
    .eq('key', key)
    .eq('is_active', true)
    .single();
  
  if (data?.content) {
    promptCache.set(key, data.content);
    return substituteVariables(data.content, variables);
  }
  
  // 5. Fallback hardcodeado
  console.log(`Using fallback for prompt: ${key}`);
  return substituteVariables(fallback, variables);
}

function substituteVariables(
  content: string, 
  variables: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'), 
      value || ''
    );
  }
  return result;
}
```

### Parte 5: Prompts con keys correctos

Actualizar los prompts existentes en la BD con contenido real:

| Key del prompt | Propósito | Variables disponibles |
|----------------|-----------|----------------------|
| `saas.topic` | Generar tema | `{{site.name}}`, `{{sector}}`, `{{description}}`, `{{location}}`, `{{scope}}`, `{{month}}`, `{{year}}`, `{{usedTopics}}` |
| `saas.article.system` | Sistema artículo | `{{site.name}}`, `{{sector}}`, `{{description}}`, `{{geoContext}}`, `{{dateContext}}` |
| `saas.article.user` | Usuario artículo | `{{topic}}` |
| `saas.image` | Generar imagen | `{{topic}}`, `{{sector}}`, `{{description}}` |
| `saas.translate.catalan` | Traducir catalán | `{{title}}`, `{{meta}}`, `{{slug}}`, `{{content}}` |

### Parte 6: Actualizar hook del panel admin

Cuando se guarda un prompt, el trigger automáticamente incrementa la versión, no hay cambios necesarios en el frontend.

## Cambios técnicos detallados

### Migración SQL

```sql
-- Tabla de versión de caché
CREATE TABLE prompt_cache_version (
  id integer PRIMARY KEY DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar registro inicial
INSERT INTO prompt_cache_version (id, version) VALUES (1, 1);

-- RLS: Solo lectura para service_role
ALTER TABLE prompt_cache_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read cache version"
  ON prompt_cache_version FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Superadmins can manage cache version"
  ON prompt_cache_version FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

-- Trigger para invalidar caché
CREATE OR REPLACE FUNCTION increment_prompt_cache_version()
RETURNS trigger AS $$
BEGIN
  UPDATE prompt_cache_version SET 
    version = version + 1,
    updated_at = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prompt_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON prompts
FOR EACH STATEMENT
EXECUTE FUNCTION increment_prompt_cache_version();
```

### Edge Function: generate-article-saas/index.ts

1. Añadir sistema de caché al inicio del archivo
2. Crear función `getPrompt()` con lógica de caché
3. Crear función `substituteVariables()` para reemplazo
4. Reemplazar prompts hardcodeados por llamadas a `getPrompt()`
5. Mantener los actuales como fallbacks

### Actualizar/Crear prompts en BD

Insertar los prompts con el contenido actual de la Edge Function para que funcionen desde el día 1.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Crear tabla `prompt_cache_version`, trigger |
| `supabase/functions/generate-article-saas/index.ts` | Implementar sistema de caché, usar prompts de BD |
| Inserción de datos | Crear prompts con contenido correcto |

## Resultado esperado

1. Los prompts del panel admin SON los que se usan
2. Solo se consulta la BD cuando cambias algo
3. El sistema es eficiente (caché en memoria)
4. Hay fallbacks si borras un prompt por error
5. Puedes ajustar tono, longitud, reglas sin tocar código

