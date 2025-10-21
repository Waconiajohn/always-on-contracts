-- Migration: Progressive Profiling System
-- Asks targeted micro-questions to upgrade vault item quality tiers

-- Track when users should be prompted for micro-questions
CREATE TABLE IF NOT EXISTS progressive_profiling_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('applications_milestone', 'low_quality_detected', 'manual')),
  applications_count INTEGER DEFAULT 0,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  UNIQUE(user_id, vault_id, trigger_type, triggered_at)
);

-- Store micro-questions generated for each user
CREATE TABLE IF NOT EXISTS progressive_profiling_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES progressive_profiling_triggers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_category TEXT NOT NULL,
  vault_item_id UUID NOT NULL,
  current_quality_tier TEXT CHECK (current_quality_tier IN ('bronze', 'silver', 'assumed')),
  target_quality_tier TEXT CHECK (target_quality_tier IN ('silver', 'gold')),
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('numeric', 'text', 'yes_no', 'multiple_choice')),
  answer_options JSONB,
  user_answer JSONB,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiling_triggers_user_status
ON progressive_profiling_triggers(user_id, status);

CREATE INDEX IF NOT EXISTS idx_profiling_questions_trigger
ON progressive_profiling_questions(trigger_id);

CREATE INDEX IF NOT EXISTS idx_profiling_questions_user_pending
ON progressive_profiling_questions(user_id) WHERE user_answer IS NULL;

-- Enable RLS
ALTER TABLE progressive_profiling_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE progressive_profiling_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profiling triggers"
  ON progressive_profiling_triggers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profiling triggers"
  ON progressive_profiling_triggers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert profiling triggers"
  ON progressive_profiling_triggers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own profiling questions"
  ON progressive_profiling_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profiling questions"
  ON progressive_profiling_questions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert profiling questions"
  ON progressive_profiling_questions FOR INSERT
  WITH CHECK (true);

-- Function to check if user should be prompted
CREATE OR REPLACE FUNCTION check_progressive_profiling_trigger(
  p_user_id UUID,
  p_vault_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_applications_count INTEGER;
  v_last_trigger_at TIMESTAMP WITH TIME ZONE;
  v_pending_trigger UUID;
  v_bronze_items_count INTEGER;
  v_assumed_items_count INTEGER;
  v_result JSONB;
BEGIN
  -- Count applications (from job_applications or saved_jobs tables)
  SELECT COUNT(*) INTO v_applications_count
  FROM job_applications
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Check for existing pending triggers
  SELECT id INTO v_pending_trigger
  FROM progressive_profiling_triggers
  WHERE user_id = p_user_id
    AND vault_id = p_vault_id
    AND status = 'pending'
  ORDER BY triggered_at DESC
  LIMIT 1;

  -- If already has pending trigger, return it
  IF v_pending_trigger IS NOT NULL THEN
    RETURN jsonb_build_object(
      'shouldTrigger', true,
      'reason', 'pending_questions_available',
      'triggerId', v_pending_trigger,
      'applicationsCount', v_applications_count
    );
  END IF;

  -- Get last trigger time
  SELECT MAX(triggered_at) INTO v_last_trigger_at
  FROM progressive_profiling_triggers
  WHERE user_id = p_user_id
    AND vault_id = p_vault_id;

  -- Check if we should trigger based on applications milestone
  -- Trigger at: 5, 10, 15, 20, 25 applications, etc.
  IF v_applications_count >= 5 AND
     v_applications_count % 5 = 0 AND
     (v_last_trigger_at IS NULL OR
      v_last_trigger_at < NOW() - INTERVAL '7 days') THEN

    -- Count low-quality vault items
    SELECT COUNT(*) INTO v_bronze_items_count
    FROM vault_power_phrases
    WHERE user_id = p_user_id
      AND quality_tier IN ('bronze', 'assumed');

    SELECT COUNT(*) INTO v_assumed_items_count
    FROM vault_soft_skills
    WHERE user_id = p_user_id
      AND quality_tier = 'assumed';

    -- Only trigger if there are items that can be upgraded
    IF (v_bronze_items_count + v_assumed_items_count) > 0 THEN
      RETURN jsonb_build_object(
        'shouldTrigger', true,
        'reason', 'applications_milestone',
        'applicationsCount', v_applications_count,
        'upgradeableItemsCount', v_bronze_items_count + v_assumed_items_count
      );
    END IF;
  END IF;

  -- No trigger needed
  RETURN jsonb_build_object(
    'shouldTrigger', false,
    'applicationsCount', v_applications_count,
    'nextMilestone', ((v_applications_count / 5) + 1) * 5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade vault item quality tier after micro-question answered
CREATE OR REPLACE FUNCTION upgrade_vault_item_tier(
  p_vault_category TEXT,
  p_vault_item_id UUID,
  p_new_tier TEXT,
  p_evidence JSONB
) RETURNS VOID AS $$
DECLARE
  v_table_name TEXT;
BEGIN
  -- Construct table name
  v_table_name := 'vault_' || p_vault_category;

  -- Update quality tier and add evidence
  EXECUTE format(
    'UPDATE %I SET
      quality_tier = $1,
      freshness_score = GREATEST(freshness_score, 80),
      updated_at = NOW()
    WHERE id = $2',
    v_table_name
  ) USING p_new_tier, p_vault_item_id;

  -- Log the upgrade
  RAISE NOTICE 'Upgraded % item % to tier %', v_table_name, p_vault_item_id, p_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add progressive profiling metadata to career_vault
ALTER TABLE career_vault
ADD COLUMN IF NOT EXISTS progressive_profiling_score INTEGER DEFAULT 0 CHECK (progressive_profiling_score >= 0 AND progressive_profiling_score <= 100),
ADD COLUMN IF NOT EXISTS last_profiling_prompt_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_micro_questions_answered INTEGER DEFAULT 0;

COMMENT ON COLUMN career_vault.progressive_profiling_score IS
'Percentage of low-quality items that have been upgraded via micro-questions (0-100)';

COMMENT ON FUNCTION check_progressive_profiling_trigger IS
'Checks if user should be prompted with progressive profiling micro-questions.
Triggers at 5, 10, 15, 20... applications if low-quality items exist.
Returns JSON with shouldTrigger flag and reason.';

COMMENT ON FUNCTION upgrade_vault_item_tier IS
'Upgrades a vault item to a higher quality tier after micro-question is answered.
Bumps freshness_score to at least 80 when upgraded.';
