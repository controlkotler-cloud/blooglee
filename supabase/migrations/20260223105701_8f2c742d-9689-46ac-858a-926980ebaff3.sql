
-- Helper function: check if auth.uid() is the OWNER of a given member
CREATE OR REPLACE FUNCTION public.is_team_owner(member_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE owner_id = auth.uid() AND member_id = member_user_id
  )
$$;

-- SITES: Update SELECT to include reverse direction
DROP POLICY IF EXISTS "Users can view own or team sites" ON public.sites;
CREATE POLICY "Users can view own or team sites"
ON public.sites FOR SELECT
USING (
  auth.uid() = user_id
  OR is_team_member(user_id)
  OR is_team_owner(user_id)
);

-- SITES: Update UPDATE
DROP POLICY IF EXISTS "Users can update own or team sites" ON public.sites;
CREATE POLICY "Users can update own or team sites"
ON public.sites FOR UPDATE
USING (
  auth.uid() = user_id
  OR is_team_member(user_id)
  OR is_team_owner(user_id)
);

-- SITES: Update DELETE
DROP POLICY IF EXISTS "Users can delete own or team sites" ON public.sites;
CREATE POLICY "Users can delete own or team sites"
ON public.sites FOR DELETE
USING (
  auth.uid() = user_id
  OR is_team_member(user_id)
  OR is_team_owner(user_id)
);

-- ARTICLES: Update SELECT
DROP POLICY IF EXISTS "Users can view own or team articles" ON public.articles;
CREATE POLICY "Users can view own or team articles"
ON public.articles FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_owner(s.user_id))
);

-- ARTICLES: Update UPDATE
DROP POLICY IF EXISTS "Users can update own or team articles" ON public.articles;
CREATE POLICY "Users can update own or team articles"
ON public.articles FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_owner(s.user_id))
);

-- ARTICLES: Update DELETE
DROP POLICY IF EXISTS "Users can delete own or team articles" ON public.articles;
CREATE POLICY "Users can delete own or team articles"
ON public.articles FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_owner(s.user_id))
);

-- ARTICLES: Update INSERT
DROP POLICY IF EXISTS "Users can create articles on own or team sites" ON public.articles;
CREATE POLICY "Users can create articles on own or team sites"
ON public.articles FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_member(s.user_id))
    OR EXISTS (SELECT 1 FROM sites s WHERE s.id = articles.site_id AND is_team_owner(s.user_id))
  )
);

-- WORDPRESS_CONFIGS: Update SELECT
DROP POLICY IF EXISTS "Users can view own or team wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can view own or team wp configs"
ON public.wordpress_configs FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_owner(s.user_id))
);

-- WORDPRESS_CONFIGS: Update UPDATE
DROP POLICY IF EXISTS "Users can update own or team wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can update own or team wp configs"
ON public.wordpress_configs FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_owner(s.user_id))
);

-- WORDPRESS_CONFIGS: Update DELETE
DROP POLICY IF EXISTS "Users can delete own or team wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can delete own or team wp configs"
ON public.wordpress_configs FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_owner(s.user_id))
);

-- WORDPRESS_CONFIGS: Update INSERT
DROP POLICY IF EXISTS "Users can create wp configs on own or team sites" ON public.wordpress_configs;
CREATE POLICY "Users can create wp configs on own or team sites"
ON public.wordpress_configs FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_member(s.user_id))
    OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_configs.site_id AND is_team_owner(s.user_id))
  )
);

-- SITE_ACTIVITY_LOG: Update SELECT
DROP POLICY IF EXISTS "Users can view own or team site activity" ON public.site_activity_log;
CREATE POLICY "Users can view own or team site activity"
ON public.site_activity_log FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = site_activity_log.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = site_activity_log.site_id AND is_team_owner(s.user_id))
);

-- WORDPRESS_DIAGNOSTICS: Update SELECT
DROP POLICY IF EXISTS "Users can view own or team wordpress diagnostics" ON public.wordpress_diagnostics;
CREATE POLICY "Users can view own or team wordpress diagnostics"
ON public.wordpress_diagnostics FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_diagnostics.site_id AND is_team_member(s.user_id))
  OR EXISTS (SELECT 1 FROM sites s WHERE s.id = wordpress_diagnostics.site_id AND is_team_owner(s.user_id))
);

-- WORDPRESS_TAXONOMIES_SAAS: Update SELECT
DROP POLICY IF EXISTS "Users can view own or team taxonomies" ON public.wordpress_taxonomies_saas;
CREATE POLICY "Users can view own or team taxonomies"
ON public.wordpress_taxonomies_saas FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM wordpress_configs wc JOIN sites s ON s.id = wc.site_id
    WHERE wc.id = wordpress_taxonomies_saas.wordpress_config_id AND is_team_member(s.user_id)
  )
  OR EXISTS (
    SELECT 1 FROM wordpress_configs wc JOIN sites s ON s.id = wc.site_id
    WHERE wc.id = wordpress_taxonomies_saas.wordpress_config_id AND is_team_owner(s.user_id)
  )
);
