

## Plan: Generar 20 articulos estrategicos del blog

### Situacion actual

La edge function `generate-blog-blooglee` genera temas **automaticamente** con IA. No permite forzar un titulo o tema especifico. Para cubrir los 20 huecos estrategicos del plan de marketing, necesitamos poder indicarle a la funcion exactamente que titulo/tema generar.

### Cambio propuesto

Modificar la edge function `generate-blog-blooglee` para aceptar un parametro opcional `forceTopic` que, cuando se proporciona, **salte la generacion automatica de metadatos** y use el titulo/tema dado directamente.

### Como funcionara

Cuando se envie una peticion con `forceTopic`, la funcion:

1. Usara el titulo proporcionado en vez de generar uno con IA
2. Generara el slug automaticamente a partir del titulo
3. Generara el excerpt con IA basandose en el titulo
4. Generara el contenido completo normalmente
5. Saltara la validacion de similaridad (el usuario esta forzando ese tema intencionadamente)

### Parametros nuevos del body

```text
{
  "category": "Empresas" | "Agencias",
  "force": true,
  "forceTopic": "SEO local para clinicas: como atraer pacientes de tu zona con contenido",
  "forceThematicCategory": "SEO",
  "forceLanguage": "catalan"  // opcional, para los 2 posts en catalan
}
```

### Los 20 articulos y como se ejecutaran

Una vez desplegada la funcion actualizada, se lanzaran los 20 articulos invocando la edge function manualmente con cada titulo. Aqui la asignacion:

**HUECO 1 - BOFU (Comparativas, audience: empresas)**
1. "Cuanto cuesta realmente mantener un blog vs usar Blooglee" - Comparativas / Empresas
2. "Blooglee vs redactor freelance: comparativa de coste, tiempo y calidad" - Comparativas / Empresas

**HUECO 2 - SEO Local (SEO, audience: empresas)**
3. "SEO local para clinicas: como atraer pacientes de tu zona con contenido" - SEO / Empresas
4. "SEO para tiendas online pequenas: guia de posicionamiento" - SEO / Empresas
5. "Como posicionar tu negocio local en Google Maps con articulos de blog" - SEO / Empresas

**HUECO 3 - Autonomos (Marketing/Tutoriales, audience: empresas)**
6. "Marketing de contenidos para autonomos: como competir con grandes empresas" - Marketing / Empresas
7. "El blog como herramienta de captacion para freelancers: guia practica" - Tutoriales / Empresas
8. "Las 5 excusas que los autonomos ponen para no tener blog" - Marketing / Empresas

**HUECO 4 - Tendencias (Tendencias, audience: empresas)**
9. "Google y el contenido IA: que dice realmente Google" - Tendencias / Empresas
10. "El futuro del SEO: AEO, SGE y como preparar tu web para la busqueda con IA" - Tendencias / Empresas
11. "Content marketing en Espana: datos y tendencias del mercado hispanohablante" - Tendencias / Empresas

**HUECO 5 - Catalan (Tutoriales/SEO, audience: empresas)**
12. "Com automatitzar el teu blog en catala: guia completa" - Tutoriales / Empresas
13. "SEO en catala: com posicionar contingut en Google per al mercat catala" - SEO / Empresas

### Cambios tecnicos

**Archivo modificado**: `supabase/functions/generate-blog-blooglee/index.ts`

1. Leer `forceTopic` y `forceLanguage` del body de la peticion
2. Cuando `forceTopic` esta presente:
   - Generar slug a partir del titulo (slugify)
   - Llamar a la IA solo para generar excerpt y keywords basados en el titulo
   - Saltar la validacion `isTooSimilar`
3. Cuando `forceLanguage === 'catalan'`:
   - Modificar el prompt de contenido para que escriba en catalan
   - Anadir instrucciones de SEO en catalan al prompt
4. El resto del flujo (generacion de contenido, imagen IA, insercion en BD) permanece igual

### Ejecucion

Tras desplegar la funcion, se ejecutaran los 20 articulos uno a uno invocando la edge function con curl. Los articulos en catalan (12 y 13) se generaran con `forceLanguage: "catalan"`.

Nota: solo se listan 13 articulos porque el plan de marketing menciona 20 pero solo detalla titulos para 13 temas concretos (2 BOFU + 3 SEO Local + 3 Autonomos + 3 Tendencias + 2 Catalan).

