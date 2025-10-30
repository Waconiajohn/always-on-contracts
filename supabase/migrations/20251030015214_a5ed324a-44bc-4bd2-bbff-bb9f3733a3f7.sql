-- =====================================================
-- CAREER VAULT 2.0 - DATABASE ENHANCEMENTS
-- =====================================================

-- Add new columns to career_vault table
ALTER TABLE career_vault 
ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) DEFAULT 'resume_upload',
ADD COLUMN IF NOT EXISTS vault_version VARCHAR(10) DEFAULT '2.0',
ADD COLUMN IF NOT EXISTS last_gap_analysis_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_behavioral_indicators INTEGER DEFAULT 0;

-- Create vault_gap_analysis table
CREATE TABLE IF NOT EXISTS vault_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  target_role VARCHAR(255),
  gap_type VARCHAR(50) NOT NULL,
  gap_description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  recommended_actions TEXT[],
  vault_evidence TEXT[],
  confidence_score INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on vault_gap_analysis
ALTER TABLE vault_gap_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for vault_gap_analysis
CREATE POLICY "Users can view their own gap analysis"
ON vault_gap_analysis FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gap analysis"
ON vault_gap_analysis FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gap analysis"
ON vault_gap_analysis FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gap analysis"
ON vault_gap_analysis FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for vault_gap_analysis
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_vault_id ON vault_gap_analysis(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_user_id ON vault_gap_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_severity ON vault_gap_analysis(severity);

-- Full-text search indexes for all vault tables
CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_fts ON vault_power_phrases USING gin(to_tsvector('english', power_phrase));
CREATE INDEX IF NOT EXISTS idx_vault_transferable_skills_fts ON vault_transferable_skills USING gin(to_tsvector('english', stated_skill));
CREATE INDEX IF NOT EXISTS idx_vault_hidden_competencies_fts ON vault_hidden_competencies USING gin(to_tsvector('english', competency_area || ' ' || inferred_capability));
CREATE INDEX IF NOT EXISTS idx_vault_soft_skills_fts ON vault_soft_skills USING gin(to_tsvector('english', skill_name));
CREATE INDEX IF NOT EXISTS idx_vault_leadership_philosophy_fts ON vault_leadership_philosophy USING gin(to_tsvector('english', philosophy_statement));
CREATE INDEX IF NOT EXISTS idx_vault_executive_presence_fts ON vault_executive_presence USING gin(to_tsvector('english', presence_indicator));
CREATE INDEX IF NOT EXISTS idx_vault_personality_traits_fts ON vault_personality_traits USING gin(to_tsvector('english', trait_name));
CREATE INDEX IF NOT EXISTS idx_vault_work_style_fts ON vault_work_style USING gin(to_tsvector('english', preference_area));
CREATE INDEX IF NOT EXISTS idx_vault_values_motivations_fts ON vault_values_motivations USING gin(to_tsvector('english', value_name));
CREATE INDEX IF NOT EXISTS idx_vault_behavioral_indicators_fts ON vault_behavioral_indicators USING gin(to_tsvector('english', indicator_type));

-- Create search_vault_items function
CREATE OR REPLACE FUNCTION search_vault_items(
  p_vault_id UUID,
  p_search_query TEXT,
  p_categories TEXT[] DEFAULT NULL,
  p_quality_tiers TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  table_name TEXT,
  item_id UUID,
  content TEXT,
  quality_tier VARCHAR(20),
  relevance_score REAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Search across all vault tables with full-text search
  RETURN QUERY
  (
    SELECT 
      'power_phrases'::TEXT as table_name,
      id as item_id,
      power_phrase as content,
      quality_tier,
      ts_rank(to_tsvector('english', power_phrase), plainto_tsquery('english', p_search_query)) as relevance_score,
      created_at
    FROM vault_power_phrases
    WHERE vault_id = p_vault_id
      AND (p_categories IS NULL OR 'power_phrases' = ANY(p_categories))
      AND (p_quality_tiers IS NULL OR quality_tier = ANY(p_quality_tiers))
      AND to_tsvector('english', power_phrase) @@ plainto_tsquery('english', p_search_query)
  )
  UNION ALL
  (
    SELECT 
      'transferable_skills'::TEXT,
      id,
      stated_skill,
      quality_tier,
      ts_rank(to_tsvector('english', stated_skill), plainto_tsquery('english', p_search_query)),
      created_at
    FROM vault_transferable_skills
    WHERE vault_id = p_vault_id
      AND (p_categories IS NULL OR 'transferable_skills' = ANY(p_categories))
      AND (p_quality_tiers IS NULL OR quality_tier = ANY(p_quality_tiers))
      AND to_tsvector('english', stated_skill) @@ plainto_tsquery('english', p_search_query)
  )
  UNION ALL
  (
    SELECT 
      'hidden_competencies'::TEXT,
      id,
      competency_area || ': ' || inferred_capability,
      quality_tier,
      ts_rank(to_tsvector('english', competency_area || ' ' || inferred_capability), plainto_tsquery('english', p_search_query)),
      created_at
    FROM vault_hidden_competencies
    WHERE vault_id = p_vault_id
      AND (p_categories IS NULL OR 'hidden_competencies' = ANY(p_categories))
      AND (p_quality_tiers IS NULL OR quality_tier = ANY(p_quality_tiers))
      AND to_tsvector('english', competency_area || ' ' || inferred_capability) @@ plainto_tsquery('english', p_search_query)
  )
  ORDER BY relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_vault_statistics function
CREATE OR REPLACE FUNCTION get_vault_statistics(p_vault_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
  total_items INTEGER;
  quality_breakdown JSON;
  category_breakdown JSON;
  vault_strength INTEGER;
BEGIN
  -- Count total items across all vault tables
  SELECT 
    (SELECT COUNT(*) FROM vault_power_phrases WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_transferable_skills WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_hidden_competencies WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_soft_skills WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_executive_presence WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_personality_traits WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_work_style WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_values_motivations WHERE vault_id = p_vault_id) +
    (SELECT COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = p_vault_id)
  INTO total_items;

  -- Calculate quality tier breakdown
  SELECT json_build_object(
    'platinum', (
      SELECT COUNT(*) FROM (
        SELECT id FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'platinum'
        UNION ALL SELECT id FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'platinum'
        UNION ALL SELECT id FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'platinum'
        UNION ALL SELECT id FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'platinum'
      ) AS platinum_items
    ),
    'gold', (
      SELECT COUNT(*) FROM (
        SELECT id FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'gold'
        UNION ALL SELECT id FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'gold'
        UNION ALL SELECT id FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'gold'
        UNION ALL SELECT id FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'gold'
      ) AS gold_items
    ),
    'silver', (
      SELECT COUNT(*) FROM (
        SELECT id FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'silver'
        UNION ALL SELECT id FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'silver'
        UNION ALL SELECT id FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'silver'
        UNION ALL SELECT id FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'silver'
      ) AS silver_items
    )
  ) INTO quality_breakdown;

  -- Calculate category breakdown
  SELECT json_build_object(
    'power_phrases', (SELECT COUNT(*) FROM vault_power_phrases WHERE vault_id = p_vault_id),
    'transferable_skills', (SELECT COUNT(*) FROM vault_transferable_skills WHERE vault_id = p_vault_id),
    'hidden_competencies', (SELECT COUNT(*) FROM vault_hidden_competencies WHERE vault_id = p_vault_id),
    'soft_skills', (SELECT COUNT(*) FROM vault_soft_skills WHERE vault_id = p_vault_id),
    'leadership_philosophy', (SELECT COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = p_vault_id),
    'executive_presence', (SELECT COUNT(*) FROM vault_executive_presence WHERE vault_id = p_vault_id),
    'personality_traits', (SELECT COUNT(*) FROM vault_personality_traits WHERE vault_id = p_vault_id),
    'work_style', (SELECT COUNT(*) FROM vault_work_style WHERE vault_id = p_vault_id),
    'values_motivations', (SELECT COUNT(*) FROM vault_values_motivations WHERE vault_id = p_vault_id),
    'behavioral_indicators', (SELECT COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = p_vault_id)
  ) INTO category_breakdown;

  -- Calculate vault strength (0-100 score based on item count and quality)
  SELECT LEAST(100, (total_items * 2) + 
    ((SELECT COUNT(*) FROM (
      SELECT id FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'platinum'
      UNION ALL SELECT id FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'platinum'
    ) AS plat) * 3)
  ) INTO vault_strength;

  -- Build final stats object
  stats := json_build_object(
    'totalItems', total_items,
    'vaultStrength', vault_strength,
    'qualityBreakdown', quality_breakdown,
    'categoryBreakdown', category_breakdown,
    'lastUpdated', now()
  );

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;