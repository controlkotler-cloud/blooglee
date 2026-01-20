-- Create wordpress_sites table to store WordPress credentials for each farmacia
CREATE TABLE public.wordpress_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmacia_id UUID NOT NULL REFERENCES public.farmacias(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  wp_username TEXT NOT NULL,
  wp_app_password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(farmacia_id)
);

-- Enable RLS
ALTER TABLE public.wordpress_sites ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Allow all operations on wordpress_sites" 
ON public.wordpress_sites 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wordpress_sites_updated_at
BEFORE UPDATE ON public.wordpress_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();