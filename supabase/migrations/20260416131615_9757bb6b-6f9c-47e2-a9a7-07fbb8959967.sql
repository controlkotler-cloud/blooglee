-- Add explicit SELECT policy to restrict reads to superadmins only
CREATE POLICY "Superadmins can view newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::public.app_role));