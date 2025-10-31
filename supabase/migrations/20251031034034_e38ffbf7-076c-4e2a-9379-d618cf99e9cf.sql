-- =====================================================
-- MIGRATION: Enhance gap_analysis schema
-- =====================================================
-- This migration adds 8 missing columns to vault_gap_analysis
-- table to support complete benchmark data storage and
-- competitive analysis features in Career Vault 2.0
-- =====================================================

-- Add new columns to vault_gap_analysis table
ALTER TABLE vault_gap_analysis
  ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(50) DEFAULT 'comprehensive',
  ADD COLUMN IF NOT EXISTS identified_gaps JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS competitive_insights JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS percentile_ranking INTEGER,
  ADD COLUMN IF NOT EXISTS vault_strength_at_analysis INTEGER,
  ADD COLUMN IF NOT EXISTS strengths JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS opportunities JSONB DEFAULT '[]'::jsonb;

-- Add CHECK constraint to ensure percentile is valid (1-100)
ALTER TABLE vault_gap_analysis
  ADD CONSTRAINT check_percentile_ranking_range 
  CHECK (percentile_ranking IS NULL OR (percentile_ranking >= 1 AND percentile_ranking <= 100));

-- Add CHECK constraint to ensure vault_strength is valid (0-100)
ALTER TABLE vault_gap_analysis
  ADD CONSTRAINT check_vault_strength_range 
  CHECK (vault_strength_at_analysis IS NULL OR (vault_strength_at_analysis >= 0 AND vault_strength_at_analysis <= 100));

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_analysis_type ON vault_gap_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_percentile ON vault_gap_analysis(percentile_ranking DESC) WHERE percentile_ranking IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_vault_strength ON vault_gap_analysis(vault_strength_at_analysis DESC) WHERE vault_strength_at_analysis IS NOT NULL;

-- Add GIN indexes for JSONB columns to enable efficient querying
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_gaps ON vault_gap_analysis USING GIN (identified_gaps);
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_insights ON vault_gap_analysis USING GIN (competitive_insights);
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_recommendations ON vault_gap_analysis USING GIN (recommendations);
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_strengths ON vault_gap_analysis USING GIN (strengths);
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_opportunities ON vault_gap_analysis USING GIN (opportunities);

-- Add comments for documentation
COMMENT ON COLUMN vault_gap_analysis.analysis_type IS 'Type of gap analysis: comprehensive, quick_scan, targeted, etc.';
COMMENT ON COLUMN vault_gap_analysis.identified_gaps IS 'Array of specific gaps identified in the career vault';
COMMENT ON COLUMN vault_gap_analysis.competitive_insights IS 'Market positioning and competitive analysis data';
COMMENT ON COLUMN vault_gap_analysis.recommendations IS 'Actionable recommendations to close identified gaps';
COMMENT ON COLUMN vault_gap_analysis.percentile_ranking IS 'User percentile ranking (1-100) compared to industry peers';
COMMENT ON COLUMN vault_gap_analysis.vault_strength_at_analysis IS 'Overall vault strength score (0-100) at time of analysis';
COMMENT ON COLUMN vault_gap_analysis.strengths IS 'Array of identified strengths and competitive advantages';
COMMENT ON COLUMN vault_gap_analysis.opportunities IS 'Array of growth opportunities and career development paths';