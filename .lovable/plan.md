

# Plan: Replantear los Calendarios para Clinicas y Autonomos

## Resumen del Problema

| Recurso | Estado Actual | Problema |
|---------|---------------|----------|
| Calendario Clinicas | Existe pero mal enfocado | Fechas de salud general (Cancer, SIDA, Diabetes, EPOC) irrelevantes para dental/estetica/fisio |
| Calendario Autonomos | No existe (apunta a .pdf inexistente) | Nunca se creo, descripcion actual habla de "fechas fiscales" que no tiene sentido |

## Solucion Propuesta

### 1. Calendario Editorial 2026 para Clinicas (Rehacer completo)

**Nuevo enfoque:** Calendario especifico para clinicas de **bienestar y belleza** (dental, estetica, fisioterapia)

**Estructura por mes:**

| Mes | Fechas/Temporadas Relevantes | Temas Dental | Temas Estetica | Temas Fisio |
|-----|------------------------------|--------------|----------------|-------------|
| Enero | Propositos, post-navidad | Revision dental anual, blanqueamiento post-excesos | Tratamientos detox, propositos de piel | Lesiones por frio, vuelta al gym |
| Febrero | San Valentin, Carnaval | Sonrisa perfecta para San Valentin | Tratamientos express para lucir | Preparacion fisica primavera |
| Marzo | Primavera, Dia de la Mujer | Ortodoncia invisible | Tratamientos anticelulitis pre-verano | Alergias y contracturas |
| Abril | Semana Santa, Pre-verano | Revision pre-vacaciones | Mesoterapia, drenaje linfatico | Prevencion lesiones deportivas |
| Mayo | Dia de la Madre, Bodas | Carillas y estetica dental | Tratamientos regalo mama, novias | Dolor de espalda cronico |
| Junio | Inicio verano, graduaciones | Blanqueamiento express | Depilacion laser, bronceado seguro | Preparacion fisica verano |
| Julio | Vacaciones verano | Urgencias dentales en vacaciones | Proteccion solar, hidratacion | Lesiones playa/piscina |
| Agosto | Relax, preparacion vuelta | Protectores bucales deportivos | Tratamientos reparadores post-sol | Estiramientos vacaciones |
| Septiembre | Vuelta rutina, nuevos habitos | Revision vuelta al cole, ortodoncia | Peeling otonal, renovacion piel | Vuelta al deporte |
| Octubre | Otono, Halloween | Higiene bucal Halloween dulces | Tratamientos antiaging | Lesiones otono |
| Noviembre | Pre-navidad, Black Friday | Ofertas tratamientos dentales | Tratamientos pre-fiestas | Preparacion esqui |
| Diciembre | Navidad, fiestas | Sonrisa para fotos navidad | Tratamientos express fiestas | Lesiones invierno |

**Tips actualizados:** Especificos para dental, estetica y fisio

---

### 2. Calendario Editorial 2026 para Autonomos (Crear desde cero)

**Nuevo enfoque:** Calendario de contenidos para **cualquier profesional independiente** que quiera posicionar su marca personal y atraer clientes

**Estructura por mes:**

| Mes | Temas de Contenido | Enfoque SEO/Marketing |
|-----|-------------------|----------------------|
| Enero | Propositos profesionales, planificacion anual, tendencias del sector | Posts de predicciones y tendencias |
| Febrero | Diferenciacion, propuesta de valor, casos de exito | Contenido de autoridad |
| Marzo | Networking, colaboraciones, visibilidad online | Estrategias de posicionamiento |
| Abril | Primavera = renovacion, nuevos servicios, formacion | Lanzamientos y novedades |
| Mayo | Productividad, herramientas del oficio, metodologia | Tutoriales y how-to |
| Junio | Preparacion verano, contenido evergreen | Posts atemporales |
| Julio | Balance semestre, casos de exito acumulados | Retrospectiva y social proof |
| Agosto | Contenido ligero, detras de escenas, marca personal | Humanizar la marca |
| Septiembre | Nuevos comienzos, captacion clientes | Contenido comercial |
| Octubre | Preparacion cierre de ano, ofertas especiales | Black Friday anticipado |
| Noviembre | Testimonios, resumen de logros | Social proof pre-navidad |
| Diciembre | Balance anual, agradecimientos, objetivos 2027 | Contenido emocional |

**Tips:** Consejos practicos para cualquier autonomo que quiera publicar contenido que atraiga clientes

---

## Archivos a Modificar

| Archivo | Accion |
|---------|--------|
| `public/resources/calendario-editorial-clinicas-2026.html` | **Reescribir** con nuevo enfoque dental/estetica/fisio |
| `public/resources/calendario-editorial-autonomos-2026.html` | **Crear** (actualmente no existe, leadMagnets apunta a .pdf) |
| `src/data/leadMagnets.ts` linea 123 | **Cambiar** extension de `.pdf` a `.html` para autonomos |
| `src/data/leadMagnets.ts` linea 119 | **Actualizar** descripcion del calendario autonomos |

---

## Resultado Esperado

1. **Calendario Clinicas:** Util para dentistas, clinicas de estetica y fisioterapeutas con fechas y temas relevantes para su practica
2. **Calendario Autonomos:** Util para cualquier profesional independiente que quiera planificar contenido para su blog sin depender de fechas fiscales

