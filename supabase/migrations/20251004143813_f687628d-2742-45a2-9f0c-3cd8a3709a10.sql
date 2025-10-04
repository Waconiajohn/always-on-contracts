-- Fix security warning: Set search_path for update_persona_memories_updated_at function
DROP TRIGGER IF EXISTS update_persona_memories_timestamp ON public.persona_memories;
DROP FUNCTION IF EXISTS update_persona_memories_updated_at();

CREATE OR REPLACE FUNCTION update_persona_memories_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_persona_memories_timestamp
  BEFORE UPDATE ON public.persona_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_memories_updated_at();

-- Verify existing handle_updated_at function has search_path set (it should already)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;