ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS skip_auto_publish BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_articles_skip_auto_publish 
  ON public.articles(skip_auto_publish) 
  WHERE skip_auto_publish = false;