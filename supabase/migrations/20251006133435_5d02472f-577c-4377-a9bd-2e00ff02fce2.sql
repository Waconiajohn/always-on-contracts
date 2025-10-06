-- Fix search_path for trigger function
CREATE OR REPLACE FUNCTION update_war_chest_confirmed_skills_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;