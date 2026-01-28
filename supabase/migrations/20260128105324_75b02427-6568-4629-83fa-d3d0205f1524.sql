-- 1. Añadir columna audience a blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'general';

-- 2. Migrar datos existentes (los posts actuales tienen la audiencia en category)
UPDATE blog_posts SET audience = 'empresas' WHERE LOWER(category) = 'empresas';
UPDATE blog_posts SET audience = 'agencias' WHERE LOWER(category) = 'agencias';

-- 3. Asignar categoría temática a posts existentes que tenían Empresas/Agencias como categoría
UPDATE blog_posts SET category = 'Marketing' WHERE LOWER(category) IN ('empresas', 'agencias');

-- 4. Añadir columna audience a newsletter_subscribers
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'both';