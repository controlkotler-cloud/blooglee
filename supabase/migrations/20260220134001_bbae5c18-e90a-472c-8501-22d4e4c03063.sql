-- Re-add mkpro_admin to the enum to match production and unblock publishing
-- This is a no-op if mkpro_admin already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'mkpro_admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'mkpro_admin';
  END IF;
END $$;