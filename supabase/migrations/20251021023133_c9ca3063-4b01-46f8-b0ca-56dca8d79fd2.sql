-- Add privacy control columns to vault_resume_milestones for age discrimination protection
ALTER TABLE vault_resume_milestones
ADD COLUMN IF NOT EXISTS hidden_from_resume BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hide_dates BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS date_display_preference TEXT DEFAULT 'exact',
ADD COLUMN IF NOT EXISTS privacy_notes TEXT;

-- Add index for efficient filtering of visible milestones
CREATE INDEX IF NOT EXISTS idx_milestones_visibility 
ON vault_resume_milestones(vault_id, hidden_from_resume) 
WHERE hidden_from_resume = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN vault_resume_milestones.hidden_from_resume IS 'When TRUE, milestone will not be included in resume generation';
COMMENT ON COLUMN vault_resume_milestones.hide_dates IS 'When TRUE, dates will not be displayed (helps prevent age discrimination)';
COMMENT ON COLUMN vault_resume_milestones.date_display_preference IS 'Options: exact, year_only, range, vague - controls how dates are formatted';
COMMENT ON COLUMN vault_resume_milestones.privacy_notes IS 'User notes about why this milestone is hidden or date-protected';