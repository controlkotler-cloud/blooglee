
-- Fix privilege escalation: enforce that team members can only insert rows with their own user_id

-- 1. sites: INSERT must have user_id = auth.uid()
DROP POLICY IF EXISTS "Users can create own or team-owner sites" ON public.sites;
CREATE POLICY "Users can create own sites"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. articles: INSERT must have user_id = auth.uid(), and site must be own or team-accessible
DROP POLICY IF EXISTS "Users can create articles on own or team sites" ON public.articles;
CREATE POLICY "Users can create articles on own or team sites"
ON public.articles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = articles.site_id
      AND (s.user_id = auth.uid() OR public.is_team_member(s.user_id))
  )
);

-- 3. wordpress_configs: INSERT must have user_id = auth.uid()
DROP POLICY IF EXISTS "Users can create wp configs on own or team sites" ON public.wordpress_configs;
CREATE POLICY "Users can create wp configs on own or team sites"
ON public.wordpress_configs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = wordpress_configs.site_id
      AND (s.user_id = auth.uid() OR public.is_team_member(s.user_id))
  )
);

-- 4. Storage: restrict article-images write policies to service_role only.
--    Uploads/updates/deletes happen exclusively from edge functions with the service role key.
DROP POLICY IF EXISTS "Service role can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update article images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete article images" ON storage.objects;

CREATE POLICY "Service role can upload article images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'article-images'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role can update article images"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'article-images'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role can delete article images"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'article-images'
  AND auth.role() = 'service_role'
);
