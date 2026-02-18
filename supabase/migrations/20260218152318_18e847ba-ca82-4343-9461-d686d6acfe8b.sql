
-- 1. Create onboarding_progress table
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 1,
  wizard_completed BOOLEAN DEFAULT FALSE,
  checklist_completed BOOLEAN DEFAULT FALSE,
  step_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own onboarding progress"
  ON public.onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding progress"
  ON public.onboarding_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create onboarding_checklist table
CREATE TABLE public.onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  step_key VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding checklist"
  ON public.onboarding_checklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own onboarding checklist"
  ON public.onboarding_checklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding checklist"
  ON public.onboarding_checklist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding checklist"
  ON public.onboarding_checklist FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create wordpress_diagnostics table
CREATE TABLE public.wordpress_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  check_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT,
  raw_response JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wordpress_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wordpress diagnostics"
  ON public.wordpress_diagnostics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wordpress diagnostics"
  ON public.wordpress_diagnostics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wordpress diagnostics"
  ON public.wordpress_diagnostics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wordpress diagnostics"
  ON public.wordpress_diagnostics FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add use_brand_colors to sites (color_palette and mood already exist)
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS use_brand_colors BOOLEAN DEFAULT TRUE;
