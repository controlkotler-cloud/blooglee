-- Tabla de versión de caché para prompts
CREATE TABLE prompt_cache_version (
  id integer PRIMARY KEY DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar registro inicial
INSERT INTO prompt_cache_version (id, version) VALUES (1, 1);

-- RLS: Solo lectura para service_role y superadmins
ALTER TABLE prompt_cache_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read cache version"
  ON prompt_cache_version FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Superadmins can manage cache version"
  ON prompt_cache_version FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

-- Trigger para invalidar caché cuando se modifica un prompt
CREATE OR REPLACE FUNCTION increment_prompt_cache_version()
RETURNS trigger AS $$
BEGIN
  UPDATE prompt_cache_version SET 
    version = version + 1,
    updated_at = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prompt_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON prompts
FOR EACH STATEMENT
EXECUTE FUNCTION increment_prompt_cache_version();