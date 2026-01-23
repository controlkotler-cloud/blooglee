-- Hacer farmacia_id nullable para permitir registros solo con empresa_id
ALTER TABLE wordpress_sites ALTER COLUMN farmacia_id DROP NOT NULL;

-- Asegurar que cada registro tenga al menos una referencia (farmacia o empresa)
ALTER TABLE wordpress_sites 
ADD CONSTRAINT wordpress_sites_owner_check 
CHECK (farmacia_id IS NOT NULL OR empresa_id IS NOT NULL);