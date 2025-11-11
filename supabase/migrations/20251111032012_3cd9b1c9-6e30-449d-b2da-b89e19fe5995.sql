-- Phase 1: Add education columns to vault_career_context
ALTER TABLE vault_career_context 
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS education_field TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_vault_career_context_education 
ON vault_career_context(education_level, education_field);

-- Add helpful comments
COMMENT ON COLUMN vault_career_context.education_level IS 'Highest education level: High School, Associate, Bachelor, Master, PhD, None';
COMMENT ON COLUMN vault_career_context.education_field IS 'Primary field of study (e.g., Mechanical Engineering, Business Administration)';
COMMENT ON COLUMN vault_career_context.certifications IS 'Professional certifications and licenses';