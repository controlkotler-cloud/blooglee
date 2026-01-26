-- Añadir columna description a sites
ALTER TABLE sites ADD COLUMN description TEXT;

-- Crear bucket para imágenes de artículos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('article-images', 'article-images', true);

-- Política de lectura pública
CREATE POLICY "Public access for article images" ON storage.objects 
FOR SELECT USING (bucket_id = 'article-images');

-- Política de escritura para service role (edge functions)
CREATE POLICY "Service role can upload article images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'article-images');

-- Política de actualización para service role
CREATE POLICY "Service role can update article images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'article-images');

-- Política de eliminación para service role
CREATE POLICY "Service role can delete article images" ON storage.objects 
FOR DELETE USING (bucket_id = 'article-images');