
-- Normalize existing mood values to new format
UPDATE public.sites SET mood = CASE
  WHEN mood = 'warm and welcoming' THEN 'warm_and_welcoming'
  WHEN mood = 'clean and clinical' THEN 'clean_and_clinical'
  WHEN mood = 'energetic and vibrant' THEN 'energetic'
  WHEN mood = 'calm and natural' THEN 'calm_and_trustworthy'
  ELSE NULL
END;

-- Now add CHECK constraint
ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS sites_mood_check;
ALTER TABLE public.sites ADD CONSTRAINT sites_mood_check
  CHECK (mood IS NULL OR mood IN ('warm_and_welcoming', 'clean_and_clinical', 'energetic', 'calm_and_trustworthy'));
