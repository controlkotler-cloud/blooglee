
CREATE TABLE public.scheduler_runs (
  id bigserial PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  success boolean,
  dispatched_farmacias int DEFAULT 0,
  dispatched_empresas int DEFAULT 0,
  dispatched_sites int DEFAULT 0,
  skipped_farmacias int DEFAULT 0,
  skipped_empresas int DEFAULT 0,
  skipped_sites int DEFAULT 0,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- RLS: only service_role can manage
ALTER TABLE public.scheduler_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage scheduler runs"
  ON public.scheduler_runs
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Superadmins can read for admin dashboard
CREATE POLICY "Superadmins can view scheduler runs"
  ON public.scheduler_runs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));
