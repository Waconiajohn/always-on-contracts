-- =====================================================
-- FIX VAULT_GAP_ANALYSIS SCHEMA - Career Vault 2.0
-- =====================================================
-- This migration adds missing columns to store complete
-- competitive benchmark data from generate-completion-benchmark
-- =====================================================

-- Add missing columns for comprehensive benchmark storage
ALTER TABLE vault_gap_analysis
ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(50) DEFAULT 'gap_analysis',
ADD COLUMN IF NOT EXISTS identified_gaps JSONB,
ADD COLUMN IF NOT EXISTS competitive_insights JSONB,
ADD COLUMN IF NOT EXISTS recommendations JSONB,
ADD COLUMN IF NOT EXISTS percentile_ranking INTEGER,
ADD COLUMN IF NOT EXISTS vault_strength_at_analysis INTEGER;

-- Add strengths and opportunities columns for complete benchmark data
ALTER TABLE vault_gap_analysis
ADD COLUMN IF NOT EXISTS strengths JSONB,
ADD COLUMN IF NOT EXISTS opportunities JSONB;

-- Update existing rows to have proper structure
UPDATE vault_gap_analysis
SET
  analysis_type = COALESCE(analysis_type, 'gap_analysis'),
  identified_gaps = CASE
    WHEN identified_gaps IS NULL THEN
      jsonb_build_array(
        jsonb_build_object(
          'area', gap_type,
          'description', gap_description,
          'severity', severity,
          'recommended_actions', recommended_actions,
          'vault_evidence', vault_evidence,
          'confidence_score', confidence_score
        )
      )
    ELSE identified_gaps
  END
WHERE identified_gaps IS NULL AND gap_description IS NOT NULL;

-- Create index for analysis_type queries
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_type
ON vault_gap_analysis(analysis_type);

-- Create index for percentile_ranking queries
CREATE INDEX IF NOT EXISTS idx_vault_gap_analysis_percentile
ON vault_gap_analysis(percentile_ranking);

-- Add constraint to ensure valid percentile values
ALTER TABLE vault_gap_analysis
ADD CONSTRAINT check_percentile_range
CHECK (percentile_ranking IS NULL OR (percentile_ranking >= 1 AND percentile_ranking <= 100));

-- Add comment to document the enhanced schema
COMMENT ON TABLE vault_gap_analysis IS 'Stores both gap analysis and competitive benchmark data. analysis_type determines the structure: "gap_analysis" for targeted gaps, "completion_benchmark" for full competitive positioning.';

COMMENT ON COLUMN vault_gap_analysis.analysis_type IS 'Type of analysis: gap_analysis, completion_benchmark, or custom';
COMMENT ON COLUMN vault_gap_analysis.identified_gaps IS 'Array of gap objects with area, description, severity, impact, howToFill';
COMMENT ON COLUMN vault_gap_analysis.competitive_insights IS 'Object with vsTopPerformers, marketPosition, differentiators, areasToWatch';
COMMENT ON COLUMN vault_gap_analysis.recommendations IS 'Array of recommendation objects with title, description, impact, estimatedBoost, timeToImplement';
COMMENT ON COLUMN vault_gap_analysis.percentile_ranking IS 'Percentile ranking (1-100) where 10 means top 10%';
COMMENT ON COLUMN vault_gap_analysis.vault_strength_at_analysis IS 'Vault strength percentage (0-100) at time of analysis';
COMMENT ON COLUMN vault_gap_analysis.strengths IS 'Array of strength objects with area, description, advantage, examples';
COMMENT ON COLUMN vault_gap_analysis.opportunities IS 'Array of opportunity objects with area, description, impact, priority, estimatedEffort';
