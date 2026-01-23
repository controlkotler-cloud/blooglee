-- Create empresas table
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  sector text,
  languages text[] NOT NULL DEFAULT ARRAY['spanish'],
  blog_url text,
  instagram_url text,
  auto_generate boolean NOT NULL DEFAULT true,
  custom_topic text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);

-- Create articulos_empresas table
CREATE TABLE public.articulos_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  topic text NOT NULL,
  pexels_query text,
  content_spanish jsonb,
  content_catalan jsonb,
  image_url text,
  image_photographer text,
  image_photographer_url text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, month, year)
);

-- RLS for articulos_empresas
ALTER TABLE public.articulos_empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on articulos_empresas" ON public.articulos_empresas FOR ALL USING (true) WITH CHECK (true);

-- Add empresa_id to wordpress_sites (optional, for companies)
ALTER TABLE public.wordpress_sites ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;