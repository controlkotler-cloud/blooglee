-- Añadir columnas de perfil de contenido a la tabla sites
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'casual',
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS content_pillars text[] DEFAULT ARRAY['educational', 'trends', 'seasonal']::text[],
ADD COLUMN IF NOT EXISTS avoid_topics text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS preferred_length text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS wordpress_context jsonb,
ADD COLUMN IF NOT EXISTS last_pillar_index integer DEFAULT 0;

-- Añadir comentarios para documentar
COMMENT ON COLUMN public.sites.tone IS 'Tono de voz: formal, casual, technical, educational';
COMMENT ON COLUMN public.sites.target_audience IS 'Descripción de la audiencia objetivo';
COMMENT ON COLUMN public.sites.content_pillars IS 'Pilares de contenido: educational, trends, cases, seasonal, opinion';
COMMENT ON COLUMN public.sites.avoid_topics IS 'Temas a evitar en la generación';
COMMENT ON COLUMN public.sites.preferred_length IS 'Longitud preferida: short (~800), medium (~1500), long (~2500)';
COMMENT ON COLUMN public.sites.wordpress_context IS 'Contexto analizado del WordPress existente';
COMMENT ON COLUMN public.sites.last_pillar_index IS 'Índice del último pilar usado para rotación';