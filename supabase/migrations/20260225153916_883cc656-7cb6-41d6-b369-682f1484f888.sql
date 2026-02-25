-- Add unique constraint on (site_id, generation_key) to prevent duplicate articles per period
-- Only applies when generation_key is NOT NULL (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_site_generation_key 
ON public.articles (site_id, generation_key) 
WHERE generation_key IS NOT NULL;