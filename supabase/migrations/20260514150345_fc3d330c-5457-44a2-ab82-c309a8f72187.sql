
-- 1. Enable RLS on prompts_backup
ALTER TABLE public.prompts_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can read prompts_backup"
ON public.prompts_backup
FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'::public.app_role));

CREATE POLICY "Service role can manage prompts_backup"
ON public.prompts_backup
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. Lock down beta_invitations (remove public SELECT, add RPC for validation)
DROP POLICY IF EXISTS "Anyone can read active beta invitations" ON public.beta_invitations;

CREATE OR REPLACE FUNCTION public.validate_beta_token(_token text)
RETURNS TABLE(id uuid, max_uses integer, current_uses integer, expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bi.id, bi.max_uses, bi.current_uses, bi.expires_at
  FROM public.beta_invitations bi
  WHERE bi.token = upper(_token)
    AND bi.is_active = true
    AND (bi.expires_at IS NULL OR bi.expires_at > now())
    AND bi.current_uses < bi.max_uses
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_beta_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_beta_token(text) TO anon, authenticated;
