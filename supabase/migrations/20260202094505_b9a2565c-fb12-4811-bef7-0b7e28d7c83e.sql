-- Add wp_post_url column to track published WordPress post URLs
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS wp_post_url text;
ALTER TABLE articulos_empresas ADD COLUMN IF NOT EXISTS wp_post_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS wp_post_url text;

-- Add comment for documentation
COMMENT ON COLUMN articulos.wp_post_url IS 'URL of the published WordPress post';
COMMENT ON COLUMN articulos_empresas.wp_post_url IS 'URL of the published WordPress post';
COMMENT ON COLUMN articles.wp_post_url IS 'URL of the published WordPress post';