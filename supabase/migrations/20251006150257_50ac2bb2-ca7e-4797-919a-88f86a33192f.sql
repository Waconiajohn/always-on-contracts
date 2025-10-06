-- Drop the incorrect trigger and function for career_war_chest
DROP TRIGGER IF EXISTS update_career_war_chest_updated_at ON career_war_chest;
DROP FUNCTION IF EXISTS update_career_war_chest_updated_at();

-- Create a corrected trigger function that uses last_updated_at
CREATE OR REPLACE FUNCTION update_career_war_chest_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger using the correct column name
CREATE TRIGGER update_career_war_chest_last_updated_at
  BEFORE UPDATE ON career_war_chest
  FOR EACH ROW
  EXECUTE FUNCTION update_career_war_chest_last_updated_at();