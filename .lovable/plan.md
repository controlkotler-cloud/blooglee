
# Plan: Reinicio Blog Blooglee con 5 Posts Premium

## Cambios Requeridos

### 1. Avatar del Equipo Blooglee
Cambiar la foto masculina de Unsplash por un avatar femenino profesional.

**Avatar actual** (línea 524):
```
https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face
```

**Nuevo avatar** (mujer profesional):
```
https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face
```

### 2. Reglas de Capitalización Español

Añadir al prompt de generación de metadatos instrucciones explícitas:

```text
REGLAS DE CAPITALIZACIÓN (ESPAÑOL):
- Solo la primera letra del título en mayúscula (más nombres propios)
- NO usar capitalización tipo inglés (Title Case)
- Ejemplo CORRECTO: "Cómo automatizar tu blog con inteligencia artificial"
- Ejemplo INCORRECTO: "Cómo Automatizar Tu Blog Con Inteligencia Artificial"
```

### 3. Estrategia de Contenido: Opción B - Eliminar y Crear 5 Nuevos

Eliminar los 6 posts actuales y crear 5 nuevos posts premium:

| # | Categoría | Tema Específico | Audiencia |
|---|-----------|-----------------|-----------|
| 1 | Empresas | IA para automatizar marketing de contenidos | PYMEs |
| 2 | Empresas | SEO local para pequeños negocios | PYMEs |
| 3 | Agencias | Gestionar múltiples blogs WordPress a escala | Agencias |
| 4 | Marketing | Comparativa Blooglee vs competidores | General |
| 5 | Tutoriales | Qué es Blooglee y cómo empezar | Nuevos usuarios |

El **post #3** está específicamente diseñado para agencias que gestionan muchos WordPress, con contenido sobre:
- Workflow multi-cliente
- White-label content
- Reporting automatizado
- Escalabilidad de producción

---

## Archivos a Modificar

### 1. `supabase/functions/generate-blog-blooglee/index.ts`

**Cambios:**
- Línea 524: Cambiar URL del avatar a mujer profesional
- Prompt de metadatos (línea 204-225): Añadir reglas de capitalización español
- Prompt de contenido (línea 278-335): Reforzar reglas de capitalización

### 2. Base de Datos

**SQL a ejecutar:**
```sql
-- Eliminar todos los posts actuales
DELETE FROM blog_posts;
```

### 3. Generación de 5 Posts Nuevos

Llamar a la edge function 5 veces con parámetros específicos para cada post:
1. Empresas (tema IA/automatización)
2. Empresas (tema SEO local)
3. Agencias (tema multi-WordPress) ← POST CLAVE
4. Marketing (comparativa)
5. Tutoriales (qué es Blooglee)

---

## Prompt Específico para Post de Agencias

El post #3 tendrá un prompt especializado:

```text
TEMA: Cómo gestionar múltiples blogs WordPress desde una agencia

AUDIENCIA ESPECÍFICA: 
- Agencias de marketing digital
- Freelancers con varios clientes
- Equipos que gestionan 5-50 WordPress diferentes

PUNTOS OBLIGATORIOS:
- Desafíos de escalar producción de contenido
- Cómo Blooglee permite gestionar múltiples sitios
- Workflow de aprobación y publicación
- White-label y branding por cliente
- Métricas y reporting consolidado
- ROI de automatizar vs. redactores internos

DATOS A INCLUIR:
- "Una agencia media gestiona 12-15 blogs de clientes"
- "El tiempo medio de producción por artículo es 4 horas"
- "Con automatización IA, se reduce a 15 minutos de revisión"
```

---

## Flujo de Implementación

```text
1. Actualizar edge function
   ├── Nuevo avatar femenino
   └── Reglas capitalización español
         ↓
2. Eliminar posts actuales (SQL)
         ↓
3. Generar 5 posts nuevos
   ├── Post 1: Empresas (IA/automatización)
   ├── Post 2: Empresas (SEO local)
   ├── Post 3: Agencias (multi-WordPress) ← CLAVE
   ├── Post 4: Marketing (comparativa)
   └── Post 5: Tutoriales (qué es Blooglee)
         ↓
4. Verificar en /blog
         ↓
5. Actualizar SEO assets
```

---

## Resultado Final

| Aspecto | Antes | Después |
|---------|-------|---------|
| Avatar | Hombre (foto) | Mujer (avatar profesional) |
| Títulos | Title Case inglés | Capitalización española correcta |
| Posts Empresas | 1 | 2 |
| Posts Agencias | 0 | 1 (multi-WordPress) |
| Total posts | 6 (calidad mixta) | 5 (todos premium) |
| Longitud | Variable | 2500-3500 palabras todos |
| Imágenes | Unsplash genérico | IA con estética Blooglee |
