

# Plan: Insertar Prompts Iniciales en la Base de Datos

## Problema

La tabla `prompts` está vacía. Creamos la estructura pero no insertamos los prompts que actualmente están hardcodeados en las Edge Functions. Por eso la página `/admin/prompts` muestra "No hay prompts".

## Solución

Ejecutar una migración SQL que inserte todos los prompts identificados en las Edge Functions como datos iniciales.

---

## Prompts a Insertar

Basándome en el análisis de las Edge Functions, estos son los prompts que debemos insertar:

| Key | Nombre | Categoría | Variables |
|-----|--------|-----------|-----------|
| `generate-article.system.es` | Sistema Farmacia ES | farmacias | `{{dateContext}}`, `{{geoContext}}` |
| `generate-article.user.es` | Usuario Farmacia ES | farmacias | `{{pharmacy.name}}`, `{{pharmacy.location}}`, `{{topic}}`, `{{keywords}}`, `{{dateContext}}`, `{{geoContext}}` |
| `generate-article.topic` | Generador Temas Farmacia | farmacias | `{{pharmacy.name}}`, `{{sector}}`, `{{location}}`, `{{month}}`, `{{year}}` |
| `generate-article-empresa.system.es` | Sistema Empresa ES | empresas | `{{dateContext}}`, `{{geoContext}}`, `{{sectorContext}}` |
| `generate-article-empresa.topic` | Generador Temas Empresa | empresas | `{{company.name}}`, `{{sector}}`, `{{location}}`, `{{month}}`, `{{year}}`, `{{usedTopics}}` |
| `generate-article-saas.system.es` | Sistema SaaS ES | saas | `{{dateContext}}`, `{{geoContext}}`, `{{sectorContext}}` |
| `generate-article-saas.topic` | Generador Temas SaaS | saas | `{{site.name}}`, `{{sector}}`, `{{description}}`, `{{month}}`, `{{year}}`, `{{usedTopics}}` |
| `generate-blog.metadata` | Blog Metadatos | blog | `{{category}}`, `{{usedTopics}}`, `{{year}}`, `{{forceCategory}}` |
| `generate-blog.content` | Blog Contenido | blog | `{{title}}`, `{{topic}}`, `{{category}}`, `{{year}}`, `{{monthName}}` |
| `generate-blog.image` | Blog Imagen AI | blog | `{{topic}}`, `{{category}}` |
| `support-chatbot.system` | Chatbot Soporte | soporte | `{{articlesContext}}`, `{{errorContext}}` |

---

## Migración SQL

Se ejecutará una migración que inserta cada prompt con su contenido completo extraído de las Edge Functions. Cada prompt tendrá:

- `key`: Identificador único para referenciarlo desde las Edge Functions
- `name`: Nombre legible para el panel de admin
- `description`: Descripción del propósito del prompt
- `category`: Categoría para filtrar (farmacias, empresas, saas, blog, soporte)
- `content`: El texto completo del prompt
- `variables`: Array JSON con las variables disponibles
- `is_active`: true para que se usen por defecto
- `version`: 1 para la versión inicial

---

## Ejemplo de Inserción

```sql
INSERT INTO prompts (key, name, description, category, content, variables, is_active, version) VALUES
(
  'support-chatbot.system',
  'Chatbot Soporte - Sistema',
  'Prompt del sistema para el chatbot de soporte de Blooglee',
  'soporte',
  'Eres Bloobot, el asistente de soporte de Blooglee...', -- contenido completo
  '["{{articlesContext}}", "{{errorContext}}"]'::jsonb,
  true,
  1
);
```

---

## Archivos a Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| Nueva migración SQL | CREAR | Insertar todos los prompts iniciales |

---

## Resultado Esperado

Después de ejecutar la migración:

1. La página `/admin/prompts` mostrará todos los prompts organizados por categoría
2. Podrás ver, editar y mejorar cada prompt sin tocar código
3. Las Edge Functions seguirán funcionando con los prompts hardcodeados (fallback)
4. Cuando actives la lectura desde BD en las Edge Functions, usarán estos prompts editables

---

## Sección Técnica

La migración insertará aproximadamente 11 prompts iniciales. Debido al tamaño de algunos prompts (el de chatbot tiene ~1500 caracteres, los de generación de artículos tienen ~2000+ caracteres), la migración será extensa pero contendrá todo el contenido necesario.

Para mantener la compatibilidad hacia atrás, las Edge Functions NO se modificarán en este paso. Primero poblaremos la tabla y luego, en un paso posterior, actualizaremos las funciones para leer de la BD con fallback al hardcodeado.

