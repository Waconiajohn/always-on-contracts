-- Create resume_requirement_mappings table
CREATE TABLE IF NOT EXISTS resume_requirement_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID, -- Optional link to a job listing
  requirement_id TEXT NOT NULL, -- ID from the analysis
  requirement_text TEXT NOT NULL,
  requirement_category TEXT CHECK (requirement_category IN ('required', 'preferred', 'nice_to_have')),

  -- Evidence from career vault
  milestone_id UUID REFERENCES vault_resume_milestones(id),
  original_bullet TEXT,
  original_source JSONB, -- { jobTitle, company, dateRange }

  -- Match quality
  match_score DECIMAL(5,2), -- 0-100
  match_reasons TEXT[],
  match_confidence DECIMAL(5,2),

  -- Enhanced version
  enhanced_bullet TEXT,
  ats_keywords TEXT[],
  enhancement_reasoning TEXT,

  -- User customization
  user_selection TEXT DEFAULT 'enhanced' CHECK (user_selection IN ('original', 'enhanced', 'custom')),
  custom_bullet TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resume_requirement_mappings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own mappings"
  ON resume_requirement_mappings
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_resume_req_mappings_user ON resume_requirement_mappings(user_id);
CREATE INDEX idx_resume_req_mappings_job ON resume_requirement_mappings(job_id);
