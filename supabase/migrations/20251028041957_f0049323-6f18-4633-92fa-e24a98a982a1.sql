-- Add review completion tracking column to career_vault
ALTER TABLE career_vault 
ADD COLUMN review_completion_percentage INTEGER DEFAULT 0;

-- Add comment explaining the difference between the two percentage fields
COMMENT ON COLUMN career_vault.interview_completion_percentage IS 'Tracks AI auto-population status (interview responses completed)';
COMMENT ON COLUMN career_vault.review_completion_percentage IS 'Tracks user review progress (items approved/skipped/edited)';