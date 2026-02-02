-- 1. Actualizar el CHECK constraint para incluir 'starter'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('free', 'starter', 'pro', 'agency'));

-- 2. Corregir el usuario existente controlkotler@gmail.com
UPDATE profiles SET 
  is_beta = true,
  beta_started_at = NOW(),
  beta_expires_at = NOW() + INTERVAL '3 months',
  plan = 'starter',
  sites_limit = 1,
  posts_limit = 4
WHERE email = 'controlkotler@gmail.com';

-- 3. Añadir rol beta al usuario existente (si no lo tiene)
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'beta' FROM profiles WHERE email = 'controlkotler@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;