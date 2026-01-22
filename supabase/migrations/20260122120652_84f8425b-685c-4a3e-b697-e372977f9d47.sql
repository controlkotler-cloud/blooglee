-- Add blog_url and instagram_url columns to farmacias table for SEO links
ALTER TABLE public.farmacias 
ADD COLUMN blog_url TEXT,
ADD COLUMN instagram_url TEXT;