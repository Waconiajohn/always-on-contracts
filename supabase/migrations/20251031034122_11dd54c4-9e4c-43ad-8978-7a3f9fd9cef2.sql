-- =====================================================
-- MIGRATION: Standardize quality tiers
-- =====================================================
-- This migration enforces a 4-tier quality system across
-- all vault tables: gold, silver, bronze, assumed
-- (removes "platinum" tier by migrating to "gold")
-- =====================================================

-- First, migrate all existing "platinum" records to "gold" across all 10 tables
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

-- Drop existing CHECK constraints if they exist (to avoid conflicts)
ALTER TABLE vault_power_phrases DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_transferable_skills DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_hidden_competencies DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_soft_skills DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_leadership_philosophy DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_executive_presence DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_personality_traits DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_work_style DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_values_motivations DROP CONSTRAINT IF EXISTS check_quality_tier;
ALTER TABLE vault_behavioral_indicators DROP CONSTRAINT IF EXISTS check_quality_tier;

-- Add CHECK constraints to enforce 4-tier system on all 10 tables
ALTER TABLE vault_power_phrases 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_transferable_skills 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_hidden_competencies 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_soft_skills 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_leadership_philosophy 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_executive_presence 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_personality_traits 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_work_style 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_values_motivations 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

ALTER TABLE vault_behavioral_indicators 
  ADD CONSTRAINT check_quality_tier 
  CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed'));

-- Update get_vault_statistics() function to count only 4 quality tiers
CREATE OR REPLACE FUNCTION public.get_vault_statistics(p_vault_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Calculate quality tier breakdown (4 tiers: gold, silver, bronze, assumed)
  SELECT json_build_object(
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
    ),
    'bronze', (
      SELECT COUNT(*) FROM (
        SELECT id FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'bronze'
        UNION ALL SELECT id FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'bronze'
        UNION ALL SELECT id FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'bronze'
        UNION ALL SELECT id FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'bronze'
      ) AS bronze_items
    ),
    'assumed', (
      SELECT COUNT(*) FROM (
        SELECT id FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'assumed'
        UNION ALL SELECT id FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'assumed'
        UNION ALL SELECT id FROM vault_hidden_competencies WHERE vault_id = p_vault_id AND quality_tier = 'assumed'
        UNION ALL SELECT id FROM vault_soft_skills WHERE vault_id = p_vault_id AND quality_tier = 'assumed'
      ) AS assumed_items
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
      SELECT id FROM vault_power_phrases WHERE vault_id = p_vault_id AND quality_tier = 'gold'
      UNION ALL SELECT id FROM vault_transferable_skills WHERE vault_id = p_vault_id AND quality_tier = 'gold'
    ) AS gold_count) * 3)
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
$$;

-- Add comments for documentation
COMMENT ON CONSTRAINT check_quality_tier ON vault_power_phrases IS 'Enforces 4-tier quality system: gold, silver, bronze, assumed';
COMMENT ON CONSTRAINT check_quality_tier ON vault_transferable_skills IS 'Enforces 4-tier quality system: gold, silver, bronze, assumed';
COMMENT ON CONSTRAINT check_quality_tier ON vault_hidden_competencies IS 'Enforces 4-tier quality system: gold, silver, bronze, assumed';
COMMENT ON CONSTRAINT check_quality_tier ON vault_soft_skills IS 'Enforces 4-tier quality system: gold, silver, bronze, assumed';