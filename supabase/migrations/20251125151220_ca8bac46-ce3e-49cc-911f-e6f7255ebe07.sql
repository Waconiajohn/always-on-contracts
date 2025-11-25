-- Create table for storing career transition research results
CREATE TABLE IF NOT EXISTS vault_transition_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_industry_outlook JSONB,
  transition_opportunities JSONB,
  hidden_advantages TEXT[],
  research_sources TEXT[],
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  perplexity_query_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE vault_transition_research ENABLE ROW LEVEL SECURITY;

-- Users can view their own transition research
CREATE POLICY "Users can view their own transition research"
  ON vault_transition_research
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transition research
CREATE POLICY "Users can insert their own transition research"
  ON vault_transition_research
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own transition research
CREATE POLICY "Users can update their own transition research"
  ON vault_transition_research
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own transition research
CREATE POLICY "Users can delete their own transition research"
  ON vault_transition_research
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_vault_transition_research_user_id ON vault_transition_research(user_id);
CREATE INDEX idx_vault_transition_research_vault_id ON vault_transition_research(vault_id);

-- Add trigger for updated_at
CREATE TRIGGER update_vault_transition_research_updated_at
  BEFORE UPDATE ON vault_transition_research
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();