-- Add performance indexes for War Chest tables
CREATE INDEX IF NOT EXISTS idx_war_chest_user 
  ON career_war_chest(user_id);

CREATE INDEX IF NOT EXISTS idx_confirmed_skills_user 
  ON war_chest_confirmed_skills(user_id);

CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_user_source 
  ON war_chest_skill_taxonomy(user_id, source);

CREATE INDEX IF NOT EXISTS idx_interview_responses_war_chest 
  ON war_chest_interview_responses(war_chest_id);

-- Add updated_at trigger for war_chest_confirmed_skills
CREATE OR REPLACE FUNCTION public.update_war_chest_confirmed_skills_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_war_chest_confirmed_skills_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_war_chest_confirmed_skills_updated_at_trigger
      BEFORE UPDATE ON war_chest_confirmed_skills
      FOR EACH ROW
      EXECUTE FUNCTION update_war_chest_confirmed_skills_updated_at();
  END IF;
END $$;