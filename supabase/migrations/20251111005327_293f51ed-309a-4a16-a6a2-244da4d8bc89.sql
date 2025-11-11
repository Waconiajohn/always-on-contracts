-- Phase 1: Fix RLS Policy - Allow users to read their own extraction sessions
CREATE POLICY "Users can read their own extraction sessions"
ON extraction_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Phase 2: Fix Missing Columns in ai_responses table
ALTER TABLE ai_responses 
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS prompt_version TEXT;