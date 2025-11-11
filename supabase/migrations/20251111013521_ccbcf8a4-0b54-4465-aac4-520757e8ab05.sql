-- Phase 3: Add quality tier support for draft→verified→gold progression
-- Note: quality_tier is stored as VARCHAR(20), not an enum

-- Add extraction_version column to track which version extracted the data
ALTER TABLE vault_power_phrases ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT 'v3-hybrid';
ALTER TABLE vault_transferable_skills ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT 'v3-hybrid';
ALTER TABLE vault_hidden_competencies ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT 'v3-hybrid';
ALTER TABLE vault_soft_skills ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT 'v3-hybrid';

-- Add industry_context column for Phase 4 (industry benchmarks and context)
ALTER TABLE vault_power_phrases ADD COLUMN IF NOT EXISTS industry_context JSONB DEFAULT '{}'::jsonb;
ALTER TABLE vault_transferable_skills ADD COLUMN IF NOT EXISTS industry_context JSONB DEFAULT '{}'::jsonb;

-- Add review_priority column to identify items needing user enhancement (0-100)
ALTER TABLE vault_power_phrases ADD COLUMN IF NOT EXISTS review_priority INTEGER DEFAULT 0;
ALTER TABLE vault_transferable_skills ADD COLUMN IF NOT EXISTS review_priority INTEGER DEFAULT 0;
ALTER TABLE vault_hidden_competencies ADD COLUMN IF NOT EXISTS review_priority INTEGER DEFAULT 0;
ALTER TABLE vault_soft_skills ADD COLUMN IF NOT EXISTS review_priority INTEGER DEFAULT 0;

-- Add section_source to track which resume section an item came from
ALTER TABLE vault_power_phrases ADD COLUMN IF NOT EXISTS section_source TEXT;
ALTER TABLE vault_transferable_skills ADD COLUMN IF NOT EXISTS section_source TEXT;
ALTER TABLE vault_hidden_competencies ADD COLUMN IF NOT EXISTS section_source TEXT;
ALTER TABLE vault_soft_skills ADD COLUMN IF NOT EXISTS section_source TEXT;

-- Add enhancement_notes to track AI's reasoning for enhancements
ALTER TABLE vault_power_phrases ADD COLUMN IF NOT EXISTS enhancement_notes TEXT;
ALTER TABLE vault_transferable_skills ADD COLUMN IF NOT EXISTS enhancement_notes TEXT;
ALTER TABLE vault_hidden_competencies ADD COLUMN IF NOT EXISTS enhancement_notes TEXT;

COMMENT ON COLUMN vault_power_phrases.extraction_version IS 'Version of extraction system (v3-hybrid = section-by-section with enhancement)';
COMMENT ON COLUMN vault_power_phrases.industry_context IS 'Industry benchmarks and relative performance context';
COMMENT ON COLUMN vault_power_phrases.review_priority IS 'Priority for user review (0-100, higher = needs review sooner, based on impact potential)';
COMMENT ON COLUMN vault_power_phrases.section_source IS 'Resume section this was extracted from (experience, education, skills, certifications, other)';
COMMENT ON COLUMN vault_power_phrases.enhancement_notes IS 'AI notes on how this was enhanced from raw resume content';

-- Add check constraint to ensure valid quality tiers (existing + new ones)
ALTER TABLE vault_power_phrases DROP CONSTRAINT IF EXISTS vault_power_phrases_quality_tier_check;
ALTER TABLE vault_power_phrases ADD CONSTRAINT vault_power_phrases_quality_tier_check 
  CHECK (quality_tier IN ('draft', 'needs_review', 'assumed', 'bronze', 'silver', 'gold', 'verified'));

ALTER TABLE vault_transferable_skills DROP CONSTRAINT IF EXISTS vault_transferable_skills_quality_tier_check;
ALTER TABLE vault_transferable_skills ADD CONSTRAINT vault_transferable_skills_quality_tier_check 
  CHECK (quality_tier IN ('draft', 'needs_review', 'assumed', 'bronze', 'silver', 'gold', 'verified'));

ALTER TABLE vault_hidden_competencies DROP CONSTRAINT IF EXISTS vault_hidden_competencies_quality_tier_check;
ALTER TABLE vault_hidden_competencies ADD CONSTRAINT vault_hidden_competencies_quality_tier_check 
  CHECK (quality_tier IN ('draft', 'needs_review', 'assumed', 'bronze', 'silver', 'gold', 'verified'));

ALTER TABLE vault_soft_skills DROP CONSTRAINT IF EXISTS vault_soft_skills_quality_tier_check;
ALTER TABLE vault_soft_skills ADD CONSTRAINT vault_soft_skills_quality_tier_check 
  CHECK (quality_tier IN ('draft', 'needs_review', 'assumed', 'bronze', 'silver', 'gold', 'verified'));