-- Add posts_limit column to profiles for SaaS plan limits
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS posts_limit integer NOT NULL DEFAULT 4;

-- Add comment documenting the limits
COMMENT ON COLUMN public.profiles.posts_limit IS 'Monthly article limit by plan: Free=1, Starter=4, Pro=30, Agency=100';