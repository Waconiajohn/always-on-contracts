-- Phase 1: Database Schema Extension for Career Coaching AI Integration

-- Extend profiles table with Candidate fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_title TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS target_salary TEXT,
ADD COLUMN IF NOT EXISTS preferred_location TEXT,
ADD COLUMN IF NOT EXISTS base_resume TEXT,
ADD COLUMN IF NOT EXISTS career_goals TEXT,
ADD COLUMN IF NOT EXISTS industry_preferences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS role_preferences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS work_style_preferences JSONB DEFAULT '[]'::jsonb;

-- Create star_stories table for STAR method achievements
CREATE TABLE IF NOT EXISTS public.star_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- STAR Method Components
  title TEXT NOT NULL,
  situation TEXT NOT NULL,
  task TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  
  -- Metadata
  skills JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  industry TEXT,
  timeframe TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agent_sessions table for coaching sessions
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_run_id UUID REFERENCES public.application_queue(id) ON DELETE CASCADE,
  
  -- Session Configuration
  coach_personality TEXT NOT NULL, -- 'robert', 'sophia', 'nexus'
  intensity_level TEXT NOT NULL, -- 'basic', 'moderate', 'super_intensive'
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Context Management
  context_digest TEXT,
  context_data TEXT,
  session_state JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Session Lifecycle
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'expired'
  current_phase TEXT DEFAULT 'discovery', -- 'discovery', 'analysis', 'optimization'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_accessed TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

-- Create artifacts table for resume versions, cover letters, etc.
CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_run_id UUID REFERENCES public.application_queue(id) ON DELETE CASCADE,
  
  -- Artifact Classification
  kind TEXT NOT NULL, -- 'rewrittenResume', 'gapAnalysis', 'coverLetter', 'interviewPrep'
  version INTEGER DEFAULT 1,
  
  -- Content
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Quality Metrics
  quality_score FLOAT,
  ats_score FLOAT,
  competitiveness_score FLOAT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.star_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for star_stories
CREATE POLICY "Users can view their own STAR stories"
ON public.star_stories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own STAR stories"
ON public.star_stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own STAR stories"
ON public.star_stories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own STAR stories"
ON public.star_stories FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for agent_sessions
CREATE POLICY "Users can view their own coaching sessions"
ON public.agent_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coaching sessions"
ON public.agent_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coaching sessions"
ON public.agent_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coaching sessions"
ON public.agent_sessions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for artifacts
CREATE POLICY "Users can view their own artifacts"
ON public.artifacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artifacts"
ON public.artifacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts"
ON public.artifacts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artifacts"
ON public.artifacts FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_star_stories_updated_at
BEFORE UPDATE ON public.star_stories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_agent_sessions_updated_at
BEFORE UPDATE ON public.agent_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_artifacts_updated_at
BEFORE UPDATE ON public.artifacts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_star_stories_user_id ON public.star_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON public.agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON public.agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON public.artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_kind ON public.artifacts(kind);