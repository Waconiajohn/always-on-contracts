-- ============================================
-- Week 1: Career Intelligence Builder Foundation
-- (Using IF NOT EXISTS for safety)
-- ============================================

-- New Table: Market research for benchmarking
CREATE TABLE IF NOT EXISTS vault_market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  target_industry TEXT,
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  sample_jobs JSONB,
  common_requirements JSONB,
  skill_frequency JSONB,
  salary_range JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New Table: Track gap-filling progress
CREATE TABLE IF NOT EXISTS vault_gap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  gap_id TEXT NOT NULL,
  gap_type TEXT CHECK (gap_type IN ('critical', 'important', 'nice_to_have')),
  gap_description TEXT NOT NULL,
  questions_generated JSONB,
  questions_answered INTEGER DEFAULT 0,
  questions_total INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New Table: Many-to-many skills to positions
CREATE TABLE IF NOT EXISTS vault_skill_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES vault_transferable_skills(id) ON DELETE CASCADE,
  position_id UUID REFERENCES vault_work_positions(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_used NUMERIC(4,1),
  last_used_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, position_id)
);

-- New Table: AI coaching history
CREATE TABLE IF NOT EXISTS vault_ai_coaching_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID,
  position_id UUID REFERENCES vault_work_positions(id),
  coaching_type TEXT CHECK (coaching_type IN ('improve', 'quantify', 'expand')),
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  user_action TEXT CHECK (user_action IN ('accepted', 'rejected', 'modified', 'pending')),
  final_text TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vault_market_research_vault_id ON vault_market_research(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_gap_progress_vault_id ON vault_gap_progress(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_gap_progress_status ON vault_gap_progress(status);
CREATE INDEX IF NOT EXISTS idx_vault_skill_positions_skill_id ON vault_skill_positions(skill_id);
CREATE INDEX IF NOT EXISTS idx_vault_skill_positions_position_id ON vault_skill_positions(position_id);
CREATE INDEX IF NOT EXISTS idx_vault_ai_coaching_vault_id ON vault_ai_coaching_history(vault_id);

-- Add columns to existing vault tables (all nullable for safety)
ALTER TABLE vault_power_phrases 
  ADD COLUMN IF NOT EXISTS work_position_id UUID REFERENCES vault_work_positions(id),
  ADD COLUMN IF NOT EXISTS adapted_from_id UUID REFERENCES vault_power_phrases(id),
  ADD COLUMN IF NOT EXISTS adaptation_notes TEXT;

ALTER TABLE vault_transferable_skills 
  ADD COLUMN IF NOT EXISTS work_position_id UUID REFERENCES vault_work_positions(id);

ALTER TABLE vault_hidden_competencies 
  ADD COLUMN IF NOT EXISTS work_position_id UUID REFERENCES vault_work_positions(id);

ALTER TABLE vault_soft_skills
  ADD COLUMN IF NOT EXISTS work_position_id UUID REFERENCES vault_work_positions(id);

ALTER TABLE vault_leadership_philosophy
  ADD COLUMN IF NOT EXISTS work_position_id UUID REFERENCES vault_work_positions(id);

ALTER TABLE vault_executive_presence
  ADD COLUMN IF NOT EXISTS work_position_id UUID REFERENCES vault_work_positions(id);

-- Track intelligence builder progress
ALTER TABLE career_vault 
  ADD COLUMN IF NOT EXISTS intelligence_builder_phase INTEGER DEFAULT 1 CHECK (intelligence_builder_phase BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS intelligence_builder_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS intelligence_builder_started_at TIMESTAMPTZ;

-- Indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_position ON vault_power_phrases(work_position_id);
CREATE INDEX IF NOT EXISTS idx_vault_transferable_skills_position ON vault_transferable_skills(work_position_id);
CREATE INDEX IF NOT EXISTS idx_vault_hidden_competencies_position ON vault_hidden_competencies(work_position_id);
CREATE INDEX IF NOT EXISTS idx_vault_soft_skills_position ON vault_soft_skills(work_position_id);
CREATE INDEX IF NOT EXISTS idx_vault_leadership_philosophy_position ON vault_leadership_philosophy(work_position_id);
CREATE INDEX IF NOT EXISTS idx_vault_executive_presence_position ON vault_executive_presence(work_position_id);

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_vault_table_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vault_market_research_updated_at ON vault_market_research;
CREATE TRIGGER vault_market_research_updated_at
  BEFORE UPDATE ON vault_market_research
  FOR EACH ROW EXECUTE FUNCTION update_vault_table_updated_at();

DROP TRIGGER IF EXISTS vault_gap_progress_updated_at ON vault_gap_progress;
CREATE TRIGGER vault_gap_progress_updated_at
  BEFORE UPDATE ON vault_gap_progress
  FOR EACH ROW EXECUTE FUNCTION update_vault_table_updated_at();