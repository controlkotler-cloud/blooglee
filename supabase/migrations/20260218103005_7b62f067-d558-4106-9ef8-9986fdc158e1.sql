
-- Add color_palette and mood columns to sites table
ALTER TABLE public.sites
ADD COLUMN color_palette text DEFAULT 'warm neutrals',
ADD COLUMN mood text DEFAULT 'warm and welcoming';
