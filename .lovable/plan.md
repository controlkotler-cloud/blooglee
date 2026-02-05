

## Plan: Eliminar markdown residual del contenido HTML

### Problema detectado

El modelo Gemini genera contenido HTML pero a veces mezcla sintaxis markdown dentro del HTML:

```html
<!-- Problema: markdown dentro de HTML -->
<li>**SEO:** Optimiza tu contenido...</li>

<!-- Correcto: HTML puro -->
<li><strong>SEO:</strong> Optimiza tu contenido...</li>
```

Esto se muestra literalmente en WordPress como `**texto**` en vez de **texto**.

### Causa raiz

| Factor | Descripcion |
|--------|-------------|
| Prompts insuficientes | Piden "formato HTML" pero no prohiben markdown explicita y enfaticamente |
| Sin sanitizacion | No hay post-procesamiento que convierta markdown a HTML |
| Comportamiento IA | Gemini mezcla formatos cuando el prompt no es estricto |

### Solucion propuesta (doble capa)

#### Capa 1: Mejorar prompts (prevencion)

Anadir instruccion explicita en `FALLBACK_PROMPTS.articleSystem`:

```text
FORMATO HTML OBLIGATORIO:
- TODO el contenido DEBE estar en HTML puro
- NUNCA uses sintaxis markdown: NO **texto**, NO *texto*, NO ~~texto~~
- Para negrita usa <strong>texto</strong>
- Para cursiva usa <em>texto</em>
- Para listas usa <ul><li>texto</li></ul>
```

#### Capa 2: Funcion de limpieza (garantia)

Crear funcion `cleanMarkdownFromHtml()` que se ejecute tras la generacion:

```javascript
function cleanMarkdownFromHtml(content: string): string {
  return content
    // **texto** → <strong>texto</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // *texto* → <em>texto</em> (solo asteriscos simples no dentro de strong)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // ~~texto~~ → <del>texto</del>
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // `codigo` → <code>codigo</code>
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
```

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/generate-article-saas/index.ts` | Anadir prohibicion markdown al prompt + funcion `cleanMarkdownFromHtml()` + aplicar tras generacion |
| `supabase/functions/generate-article/index.ts` | Anadir funcion `cleanMarkdownFromHtml()` + aplicar tras generacion (MKPro farmacias) |
| `supabase/functions/generate-article-empresa/index.ts` | Anadir funcion `cleanMarkdownFromHtml()` + aplicar tras generacion (MKPro empresas) |

### Cambios detallados

#### 1. `generate-article-saas/index.ts`

**A. Actualizar prompt (lineas 142-148):**

Insertar despues de "El contenido DEBE empezar con un h2 introductorio":

```text
⚠️ FORMATO HTML ESTRICTO (OBLIGATORIO):
- TODO el contenido DEBE estar en HTML puro
- NUNCA uses sintaxis markdown dentro del HTML
- NO uses **texto** → usa <strong>texto</strong>
- NO uses *texto* → usa <em>texto</em>
- NO uses ~~texto~~ → usa <del>texto</del>
- NO uses `codigo` → usa <code>codigo</code>
- Para listas SIEMPRE usa <ul><li>...</li></ul> sin markdown dentro
```

**B. Agregar funcion de limpieza (despues de linea 80):**

```javascript
function cleanMarkdownFromHtml(content: string): string {
  if (!content) return content;
  
  return content
    // **texto** o __texto__ → <strong>texto</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // *texto* o _texto_ → <em>texto</em>
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
    // ~~texto~~ → <del>texto</del>
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // `codigo` → <code>codigo</code>
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
```

**C. Aplicar limpieza tras generacion (linea 1191, despues de "Spanish article generated successfully"):**

```javascript
// Clean any markdown that slipped into HTML
if (spanishArticle.content) {
  spanishArticle.content = cleanMarkdownFromHtml(spanishArticle.content);
  console.log("Cleaned markdown from Spanish content");
}
```

**D. Aplicar limpieza a catalan (linea 1268, despues de parsear catalan):**

```javascript
// Clean any markdown from Catalan content
if (catalanArticle.content) {
  catalanArticle.content = cleanMarkdownFromHtml(catalanArticle.content);
  console.log("Cleaned markdown from Catalan content");
}
```

#### 2. `generate-article/index.ts` (MKPro farmacias)

**A. Agregar funcion `cleanMarkdownFromHtml` (misma implementacion)**

**B. Aplicar tras parsear spanishArticle (linea ~483):**

```javascript
if (spanishArticle.content) {
  spanishArticle.content = cleanMarkdownFromHtml(spanishArticle.content);
}
```

**C. Aplicar tras parsear catalanArticle si existe**

#### 3. `generate-article-empresa/index.ts` (MKPro empresas)

Mismos cambios que generate-article.

---

### Resultado esperado

| Antes | Despues |
|-------|---------|
| `<li>**SEO:** Optimiza...</li>` | `<li><strong>SEO:</strong> Optimiza...</li>` |
| `<li>**SEM:** Invierte...</li>` | `<li><strong>SEM:</strong> Invierte...</li>` |
| `<p>Usa *estrategias*...</p>` | `<p>Usa <em>estrategias</em>...</p>` |

La doble capa garantiza que:
1. El prompt previene la mayoria de casos
2. La funcion de limpieza captura cualquier markdown residual

