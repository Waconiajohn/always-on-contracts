-- Add milestone_id column to vault_interview_responses
ALTER TABLE vault_interview_responses 
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES vault_resume_milestones(id) ON DELETE CASCADE;

-- Add index for faster milestone-based queries
CREATE INDEX IF NOT EXISTS idx_vault_responses_milestone 
ON vault_interview_responses(milestone_id, user_id);

-- Comment explaining the schema update
COMMENT ON COLUMN vault_interview_responses.milestone_id IS 'Links interview responses to specific career milestones for better organization and tracking';