-- Create table for tracking resume milestones (jobs, projects, achievements)
CREATE TABLE IF NOT EXISTS vault_resume_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('job', 'project', 'education', 'achievement')),
  company_name TEXT,
  job_title TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  key_achievements TEXT[],
  extracted_from_resume BOOLEAN DEFAULT true,
  completion_percentage INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  intelligence_extracted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vault_resume_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own milestones"
  ON vault_resume_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON vault_resume_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON vault_resume_milestones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones"
  ON vault_resume_milestones FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_vault_resume_milestones_vault_id ON vault_resume_milestones(vault_id);
CREATE INDEX idx_vault_resume_milestones_user_id ON vault_resume_milestones(user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_vault_resume_milestones_updated_at
  BEFORE UPDATE ON vault_resume_milestones
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();