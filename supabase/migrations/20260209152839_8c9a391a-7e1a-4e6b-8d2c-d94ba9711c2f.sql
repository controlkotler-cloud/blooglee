
-- Create social_content table
CREATE TABLE public.social_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  platform text NOT NULL,
  content_type text NOT NULL DEFAULT 'post',
  title text NOT NULL,
  content text NOT NULL,
  media_prompt text,
  image_url text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  metricool_post_id text,
  language text NOT NULL DEFAULT 'spanish',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_content ENABLE ROW LEVEL SECURITY;

-- Superadmins can do everything
CREATE POLICY "Superadmins can manage social content"
  ON public.social_content
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Service role full access
CREATE POLICY "Service role can manage social content"
  ON public.social_content
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
