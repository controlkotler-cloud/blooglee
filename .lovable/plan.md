
# Mejora del sistema de Social Media del panel admin

## Objetivo

Integrar las directrices del Social Media Brand Kit de Blooglee en las dos Edge Functions de generacion social (`generate-social-content` y `generate-social-from-blog`), mejorando drasticamente la calidad de los copys generados y probando un modelo de imagen superior.

---

## Cambios detectados vs estado actual

### Problemas actuales en los prompts

1. **`generate-social-content`**: Los prompts son genericos y cortos. No incluyen las reglas de marca (tuteo vosotros, espanol de Espana, estructura gancho-contexto-valor-CTA, pilares de contenido, lista de prohibiciones).
2. **`generate-social-from-blog`**: Algo mejor pero sigue sin reflejar el Brand Kit. TikTok genera "guiones de video" cuando deberia generar copys de marketing directos. No tiene las reglas de hashtags del kit.
3. **Modelo de imagen**: `generate-social-content` usa `google/gemini-3-pro-image-preview` (bueno). `generate-social-from-blog` usa `google/gemini-2.5-flash-image` para adaptar imagenes, que es un modelo inferior. Deberia usar `google/gemini-3-pro-image-preview` para mejor calidad.
4. **Hashtags**: El kit define hashtags de marca (#Blooglee, #TuBlogEnPilotoAutomatico, #BlogConIA, #HechoEnBarcelona) y de comunidad para rotar. Los prompts actuales dicen "SIN hashtags" cuando el kit si los quiere en Instagram (max 5-8) y LinkedIn (2-3).

---

## Plan de implementacion

### 1. Reescribir prompts en `generate-social-content/index.ts`

Sustituir los `PLATFORM_PROMPTS` actuales por prompts completos que incluyan:

- **System prompt comun**: Identidad de Blooglee, regla del tuteo (tu/vosotros, NUNCA usted), espanol nativo de Espana, estructura gancho-contexto-valor-CTA, lista de expresiones naturales, lista de prohibiciones (anglicismos, superlativos vacios, mayusculas agresivas, mas de 3 emojis seguidos), pilares de contenido (educativo 40%, producto 25%, social proof 20%, comunidad 15%).

- **Instagram**: 150-250 palabras, emojis moderados (2-3), tono visual-didactico ("amigo que sabe de marketing"), hashtags al final (3-5: siempre #Blooglee + 2-4 de comunidad rotando), CTA suave.

- **LinkedIn**: 200-400 palabras, tono profesional-cercano ("colega experto en un cafe"), datos/estadisticas, saltos de linea, hashtags (2-3: #Blooglee + 1-2 de nicho), CTA con pregunta o invitacion a comentar.

- **Facebook**: 100-250 palabras, tono cercano-explicativo ("vecino que te explica las cosas"), explicar como si fuera la primera vez, preguntas abiertas al final, hashtags (2-3: #Blooglee + 1-2 relevantes), historias reales.

- **TikTok**: 100-200 palabras, copy de marketing (NO guion de video), tono informal-directo ("colega que va al grano"), gancho fuerte primera frase, humor sutil permitido, SIN hashtags (no funcionan en TikTok segun el kit), CTA tipo "link en bio".

### 2. Reescribir prompts en `generate-social-from-blog/index.ts`

Misma logica aplicada a `buildPlatformConfigs`:

- Actualizar los `copyPrompt` de cada plataforma con las mismas reglas del Brand Kit.
- TikTok: cambiar de "guion de video con escenas" a copy de marketing directo (100-200 palabras).
- Anadir hashtags donde corresponda (Instagram, LinkedIn, Facebook) y quitarlos de TikTok.
- Incluir el contexto de audiencia (empresas vs agencias) en el tono.

### 3. Mejorar modelo de imagen en `generate-social-from-blog`

- Cambiar `google/gemini-2.5-flash-image` a `google/gemini-3-pro-image-preview` en la funcion `adaptImage` para obtener imagenes de mayor calidad en la adaptacion de aspect ratios.

### 4. Actualizar system prompt comun

Crear una constante `BLOOGLEE_SOCIAL_SYSTEM_PROMPT` compartida en ambas funciones que encapsule:

```text
Eres el community manager de Blooglee, una plataforma de automatizacion de blogs con IA desde Barcelona.

IDENTIDAD DE MARCA:
- Blooglee genera articulos SEO y los publica en WordPress automaticamente
- Precio desde 15 euros/mes
- Hecho en Barcelona

REGLAS ABSOLUTAS DE COMUNICACION:
1. SIEMPRE tutear: "tu" (singular) y "vosotros" (plural). NUNCA "usted/ustedes".
2. Espanol nativo de Espana. Expresiones naturales: "echar un vistazo", "ir al grano", "sin complicaciones", "mola" (con moderacion).
3. Prohibido: anglicismos innecesarios (performar, engagement, insights, leverage), superlativos vacios (revolucionario, disruptivo), mayusculas agresivas, mas de 3 emojis seguidos, frases de traduccion del ingles.
4. Estructura: Gancho (primera linea) > Contexto > Valor > CTA suave.
5. Cada post debe aportar valor aunque el lector no conozca Blooglee.

HASHTAGS DE MARCA (rotar): #Blooglee #TuBlogEnPilotoAutomatico #BlogConIA #HechoEnBarcelona
HASHTAGS DE COMUNIDAD (rotar segun post): #SEOenEspanol #MarketingDeContenidos #BloggingTips #PYMEdigital #NegocioLocal #EmprendedoresEspana #CrecimientoOrganico
```

### 5. Checklist de calidad (instruccion final en prompts)

Anadir al final de cada prompt la checklist del kit:
- Usa tu/vosotros? No hay ni un "usted"?
- Suena a espanol de Espana natural?
- Primera linea engancha?
- Aporta valor o es solo autopromocion?
- CTA suave y natural?
- Emojis puntuales (2-3 max)?
- Ninguna frase suena a traduccion del ingles?

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/generate-social-content/index.ts` | Reescribir PLATFORM_PROMPTS con Brand Kit, anadir system prompt de marca, actualizar reglas de hashtags por plataforma |
| `supabase/functions/generate-social-from-blog/index.ts` | Reescribir copyPrompts en buildPlatformConfigs, cambiar TikTok de guion a copy, actualizar modelo de imagen a gemini-3-pro-image-preview, anadir hashtags |

## Lo que NO cambia

- La UI del panel admin (`AdminSocialContent.tsx`, `SocialContentCard.tsx`, `SocialGeneratorForm.tsx`) se mantiene igual
- La tabla `social_content` no necesita cambios
- La integracion con Metricool no cambia
- El flujo de generacion bulk desde blog posts no cambia
