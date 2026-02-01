

# Plan: Gestor de Prompts del Panel Admin

## Objetivo

Crear una seccion dedicada en el panel superadmin (`/admin/prompts`) donde puedas visualizar, editar y mejorar todos los prompts utilizados por las Edge Functions de la plataforma, sin necesidad de modificar codigo directamente.

---

## Prompts Identificados en el Sistema

Tras analizar las Edge Functions, estos son todos los prompts utilizados:

| Funcion | Prompt | Proposito |
|---------|--------|-----------|
| `generate-article` | System Prompt Farmacia ES | Genera articulos para farmacias en espanol |
| `generate-article` | User Prompt Farmacia ES | Instrucciones especificas por farmacia |
| `generate-article` | Topic Generation | Genera temas automaticamente |
| `generate-article-empresa` | System Prompt Empresa ES | Genera articulos para empresas en espanol |
| `generate-article-empresa` | Sector Context AI | Genera contexto de sector con IA |
| `generate-article-saas` | System Prompt SaaS ES | Genera articulos para sites SaaS |
| `generate-article-saas` | Image Query Generator | Genera queries de busqueda de imagenes |
| `generate-blog-blooglee` | Metadata Generator | Genera titulo, slug, excerpt del blog |
| `generate-blog-blooglee` | Content Generator | Genera contenido completo del blog |
| `generate-blog-blooglee` | Image Prompt | Genera imagenes AI para el blog |
| `support-chatbot` | System Prompt | Instrucciones del chatbot de soporte |

---

## Arquitectura Propuesta

### 1. Nueva tabla `prompts` en la base de datos

Almacenara todos los prompts de forma centralizada y versionada.

```text
prompts
├── id (uuid)
├── key (text unique) - Identificador unico ej: "generate-article.system.es"
├── name (text) - Nombre legible ej: "Articulos Farmacia - Sistema"
├── description (text) - Descripcion del proposito
├── category (text) - Categoria: "farmacias", "empresas", "saas", "blog", "support"
├── content (text) - El prompt completo
├── variables (jsonb) - Lista de variables disponibles ej: ["{{pharmacy.name}}", "{{month}}"]
├── is_active (boolean) - Si se usa este prompt o el hardcodeado
├── version (integer) - Numero de version
├── created_at, updated_at (timestamps)
```

### 2. Nueva pagina `/admin/prompts`

Interface para gestionar los prompts con:
- Lista de todos los prompts organizados por categoria
- Vista previa con syntax highlighting
- Editor con variables autocomplete
- Historial de versiones
- Boton de test (ejecutar prompt con datos de ejemplo)

### 3. Modificacion de Edge Functions

Las funciones leeran el prompt de la base de datos si existe y esta activo, sino usaran el hardcodeado como fallback.

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/admin/AdminPrompts.tsx` | Pagina principal del gestor |
| `src/components/admin/PromptEditor.tsx` | Editor de prompts con syntax highlighting |
| `src/components/admin/PromptCard.tsx` | Tarjeta de preview de prompt |
| `src/components/admin/PromptTestDialog.tsx` | Dialog para probar prompts |
| `src/hooks/useAdminPrompts.ts` | Hook para CRUD de prompts |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/admin/AdminLayout.tsx` | Anadir enlace "Prompts" al menu |
| `src/App.tsx` | Anadir ruta `/admin/prompts` |
| Edge Functions (todas) | Leer prompt de BD si existe |

---

## Diseno de la UI

### Vista de Lista

```text
+--------------------------------------------------+
| Prompts del Sistema                              |
| Gestiona los prompts de IA de la plataforma      |
+--------------------------------------------------+
| [Farmacias] [Empresas] [SaaS] [Blog] [Soporte]   |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | Articulos Farmacia - Sistema          [Edit] | |
| | generate-article.system.es                   | |
| | Prompt principal para generar articulos...   | |
| | v3 | Activo | Ultima edicion: hace 2 dias    | |
| +----------------------------------------------+ |
| +----------------------------------------------+ |
| | Articulos Farmacia - Usuario          [Edit] | |
| | generate-article.user.es                     | |
| | Instrucciones especificas con datos de...    | |
| | v1 | Activo | Ultima edicion: hace 5 dias    | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

### Vista de Editor

```text
+--------------------------------------------------+
| < Volver                                         |
| Articulos Farmacia - Sistema                     |
+--------------------------------------------------+
| Key: generate-article.system.es                  |
| Categoria: [Farmacias v]                         |
+--------------------------------------------------+
| Variables disponibles:                           |
| {{pharmacy.name}} {{pharmacy.location}} {{month}}|
| {{year}} {{geoContext}}                          |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | Eres un redactor experto en contenido        | |
| | farmaceutico y SEO. Generas articulos de     | |
| | blog profesionales para farmacias.           | |
| |                                              | |
| | REGLAS IMPORTANTES:                          | |
| | - La fecha actual es {{month}} de {{year}}   | |
| | ...                                          | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| Version: 3 | Caracteres: 2,456                   |
| [Cancelar]  [Probar]  [Guardar como v4]          |
+--------------------------------------------------+
```

---

## Flujo de Datos

```text
1. Usuario edita prompt en /admin/prompts
                |
                v
2. Se guarda en tabla "prompts" con nueva version
                |
                v
3. Edge Function se ejecuta
                |
                v
4. Funcion busca prompt por key en BD
                |
        +-------+-------+
        |               |
        v               v
   Encontrado     No encontrado
        |               |
        v               v
   Usa prompt BD   Usa hardcoded
        |               |
        +-------+-------+
                |
                v
5. Reemplaza variables {{...}} con datos reales
                |
                v
6. Envia a Lovable AI Gateway
```

---

## Migracion SQL

```sql
-- Tabla de prompts
CREATE TABLE prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Solo superadmins pueden gestionar prompts
CREATE POLICY "Superadmins can manage prompts"
ON prompts FOR ALL
USING (has_role(auth.uid(), 'superadmin'));

-- Las Edge Functions pueden leer prompts (sin auth)
CREATE POLICY "Service role can read prompts"
ON prompts FOR SELECT
USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Prompts Iniciales a Migrar

Se insertaran los prompts actuales como datos iniciales:

| Key | Nombre | Categoria |
|-----|--------|-----------|
| `generate-article.system.es` | Articulos Farmacia - Sistema | farmacias |
| `generate-article.user.es` | Articulos Farmacia - Usuario | farmacias |
| `generate-article.topic` | Generador de Temas Farmacia | farmacias |
| `generate-article-empresa.system.es` | Articulos Empresa - Sistema | empresas |
| `generate-article-empresa.sector-context` | Contexto de Sector AI | empresas |
| `generate-article-saas.system.es` | Articulos SaaS - Sistema | saas |
| `generate-article-saas.image-query` | Generador Query Imagenes | saas |
| `generate-blog.metadata` | Blog - Metadatos | blog |
| `generate-blog.content` | Blog - Contenido | blog |
| `generate-blog.image` | Blog - Prompt Imagen | blog |
| `support-chatbot.system` | Chatbot Soporte - Sistema | soporte |

---

## Seccion Tecnica

### Hook useAdminPrompts

```typescript
interface Prompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export function useAdminPrompts(category?: string);
export function usePrompt(key: string);
export function useUpdatePrompt();
export function useCreatePrompt();
```

### Funcion de reemplazo de variables en Edge Functions

```typescript
async function getPrompt(key: string, fallback: string): Promise<string> {
  const { data } = await supabase
    .from('prompts')
    .select('content')
    .eq('key', key)
    .eq('is_active', true)
    .single();
  
  return data?.content || fallback;
}

function replaceVariables(prompt: string, vars: Record<string, string>): string {
  return prompt.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], vars);
    return value ?? '';
  });
}
```

### Ejemplo de uso en Edge Function

```typescript
// En generate-article/index.ts
const systemPromptTemplate = await getPrompt(
  'generate-article.system.es',
  FALLBACK_SYSTEM_PROMPT // El prompt hardcodeado actual
);

const systemPrompt = replaceVariables(systemPromptTemplate, {
  'pharmacy.name': pharmacy.name,
  'pharmacy.location': pharmacy.location,
  'month': monthName,
  'year': currentYear.toString(),
  'geoContext': geoContext,
});
```

---

## Resultado Final

Despues de implementar estos cambios:

1. Tendras una seccion `/admin/prompts` accesible desde el menu lateral
2. Podras ver todos los prompts organizados por categoria
3. Podras editar cualquier prompt sin tocar codigo
4. Los cambios se aplicaran inmediatamente a las Edge Functions
5. Tendras historial de versiones para revertir si algo falla
6. Podras probar prompts antes de activarlos

