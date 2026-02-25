-- Add unique constraint to prevent duplicate alerts per hour
CREATE UNIQUE INDEX IF NOT EXISTS idx_ops_alert_log_type_hour 
ON public.ops_alert_log (alert_type, alert_hour);

-- Enable RLS on ops_alert_log (currently has no policies)
ALTER TABLE public.ops_alert_log ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "Service role can manage ops alerts"
ON public.ops_alert_log
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);