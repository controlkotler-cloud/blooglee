

## Reescritura completa del prompt de generacion de articulos SaaS

### Diagnostico actual

El sistema actual tiene estos problemas fundamentales:

1. **El prompt de generacion del tema y del articulo son mediocres** - No aprovechan toda la informacion del site (descripcion, audiencia, pilares, temas a evitar, custom_topic)
2. **Los terminos prohibidos se validan DESPUES de generar** en vez de incluirlos en el prompt. La IA genera 3 veces, las 3 se rechazan, y cae a un fallback estatico
3. **La traduccion al catalan es literal** - se traduce el texto espanol en vez de generar nativamente en el otro idioma
4. **El footer SEO es siempre identico** - "Quieres mas consejos? Visita nuestro blog..." repetido en cada articulo
5. **El custom_topic (directriz tematica) no se usa en el prompt del articulo**, solo en el del tema

### Solucion: Prompt maestro que usa TODA la informacion del site

#### Datos que se usaran (en orden de prioridad):

| Dato | Uso en el prompt |
|------|-----------------|
| `name` | Primera mencion con enlace a home |
| `sector` | Contexto sectorial del contenido |
| `geographic_scope` + `location` | Solo si es local/regional: mencion de localidad para SEO local. Nacional: nada |
| `description` | Contexto completo del negocio, servicios, propuesta de valor |
| `custom_topic` | Si tiene contenido: directriz tematica global para orientar TODOS los temas. Si vacio: generacion libre |
| `tone` | Estilo de escritura (formal, cercano, tecnico, divulgativo) |
| `target_audience` | A quien va dirigido el contenido |
| `content_pillars` | Pilar actual de la rotacion (educativo, tendencias, casos, estacional) |
| `avoid_topics` | Temas PROHIBIDOS incluidos directamente en el prompt para que la IA no los genere |
| `preferred_length` | Longitud objetivo del articulo |
| `wordpress_context` | Temas recientes del blog WP + estilo detectado para no repetir |
| `blog_url` + `instagram_url` | Frase final variada con enlaces |

#### Cambios tecnicos en `supabase/functions/generate-article-saas/index.ts`:

**Cambio 1: Nuevo prompt de generacion de tema (lineas ~108-140)**

Reescribir `FALLBACK_PROMPTS.topic` para que:
- Incluya los temas a evitar (`avoid_topics`) directamente en las instrucciones
- Incluya los terminos prohibidos del sector dentro del prompt (no como validacion posterior)
- Use el `custom_topic` como directriz tematica si esta rellenado
- Liste los temas ya usados (Blooglee + WordPress sincronizados) para no repetir
- Tenga en cuenta la descripcion del negocio para generar temas relevantes

**Cambio 2: Nuevo prompt de generacion de articulo (lineas ~142-255)**

Reescribir `FALLBACK_PROMPTS.articleSystem` y `articleUser` como un unico prompt maestro que incluya:

```text
Estructura del nuevo prompt:

1. ROL: Eres el mejor redactor de blogs del mundo, especializado en [sector]
2. EMPRESA: [name] - [description completa]
3. CONTEXTO GEOGRAFICO: [solo si local: "en [location]"]
4. AUDIENCIA: [target_audience completo]
5. TONO: [tone + descripcion detallada]
6. PILAR DE CONTENIDO: [pillar actual + descripcion]
7. DIRECTRIZ TEMATICA: [custom_topic si existe]
8. ESTILO DEL BLOG: [wordpress_context.style_notes si existe]
9. TEMA DEL ARTICULO: [topic]
10. LONGITUD: [preferred_length palabras]
11. REGLAS SEO (Yoast verde obligatorio)
12. REGLAS DE ENLACES:
    - Primera mencion de [name] enlaza a [blog_url domain]
    - 2 enlaces externos a fuentes de autoridad
    - Frase final VARIADA (no siempre igual) con enlace a [blog_url] y [instagram_url]
13. TEMAS PROHIBIDOS: [avoid_topics + sector prohibited terms]
14. FORMATO JSON
```

**Cambio 3: Generacion nativa en otros idiomas (lineas ~1365-1423)**

Reemplazar el prompt de traduccion por un prompt de generacion nativa:
- En vez de "Traduce este articulo", sera "Genera un articulo NATIVO en catalan sobre el mismo tema"
- Se le pasa el articulo espanol como referencia de contenido pero se le pide que lo escriba como si fuera un redactor nativo catalan
- Mantiene estructura y datos del espanol pero con expresiones, giros y estilo propios del catalan

**Cambio 4: Frase final variada (lineas ~1528-1563)**

Eliminar el footer estatico hardcodeado y mover la instruccion al prompt de generacion:
- La IA generara la frase final como parte del contenido
- Se le indicara que debe variar: a veces invitar al blog, a veces a redes, a veces ambos
- Se le daran las URLs reales de blog e instagram para que las incluya
- Nunca repetir la misma formula de cierre

**Cambio 5: Eliminar validacion post-generacion de terminos prohibidos (lineas ~1131-1214)**

- Los terminos prohibidos ahora van DENTRO del prompt (cambio 1)
- Eliminar el bucle de 3 intentos con validacion regex
- Si el tema generado no es valido (vacio o error de API), usar fallback ampliado con filtro de duplicados
- Ampliar fallbacks a 10+ opciones por categoria
- Filtrar contra `usedTopics` + `wpTopics` antes de elegir

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-article-saas/index.ts` | Reescritura completa de prompts, eliminacion de validacion post-generacion, generacion nativa multi-idioma, frase final variada |

### Resultado esperado

- Articulos mucho mas relevantes y personalizados para cada site
- Cero temas duplicados (prohibidos incluidos en el prompt)
- Catalan nativo, no traducido
- Frase final variada y natural
- Toda la informacion del site aprovechada al maximo
