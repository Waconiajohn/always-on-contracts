-- Phase 3: Add 7 New Intelligence Categories for Intangibles

-- 1. Soft Skills & Emotional Intelligence
CREATE TABLE IF NOT EXISTS public.war_chest_soft_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  examples TEXT NOT NULL,
  impact TEXT,
  proficiency_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.war_chest_soft_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own soft skills"
  ON public.war_chest_soft_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own soft skills"
  ON public.war_chest_soft_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Leadership Philosophy & Style
CREATE TABLE IF NOT EXISTS public.war_chest_leadership_philosophy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  philosophy_statement TEXT NOT NULL,
  leadership_style TEXT,
  core_principles TEXT[],
  real_world_application TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.war_chest_leadership_philosophy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leadership philosophy"
  ON public.war_chest_leadership_philosophy FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leadership philosophy"
  ON public.war_chest_leadership_philosophy FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Executive Presence & Personal Brand
CREATE TABLE IF NOT EXISTS public.war_chest_executive_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presence_indicator TEXT NOT NULL,
  situational_example TEXT NOT NULL,
  perceived_impact TEXT,
  brand_alignment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.war_chest_executive_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executive presence"
  ON public.war_chest_executive_presence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executive presence"
  ON public.war_chest_executive_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Personality Traits & Behavioral Patterns
CREATE TABLE IF NOT EXISTS public.war_chest_personality_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  behavioral_evidence TEXT NOT NULL,
  work_context TEXT,
  strength_or_growth TEXT CHECK (strength_or_growth IN ('strength', 'growth_area')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.war_chest_personality_traits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personality traits"
  ON public.war_chest_personality_traits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality traits"
  ON public.war_chest_personality_traits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Work Style & Preferences
CREATE TABLE IF NOT EXISTS public.war_chest_work_style (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_area TEXT NOT NULL,
  preference_description TEXT NOT NULL,
  examples TEXT,
  ideal_environment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.war_chest_work_style ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work style"
  ON public.war_chest_work_style FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work style"
  ON public.war_chest_work_style FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Values & Motivations
CREATE TABLE IF NOT EXISTS public.war_chest_values_motivations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_name TEXT NOT NULL,
  importance_level TEXT CHECK (importance_level IN ('core', 'important', 'nice_to_have')),
  manifestation TEXT NOT NULL,
  career_decisions_influenced TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.war_chest_values_motivations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own values"
  ON public.war_chest_values_motivations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own values"
  ON public.war_chest_values_motivations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Behavioral Indicators & Decision-Making
CREATE TABLE IF NOT EXISTS public.war_chest_behavioral_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_chest_id UUID NOT NULL REFERENCES public.career_war_chest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  indicator_type TEXT NOT NULL,
  specific_behavior TEXT NOT NULL,
  context TEXT,
  outcome_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.war_chest_behavioral_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own behavioral indicators"
  ON public.war_chest_behavioral_indicators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavioral indicators"
  ON public.war_chest_behavioral_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add new count columns to career_war_chest
ALTER TABLE public.career_war_chest
  ADD COLUMN IF NOT EXISTS total_soft_skills INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_leadership_philosophy INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_executive_presence INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_personality_traits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_work_style INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_values INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_behavioral_indicators INTEGER DEFAULT 0;

-- Phase 2: Add enhancement queue tracking
ALTER TABLE public.war_chest_interview_responses
  ADD COLUMN IF NOT EXISTS needs_enhancement BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enhancement_priority TEXT CHECK (enhancement_priority IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS completeness_score INTEGER,
  ADD COLUMN IF NOT EXISTS specificity_score INTEGER,
  ADD COLUMN IF NOT EXISTS intelligence_value INTEGER;