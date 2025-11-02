-- =====================================================
-- MIGRATION: Fix Incomplete Vault Uploads
-- =====================================================
-- Purpose: Update vault records stuck in 'resume_upload' state
-- to 'resume_uploaded' for proper flow continuation
-- =====================================================

-- Create audit table for rollback capability
CREATE TABLE IF NOT EXISTS vault_fix_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL,
  user_id UUID NOT NULL,
  old_onboarding_step TEXT,
  new_onboarding_step TEXT,
  resume_text_length INTEGER,
  had_analysis BOOLEAN,
  fixed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert audit records for all vaults being fixed
INSERT INTO vault_fix_audit (vault_id, user_id, old_onboarding_step, new_onboarding_step, resume_text_length, had_analysis)
SELECT 
  id,
  user_id,
  onboarding_step,
  'resume_uploaded' as new_onboarding_step,
  LENGTH(resume_raw_text) as resume_text_length,
  (initial_analysis IS NOT NULL AND initial_analysis::text != '{}') as had_analysis
FROM career_vault
WHERE onboarding_step = 'resume_upload'
  AND resume_raw_text IS NOT NULL
  AND LENGTH(resume_raw_text) > 100;

-- Update affected vault records
UPDATE career_vault
SET 
  onboarding_step = 'resume_uploaded',
  last_updated_at = NOW()
WHERE onboarding_step = 'resume_upload'
  AND resume_raw_text IS NOT NULL
  AND LENGTH(resume_raw_text) > 100;

-- Create index for faster queries on incomplete vaults
CREATE INDEX IF NOT EXISTS idx_career_vault_incomplete_analysis 
ON career_vault (onboarding_step, user_id) 
WHERE onboarding_step IN ('resume_upload', 'resume_uploaded') 
  AND (initial_analysis IS NULL OR initial_analysis::text = '{}');

-- Log the number of affected rows
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count FROM vault_fix_audit;
  RAISE NOTICE 'Fixed % incomplete vault records', affected_count;
END $$;