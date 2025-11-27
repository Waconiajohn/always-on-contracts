-- Add unique constraints for duplicate prevention on structured data

-- Constraint for vault_work_positions: prevent duplicate job entries
ALTER TABLE vault_work_positions
DROP CONSTRAINT IF EXISTS unique_work_position;

ALTER TABLE vault_work_positions
ADD CONSTRAINT unique_work_position 
UNIQUE (vault_id, company_name, job_title);

-- Constraint for vault_education: prevent duplicate education entries
ALTER TABLE vault_education
DROP CONSTRAINT IF EXISTS unique_education_entry;

ALTER TABLE vault_education
ADD CONSTRAINT unique_education_entry 
UNIQUE (vault_id, institution_name, degree_type, field_of_study);

-- Add indexes for better performance on duplicate checks
CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_content 
ON vault_power_phrases(vault_id, power_phrase);

CREATE INDEX IF NOT EXISTS idx_vault_transferable_skills_content 
ON vault_transferable_skills(vault_id, stated_skill);

CREATE INDEX IF NOT EXISTS idx_vault_hidden_competencies_content 
ON vault_hidden_competencies(vault_id, competency_area);

CREATE INDEX IF NOT EXISTS idx_vault_soft_skills_content 
ON vault_soft_skills(vault_id, skill_name);