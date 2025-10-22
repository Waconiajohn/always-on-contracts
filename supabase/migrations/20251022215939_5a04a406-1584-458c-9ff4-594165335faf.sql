-- Add quality tier and freshness tracking columns to all vault intelligence tables

-- Power Phrases
ALTER TABLE vault_power_phrases 
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'assumed' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS needs_user_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inferred_from TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.50 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT now();

-- Transferable Skills
ALTER TABLE vault_transferable_skills
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'assumed' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS needs_user_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inferred_from TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.50 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT now();

-- Hidden Competencies  
ALTER TABLE vault_hidden_competencies
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'assumed' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS needs_user_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inferred_from TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.50 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT now();

-- Soft Skills
ALTER TABLE vault_soft_skills
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'assumed' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS needs_user_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inferred_from TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.50 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT now();

-- Leadership Philosophy
ALTER TABLE vault_leadership_philosophy
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'assumed' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS needs_user_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inferred_from TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.50 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes for quality filtering
CREATE INDEX IF NOT EXISTS idx_power_phrases_quality ON vault_power_phrases(quality_tier, last_updated_at);
CREATE INDEX IF NOT EXISTS idx_transferable_skills_quality ON vault_transferable_skills(quality_tier, last_updated_at);
CREATE INDEX IF NOT EXISTS idx_hidden_competencies_quality ON vault_hidden_competencies(quality_tier, last_updated_at);
CREATE INDEX IF NOT EXISTS idx_soft_skills_quality ON vault_soft_skills(quality_tier, last_updated_at);
CREATE INDEX IF NOT EXISTS idx_leadership_philosophy_quality ON vault_leadership_philosophy(quality_tier, last_updated_at);

-- Create triggers to update last_updated_at
CREATE OR REPLACE FUNCTION update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_power_phrases_timestamp
  BEFORE UPDATE ON vault_power_phrases
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER update_transferable_skills_timestamp
  BEFORE UPDATE ON vault_transferable_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER update_hidden_competencies_timestamp
  BEFORE UPDATE ON vault_hidden_competencies
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER update_soft_skills_timestamp
  BEFORE UPDATE ON vault_soft_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_at();

CREATE TRIGGER update_leadership_philosophy_timestamp
  BEFORE UPDATE ON vault_leadership_philosophy
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_at();