-- Create vault_professional_resources table for Layer 2: Professional Development & Resources
CREATE TABLE vault_professional_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  
  -- Enterprise Systems
  enterprise_systems JSONB DEFAULT '[]'::jsonb,
  proficiency_levels JSONB DEFAULT '{}'::jsonb,
  
  -- Training Investments
  training_programs JSONB DEFAULT '[]'::jsonb,
  certifications_funded JSONB DEFAULT '[]'::jsonb,
  
  -- Industry Exposure
  conferences_attended JSONB DEFAULT '[]'::jsonb,
  trade_shows JSONB DEFAULT '[]'::jsonb,
  professional_memberships JSONB DEFAULT '[]'::jsonb,
  
  -- Consultant/External Resources
  consultant_experience JSONB DEFAULT '[]'::jsonb,
  external_coaches JSONB DEFAULT '[]'::jsonb,
  
  -- Quality Metadata
  quality_tier VARCHAR(20) DEFAULT 'assumed',
  ai_confidence DECIMAL(3,2) DEFAULT 0.5,
  user_verified BOOLEAN DEFAULT FALSE,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vault_professional_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own professional resources"
  ON vault_professional_resources
  FOR SELECT
  USING (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own professional resources"
  ON vault_professional_resources
  FOR INSERT
  WITH CHECK (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own professional resources"
  ON vault_professional_resources
  FOR UPDATE
  USING (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own professional resources"
  ON vault_professional_resources
  FOR DELETE
  USING (
    vault_id IN (
      SELECT id FROM career_vault WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_vault_professional_resources_vault_id ON vault_professional_resources(vault_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vault_professional_resources_updated_at
  BEFORE UPDATE ON vault_professional_resources
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();