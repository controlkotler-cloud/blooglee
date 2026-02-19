

## Plan: Completar el perfil del site durante el onboarding

### Situacion actual
El onboarding tiene 7 pasos internos (Business, Tone, Mood, Topic, Generating, ArticleReady, WordPress) mapeados a 5 puntos en la barra de progreso. Faltan configuraciones importantes que obligan al usuario a ir a Configuracion despues.

### Campos que faltan
1. **Idiomas** (languages) - seleccion de catalan + aviso sobre Polylang
2. **Imagen destacada** (include_featured_image) - con explicacion
3. **Publicacion automatica** (auto_generate) - si/no
4. **Programacion** (publish_frequency, publish_day_of_week, publish_hour_utc) - con restricciones por plan
5. **Temas a evitar** (avoid_topics) - campo libre
6. **Tono de voz** - ya se pregunta en el paso 2 (ToneStep), no requiere cambios

### Propuesta: 2 nuevos pasos

Se crearan 2 nuevos componentes step que se insertaran entre MoodStep y TopicStep:

**Paso 4 (nuevo): ContentPrefsStep** - "Personaliza tu contenido"
- Idiomas: checkbox para catalan (+ card de aviso amarilla si selecciona catalan: "Necesitaras el plugin Polylang instalado en tu WordPress para gestionar contenido en dos idiomas")
- Imagen destacada: switch con explicacion breve ("La imagen destacada aparece en la cabecera de tu post y en redes sociales. Si tu tema de WordPress no la muestra, desactivala.")
- Temas a evitar: textarea con placeholder contextualizado por sector (ej. farmacia: "Ej: medicamentos con receta, diagnosticos medicos")

**Paso 5 (nuevo): SchedulingStep** - "Programacion de articulos"
- Auto-publicar: switch ("Cuando se genere un articulo, se publicara automaticamente en tu WordPress sin necesidad de revision")
- Frecuencia: radio group (mensual, quincenal, semanal) con aviso si el plan es Starter/Free y selecciona semanal ("Para publicar semanalmente necesitas el plan Pro")
- Dia preferido de la semana: select
- Hora preferida: select (convertida a UTC al guardar)

### Nueva estructura del wizard

| Paso interno | Componente | Progreso |
|---|---|---|
| 1 | BusinessStep | 1 - Negocio |
| 2 | ToneStep | 2 - Estilo |
| 3 | MoodStep | 2 - Estilo |
| 4 | ContentPrefsStep (NUEVO) | 3 - Contenido |
| 5 | SchedulingStep (NUEVO) | 4 - Publicacion |
| 6 | TopicStep | 5 - Tema |
| 7 | GeneratingStep | 6 - Generando |
| 8 | ArticleReadyStep | 7 - Listo! |
| 9 | WordPressOnboardingStep | 7 - Listo! |

La barra de progreso pasa de 5 a 7 puntos con las etiquetas: Negocio, Estilo, Contenido, Publicacion, Tema, Generando, Listo!

### Archivos a modificar

1. **Crear** `src/components/onboarding/steps/ContentPrefsStep.tsx`
   - Seccion idiomas: checkbox catalan + card amarilla con icono de aviso si esta activo
   - Seccion imagen destacada: switch + texto explicativo
   - Seccion temas a evitar: textarea con placeholder por sector
   - Guarda en `sites`: languages, include_featured_image, avoid_topics
   - Guarda en stepData: `step_content_prefs`

2. **Crear** `src/components/onboarding/steps/SchedulingStep.tsx`
   - Switch auto-publicar (auto_generate)
   - Radio group frecuencia (monthly/biweekly/weekly) con restriccion por plan (consulta profiles.plan)
   - Select dia de la semana y hora (conversion local a UTC)
   - Guarda en `sites`: auto_generate, publish_frequency, publish_day_of_week, publish_hour_utc
   - Guarda en stepData: `step_scheduling`

3. **Modificar** `src/components/onboarding/OnboardingWizard.tsx`
   - Importar los 2 nuevos componentes
   - Actualizar renderizado: pasos 4 y 5 son los nuevos, 6-9 son los antiguos 4-7
   - Actualizar `STEP_NAMES` y `mapStepToProgressPoint` para 9 pasos / 7 puntos

4. **Modificar** `src/components/onboarding/ProgressBar.tsx`
   - Actualizar `STEP_LABELS` a 7 elementos: Negocio, Estilo, Contenido, Publicacion, Tema, Generando, Listo!

5. **Modificar** `src/hooks/useOnboarding.ts`
   - Actualizar la interfaz `OnboardingStepData` para incluir `step_content_prefs` y `step_scheduling`

### Detalles de UX

- Todos los campos nuevos tienen valores por defecto razonables (espanol activado, imagen destacada activada, auto-publicar activado, frecuencia mensual)
- Cada seccion tiene una breve explicacion contextualizada
- El placeholder de "temas a evitar" cambia segun el sector
- La card de aviso de Polylang solo aparece si se activa catalan
- La restriccion de frecuencia muestra un badge con enlace a /pricing si el plan no permite esa frecuencia
- Todos los valores se persisten directamente en la tabla `sites` al avanzar al siguiente paso

