-- Career Vault Intelligence-First Redesign: Database Schema

-- 1. Store industry research results from Perplexity
CREATE TABLE IF NOT EXISTS career_vault_industry_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL CHECK (research_type IN ('industry_standards', 'gap_analysis', 'competitive_intel', 'role_expectations')),
  target_role TEXT NOT NULL,
  target_industry TEXT NOT NULL,
  research_results JSONB NOT NULL DEFAULT '{}',
  perplexity_citations TEXT[] DEFAULT '{}',
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Store intelligent question responses
CREATE TABLE IF NOT EXISTS career_vault_intelligent_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('quantify_achievement', 'gap_probe', 'hidden_achievement', 'soft_skills', 'competitive_advantage', 'open_probe')),
  question_category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  user_response JSONB NOT NULL DEFAULT '{}',
  created_items TEXT[] DEFAULT '{}',
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance career_vault table with new intelligence fields
ALTER TABLE career_vault 
  ADD COLUMN IF NOT EXISTS industry_research_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intelligent_qa_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gap_analysis JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS benchmark_comparison JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_industries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS career_direction TEXT CHECK (career_direction IN ('stay', 'pivot', 'explore')),
  ADD COLUMN IF NOT EXISTS vault_strength_before_qa INTEGER,
  ADD COLUMN IF NOT EXISTS vault_strength_after_qa INTEGER;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_industry_research_vault_id ON career_vault_industry_research(vault_id);
CREATE INDEX IF NOT EXISTS idx_industry_research_type ON career_vault_industry_research(research_type);
CREATE INDEX IF NOT EXISTS idx_intelligent_responses_vault_id ON career_vault_intelligent_responses(vault_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_responses_type ON career_vault_intelligent_responses(question_type);

-- 5. Enable RLS
ALTER TABLE career_vault_industry_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_vault_intelligent_responses ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for career_vault_industry_research
CREATE POLICY "Users can view their own industry research"
  ON career_vault_industry_research FOR SELECT
  USING (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own industry research"
  ON career_vault_industry_research FOR INSERT
  WITH CHECK (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own industry research"
  ON career_vault_industry_research FOR UPDATE
  USING (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

-- 7. RLS Policies for career_vault_intelligent_responses
CREATE POLICY "Users can view their own intelligent responses"
  ON career_vault_intelligent_responses FOR SELECT
  USING (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own intelligent responses"
  ON career_vault_intelligent_responses FOR INSERT
  WITH CHECK (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own intelligent responses"
  ON career_vault_intelligent_responses FOR UPDATE
  USING (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_career_vault_industry_research_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_career_vault_industry_research_updated_at_trigger ON career_vault_industry_research;
CREATE TRIGGER update_career_vault_industry_research_updated_at_trigger
  BEFORE UPDATE ON career_vault_industry_research
  FOR EACH ROW
  EXECUTE FUNCTION update_career_vault_industry_research_updated_at();