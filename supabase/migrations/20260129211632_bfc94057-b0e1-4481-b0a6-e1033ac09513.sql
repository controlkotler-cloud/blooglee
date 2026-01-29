-- Añadir campo para tracking del onboarding
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Marcar usuarios existentes como completados (los que ya tienen sitios)
UPDATE profiles SET onboarding_completed = TRUE WHERE user_id IN (
  SELECT DISTINCT user_id FROM sites
);