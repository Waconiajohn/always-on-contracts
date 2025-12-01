-- Create table for storing Quick Score results
CREATE TABLE IF NOT EXISTS public.quick_score_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Overall score data
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Tier information
  tier_name TEXT NOT NULL,
  tier_emoji TEXT,
  tier_message TEXT,
  
  -- Breakdown scores
  jd_match_score INTEGER CHECK (jd_match_score >= 0 AND jd_match_score <= 100),
  jd_match_weight INTEGER,
  industry_benchmark_score INTEGER CHECK (industry_benchmark_score >= 0 AND industry_benchmark_score <= 100),
  industry_benchmark_weight INTEGER,
  ats_compliance_score INTEGER CHECK (ats_compliance_score >= 0 AND ats_compliance_score <= 100),
  ats_compliance_weight INTEGER,
  human_voice_score INTEGER CHECK (human_voice_score >= 0 AND human_voice_score <= 100),
  human_voice_weight INTEGER,
  
  -- Detailed breakdown data (JSON)
  breakdown_details JSONB,
  
  -- Target role information
  target_role TEXT,
  target_industry TEXT,
  
  -- Resume data used for scoring
  resume_text TEXT,
  resume_file_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_quick_score_results_user_id ON public.quick_score_results(user_id);
CREATE INDEX idx_quick_score_results_scored_at ON public.quick_score_results(scored_at DESC);

-- Enable RLS
ALTER TABLE public.quick_score_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scores"
  ON public.quick_score_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
  ON public.quick_score_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON public.quick_score_results
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create table for tracking resume building progress
CREATE TABLE IF NOT EXISTS public.resume_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Progress tracking
  has_active_resume BOOLEAN DEFAULT false,
  active_resume_id UUID,
  last_resume_created_at TIMESTAMPTZ,
  total_resumes_created INTEGER DEFAULT 0,
  
  -- Wizard completion tracking
  wizard_step_completed INTEGER DEFAULT 0,
  wizard_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.resume_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own resume progress"
  ON public.resume_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume progress"
  ON public.resume_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume progress"
  ON public.resume_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_quick_score_results_updated_at
  BEFORE UPDATE ON public.quick_score_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_progress_updated_at
  BEFORE UPDATE ON public.resume_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();