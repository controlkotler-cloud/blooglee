-- Tabla de prompts para gestión centralizada
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Solo superadmins pueden gestionar prompts
CREATE POLICY "Superadmins can manage prompts"
ON public.prompts FOR ALL
USING (has_role(auth.uid(), 'superadmin'));

-- Las Edge Functions pueden leer prompts (service_role)
CREATE POLICY "Service role can read prompts"
ON public.prompts FOR SELECT
USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();