-- Add AI Inference Review System
-- Flag AI-generated items for user confirmation to reduce hallucinations

-- Add review flags to all vault tables
DO $$
DECLARE
  vault_table TEXT;
BEGIN
  FOR vault_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name LIKE 'vault_%'
      AND table_schema = 'public'
      AND table_type = 'BASE TABLE'
  LOOP
    -- Add review columns if they don't exist
    EXECUTE format('
      ALTER TABLE %I
      ADD COLUMN IF NOT EXISTS needs_user_review BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS inferred_from TEXT,
      ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS review_action TEXT CHECK (review_action IN (''confirmed'', ''edited'', ''rejected'', NULL))
    ', vault_table);

    RAISE NOTICE 'Added review columns to %', vault_table;
  END LOOP;
END $$;

-- Create indexes for quick lookup of items needing review
CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_needs_review
  ON vault_power_phrases(user_id, needs_user_review)
  WHERE needs_user_review = true;

CREATE INDEX IF NOT EXISTS idx_vault_soft_skills_needs_review
  ON vault_soft_skills(user_id, needs_user_review)
  WHERE needs_user_review = true;

CREATE INDEX IF NOT EXISTS idx_vault_transferable_skills_needs_review
  ON vault_transferable_skills(user_id, needs_user_review)
  WHERE needs_user_review = true;

CREATE INDEX IF NOT EXISTS idx_vault_hidden_competencies_needs_review
  ON vault_hidden_competencies(user_id, needs_user_review)
  WHERE needs_user_review = true;

CREATE INDEX IF NOT EXISTS idx_vault_leadership_philosophy_needs_review
  ON vault_leadership_philosophy(user_id, needs_user_review)
  WHERE needs_user_review = true;

-- Function to get all items needing review across all vault tables
CREATE OR REPLACE FUNCTION get_items_needing_review(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_power_phrases JSONB;
  v_soft_skills JSONB;
  v_transferable_skills JSONB;
  v_hidden_competencies JSONB;
  v_leadership JSONB;
  v_total INTEGER := 0;
BEGIN
  -- Power phrases needing review
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'category', 'power_phrases',
    'content', power_phrase,
    'inferredFrom', inferred_from,
    'confidence', ai_confidence,
    'qualityTier', quality_tier
  ))
  INTO v_power_phrases
  FROM vault_power_phrases
  WHERE user_id = p_user_id
    AND needs_user_review = true;

  -- Soft skills needing review
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'category', 'soft_skills',
    'content', skill_name,
    'examples', examples,
    'inferredFrom', inferred_from,
    'confidence', ai_confidence,
    'qualityTier', quality_tier
  ))
  INTO v_soft_skills
  FROM vault_soft_skills
  WHERE user_id = p_user_id
    AND needs_user_review = true;

  -- Transferable skills needing review
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'category', 'transferable_skills',
    'content', stated_skill,
    'evidence', evidence,
    'inferredFrom', inferred_from,
    'confidence', ai_confidence,
    'qualityTier', quality_tier
  ))
  INTO v_transferable_skills
  FROM vault_transferable_skills
  WHERE user_id = p_user_id
    AND needs_user_review = true;

  -- Hidden competencies needing review
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'category', 'hidden_competencies',
    'content', competency_area,
    'capability', inferred_capability,
    'inferredFrom', inferred_from,
    'confidence', ai_confidence,
    'qualityTier', quality_tier
  ))
  INTO v_hidden_competencies
  FROM vault_hidden_competencies
  WHERE user_id = p_user_id
    AND needs_user_review = true;

  -- Leadership philosophy needing review
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'category', 'leadership_philosophy',
    'content', philosophy_statement,
    'style', leadership_style,
    'inferredFrom', inferred_from,
    'confidence', ai_confidence,
    'qualityTier', quality_tier
  ))
  INTO v_leadership
  FROM vault_leadership_philosophy
  WHERE user_id = p_user_id
    AND needs_user_review = true;

  -- Calculate total count
  v_total := (
    COALESCE(jsonb_array_length(v_power_phrases), 0) +
    COALESCE(jsonb_array_length(v_soft_skills), 0) +
    COALESCE(jsonb_array_length(v_transferable_skills), 0) +
    COALESCE(jsonb_array_length(v_hidden_competencies), 0) +
    COALESCE(jsonb_array_length(v_leadership), 0)
  );

  v_result := jsonb_build_object(
    'powerPhrases', COALESCE(v_power_phrases, '[]'::jsonb),
    'softSkills', COALESCE(v_soft_skills, '[]'::jsonb),
    'transferableSkills', COALESCE(v_transferable_skills, '[]'::jsonb),
    'hiddenCompetencies', COALESCE(v_hidden_competencies, '[]'::jsonb),
    'leadership', COALESCE(v_leadership, '[]'::jsonb),
    'totalCount', v_total
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle review action (confirm, edit, reject)
CREATE OR REPLACE FUNCTION process_inference_review(
  p_user_id UUID,
  p_vault_category TEXT,
  p_item_id UUID,
  p_action TEXT, -- 'confirmed', 'edited', 'rejected'
  p_edited_content JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_table_name TEXT;
  v_new_tier TEXT;
BEGIN
  -- Validate action
  IF p_action NOT IN ('confirmed', 'edited', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  -- Get table name
  v_table_name := 'vault_' || p_vault_category;

  -- Handle rejection (delete item)
  IF p_action = 'rejected' THEN
    EXECUTE format('DELETE FROM %I WHERE id = $1 AND user_id = $2', v_table_name)
    USING p_item_id, p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'deleted'
    );
  END IF;

  -- Handle confirmation (upgrade to Silver)
  IF p_action = 'confirmed' THEN
    v_new_tier := 'silver';

    EXECUTE format('
      UPDATE %I
      SET needs_user_review = false,
          reviewed_at = NOW(),
          review_action = $1,
          quality_tier = $2
      WHERE id = $3 AND user_id = $4
    ', v_table_name)
    USING p_action, v_new_tier, p_item_id, p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'confirmed',
      'newTier', v_new_tier
    );
  END IF;

  -- Handle editing (upgrade to Gold)
  IF p_action = 'edited' AND p_edited_content IS NOT NULL THEN
    v_new_tier := 'gold';

    -- Update with edited content (specific fields depend on table)
    -- This is a simplified version - in production, you'd update specific columns
    EXECUTE format('
      UPDATE %I
      SET needs_user_review = false,
          reviewed_at = NOW(),
          review_action = $1,
          quality_tier = $2,
          updated_at = NOW()
      WHERE id = $3 AND user_id = $4
    ', v_table_name)
    USING p_action, v_new_tier, p_item_id, p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'edited',
      'newTier', v_new_tier
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Unknown error');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark items as needing review during AI extraction
-- This should be called by the analyze-resume edge function
CREATE OR REPLACE FUNCTION mark_for_review(
  p_table_name TEXT,
  p_item_id UUID,
  p_inferred_from TEXT,
  p_confidence DECIMAL
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    UPDATE %I
    SET needs_user_review = true,
        inferred_from = $1,
        ai_confidence = $2
    WHERE id = $3
  ', p_table_name)
  USING p_inferred_from, p_confidence, p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
