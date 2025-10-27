-- Create user AI preferences table
CREATE TABLE user_ai_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  target_roles text[] DEFAULT '{}',
  target_industries text[] DEFAULT '{}',
  preferred_locations text[] DEFAULT '{}',
  min_salary integer,
  max_salary integer,
  remote_preference text DEFAULT 'any',
  email_frequency text DEFAULT 'weekly',
  last_match_run timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies for user_ai_preferences
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI preferences"
  ON user_ai_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for user_ai_preferences
CREATE INDEX idx_user_ai_preferences_user_enabled 
  ON user_ai_preferences(user_id, enabled);

-- Create AI match feedback table
CREATE TABLE ai_match_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES opportunity_matches NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL CHECK (action IN ('added', 'dismissed', 'not_interested', 'applied')),
  feedback_notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies for ai_match_feedback
ALTER TABLE ai_match_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
  ON ai_match_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON ai_match_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index for learning system
CREATE INDEX idx_ai_match_feedback_user_action 
  ON ai_match_feedback(user_id, action, created_at DESC);

-- Add index to opportunity_matches for performance
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_user_status_score 
  ON opportunity_matches(user_id, status, match_score DESC, created_at DESC);

-- Update application_queue table
ALTER TABLE application_queue 
  ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'not_applied' 
  CHECK (application_status IN ('not_applied', 'applied', 'interviewing', 'offer', 'rejected_by_employer'));

-- Drop old status column if it exists
ALTER TABLE application_queue DROP COLUMN IF EXISTS status;