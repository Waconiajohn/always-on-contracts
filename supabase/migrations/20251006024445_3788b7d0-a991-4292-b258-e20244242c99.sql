-- Add war_chest_id column to war_chest_interview_responses
ALTER TABLE war_chest_interview_responses 
ADD COLUMN IF NOT EXISTS war_chest_id UUID REFERENCES career_war_chest(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_war_chest_responses_war_chest_id 
ON war_chest_interview_responses(war_chest_id);