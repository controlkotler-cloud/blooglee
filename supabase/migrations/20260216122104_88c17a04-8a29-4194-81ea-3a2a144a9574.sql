-- Recreate the trigger to invalidate prompt cache on any prompt change
CREATE OR REPLACE TRIGGER on_prompt_change
AFTER INSERT OR UPDATE OR DELETE ON public.prompts
FOR EACH STATEMENT
EXECUTE FUNCTION public.increment_prompt_cache_version();