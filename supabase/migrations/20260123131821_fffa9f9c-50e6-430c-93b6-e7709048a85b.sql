-- Table to store synced categories and tags from WordPress
CREATE TABLE public.wordpress_taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_site_id UUID NOT NULL REFERENCES public.wordpress_sites(id) ON DELETE CASCADE,
  taxonomy_type TEXT NOT NULL CHECK (taxonomy_type IN ('category', 'tag')),
  wp_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wordpress_site_id, taxonomy_type, wp_id)
);

-- Enable RLS
ALTER TABLE public.wordpress_taxonomies ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all operations on wordpress_taxonomies" 
  ON public.wordpress_taxonomies 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Table to store default taxonomies for each WordPress site
CREATE TABLE public.wordpress_site_default_taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_site_id UUID NOT NULL REFERENCES public.wordpress_sites(id) ON DELETE CASCADE,
  taxonomy_id UUID NOT NULL REFERENCES public.wordpress_taxonomies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wordpress_site_id, taxonomy_id)
);

-- Enable RLS
ALTER TABLE public.wordpress_site_default_taxonomies ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all operations on wordpress_site_default_taxonomies" 
  ON public.wordpress_site_default_taxonomies 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_wordpress_taxonomies_site ON public.wordpress_taxonomies(wordpress_site_id);
CREATE INDEX idx_wordpress_taxonomies_type ON public.wordpress_taxonomies(wordpress_site_id, taxonomy_type);
CREATE INDEX idx_wordpress_site_default_taxonomies_site ON public.wordpress_site_default_taxonomies(wordpress_site_id);