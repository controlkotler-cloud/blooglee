-- Item 5: Update default plan limits to match new pricing
-- Free: 1 site, 1 article total (not per month)
-- Starter: 1 site, 4 articles/month  
-- Pro: 5 sites, 46 articles/month
-- Agency: 25 sites, unlimited (9999)

-- Update defaults for new profiles
ALTER TABLE public.profiles 
  ALTER COLUMN posts_limit SET DEFAULT 1,
  ALTER COLUMN sites_limit SET DEFAULT 1;

-- Item 1: Add normalized_site_url column for anti-abuse URL uniqueness
ALTER TABLE public.wordpress_configs 
  ADD COLUMN IF NOT EXISTS normalized_site_url TEXT;

-- Create function to normalize WordPress URLs
CREATE OR REPLACE FUNCTION public.normalize_wordpress_url(url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Remove protocol, www, trailing slash
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(url),
        '^https?://', ''
      ),
      '^www\.', ''
    ),
    '/$', ''
  );
END;
$$;

-- Create trigger to auto-populate normalized_site_url on insert/update
CREATE OR REPLACE FUNCTION public.set_normalized_site_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.normalized_site_url := public.normalize_wordpress_url(NEW.site_url);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_normalize_site_url
  BEFORE INSERT OR UPDATE OF site_url ON public.wordpress_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_normalized_site_url();

-- Backfill existing rows
UPDATE public.wordpress_configs 
SET normalized_site_url = public.normalize_wordpress_url(site_url)
WHERE normalized_site_url IS NULL;

-- Add unique index on normalized URL to prevent same site on multiple accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_wordpress_configs_normalized_url 
  ON public.wordpress_configs (normalized_site_url);
