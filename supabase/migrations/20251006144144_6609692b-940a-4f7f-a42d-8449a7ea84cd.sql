-- Create war_chest_verifications table
CREATE TABLE IF NOT EXISTS war_chest_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  original_content JSONB NOT NULL,
  verification_result TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create war_chest_research table
CREATE TABLE IF NOT EXISTS war_chest_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL,
  query_params JSONB NOT NULL,
  research_result TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  related_questions JSONB DEFAULT '[]'::jsonb,
  researched_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_war_chest_verifications_user_type 
  ON war_chest_verifications(user_id, verification_type);
  
CREATE INDEX IF NOT EXISTS idx_war_chest_verifications_verified_at 
  ON war_chest_verifications(verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_war_chest_research_user_type 
  ON war_chest_research(user_id, research_type);
  
CREATE INDEX IF NOT EXISTS idx_war_chest_research_researched_at 
  ON war_chest_research(researched_at DESC);

-- Enable RLS
ALTER TABLE war_chest_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_chest_research ENABLE ROW LEVEL SECURITY;

-- RLS Policies for war_chest_verifications
CREATE POLICY "Users can view their own verifications"
  ON war_chest_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications"
  ON war_chest_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for war_chest_research
CREATE POLICY "Users can view their own research"
  ON war_chest_research
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research"
  ON war_chest_research
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);