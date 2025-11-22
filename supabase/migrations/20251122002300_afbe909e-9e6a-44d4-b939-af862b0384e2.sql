-- Create resume_requirement_mappings table for evidence-based resume building
CREATE TABLE IF NOT EXISTS resume_requirement_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_analysis_id UUID,
  resume_version_id UUID REFERENCES resume_versions(id) ON DELETE CASCADE,
  
  -- Requirement details
  requirement_text TEXT NOT NULL,
  requirement_category TEXT CHECK (requirement_category IN ('required', 'preferred', 'nice_to_have')),
  requirement_priority INTEGER DEFAULT 1,
  
  -- Original evidence from career vault
  milestone_id UUID REFERENCES vault_resume_milestones(id) ON DELETE SET NULL,
  original_bullet TEXT,
  original_job_title TEXT,
  original_company TEXT,
  original_date_range TEXT,
  
  -- Matching metadata
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons TEXT[],
  match_confidence DECIMAL(3,2) CHECK (match_confidence >= 0 AND match_confidence <= 1),
  
  -- Enhanced version
  enhanced_bullet TEXT,
  ats_keywords TEXT[],
  suggested_additions TEXT[],
  enhancement_reasoning TEXT,
  
  -- User decisions
  user_selection TEXT CHECK (user_selection IN ('original', 'enhanced', 'custom', 'none')),
  custom_edit TEXT,
  user_feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_req_mappings_user ON resume_requirement_mappings(user_id);
CREATE INDEX idx_req_mappings_resume ON resume_requirement_mappings(resume_version_id);
CREATE INDEX idx_req_mappings_milestone ON resume_requirement_mappings(milestone_id);
CREATE INDEX idx_req_mappings_match_score ON resume_requirement_mappings(match_score DESC);

-- RLS Policies
ALTER TABLE resume_requirement_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own requirement mappings"
  ON resume_requirement_mappings
  FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE TRIGGER update_resume_requirement_mappings_updated_at
  BEFORE UPDATE ON resume_requirement_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();