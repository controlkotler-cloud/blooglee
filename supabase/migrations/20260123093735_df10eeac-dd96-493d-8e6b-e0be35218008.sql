-- 1. Add new columns to empresas table
ALTER TABLE empresas ADD COLUMN include_featured_image boolean NOT NULL DEFAULT true;
ALTER TABLE empresas ADD COLUMN publish_frequency text NOT NULL DEFAULT 'monthly';
ALTER TABLE empresas ADD COLUMN geographic_scope text NOT NULL DEFAULT 'local';

-- 2. Make location nullable for national scope companies
ALTER TABLE empresas ALTER COLUMN location DROP NOT NULL;

-- 3. Add new columns to articulos_empresas for flexible frequency
ALTER TABLE articulos_empresas ADD COLUMN week_of_month integer DEFAULT 1;
ALTER TABLE articulos_empresas ADD COLUMN day_of_month integer;

-- 4. Drop the existing unique constraint that only allows one article per month
ALTER TABLE articulos_empresas DROP CONSTRAINT IF EXISTS articulos_empresas_empresa_id_month_year_key;

-- 5. Create a new unique constraint that allows multiple articles per month
CREATE UNIQUE INDEX articulos_empresas_unique_idx ON articulos_empresas (empresa_id, year, month, COALESCE(week_of_month, 1), COALESCE(day_of_month, 0));