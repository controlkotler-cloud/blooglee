-- Índices para optimización de consultas en tabla articles
CREATE INDEX IF NOT EXISTS idx_articles_site_user 
ON public.articles(site_id, user_id);

CREATE INDEX IF NOT EXISTS idx_articles_month_year 
ON public.articles(month, year);

CREATE INDEX IF NOT EXISTS idx_articles_generated_at 
ON public.articles(generated_at DESC);

-- Índice para optimización de consultas en tabla sites
CREATE INDEX IF NOT EXISTS idx_sites_user_id 
ON public.sites(user_id);