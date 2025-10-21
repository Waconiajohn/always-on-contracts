-- =====================================================
-- COMPETENCY QUIZ SYSTEM
-- Comprehensive, role-based quiz for high-quality vault building
-- =====================================================

-- 1. COMPETENCY QUESTIONS BANK
-- Master library of all quiz questions across roles/industries
CREATE TABLE IF NOT EXISTS competency_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Question details
  competency_name TEXT NOT NULL, -- e.g., "P&L Management", "Team Leadership"
  category TEXT NOT NULL, -- e.g., "Business Acumen", "People Management"
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'yes_no',
    'scale', -- 1-5 rating
    'numeric', -- Enter a number
    'multiple_choice',
    'multi_select',
    'text_input'
  )),

  -- Targeting (who should see this question)
  applicable_roles TEXT[] NOT NULL DEFAULT '{}', -- ['engineering_director', 'vp_engineering', 'cto']
  applicable_industries TEXT[] DEFAULT '{}', -- ['saas', 'technology', 'healthcare', 'finance']
  experience_level_min INT DEFAULT 0, -- Minimum years of experience
  experience_level_max INT DEFAULT 50, -- Maximum years of experience

  -- Importance metrics
  required_percentage DECIMAL DEFAULT 0, -- What % of job postings require this (0-100)
  differentiator_weight DECIMAL DEFAULT 0.5, -- How much this sets candidates apart (0-1)
  ats_keywords TEXT[] DEFAULT '{}', -- Keywords to include in resume if answered positively

  -- Answer configuration
  answer_options JSONB, -- For multiple_choice/multi_select
  scoring_rubric JSONB, -- How to score different answers

  -- Follow-up configuration
  requires_example BOOLEAN DEFAULT false, -- Should we ask for a story/example?
  link_to_milestone BOOLEAN DEFAULT false, -- Should this link to specific job from resume?
  follow_up_question TEXT, -- Optional follow-up question
  follow_up_condition TEXT, -- When to show follow-up (e.g., "if_answered_yes")

  -- Metadata
  help_text TEXT, -- "Why we're asking this"
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competency_questions_roles ON competency_questions USING GIN(applicable_roles);
CREATE INDEX idx_competency_questions_industries ON competency_questions USING GIN(applicable_industries);
CREATE INDEX idx_competency_questions_category ON competency_questions(category);

-- 2. USER QUIZ RESPONSES
-- Stores user answers to quiz questions
CREATE TABLE IF NOT EXISTS user_quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES competency_questions(id) ON DELETE CASCADE,

  -- Answer data
  answer_value JSONB NOT NULL, -- Flexible storage for any answer type
  answer_text TEXT, -- For text inputs or examples
  linked_milestone_id UUID REFERENCES vault_resume_milestones(id), -- Which job this relates to

  -- Quality metrics
  confidence_score INT DEFAULT 100 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  quality_tier TEXT DEFAULT 'gold' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),

  -- Metadata
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, question_id) -- One answer per question per user
);

CREATE INDEX idx_quiz_responses_user ON user_quiz_responses(user_id);
CREATE INDEX idx_quiz_responses_vault ON user_quiz_responses(vault_id);
CREATE INDEX idx_quiz_responses_question ON user_quiz_responses(question_id);

-- 3. COMPETENCY PROFILE
-- Aggregated view of user's competencies from quiz
CREATE TABLE IF NOT EXISTS user_competency_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,

  -- Competency details
  competency_name TEXT NOT NULL,
  category TEXT NOT NULL,

  -- Proficiency
  has_experience BOOLEAN DEFAULT false,
  proficiency_level INT CHECK (proficiency_level >= 1 AND proficiency_level <= 5), -- 1=Beginner, 5=Expert
  scope TEXT, -- e.g., "$2.5M budget", "Team of 15", "3 product launches"
  frequency TEXT, -- e.g., "Currently using", "Used 2-5 years ago"
  recency TEXT, -- e.g., "Current role", "Last used 2023"

  -- Evidence
  evidence_type TEXT CHECK (evidence_type IN ('quiz_verified', 'resume_extracted', 'user_story', 'ai_inferred')),
  evidence_text TEXT,
  source_question_ids UUID[], -- Which quiz questions contributed to this
  source_milestone_ids UUID[], -- Which jobs this relates to

  -- Quality
  quality_tier TEXT NOT NULL CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
  verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('verified', 'needs_review', 'outdated')),

  -- Importance for role
  required_percentage DECIMAL DEFAULT 0, -- What % of target jobs require this
  differentiator_weight DECIMAL DEFAULT 0.5,

  -- Performance tracking
  times_used_in_resumes INT DEFAULT 0,
  times_user_kept INT DEFAULT 0, -- How often user didn't edit it out
  times_user_removed INT DEFAULT 0,
  effectiveness_score DECIMAL DEFAULT 0, -- Calculated: (kept / (kept + removed))

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  UNIQUE(user_id, competency_name)
);

CREATE INDEX idx_competency_profile_user ON user_competency_profile(user_id);
CREATE INDEX idx_competency_profile_vault ON user_competency_profile(vault_id);
CREATE INDEX idx_competency_profile_category ON user_competency_profile(category);
CREATE INDEX idx_competency_profile_quality ON user_competency_profile(quality_tier);

-- 4. QUIZ COMPLETION TRACKING
-- Track which quizzes user has completed
CREATE TABLE IF NOT EXISTS user_quiz_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,

  -- Quiz details
  role TEXT NOT NULL, -- 'engineering_director'
  industry TEXT, -- 'saas'
  experience_level INT,

  -- Progress
  total_questions INT NOT NULL,
  questions_answered INT DEFAULT 0,
  completion_percentage DECIMAL DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),

  -- Results
  coverage_score DECIMAL, -- % of expected competencies covered
  overall_strength_score DECIMAL, -- 0-100 based on proficiency levels

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, role, industry)
);

CREATE INDEX idx_quiz_completions_user ON user_quiz_completions(user_id);
CREATE INDEX idx_quiz_completions_status ON user_quiz_completions(status);

-- 5. BENCHMARKING DATA
-- Anonymous aggregated data for percentile calculations
CREATE TABLE IF NOT EXISTS competency_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope
  role TEXT NOT NULL,
  industry TEXT,
  experience_level_bucket TEXT, -- '0-3', '3-7', '7-12', '12+'

  -- Competency
  competency_name TEXT NOT NULL,
  category TEXT NOT NULL,

  -- Statistics (updated nightly via cron job)
  total_responses INT DEFAULT 0,
  avg_proficiency DECIMAL,
  median_proficiency DECIMAL,
  percentile_25 DECIMAL,
  percentile_50 DECIMAL,
  percentile_75 DECIMAL,
  percentile_90 DECIMAL,

  -- Metadata
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role, industry, experience_level_bucket, competency_name)
);

CREATE INDEX idx_benchmarks_role ON competency_benchmarks(role);
CREATE INDEX idx_benchmarks_competency ON competency_benchmarks(competency_name);

-- =====================================================
-- ADD QUALITY TIERS TO EXISTING VAULT TABLES
-- =====================================================

-- Add quality tier columns to all existing vault tables
ALTER TABLE vault_transferable_skills
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'bronze' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS freshness_score INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0;

ALTER TABLE vault_soft_skills
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'bronze' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS freshness_score INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0;

ALTER TABLE vault_confirmed_skills
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'silver' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS freshness_score INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0;

ALTER TABLE vault_power_phrases
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'silver' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS freshness_score INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_milestone_id UUID REFERENCES vault_resume_milestones(id);

ALTER TABLE vault_hidden_competencies
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'bronze' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS freshness_score INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0;

ALTER TABLE vault_leadership_philosophy
ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'bronze' CHECK (quality_tier IN ('gold', 'silver', 'bronze', 'assumed')),
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS freshness_score INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_kept INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL DEFAULT 0;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE competency_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_competency_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_benchmarks ENABLE ROW LEVEL SECURITY;

-- Competency questions: Public read (everyone can see questions)
CREATE POLICY "Questions are publicly readable"
  ON competency_questions FOR SELECT
  USING (true);

-- Quiz responses: Users can only see/modify their own
CREATE POLICY "Users can view own quiz responses"
  ON user_quiz_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz responses"
  ON user_quiz_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz responses"
  ON user_quiz_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- Competency profiles: Users can only see/modify their own
CREATE POLICY "Users can view own competency profile"
  ON user_competency_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competency profile"
  ON user_competency_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competency profile"
  ON user_competency_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- Quiz completions: Users can only see/modify their own
CREATE POLICY "Users can view own quiz completions"
  ON user_quiz_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz completions"
  ON user_quiz_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz completions"
  ON user_quiz_completions FOR UPDATE
  USING (auth.uid() = user_id);

-- Benchmarks: Public read (anonymous aggregated data)
CREATE POLICY "Benchmarks are publicly readable"
  ON competency_benchmarks FOR SELECT
  USING (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate freshness score based on date
CREATE OR REPLACE FUNCTION calculate_freshness_score(item_date TIMESTAMPTZ)
RETURNS INT AS $$
DECLARE
  years_since DECIMAL;
BEGIN
  years_since := EXTRACT(EPOCH FROM (NOW() - item_date)) / (365.25 * 24 * 60 * 60);

  IF years_since < 2 THEN RETURN 100; -- Recent
  ELSIF years_since < 5 THEN RETURN 80; -- Still relevant
  ELSIF years_since < 10 THEN RETURN 50; -- Getting stale
  ELSE RETURN 20; -- Probably outdated
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate effectiveness score
CREATE OR REPLACE FUNCTION calculate_effectiveness_score(kept INT, removed INT)
RETURNS DECIMAL AS $$
BEGIN
  IF (kept + removed) = 0 THEN RETURN 0;
  END IF;
  RETURN (kept::DECIMAL / (kept + removed)::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competency_questions_updated_at
  BEFORE UPDATE ON competency_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competency_profile_updated_at
  BEFORE UPDATE ON user_competency_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate effectiveness score on update
CREATE OR REPLACE FUNCTION auto_calculate_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.effectiveness_score = calculate_effectiveness_score(NEW.times_kept, NEW.times_removed);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_competency_effectiveness
  BEFORE INSERT OR UPDATE ON user_competency_profile
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_effectiveness();

-- =====================================================
-- INITIAL DATA COMMENT
-- =====================================================

COMMENT ON TABLE competency_questions IS 'Master question bank for role-based competency quizzes. Questions are targeted by role, industry, and experience level.';
COMMENT ON TABLE user_quiz_responses IS 'User answers to competency quiz questions. One answer per question per user.';
COMMENT ON TABLE user_competency_profile IS 'Aggregated competency profile built from quiz responses. This is what drives resume generation.';
COMMENT ON TABLE user_quiz_completions IS 'Tracks quiz progress and completion status per role/industry.';
COMMENT ON TABLE competency_benchmarks IS 'Anonymous aggregated data for percentile calculations and competitive positioning.';
