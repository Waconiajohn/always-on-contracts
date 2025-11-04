-- Fix missing columns in vault tables for SmartReviewWorkflow

-- Add confidence_score to vault_soft_skills (currently has ai_confidence)
ALTER TABLE vault_soft_skills 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) 
GENERATED ALWAYS AS (ai_confidence) STORED;

-- Add confidence_score to other intangible tables if missing
ALTER TABLE vault_leadership_philosophy 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) 
GENERATED ALWAYS AS (ai_confidence) STORED;

ALTER TABLE vault_executive_presence 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) 
GENERATED ALWAYS AS (ai_confidence) STORED;

ALTER TABLE vault_personality_traits 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) 
GENERATED ALWAYS AS (ai_confidence) STORED;

ALTER TABLE vault_work_style 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) 
GENERATED ALWAYS AS (ai_confidence) STORED;

ALTER TABLE vault_values_motivations 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) 
GENERATED ALWAYS AS (ai_confidence) STORED;

ALTER TABLE vault_behavioral_indicators 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) 
GENERATED ALWAYS AS (ai_confidence) STORED;

-- Add last_refreshed_at to career_vault (used by edge functions)
ALTER TABLE career_vault 
ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for performance on confidence_score queries
CREATE INDEX IF NOT EXISTS idx_vault_soft_skills_confidence 
ON vault_soft_skills(vault_id, confidence_score);

CREATE INDEX IF NOT EXISTS idx_vault_transferable_skills_confidence 
ON vault_transferable_skills(vault_id, confidence_score);

CREATE INDEX IF NOT EXISTS idx_vault_hidden_competencies_confidence 
ON vault_hidden_competencies(vault_id, confidence_score);

CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_confidence 
ON vault_power_phrases(vault_id, confidence_score);