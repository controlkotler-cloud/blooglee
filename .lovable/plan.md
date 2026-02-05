

## Plan: Mejoras de Deduplicacion y Verificacion de Enlaces

### Problema 1: Memoria de deduplicacion insuficiente para sitios diarios

**Situacion actual:**
```typescript
// Linea 724-731: Fetch de 50 temas
.limit(50);

// Linea 957-959: Pero solo usa 30
...usedTopics.slice(0, 30),
```

Para sitios con publicacion diaria, 30 temas = 1 mes de memoria, lo cual es justo. Un sitio con publicaciones diarias genera ~30 articulos/mes, asi que con 30 temas de memoria apenas evita repetir en el mes actual pero no considera el historial mas amplio.

**Solucion propuesta:**

Ajustar dinamicamente la cantidad de temas segun la frecuencia de publicacion:

```typescript
// Nueva logica adaptativa segun frecuencia
function getTopicsLimit(publishFrequency: string): number {
  switch (publishFrequency) {
    case 'daily':
    case 'daily_weekdays':
      return 60; // ~2 meses de memoria para diario
    case 'weekly':
    case 'biweekly':
      return 30; // ~6-7 meses para semanal
    case 'monthly':
    default:
      return 20; // ~20 meses para mensual
  }
}
```

**Cambios en generate-article-saas/index.ts:**
1. Actualizar `getUsedTopicsForSite()` para aceptar el limite como parametro
2. Usar la frecuencia del site para determinar el limite
3. Actualizar el slice en la linea 959 para usar el mismo limite dinamico

---

### Problema 2: Enlaces externos que dan 404

**Situacion actual:**

El prompt pide al LLM incluir enlaces a fuentes de autoridad, pero el LLM "inventa" URLs basandose en su conocimiento entrenado. Muchos de estos URLs:
- Son estudios que ya no estan online
- Son URLs que parecen reales pero nunca existieron (alucinacion)
- Son URLs que cambiaron de direccion

**Como funciona actualmente:**
```
Prompt → LLM genera HTML con enlaces inventados → Se guarda sin verificar → Usuario publica con enlaces rotos
```

**Solucion propuesta: Verificacion post-generacion**

Crear una funcion que:
1. Extraiga todos los enlaces externos del HTML generado
2. Verifique cada uno con una peticion HEAD (rapida, no descarga contenido)
3. Elimine los enlaces que devuelvan 404/error, dejando solo el texto del ancla

```typescript
async function verifyAndCleanExternalLinks(htmlContent: string): Promise<string> {
  // 1. Extraer todos los <a href="https://...">...</a>
  const linkRegex = /<a\s+([^>]*href="(https?:\/\/[^"]+)"[^>]*)>([^<]+)<\/a>/gi;
  
  // 2. Para cada enlace, verificar con HEAD request (timeout 5s)
  // 3. Si 404 o error → reemplazar <a>texto</a> por solo "texto"
  // 4. Si OK → mantener el enlace
  
  return cleanedHtml;
}
```

**Ventajas:**
- No modifica el prompt ni la generacion
- Verifica DESPUES de generar (no ralentiza la generacion)
- Elimina enlaces rotos automaticamente, manteniendo el texto legible
- Google prefiere contenido sin enlaces rotos

**Consideraciones de rendimiento:**
- Usaremos HEAD requests (solo headers, no body) = ~100-200ms por enlace
- Timeout de 5 segundos para evitar bloqueos
- Maximo 10 enlaces verificados para no ralentizar demasiado

---

### Resumen de cambios

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `generate-article-saas/index.ts` | Limite dinamico de temas segun frecuencia | Evitar repeticion en sitios diarios |
| `generate-article-saas/index.ts` | Nueva funcion `verifyAndCleanExternalLinks()` | Eliminar enlaces 404 antes de guardar |
| `generate-article/index.ts` | Mismos cambios (MKPro farmacias) | Consistencia |
| `generate-article-empresa/index.ts` | Mismos cambios (MKPro empresas) | Consistencia |

---

### Flujo actualizado

```text
1. Determinar frecuencia del site (daily/weekly/monthly)
2. Calcular limite de temas: 60 para daily, 30 para weekly, 20 para monthly
3. Obtener temas usados con ese limite
4. Generar articulo con IA
5. [NUEVO] Verificar enlaces externos en el HTML
6. [NUEVO] Eliminar enlaces que devuelvan 404
7. Guardar articulo con contenido limpio
```

---

### Ejemplo de verificacion de enlaces

**Antes (HTML generado por LLM):**
```html
<p>Segun un <a href="https://www.who.int/estudio-2019-antiguo" target="_blank">estudio de la OMS</a>, 
el 45% de personas...</p>
```

**Despues (si el enlace da 404):**
```html
<p>Segun un estudio de la OMS, el 45% de personas...</p>
```

El texto se mantiene legible, solo desaparece el enlace roto.

---

### Alternativa considerada (descartada)

Otra opcion seria usar una API de busqueda para encontrar URLs reales. Esto requeriria:
- Integrar Firecrawl o similar
- Buscar cada tema mencionado
- Insertar URLs encontradas

Esto es mas complejo y costoso. La solucion de verificacion es mas simple y efectiva: si el enlace no existe, mejor no ponerlo.

