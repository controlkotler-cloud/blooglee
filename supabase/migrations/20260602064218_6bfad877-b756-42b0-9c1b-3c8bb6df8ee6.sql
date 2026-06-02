CREATE TABLE public.scheduler_auth_tokens (
  name text PRIMARY KEY,
  secret text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduler_auth_tokens TO service_role;

ALTER TABLE public.scheduler_auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage scheduler auth tokens"
ON public.scheduler_auth_tokens
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');