-- Phase 3A: Create vault_thought_leadership table
CREATE TABLE vault_thought_leadership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Content details
  content_type TEXT CHECK (content_type IN ('article', 'speaking', 'podcast', 'webinar', 'whitepaper', 'book')),
  title TEXT NOT NULL,
  platform TEXT, -- "LinkedIn", "Medium", "Conference X"
  url TEXT,
  date_published TIMESTAMPTZ,
  
  -- Engagement metrics
  views INTEGER,
  engagement_rate DECIMAL,
  
  -- Interview prep
  interview_talking_point TEXT,
  demonstrates_competency TEXT[], -- ["Communication", "Thought Leadership"]
  
  -- LinkedIn usage
  linkedin_reference_value TEXT, -- "Link to this in About section"
  repurpose_potential TEXT, -- "Turn into LinkedIn post series"
  
  quality_tier TEXT DEFAULT 'bronze',
  ai_confidence DECIMAL DEFAULT 0.70,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vault_thought_leadership ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own thought leadership"
  ON vault_thought_leadership FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thought leadership"
  ON vault_thought_leadership FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thought leadership"
  ON vault_thought_leadership FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thought leadership"
  ON vault_thought_leadership FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_vault_thought_leadership_vault_id ON vault_thought_leadership(vault_id);
CREATE INDEX idx_vault_thought_leadership_user_id ON vault_thought_leadership(user_id);
CREATE INDEX idx_vault_thought_leadership_content_type ON vault_thought_leadership(content_type);

COMMENT ON TABLE vault_thought_leadership IS 'Stores publications, speaking engagements, and other thought leadership content';
COMMENT ON COLUMN vault_thought_leadership.interview_talking_point IS 'How to mention this in interviews: "I spoke at TechCrunch about..."';
COMMENT ON COLUMN vault_thought_leadership.linkedin_reference_value IS 'Where/how to use this on LinkedIn profile';
COMMENT ON COLUMN vault_thought_leadership.repurpose_potential IS 'Ideas for turning this into other content';

-- Phase 3B: Create vault_professional_network table
CREATE TABLE vault_professional_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Network details
  network_type TEXT CHECK (network_type IN ('board_seat', 'advisory_role', 'professional_association', 'alumni_network', 'industry_group')),
  organization_name TEXT NOT NULL,
  role_title TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Credibility indicators
  selection_criteria TEXT, -- "Invited to board for expertise in X"
  impact TEXT, -- "Advised on $50M strategic initiative"
  
  -- Interview prep
  interview_leverage_point TEXT, -- "I sit on the board of X, which gives me insight into..."
  networking_intel TEXT, -- "Connected to 5 VPs at target company through this board"
  
  -- LinkedIn usage
  linkedin_profile_placement TEXT, -- "Feature prominently in Experience section"
  credibility_signal_strength TEXT CHECK (credibility_signal_strength IN ('low', 'medium', 'high', 'exceptional')),
  
  quality_tier TEXT DEFAULT 'gold', -- Network items are high value
  ai_confidence DECIMAL DEFAULT 0.80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vault_professional_network ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own professional network"
  ON vault_professional_network FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own professional network"
  ON vault_professional_network FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own professional network"
  ON vault_professional_network FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own professional network"
  ON vault_professional_network FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_vault_professional_network_vault_id ON vault_professional_network(vault_id);
CREATE INDEX idx_vault_professional_network_user_id ON vault_professional_network(user_id);
CREATE INDEX idx_vault_professional_network_type ON vault_professional_network(network_type);

COMMENT ON TABLE vault_professional_network IS 'Stores board seats, advisory roles, and professional network affiliations';
COMMENT ON COLUMN vault_professional_network.credibility_signal_strength IS 'How strongly this signals executive credibility';

-- Phase 3C: Create vault_competitive_advantages table
CREATE TABLE vault_competitive_advantages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Advantage details
  advantage_category TEXT CHECK (advantage_category IN ('unique_experience', 'rare_skill_combo', 'industry_insider_knowledge', 'executive_network', 'track_record', 'certification_rare')),
  advantage_statement TEXT NOT NULL,
  market_rarity TEXT, -- "Only 5% of candidates have X"
  
  -- Evidence
  proof_points TEXT[],
  quantified_impact TEXT,
  
  -- Interview prep
  interview_positioning TEXT, -- "Most candidates have Y, but I have X which..."
  objection_handler TEXT, -- "If asked about lack of Z, pivot to X"
  
  -- LinkedIn usage
  linkedin_hook_potential TEXT, -- "Turn into post: 'Why having X AND Y is a superpower'"
  differentiator_strength TEXT CHECK (differentiator_strength IN ('moderate', 'strong', 'exceptional')),
  
  quality_tier TEXT DEFAULT 'gold',
  ai_confidence DECIMAL DEFAULT 0.75,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vault_competitive_advantages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own competitive advantages"
  ON vault_competitive_advantages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitive advantages"
  ON vault_competitive_advantages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitive advantages"
  ON vault_competitive_advantages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitive advantages"
  ON vault_competitive_advantages FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_vault_competitive_advantages_vault_id ON vault_competitive_advantages(vault_id);
CREATE INDEX idx_vault_competitive_advantages_user_id ON vault_competitive_advantages(user_id);
CREATE INDEX idx_vault_competitive_advantages_category ON vault_competitive_advantages(advantage_category);

COMMENT ON TABLE vault_competitive_advantages IS 'Stores unique differentiators that set candidate apart from competition';
COMMENT ON COLUMN vault_competitive_advantages.differentiator_strength IS 'How strongly this differentiates from typical candidates';