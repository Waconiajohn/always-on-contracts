-- Rename main table
ALTER TABLE career_war_chest RENAME TO career_vault;

-- Rename all related tables
ALTER TABLE war_chest_behavioral_indicators RENAME TO vault_behavioral_indicators;
ALTER TABLE war_chest_confirmed_skills RENAME TO vault_confirmed_skills;
ALTER TABLE war_chest_executive_presence RENAME TO vault_executive_presence;
ALTER TABLE war_chest_hidden_competencies RENAME TO vault_hidden_competencies;
ALTER TABLE war_chest_interview_responses RENAME TO vault_interview_responses;
ALTER TABLE war_chest_leadership_philosophy RENAME TO vault_leadership_philosophy;
ALTER TABLE war_chest_personality_traits RENAME TO vault_personality_traits;
ALTER TABLE war_chest_power_phrases RENAME TO vault_power_phrases;
ALTER TABLE war_chest_research RENAME TO vault_research;
ALTER TABLE war_chest_skill_taxonomy RENAME TO vault_skill_taxonomy;
ALTER TABLE war_chest_soft_skills RENAME TO vault_soft_skills;
ALTER TABLE war_chest_transferable_skills RENAME TO vault_transferable_skills;
ALTER TABLE war_chest_values_motivations RENAME TO vault_values_motivations;
ALTER TABLE war_chest_verifications RENAME TO vault_verifications;
ALTER TABLE war_chest_work_style RENAME TO vault_work_style;

-- Rename war_chest_id columns to vault_id (only in tables that have this column)
ALTER TABLE vault_behavioral_indicators RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_executive_presence RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_hidden_competencies RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_interview_responses RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_leadership_philosophy RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_personality_traits RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_power_phrases RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_soft_skills RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_transferable_skills RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_values_motivations RENAME COLUMN war_chest_id TO vault_id;
ALTER TABLE vault_work_style RENAME COLUMN war_chest_id TO vault_id;

-- Rename trigger functions
ALTER FUNCTION update_war_chest_confirmed_skills_updated_at() RENAME TO update_vault_confirmed_skills_updated_at;
ALTER FUNCTION update_career_war_chest_last_updated_at() RENAME TO update_career_vault_last_updated_at;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_war_chest_confirmed_skills_updated_at ON vault_confirmed_skills;
DROP TRIGGER IF EXISTS update_career_war_chest_last_updated_at ON career_vault;

CREATE TRIGGER update_vault_confirmed_skills_updated_at
  BEFORE UPDATE ON vault_confirmed_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_vault_confirmed_skills_updated_at();

CREATE TRIGGER update_career_vault_last_updated_at
  BEFORE UPDATE ON career_vault
  FOR EACH ROW
  EXECUTE FUNCTION update_career_vault_last_updated_at();