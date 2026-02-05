
## Plan: Corregir el bug de enlaces anidados en addHomeLinkToContent

### Problema detectado
El artículo más reciente de farmapro tiene este HTML corrupto:
```html
<a href="https://www.<a href="https://farmapro.es" target="_blank" rel="noopener">farmapro</a>.es/blog/...">
```

**Causa raíz**: La función `addHomeLinkToContent` busca la primera mención del nombre "farmapro" y la enlaza. Pero el regex actual NO protege las URLs dentro de atributos `href=""`. La IA generó un enlace a `https://www.farmapro.es/blog/...` y después la función encontró "farmapro" dentro de esa URL y lo reemplazó, creando un enlace anidado roto.

### Solución

Modificar la función `addHomeLinkToContent` en `generate-article-saas` para:

1. **Excluir matches dentro de atributos href/src**: El regex debe ignorar cualquier ocurrencia del nombre de la empresa que esté dentro de `href="..."` o `src="..."`.

2. **Estrategia**: En lugar de usar un regex complejo, primero eliminar temporalmente todos los atributos href/src del contenido para la búsqueda, encontrar la posición correcta, y luego aplicar el reemplazo en el contenido original.

3. **Alternativa más simple**: Usar un approach de dos pasos:
   - Paso 1: Buscar todas las ocurrencias del nombre
   - Paso 2: Para cada ocurrencia, verificar que NO esté dentro de un tag `<a>` ni dentro de un atributo
   - Paso 3: Reemplazar solo la primera ocurrencia válida

### Cambios técnicos

```text
supabase/functions/generate-article-saas/index.ts
```

Actualizar `addHomeLinkToContent`:

```typescript
function addHomeLinkToContent(content: string, siteName: string, blogUrl: string | null): string {
  if (!blogUrl || !siteName) return content;
  
  let homeUrl: string;
  try {
    const url = new URL(blogUrl);
    homeUrl = `${url.protocol}//${url.host}`;
  } catch {
    return content;
  }
  
  const escapedName = escapeRegexChars(siteName);
  const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const position = match.index;
    const textBefore = content.substring(0, position);
    
    // Verificar que NO estamos dentro de un tag <a> o atributo href/src
    const lastOpenA = textBefore.lastIndexOf('<a ');
    const lastCloseA = textBefore.lastIndexOf('</a>');
    const lastHref = textBefore.lastIndexOf('href="');
    const lastSrc = textBefore.lastIndexOf('src="');
    
    // Si hay un <a abierto sin cerrar, estamos dentro de un enlace
    if (lastOpenA > lastCloseA) continue;
    
    // Si hay un href=" o src=" sin cerrar (sin comilla de cierre después)
    if (lastHref !== -1) {
      const afterHref = textBefore.substring(lastHref + 6);
      const closingQuote = afterHref.indexOf('"');
      if (closingQuote === -1) continue; // Estamos dentro del href
    }
    
    if (lastSrc !== -1) {
      const afterSrc = textBefore.substring(lastSrc + 5);
      const closingQuote = afterSrc.indexOf('"');
      if (closingQuote === -1) continue; // Estamos dentro del src
    }
    
    // Esta ocurrencia es válida - reemplazar
    const before = content.substring(0, position);
    const after = content.substring(position + match[0].length);
    const linkedName = `<a href="${homeUrl}" target="_blank" rel="noopener">${match[0]}</a>`;
    return before + linkedName + after;
  }
  
  return content;
}
```

### Archivos a modificar
- `supabase/functions/generate-article-saas/index.ts` - Corregir función addHomeLinkToContent

### Validación
- Desplegar la función actualizada
- Generar un artículo de prueba para farmapro
- Verificar que el enlace a la home sea correcto y no esté anidado dentro de otra URL
