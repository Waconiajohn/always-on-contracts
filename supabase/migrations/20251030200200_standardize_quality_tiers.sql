-- =====================================================
-- STANDARDIZE QUALITY TIERS - Career Vault 2.0
-- =====================================================
-- This migration enforces the 4-tier quality system:
-- - gold: User-verified (highest confidence)
-- - silver: Confirmed by AI (high confidence)
-- - bronze: Medium confidence
-- - assumed: Low confidence (needs verification)
--
-- Removes all 'platinum' tier references and ensures
-- consistency across all 10 vault tables.
-- =====================================================

-- Update get_vault_statistics to use 4-tier system only
CREATE OR REPLACE FUNCTION get_vault_statistics(p_vault_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH vault_counts AS (
    SELECT
      (SELECT COUNT(*) FROM vault_power_phrases WHERE vault_id = p_vault_id) as power_phrases,
      (SELECT COUNT(*) FROM vault_transferable_skills WHERE vault_id = p_vault_id) as transferable_skills,
      (SELECT COUNT(*) FROM vault_hidden_competencies WHERE vault_id = p_vault_id) as hidden_competencies,
      (SELECT COUNT(*) FROM vault_soft_skills WHERE vault_id = p_vault_id) as soft_skills,
      (SELECT COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = p_vault_id) as leadership_philosophy,
      (SELECT COUNT(*) FROM vault_executive_presence WHERE vault_id = p_vault_id) as executive_presence,
      (SELECT COUNT(*) FROM vault_personality_traits WHERE vault_id = p_vault_id) as personality_traits,
      (SELECT COUNT(*) FROM vault_work_style WHERE vault_id = p_vault_id) as work_style,
      (SELECT COUNT(*) FROM vault_values_motivations WHERE vault_id = p_vault_id) as values_motivations,
      (SELECT COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = p_vault_id) as behavioral_indicators
  ),
  quality_counts AS (
    SELECT
      'gold' as tier,
      (
        (SELECT COUNT(*) FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_executive_presence WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_personality_traits WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_work_style WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_values_motivations WHERE vault_id = p_vault_id AND quality_tier = 'gold') +
        (SELECT COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = p_vault_id AND quality_tier = 'gold')
      ) as count
    UNION ALL
    SELECT
      'silver' as tier,
      (
        (SELECT COUNT(*) FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_executive_presence WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_personality_traits WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_work_style WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_values_motivations WHERE vault_id = p_vault_id AND quality_tier = 'silver') +
        (SELECT COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = p_vault_id AND quality_tier = 'silver')
      ) as count
    UNION ALL
    SELECT
      'bronze' as tier,
      (
        (SELECT COUNT(*) FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_executive_presence WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_personality_traits WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_work_style WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_values_motivations WHERE vault_id = p_vault_id AND quality_tier = 'bronze') +
        (SELECT COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = p_vault_id AND quality_tier = 'bronze')
      ) as count
    UNION ALL
    SELECT
      'assumed' as tier,
      (
        (SELECT COUNT(*) FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_executive_presence WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_personality_traits WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_work_style WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_values_motivations WHERE vault_id = p_vault_id AND quality_tier = 'assumed') +
        (SELECT COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = p_vault_id AND quality_tier = 'assumed')
      ) as count
  )
  SELECT json_build_object(
    'categoryCounts', row_to_json(vault_counts.*),
    'qualityBreakdown', (SELECT json_object_agg(tier, count) FROM quality_counts),
    'totalItems', (
      SELECT SUM(count) FROM quality_counts
    )
  ) INTO result
  FROM vault_counts;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Migrate any existing 'platinum' tier items to 'gold' (highest tier)
UPDATE vault_power_phrases SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_transferable_skills SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_hidden_competencies SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_soft_skills SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_leadership_philosophy SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_executive_presence SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_personality_traits SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_work_style SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_values_motivations SET quality_tier = 'gold' WHERE quality_tier = 'platinum';
UPDATE vault_behavioral_indicators SET quality_tier = 'gold' WHERE quality_tier = 'platinum';

-- Add check constraints to enforce 4-tier system on all tables
ALTER TABLE vault_power_phrases
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_transferable_skills
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_hidden_competencies
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_soft_skills
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_leadership_philosophy
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_executive_presence
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_personality_traits
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_work_style
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_values_motivations
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_behavioral_indicators
DROP CONSTRAINT IF EXISTS check_quality_tier,
ADD CONSTRAINT check_quality_tier CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

-- Add documentation comments
COMMENT ON COLUMN vault_power_phrases.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_transferable_skills.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_hidden_competencies.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_soft_skills.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_leadership_philosophy.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_executive_presence.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_personality_traits.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_work_style.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_values_motivations.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
COMMENT ON COLUMN vault_behavioral_indicators.quality_tier IS 'Quality tier: gold (user-verified), silver (confirmed), bronze (medium), assumed (low) - 4-tier system only';
