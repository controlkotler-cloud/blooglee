-- ========================================
-- BLOG POSTS TABLE
-- ========================================
CREATE TABLE public.blog_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'SEO',
    author_name TEXT NOT NULL DEFAULT 'Equipo Blooglee',
    author_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    author_role TEXT DEFAULT 'Marketing Digital',
    read_time TEXT NOT NULL DEFAULT '5 min',
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_published BOOLEAN NOT NULL DEFAULT false,
    seo_keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access (for blog visitors)
CREATE POLICY "Blog posts are publicly readable"
ON public.blog_posts
FOR SELECT
USING (is_published = true);

-- Only service role can insert/update/delete (via edge functions)
CREATE POLICY "Service role can manage blog posts"
ON public.blog_posts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ========================================
CREATE TABLE public.newsletter_subscribers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    source TEXT DEFAULT 'blog',
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for subscription)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Only service role can read/update/delete
CREATE POLICY "Service role can manage subscribers"
ON public.newsletter_subscribers
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ========================================
-- MIGRATE EXISTING STATIC BLOG POSTS
-- ========================================
INSERT INTO public.blog_posts (slug, title, excerpt, content, image_url, category, author_name, author_avatar, author_role, read_time, published_at, is_published, seo_keywords) VALUES
('que-es-blooglee', '¿Qué es Blooglee? Tu asistente de contenido con IA', 'Descubre cómo Blooglee automatiza la creación de artículos SEO para tu blog. Genera contenido optimizado y publícalo en WordPress automáticamente.', '## ¿Qué es Blooglee?

Blooglee es una plataforma de automatización de contenido que utiliza inteligencia artificial para generar artículos de blog optimizados para SEO. Está diseñada para empresas, agencias de marketing y profesionales que necesitan mantener sus blogs actualizados sin invertir horas en la redacción.

## ¿Cómo funciona?

El proceso es sencillo:

1. **Configuras tu sitio**: Añades la información de tu negocio, sector y audiencia objetivo.
2. **La IA genera contenido**: Blooglee crea artículos únicos basados en tendencias y temas relevantes para tu sector.
3. **Publicas automáticamente**: Los artículos se publican directamente en tu WordPress con un solo clic.

## Características principales

- **Generación con IA**: Contenido original y optimizado para SEO
- **Integración WordPress**: Publicación directa sin copiar y pegar
- **Multiidioma**: Soporte para español y catalán
- **Imágenes incluidas**: Cada artículo incluye una imagen destacada relevante

## ¿Para quién es Blooglee?

Blooglee es ideal para:

- **Pequeñas empresas** que quieren tener presencia online sin contratar redactores
- **Agencias de marketing** que gestionan múltiples blogs de clientes
- **Freelancers** que necesitan escalar su producción de contenido
- **E-commerce** que quieren mejorar su SEO con contenido fresco

## FAQ

### ¿Blooglee escribe contenido único?
Sí, cada artículo es generado de forma única utilizando IA avanzada. No hay contenido duplicado.

### ¿Puedo editar los artículos antes de publicarlos?
Por supuesto. Puedes revisar y modificar cualquier artículo antes de publicarlo.

### ¿Funciona con cualquier WordPress?
Sí, Blooglee es compatible con cualquier instalación de WordPress mediante la API REST.', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop', 'Tutoriales', 'Equipo Blooglee', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 'Marketing Digital', '6 min', '2025-01-15 10:00:00+00', true, ARRAY['blooglee', 'qué es blooglee', 'automatización contenido', 'IA blog']),

('blooglee-vs-nextblog', 'Blooglee vs NextBlog.ai: Comparativa completa 2025', 'Análisis detallado comparando Blooglee y NextBlog.ai. Descubre cuál es mejor para tu negocio según funcionalidades, precios y facilidad de uso.', '## Blooglee vs NextBlog.ai: ¿Cuál elegir?

Cuando buscas una herramienta de generación de contenido con IA, es importante comparar las opciones disponibles. En esta comparativa analizamos Blooglee y NextBlog.ai para ayudarte a tomar la mejor decisión.

## Comparativa de funcionalidades

| Característica | Blooglee | NextBlog.ai |
|---------------|----------|-------------|
| Generación con IA | ✅ | ✅ |
| Integración WordPress | ✅ Directa | ⚠️ Manual |
| Multiidioma | ✅ ES/CAT | ❌ Solo EN |
| Plan gratuito | ✅ | ❌ |
| Imágenes incluidas | ✅ | ⚠️ Extra |
| Soporte español | ✅ | ❌ |

## Precios

**Blooglee**:
- Plan Free: 1 artículo/mes gratis
- Plan Starter: 9€/mes (4 artículos)
- Plan Pro: 29€/mes (30 artículos)

**NextBlog.ai**:
- Solo planes de pago desde $29/mes

## ¿Cuándo elegir Blooglee?

Blooglee es la mejor opción si:
- Tu audiencia es hispanohablante
- Necesitas integración directa con WordPress
- Quieres empezar gratis antes de comprometerte
- Valoras el soporte en español

## ¿Cuándo elegir NextBlog.ai?

NextBlog.ai puede ser mejor si:
- Tu contenido es principalmente en inglés
- Ya tienes un flujo de trabajo establecido

## FAQ

### ¿Puedo migrar de NextBlog a Blooglee?
Sí, el proceso es sencillo. Solo necesitas configurar tu sitio en Blooglee y empezar a generar nuevo contenido.

### ¿Blooglee tiene límite de palabras?
No, los artículos de Blooglee tienen ~2000 palabras sin límites adicionales.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop', 'Marketing', 'Equipo Blooglee', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 'Marketing Digital', '7 min', '2025-01-14 10:00:00+00', true, ARRAY['blooglee vs nextblog', 'comparativa', 'alternativas nextblog']),

('como-automatizar-blog-empresa', 'Cómo automatizar el blog de tu empresa en 2025', 'Guía paso a paso para automatizar la creación de contenido del blog de tu empresa. Ahorra tiempo y mejora tu SEO con herramientas de IA.', '## ¿Por qué automatizar tu blog empresarial?

Mantener un blog actualizado es esencial para el SEO, pero consume mucho tiempo. La automatización te permite publicar contenido regular sin dedicar horas a la redacción.

## Beneficios de la automatización

- **Ahorro de tiempo**: Reduce horas de trabajo semanal
- **Consistencia**: Publicaciones regulares mejoran el SEO
- **Escalabilidad**: Crece sin contratar más personal
- **Costes reducidos**: Más económico que redactores freelance

## Paso a paso: Automatiza tu blog con Blooglee

### Paso 1: Crea tu cuenta
Regístrate gratis en Blooglee y accede al dashboard.

### Paso 2: Configura tu sitio
Añade la información de tu empresa:
- Nombre y sector
- URL del blog
- Idiomas de publicación

### Paso 3: Conecta WordPress
Introduce las credenciales de tu WordPress para habilitar la publicación automática.

### Paso 4: Genera tu primer artículo
Haz clic en "Generar artículo" y revisa el contenido generado.

### Paso 5: Publica
Si estás satisfecho, publica directamente desde Blooglee.

## Resultados esperados

Empresas que automatizan su blog con Blooglee reportan:
- 70% menos tiempo en creación de contenido
- 3x más artículos publicados al mes
- Mejora en rankings de búsqueda

## FAQ

### ¿La automatización afecta la calidad del contenido?
No si usas herramientas de IA avanzadas. Blooglee genera contenido de alta calidad que puedes revisar antes de publicar.

### ¿Google penaliza el contenido generado por IA?
No, Google valora el contenido útil independientemente de cómo se cree. Lo importante es que aporte valor al lector.', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop', 'Tutoriales', 'Equipo Blooglee', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 'Marketing Digital', '8 min', '2025-01-13 10:00:00+00', true, ARRAY['automatizar blog', 'blog empresa', 'automatización contenido']),

('seo-para-pymes-guia-2025', 'SEO para PYMEs: Guía completa para 2025', 'Estrategias de SEO efectivas para pequeñas y medianas empresas. Aprende a posicionar tu web sin grandes presupuestos.', '## SEO para PYMEs en 2025

El SEO sigue siendo una de las estrategias de marketing más rentables para PYMEs. Con el enfoque correcto, puedes competir con empresas más grandes sin necesitar grandes presupuestos.

## Fundamentos del SEO para PYMEs

### 1. Investigación de palabras clave

Enfócate en keywords de cola larga (long-tail) con menos competencia pero alta intención de compra.

**Ejemplo**:
- ❌ "zapatos" (muy competido)
- ✅ "zapatos de cuero artesanal Madrid" (específico)

### 2. Contenido de calidad

Google prioriza el contenido que responde preguntas de usuarios. Publica artículos que resuelvan problemas reales de tu audiencia.

### 3. SEO local

Si tienes un negocio físico:
- Reclama tu perfil de Google My Business
- Consigue reseñas de clientes
- Incluye tu ubicación en el contenido

### 4. Optimización técnica

- Velocidad de carga < 3 segundos
- Diseño responsive
- HTTPS obligatorio
- Estructura de URLs clara

## Estrategia de contenido para PYMEs

| Frecuencia | Tipo de contenido | Objetivo |
|------------|-------------------|----------|
| Semanal | Blog posts | SEO y autoridad |
| Mensual | Guías largas | Captar leads |
| Trimestral | Casos de estudio | Conversión |

## Herramientas gratuitas de SEO

- Google Search Console
- Google Analytics 4
- Ubersuggest (versión gratuita)
- Answer the Public

## FAQ

### ¿Cuánto tarda el SEO en dar resultados?
Normalmente entre 3-6 meses para ver mejoras significativas en rankings.

### ¿Necesito contratar una agencia de SEO?
No necesariamente. Con las herramientas adecuadas, muchas PYMEs pueden gestionar su SEO internamente. Blooglee ayuda automatizando la creación de contenido.', 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=400&fit=crop', 'SEO', 'Equipo Blooglee', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 'Marketing Digital', '10 min', '2025-01-12 10:00:00+00', true, ARRAY['SEO pymes', 'SEO pequeñas empresas', 'posicionamiento web']),

('ia-generativa-marketing-contenidos', 'IA generativa en marketing de contenidos: Guía práctica', 'Cómo usar la inteligencia artificial generativa para crear contenido de marketing efectivo. Casos de uso y mejores prácticas.', '## La revolución de la IA en el marketing de contenidos

La IA generativa ha transformado la forma en que las empresas crean contenido. Ya no es ciencia ficción: es una herramienta práctica que ahorra tiempo y recursos.

## ¿Qué es la IA generativa?

Es un tipo de inteligencia artificial capaz de crear contenido nuevo (texto, imágenes, código) a partir de instrucciones. Los modelos más conocidos son GPT-4, Claude y Gemini.

## Casos de uso en marketing

### 1. Generación de artículos de blog
Herramientas como Blooglee utilizan IA para crear artículos completos optimizados para SEO.

### 2. Copywriting para anuncios
La IA puede generar múltiples variaciones de copy para tests A/B.

### 3. Descripciones de productos
Ideal para e-commerce con cientos de productos.

### 4. Emails personalizados
Genera plantillas que puedes personalizar para cada segmento.

## Mejores prácticas

### DO:
- ✅ Revisa y edita el contenido generado
- ✅ Añade tu voz de marca
- ✅ Verifica datos y estadísticas
- ✅ Usa la IA como asistente, no sustituto

### DON''T:
- ❌ Publicar sin revisar
- ❌ Depender 100% de la IA
- ❌ Ignorar el contexto de tu audiencia
- ❌ Copiar contenido de otros

## El futuro del marketing con IA

La IA no reemplazará a los marketers, pero los marketers que usen IA reemplazarán a los que no lo hagan.

## FAQ

### ¿Google detecta contenido de IA?
Google evalúa la calidad, no el origen. Contenido útil y original rankea bien independientemente de si fue escrito por humanos o IA.

### ¿Qué herramienta de IA es mejor para contenido?
Depende de tu uso. Para blogs en español, Blooglee ofrece la mejor combinación de calidad y facilidad de uso.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop', 'Marketing', 'Equipo Blooglee', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 'Marketing Digital', '7 min', '2025-01-11 10:00:00+00', true, ARRAY['IA generativa', 'marketing contenidos', 'inteligencia artificial marketing']);