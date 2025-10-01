-- Add quality and verification fields to job_opportunities table
ALTER TABLE public.job_opportunities
ADD COLUMN IF NOT EXISTS contract_confidence_score integer CHECK (contract_confidence_score >= 0 AND contract_confidence_score <= 100),
ADD COLUMN IF NOT EXISTS extracted_rate_min numeric,
ADD COLUMN IF NOT EXISTS extracted_rate_max numeric,
ADD COLUMN IF NOT EXISTS extracted_duration_months integer,
ADD COLUMN IF NOT EXISTS quality_score_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS user_feedback jsonb DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_opportunities_contract_confidence ON public.job_opportunities(contract_confidence_score);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_quality_score ON public.job_opportunities(quality_score);

-- Create user search profiles table
CREATE TABLE IF NOT EXISTS public.user_search_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_name text NOT NULL,
  is_active boolean DEFAULT true,
  
  -- Search criteria
  target_positions text[] DEFAULT ARRAY[]::text[],
  target_industries text[] DEFAULT ARRAY[]::text[],
  required_skills text[] DEFAULT ARRAY[]::text[],
  preferred_skills text[] DEFAULT ARRAY[]::text[],
  excluded_keywords text[] DEFAULT ARRAY[]::text[],
  excluded_companies text[] DEFAULT ARRAY[]::text[],
  
  -- Rate preferences
  min_hourly_rate numeric,
  max_hourly_rate numeric,
  
  -- Duration preferences
  min_contract_months integer,
  max_contract_months integer,
  
  -- Location preferences
  remote_only boolean DEFAULT false,
  hybrid_acceptable boolean DEFAULT true,
  onsite_acceptable boolean DEFAULT true,
  location_radius_miles integer,
  preferred_locations text[] DEFAULT ARRAY[]::text[],
  
  -- Company preferences
  company_size_preferences text[] DEFAULT ARRAY[]::text[], -- ['startup', 'midsize', 'enterprise']
  
  -- Skill weighting (JSON with skill: weight pairs)
  skill_weights jsonb DEFAULT '{}'::jsonb,
  
  -- Matching preferences
  minimum_match_score integer DEFAULT 70,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_search_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own search profiles"
ON public.user_search_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_search_profiles_updated_at
BEFORE UPDATE ON public.user_search_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create job feedback table for user reports
CREATE TABLE IF NOT EXISTS public.job_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.job_opportunities(id) ON DELETE CASCADE NOT NULL,
  
  feedback_type text NOT NULL CHECK (feedback_type IN ('incorrect_contract', 'incorrect_rate', 'incorrect_duration', 'spam', 'expired', 'other')),
  feedback_text text,
  suggested_correction jsonb,
  
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, opportunity_id, feedback_type)
);

ALTER TABLE public.job_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback"
ON public.job_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.job_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create application tracking table for Apify integration
CREATE TABLE IF NOT EXISTS public.application_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.job_opportunities(id) ON DELETE CASCADE NOT NULL,
  
  application_method text CHECK (application_method IN ('manual', 'apify_upwork', 'apify_linkedin', 'apify_indeed', 'direct')),
  apify_run_id text,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'viewed', 'responded', 'rejected', 'interview', 'offer', 'failed')),
  
  submitted_at timestamp with time zone,
  response_received_at timestamp with time zone,
  
  customized_resume_url text,
  cover_letter_text text,
  
  response_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, opportunity_id)
);

ALTER TABLE public.application_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own applications"
ON public.application_tracking
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_application_tracking_updated_at
BEFORE UPDATE ON public.application_tracking
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();