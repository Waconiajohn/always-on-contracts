-- Sprint 1 Fix #1: Add quality tracking columns to 5 vault intelligence tables

-- Add quality tracking columns to vault_executive_presence
ALTER TABLE vault_executive_presence
  ADD COLUMN quality_tier text DEFAULT 'assumed',
  ADD COLUMN needs_user_review boolean DEFAULT true,
  ADD COLUMN ai_confidence numeric DEFAULT 0.50,
  ADD COLUMN last_updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN inferred_from text;

-- Add quality tracking columns to vault_personality_traits
ALTER TABLE vault_personality_traits
  ADD COLUMN quality_tier text DEFAULT 'assumed',
  ADD COLUMN needs_user_review boolean DEFAULT true,
  ADD COLUMN ai_confidence numeric DEFAULT 0.50,
  ADD COLUMN last_updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN inferred_from text;

-- Add quality tracking columns to vault_work_style
ALTER TABLE vault_work_style
  ADD COLUMN quality_tier text DEFAULT 'assumed',
  ADD COLUMN needs_user_review boolean DEFAULT true,
  ADD COLUMN ai_confidence numeric DEFAULT 0.50,
  ADD COLUMN last_updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN inferred_from text;

-- Add quality tracking columns to vault_values_motivations
ALTER TABLE vault_values_motivations
  ADD COLUMN quality_tier text DEFAULT 'assumed',
  ADD COLUMN needs_user_review boolean DEFAULT true,
  ADD COLUMN ai_confidence numeric DEFAULT 0.50,
  ADD COLUMN last_updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN inferred_from text;

-- Add quality tracking columns to vault_behavioral_indicators
ALTER TABLE vault_behavioral_indicators
  ADD COLUMN quality_tier text DEFAULT 'assumed',
  ADD COLUMN needs_user_review boolean DEFAULT true,
  ADD COLUMN ai_confidence numeric DEFAULT 0.50,
  ADD COLUMN last_updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN inferred_from text;

-- Add indexes for performance
CREATE INDEX idx_vault_executive_presence_quality ON vault_executive_presence(quality_tier);
CREATE INDEX idx_vault_personality_traits_quality ON vault_personality_traits(quality_tier);
CREATE INDEX idx_vault_work_style_quality ON vault_work_style(quality_tier);
CREATE INDEX idx_vault_values_motivations_quality ON vault_values_motivations(quality_tier);
CREATE INDEX idx_vault_behavioral_indicators_quality ON vault_behavioral_indicators(quality_tier);