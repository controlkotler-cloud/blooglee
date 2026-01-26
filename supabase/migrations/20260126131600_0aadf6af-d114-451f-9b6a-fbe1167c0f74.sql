-- Create table for SaaS WordPress taxonomies (separate from MKPro)
CREATE TABLE public.wordpress_taxonomies_saas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wordpress_config_id UUID NOT NULL REFERENCES public.wordpress_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taxonomy_type TEXT NOT NULL CHECK (taxonomy_type IN ('category', 'tag')),
  wp_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (wordpress_config_id, taxonomy_type, wp_id)
);

-- Enable Row Level Security
ALTER TABLE public.wordpress_taxonomies_saas ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own taxonomies" 
ON public.wordpress_taxonomies_saas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own taxonomies" 
ON public.wordpress_taxonomies_saas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own taxonomies" 
ON public.wordpress_taxonomies_saas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own taxonomies" 
ON public.wordpress_taxonomies_saas 
FOR DELETE 
USING (auth.uid() = user_id);