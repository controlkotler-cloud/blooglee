-- Create table for dynamic sector contexts
CREATE TABLE public.sector_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_key TEXT UNIQUE NOT NULL,
  sector_keywords TEXT[] NOT NULL DEFAULT '{}',
  image_examples TEXT[] NOT NULL DEFAULT '{}',
  prohibited_terms TEXT[] NOT NULL DEFAULT '{}',
  fallback_query TEXT NOT NULL,
  tone_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sector_contexts ENABLE ROW LEVEL SECURITY;

-- Allow all operations (this is an internal table)
CREATE POLICY "Allow all operations on sector_contexts" 
ON public.sector_contexts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_sector_contexts_updated_at
  BEFORE UPDATE ON public.sector_contexts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();