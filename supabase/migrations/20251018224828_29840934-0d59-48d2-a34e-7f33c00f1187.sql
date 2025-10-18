-- Create vault activity log table for tracking vault activities
CREATE TABLE vault_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('document_upload', 'intelligence_extracted', 'interview_progress', 'strength_score_change', 'milestone_reached')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE vault_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vault activity"
ON vault_activity_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault activity"
ON vault_activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_vault_activity_log_vault_id ON vault_activity_log(vault_id);
CREATE INDEX idx_vault_activity_log_created_at ON vault_activity_log(created_at DESC);
CREATE INDEX idx_vault_activity_log_user_id ON vault_activity_log(user_id);