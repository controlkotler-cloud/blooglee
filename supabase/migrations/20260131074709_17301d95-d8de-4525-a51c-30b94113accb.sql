-- Crear tabla de invitaciones beta
CREATE TABLE public.beta_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  max_uses integer NOT NULL DEFAULT 100,
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Añadir columnas beta a profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_beta boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS beta_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS beta_invitation_id uuid REFERENCES public.beta_invitations(id);

-- Crear tabla de encuestas
CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_days_offset integer NOT NULL DEFAULT 0,
  questions jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Crear tabla de respuestas de encuestas
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, survey_id)
);

-- Crear tabla de encuestas pendientes
CREATE TABLE public.pending_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  trigger_event text,
  UNIQUE(user_id, survey_id)
);

-- Habilitar RLS
ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_surveys ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para beta_invitations
CREATE POLICY "Anyone can read active beta invitations"
ON public.beta_invitations FOR SELECT
USING (is_active = true);

CREATE POLICY "Superadmins can manage beta invitations"
ON public.beta_invitations FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Políticas RLS para surveys
CREATE POLICY "Anyone can read active surveys"
ON public.surveys FOR SELECT
USING (is_active = true);

CREATE POLICY "Superadmins can manage surveys"
ON public.surveys FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Políticas RLS para survey_responses
CREATE POLICY "Users can create own survey responses"
ON public.survey_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own survey responses"
ON public.survey_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all survey responses"
ON public.survey_responses FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

-- Políticas RLS para pending_surveys
CREATE POLICY "Users can view own pending surveys"
ON public.pending_surveys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending surveys"
ON public.pending_surveys FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pending surveys"
ON public.pending_surveys FOR ALL
USING (auth.role() = 'service_role');

-- Políticas adicionales para profiles (superadmin puede ver todos)
CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'));

-- Políticas para user_roles (superadmin puede gestionar)
CREATE POLICY "Superadmins can manage user roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Insertar encuestas predefinidas
INSERT INTO public.surveys (name, trigger_type, trigger_days_offset, questions, is_active) VALUES
(
  'Experiencia configuración WordPress',
  'wordpress_activation',
  1,
  '[
    {"id": "connection_experience", "type": "rating", "question": "¿Cómo fue la experiencia conectando tu WordPress?", "scale": 5},
    {"id": "had_problems", "type": "boolean", "question": "¿Tuviste algún problema durante la configuración?"},
    {"id": "problem_description", "type": "text", "question": "Describe los problemas que encontraste", "conditional": "had_problems"},
    {"id": "setup_time", "type": "select", "question": "¿Cuánto tiempo te llevó configurar WordPress?", "options": ["Menos de 5 min", "5-15 min", "15-30 min", "Más de 30 min"]}
  ]'::jsonb,
  true
),
(
  'Valoración programa beta',
  'beta_expiring',
  -7,
  '[
    {"id": "overall_experience", "type": "rating", "question": "Valoración general de Blooglee", "scale": 10},
    {"id": "content_quality", "type": "rating", "question": "Calidad de los artículos generados", "scale": 5},
    {"id": "image_quality", "type": "rating", "question": "Calidad de las imágenes", "scale": 5},
    {"id": "automation_value", "type": "rating", "question": "Valor de la automatización", "scale": 5},
    {"id": "would_pay", "type": "boolean", "question": "¿Continuarías con un plan de pago?"},
    {"id": "max_price", "type": "select", "question": "¿Qué precio máximo pagarías al mes?", "options": ["Menos de 10€", "10-20€", "20-50€", "Más de 50€"]},
    {"id": "improvements", "type": "text", "question": "¿Qué mejorarías de Blooglee?"}
  ]'::jsonb,
  true
);

-- Trigger para actualizar updated_at en surveys
CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON public.surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();