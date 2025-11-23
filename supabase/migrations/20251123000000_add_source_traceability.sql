-- Add traceability columns to Career Vault tables
-- This allows every derived item to be linked back to its original source (job or bullet)

-- Power Phrases
ALTER TABLE vault_power_phrases 
ADD COLUMN IF NOT EXISTS source_milestone_id UUID REFERENCES vault_resume_milestones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_work_position_id UUID REFERENCES vault_work_positions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_power_phrases_milestone ON vault_power_phrases(source_milestone_id);
CREATE INDEX IF NOT EXISTS idx_power_phrases_position ON vault_power_phrases(source_work_position_id);

-- Transferable Skills
ALTER TABLE vault_transferable_skills
ADD COLUMN IF NOT EXISTS source_milestone_id UUID REFERENCES vault_resume_milestones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_work_position_id UUID REFERENCES vault_work_positions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transferable_skills_milestone ON vault_transferable_skills(source_milestone_id);
CREATE INDEX IF NOT EXISTS idx_transferable_skills_position ON vault_transferable_skills(source_work_position_id);

-- Hidden Competencies
ALTER TABLE vault_hidden_competencies
ADD COLUMN IF NOT EXISTS source_milestone_id UUID REFERENCES vault_resume_milestones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_work_position_id UUID REFERENCES vault_work_positions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hidden_competencies_milestone ON vault_hidden_competencies(source_milestone_id);
CREATE INDEX IF NOT EXISTS idx_hidden_competencies_position ON vault_hidden_competencies(source_work_position_id);

-- Soft Skills
ALTER TABLE vault_soft_skills
ADD COLUMN IF NOT EXISTS source_milestone_id UUID REFERENCES vault_resume_milestones(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_work_position_id UUID REFERENCES vault_work_positions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_soft_skills_milestone ON vault_soft_skills(source_milestone_id);
CREATE INDEX IF NOT EXISTS idx_soft_skills_position ON vault_soft_skills(source_work_position_id);

-- Add comment for documentation
COMMENT ON COLUMN vault_power_phrases.source_milestone_id IS 'Link to the specific resume bullet this phrase was derived from';
COMMENT ON COLUMN vault_power_phrases.source_work_position_id IS 'Link to the job position this phrase belongs to';
