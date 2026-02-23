
-- 1. Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  member_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, member_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Owners can manage their team
CREATE POLICY "Owners can manage their team"
ON public.team_members FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Members can see their memberships
CREATE POLICY "Members can view their memberships"
ON public.team_members FOR SELECT
USING (auth.uid() = member_id);

-- Superadmins can manage all
CREATE POLICY "Superadmins can manage all team members"
ON public.team_members FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- 2. Helper function: check if current user is team member of a given owner
CREATE OR REPLACE FUNCTION public.is_team_member(site_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE owner_id = site_owner_id AND member_id = auth.uid()
  )
$$;

-- 3. Update SITES RLS policies
DROP POLICY "Users can view own sites" ON public.sites;
CREATE POLICY "Users can view own or team sites"
ON public.sites FOR SELECT
USING (auth.uid() = user_id OR public.is_team_member(user_id));

DROP POLICY "Users can update own sites" ON public.sites;
CREATE POLICY "Users can update own or team sites"
ON public.sites FOR UPDATE
USING (auth.uid() = user_id OR public.is_team_member(user_id));

DROP POLICY "Users can delete own sites" ON public.sites;
CREATE POLICY "Users can delete own or team sites"
ON public.sites FOR DELETE
USING (auth.uid() = user_id OR public.is_team_member(user_id));

-- INSERT stays owner-only (sites are created by the account owner)

-- 4. Update ARTICLES RLS policies
DROP POLICY "Users can view own articles" ON public.articles;
CREATE POLICY "Users can view own or team articles"
ON public.articles FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = articles.site_id AND public.is_team_member(s.user_id)
  )
);

DROP POLICY "Users can create own articles" ON public.articles;
CREATE POLICY "Users can create articles on own or team sites"
ON public.articles FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND public.is_team_member(s.user_id))
  )
);

DROP POLICY "Users can update own articles" ON public.articles;
CREATE POLICY "Users can update own or team articles"
ON public.articles FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = articles.site_id AND public.is_team_member(s.user_id)
  )
);

DROP POLICY "Users can delete own articles" ON public.articles;
CREATE POLICY "Users can delete own or team articles"
ON public.articles FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = articles.site_id AND public.is_team_member(s.user_id)
  )
);

-- 5. Update WORDPRESS_CONFIGS RLS policies
DROP POLICY "Users can view own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can view own or team wp configs"
ON public.wordpress_configs FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = wordpress_configs.site_id AND public.is_team_member(s.user_id)
  )
);

DROP POLICY "Users can update own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can update own or team wp configs"
ON public.wordpress_configs FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = wordpress_configs.site_id AND public.is_team_member(s.user_id)
  )
);

DROP POLICY "Users can delete own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can delete own or team wp configs"
ON public.wordpress_configs FOR DELETE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = wordpress_configs.site_id AND public.is_team_member(s.user_id)
  )
);

DROP POLICY "Users can create own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can create wp configs on own or team sites"
ON public.wordpress_configs FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND public.is_team_member(s.user_id))
  )
);

-- 6. Update WORDPRESS_TAXONOMIES_SAAS RLS
DROP POLICY "Users can view own taxonomies" ON public.wordpress_taxonomies_saas;
CREATE POLICY "Users can view own or team taxonomies"
ON public.wordpress_taxonomies_saas FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.wordpress_configs wc
    JOIN public.sites s ON s.id = wc.site_id
    WHERE wc.id = wordpress_taxonomies_saas.wordpress_config_id 
    AND public.is_team_member(s.user_id)
  )
);

-- 7. Update SITE_ACTIVITY_LOG RLS (view only for team)
DROP POLICY "Users can view own site activity" ON public.site_activity_log;
CREATE POLICY "Users can view own or team site activity"
ON public.site_activity_log FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = site_activity_log.site_id AND public.is_team_member(s.user_id)
  )
);

-- 8. Update WORDPRESS_DIAGNOSTICS RLS
DROP POLICY "Users can view own wordpress diagnostics" ON public.wordpress_diagnostics;
CREATE POLICY "Users can view own or team wordpress diagnostics"
ON public.wordpress_diagnostics FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = wordpress_diagnostics.site_id AND public.is_team_member(s.user_id)
  )
);

-- 9. Update ONBOARDING_CHECKLIST RLS  
DROP POLICY "Users can view own onboarding checklist" ON public.onboarding_checklist;
CREATE POLICY "Users can view own or team onboarding checklist"
ON public.onboarding_checklist FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.sites s 
    WHERE s.id = onboarding_checklist.site_id AND public.is_team_member(s.user_id)
  )
);
