-- Migration: Add effectiveness tracking to all vault tables
-- Tracks which vault items are used in resumes and kept by users

-- Add tracking columns to vault_power_phrases
ALTER TABLE vault_power_phrases
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_edited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_removed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Add tracking columns to vault_transferable_skills
ALTER TABLE vault_transferable_skills
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_edited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_removed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Add tracking columns to vault_hidden_competencies
ALTER TABLE vault_hidden_competencies
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_edited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_removed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Add tracking columns to vault_soft_skills
ALTER TABLE vault_soft_skills
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_edited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_removed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Add tracking columns to vault_leadership_philosophy
ALTER TABLE vault_leadership_philosophy
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_edited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_removed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Add tracking columns to vault_executive_presence
ALTER TABLE vault_executive_presence
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_edited INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_removed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Create vault_item_usage_log table to track individual uses
CREATE TABLE IF NOT EXISTS vault_item_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  vault_category TEXT NOT NULL,
  vault_item_id UUID NOT NULL,
  resume_id UUID,
  job_id UUID,
  section_name TEXT,
  action TEXT CHECK (action IN ('used', 'kept', 'edited', 'removed')),
  match_score DECIMAL,
  quality_tier TEXT CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vault_usage_log_user_vault
ON vault_item_usage_log(user_id, vault_id);

CREATE INDEX IF NOT EXISTS idx_vault_usage_log_item
ON vault_item_usage_log(vault_category, vault_item_id);

CREATE INDEX IF NOT EXISTS idx_vault_usage_log_action
ON vault_item_usage_log(action, created_at DESC);

-- Enable RLS
ALTER TABLE vault_item_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own usage logs
CREATE POLICY "Users can view own vault usage logs"
  ON vault_item_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault usage logs"
  ON vault_item_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update effectiveness score
-- Formula: effectiveness_score = (times_kept + (times_edited * 0.5)) / (times_kept + times_edited + times_removed)
-- Ranges from 0 (always removed) to 1 (always kept)
CREATE OR REPLACE FUNCTION update_vault_item_effectiveness(
  p_vault_category TEXT,
  p_vault_item_id UUID
) RETURNS VOID AS $$
DECLARE
  v_table_name TEXT;
  v_times_kept INTEGER;
  v_times_edited INTEGER;
  v_times_removed INTEGER;
  v_effectiveness DECIMAL;
BEGIN
  -- Determine table name from category
  v_table_name := 'vault_' || p_vault_category;

  -- Get current counts
  EXECUTE format(
    'SELECT times_kept, times_edited, times_removed FROM %I WHERE id = $1',
    v_table_name
  ) INTO v_times_kept, v_times_edited, v_times_removed
  USING p_vault_item_id;

  -- Calculate effectiveness score
  IF (v_times_kept + v_times_edited + v_times_removed) > 0 THEN
    v_effectiveness := (v_times_kept + (v_times_edited * 0.5)) /
                      (v_times_kept + v_times_edited + v_times_removed);
  ELSE
    v_effectiveness := 0.5; -- Default for items never used
  END IF;

  -- Update the record
  EXECUTE format(
    'UPDATE %I SET effectiveness_score = $1 WHERE id = $2',
    v_table_name
  ) USING v_effectiveness, p_vault_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log vault item usage
CREATE OR REPLACE FUNCTION log_vault_item_usage(
  p_user_id UUID,
  p_vault_id UUID,
  p_vault_category TEXT,
  p_vault_item_id UUID,
  p_action TEXT,
  p_resume_id UUID DEFAULT NULL,
  p_job_id UUID DEFAULT NULL,
  p_section_name TEXT DEFAULT NULL,
  p_match_score DECIMAL DEFAULT NULL,
  p_quality_tier TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_table_name TEXT;
BEGIN
  -- Insert usage log
  INSERT INTO vault_item_usage_log (
    user_id, vault_id, vault_category, vault_item_id,
    resume_id, job_id, section_name, action,
    match_score, quality_tier
  ) VALUES (
    p_user_id, p_vault_id, p_vault_category, p_vault_item_id,
    p_resume_id, p_job_id, p_section_name, p_action,
    p_match_score, p_quality_tier
  );

  -- Update counters in vault table
  v_table_name := 'vault_' || p_vault_category;

  -- Increment appropriate counter
  IF p_action = 'used' THEN
    EXECUTE format(
      'UPDATE %I SET times_used = times_used + 1, last_used_at = NOW() WHERE id = $1',
      v_table_name
    ) USING p_vault_item_id;
  ELSIF p_action = 'kept' THEN
    EXECUTE format(
      'UPDATE %I SET times_kept = times_kept + 1 WHERE id = $1',
      v_table_name
    ) USING p_vault_item_id;
  ELSIF p_action = 'edited' THEN
    EXECUTE format(
      'UPDATE %I SET times_edited = times_edited + 1 WHERE id = $1',
      v_table_name
    ) USING p_vault_item_id;
  ELSIF p_action = 'removed' THEN
    EXECUTE format(
      'UPDATE %I SET times_removed = times_removed + 1 WHERE id = $1',
      v_table_name
    ) USING p_vault_item_id;
  END IF;

  -- Recalculate effectiveness score
  PERFORM update_vault_item_effectiveness(p_vault_category, p_vault_item_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the functions
COMMENT ON FUNCTION log_vault_item_usage IS
'Logs vault item usage and updates effectiveness metrics. Call when:
- used: AI includes item in generated content
- kept: User accepts generated content with this item
- edited: User modifies but keeps content with this item
- removed: User deletes content containing this item';

COMMENT ON FUNCTION update_vault_item_effectiveness IS
'Calculates effectiveness score (0-1) based on how often users keep vs remove vault items.
High score = users consistently keep this item. Low score = users often remove it.';
