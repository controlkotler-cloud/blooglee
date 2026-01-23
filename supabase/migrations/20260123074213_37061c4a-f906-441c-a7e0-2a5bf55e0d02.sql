-- Add columns for manual pharmacy management
ALTER TABLE farmacias 
ADD COLUMN auto_generate boolean NOT NULL DEFAULT true,
ADD COLUMN custom_topic text;