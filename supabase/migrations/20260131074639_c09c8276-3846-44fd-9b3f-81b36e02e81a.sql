-- Paso 1: Añadir nuevos valores al enum (requiere transacción separada)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'beta';