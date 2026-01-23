-- Make custom_topic nullable for empresas (optional when auto_generate is true)
ALTER TABLE empresas ALTER COLUMN custom_topic DROP NOT NULL;