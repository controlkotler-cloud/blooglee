-- Remove mkpro_admin from app_role enum
-- First delete any existing mkpro_admin roles
DELETE FROM public.user_roles WHERE role = 'mkpro_admin';

-- Drop dependent policies first
DROP POLICY IF EXISTS "Superadmins can manage beta invitations" ON public.beta_invitations;
DROP POLICY IF EXISTS "Superadmins can manage cache version" ON public.prompt_cache_version;
DROP POLICY IF EXISTS "Superadmins can manage prompts" ON public.prompts;
DROP POLICY IF EXISTS "Superadmins can manage social content" ON public.social_content;
DROP POLICY IF EXISTS "Superadmins can manage surveys" ON public.surveys;
DROP POLICY IF EXISTS "Superadmins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all survey responses" ON public.survey_responses;

-- Drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Recreate enum
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'superadmin', 'beta');

ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING role::text::public.app_role;

DROP TYPE public.app_role_old;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Recreate all dropped policies
CREATE POLICY "Superadmins can manage beta invitations" ON public.beta_invitations FOR ALL USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can manage cache version" ON public.prompt_cache_version FOR ALL USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can manage prompts" ON public.prompts FOR ALL USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can manage social content" ON public.social_content FOR ALL USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can manage surveys" ON public.surveys FOR ALL USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can manage user roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can view all survey responses" ON public.survey_responses FOR SELECT USING (has_role(auth.uid(), 'superadmin'::app_role));