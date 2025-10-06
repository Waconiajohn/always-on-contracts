-- Fix RLS policy for resume_cache (system-only access)
CREATE POLICY "System can manage resume cache"
  ON public.resume_cache FOR ALL
  USING (true)
  WITH CHECK (true);