-- Add Mid-Senior Career Questions
-- Target: ICs, Managers, Directors (95% of users)
-- Questions focus on: Promotions, Projects, Recognition, Technical Leadership, Scope

-- Add career progression tracking table
CREATE TABLE IF NOT EXISTS mid_senior_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,
  question_id TEXT NOT NULL,
  response JSONB NOT NULL,
  follow_up_responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mid_senior_responses_user ON mid_senior_question_responses(user_id);
CREATE INDEX idx_mid_senior_responses_vault ON mid_senior_question_responses(vault_id);
CREATE INDEX idx_mid_senior_responses_question ON mid_senior_question_responses(question_id);

-- RLS policies
ALTER TABLE mid_senior_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mid-senior responses"
  ON mid_senior_question_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mid-senior responses"
  ON mid_senior_question_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mid-senior responses"
  ON mid_senior_question_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mid-senior responses"
  ON mid_senior_question_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Function to check if user has completed mid-senior questions
CREATE OR REPLACE FUNCTION get_mid_senior_question_completion(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_questions INTEGER := 5;
  v_completed_questions INTEGER;
  v_completion_percentage INTEGER;
BEGIN
  SELECT COUNT(DISTINCT question_id)
  INTO v_completed_questions
  FROM mid_senior_question_responses
  WHERE user_id = p_user_id;

  v_completion_percentage := ROUND((v_completed_questions::DECIMAL / v_total_questions) * 100);

  RETURN jsonb_build_object(
    'totalQuestions', v_total_questions,
    'completedQuestions', v_completed_questions,
    'completionPercentage', v_completion_percentage,
    'isComplete', v_completed_questions >= v_total_questions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store mid-senior question response and update vault
CREATE OR REPLACE FUNCTION store_mid_senior_response(
  p_user_id UUID,
  p_vault_id UUID,
  p_question_id TEXT,
  p_response JSONB,
  p_follow_up_responses JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_response_id UUID;
  v_power_phrase TEXT;
  v_skill TEXT;
BEGIN
  -- Insert or update response
  INSERT INTO mid_senior_question_responses (
    user_id,
    vault_id,
    question_id,
    response,
    follow_up_responses
  )
  VALUES (
    p_user_id,
    p_vault_id,
    p_question_id,
    p_response,
    p_follow_up_responses
  )
  ON CONFLICT ON CONSTRAINT mid_senior_question_responses_pkey
  DO UPDATE SET
    response = EXCLUDED.response,
    follow_up_responses = EXCLUDED.follow_up_responses,
    updated_at = NOW()
  RETURNING id INTO v_response_id;

  -- Process specific questions and add to vault

  -- Q26: Promotion Trajectory
  IF p_question_id = 'mid_promotion_trajectory' AND p_follow_up_responses IS NOT NULL THEN
    v_power_phrase := format(
      '%s. Achievement: %s',
      p_follow_up_responses->>'mostRecentPromotion',
      p_follow_up_responses->>'achievement'
    );

    INSERT INTO vault_power_phrases (
      user_id,
      vault_id,
      power_phrase,
      category,
      quality_tier,
      source
    )
    VALUES (
      p_user_id,
      p_vault_id,
      v_power_phrase,
      'career_growth',
      'gold',
      'mid_senior_questions'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Q27: Cross-Functional Projects
  IF p_question_id = 'mid_cross_functional' AND p_follow_up_responses IS NOT NULL THEN
    v_power_phrase := format(
      '%s. Outcome: %s',
      p_follow_up_responses->>'projectDescription',
      p_follow_up_responses->>'outcome'
    );

    INSERT INTO vault_power_phrases (
      user_id,
      vault_id,
      power_phrase,
      category,
      quality_tier,
      source
    )
    VALUES (
      p_user_id,
      p_vault_id,
      v_power_phrase,
      'collaboration',
      'gold',
      'mid_senior_questions'
    );
  END IF;

  -- Q28: Technical Leadership
  IF p_question_id = 'mid_technical_leadership' AND p_follow_up_responses IS NOT NULL THEN
    INSERT INTO vault_leadership_philosophy (
      user_id,
      vault_id,
      philosophy_statement,
      leadership_style,
      real_world_application,
      quality_tier,
      source
    )
    VALUES (
      p_user_id,
      p_vault_id,
      p_follow_up_responses->>'impactfulContribution',
      'technical_leadership',
      p_follow_up_responses->>'impactfulContribution',
      'gold',
      'mid_senior_questions'
    );
  END IF;

  -- Q29: Scope and Impact
  IF p_question_id = 'mid_scope_impact' AND p_follow_up_responses IS NOT NULL THEN
    v_power_phrase := format(
      '%s. Business impact: %s',
      p_follow_up_responses->>'largestScopeProject',
      p_follow_up_responses->>'businessImpact'
    );

    INSERT INTO vault_power_phrases (
      user_id,
      vault_id,
      power_phrase,
      category,
      quality_tier,
      source
    )
    VALUES (
      p_user_id,
      p_vault_id,
      v_power_phrase,
      'business_impact',
      'gold',
      'mid_senior_questions'
    );
  END IF;

  -- Q30: Awards and Recognition
  IF p_question_id = 'mid_recognition' AND p_follow_up_responses IS NOT NULL THEN
    INSERT INTO vault_hidden_competencies (
      user_id,
      vault_id,
      competency_area,
      inferred_capability,
      supporting_evidence,
      quality_tier,
      source
    )
    VALUES (
      p_user_id,
      p_vault_id,
      'professional_recognition',
      'Industry-recognized professional',
      ARRAY[p_follow_up_responses->>'details'],
      'gold',
      'mid_senior_questions'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'responseId', v_response_id,
    'vaultItemsCreated', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add source column to vault tables if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vault_power_phrases' AND column_name = 'source'
  ) THEN
    ALTER TABLE vault_power_phrases ADD COLUMN source TEXT DEFAULT 'user_input';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vault_leadership_philosophy' AND column_name = 'source'
  ) THEN
    ALTER TABLE vault_leadership_philosophy ADD COLUMN source TEXT DEFAULT 'user_input';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vault_hidden_competencies' AND column_name = 'source'
  ) THEN
    ALTER TABLE vault_hidden_competencies ADD COLUMN source TEXT DEFAULT 'user_input';
  END IF;
END $$;
