-- Migration: Resume & LinkedIn Tracking Tables
-- Create resume templates table with seed data
CREATE TABLE IF NOT EXISTS public.resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  html_structure TEXT,
  css_styles TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates"
ON public.resume_templates
FOR SELECT
USING (is_active = true);

-- Create resume versions table
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_project_id UUID REFERENCES public.job_projects(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.resume_templates(id) ON DELETE SET NULL,
  version_name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  html_content TEXT,
  customizations JSONB DEFAULT '{}'::jsonb,
  match_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own resume versions
CREATE POLICY "Users can manage their own resume versions"
ON public.resume_versions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create linkedin profile sections table
CREATE TABLE IF NOT EXISTS public.linkedin_profile_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  content TEXT NOT NULL,
  optimization_score INTEGER,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.linkedin_profile_sections ENABLE ROW LEVEL SECURITY;

-- Users can manage their own linkedin sections
CREATE POLICY "Users can manage their own linkedin sections"
ON public.linkedin_profile_sections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create interview prep sessions table
CREATE TABLE IF NOT EXISTS public.interview_prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_project_id UUID NOT NULL REFERENCES public.job_projects(id) ON DELETE CASCADE,
  interview_stage TEXT NOT NULL,
  interview_date TIMESTAMPTZ,
  prep_materials JSONB DEFAULT '{}'::jsonb,
  questions_prepared JSONB DEFAULT '[]'::jsonb,
  star_stories_used UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_prep_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own interview prep sessions
CREATE POLICY "Users can manage their own interview prep sessions"
ON public.interview_prep_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create salary market data cache table
CREATE TABLE IF NOT EXISTS public.salary_market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  location TEXT NOT NULL,
  industry TEXT,
  years_experience INTEGER,
  market_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_sources JSONB DEFAULT '[]'::jsonb,
  percentile_25 NUMERIC,
  percentile_50 NUMERIC,
  percentile_75 NUMERIC,
  percentile_90 NUMERIC,
  skill_premiums JSONB DEFAULT '{}'::jsonb,
  researched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Enable RLS
ALTER TABLE public.salary_market_data ENABLE ROW LEVEL SECURITY;

-- Anyone can view salary market data (cached public data)
CREATE POLICY "Anyone can view salary market data"
ON public.salary_market_data
FOR SELECT
USING (true);

-- Create salary negotiations table
CREATE TABLE IF NOT EXISTS public.salary_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_project_id UUID REFERENCES public.job_projects(id) ON DELETE SET NULL,
  offer_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  market_data_id UUID REFERENCES public.salary_market_data(id) ON DELETE SET NULL,
  competitive_score INTEGER,
  competitive_analysis JSONB DEFAULT '{}'::jsonb,
  negotiation_script TEXT,
  report_url TEXT,
  outcome TEXT,
  final_offer_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salary_negotiations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own salary negotiations
CREATE POLICY "Users can manage their own salary negotiations"
ON public.salary_negotiations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON public.resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_job_project_id ON public.resume_versions(job_project_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_sections_user_id ON public.linkedin_profile_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_user_id ON public.interview_prep_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_job_project_id ON public.interview_prep_sessions(job_project_id);
CREATE INDEX IF NOT EXISTS idx_salary_market_location ON public.salary_market_data(location);
CREATE INDEX IF NOT EXISTS idx_salary_market_title ON public.salary_market_data(job_title);
CREATE INDEX IF NOT EXISTS idx_salary_negotiations_user_id ON public.salary_negotiations(user_id);

-- Add updated_at triggers
CREATE TRIGGER update_resume_versions_updated_at
  BEFORE UPDATE ON public.resume_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_interview_prep_updated_at
  BEFORE UPDATE ON public.interview_prep_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_salary_negotiations_updated_at
  BEFORE UPDATE ON public.salary_negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert seed data for resume templates
INSERT INTO public.resume_templates (template_name, template_type, description, features) VALUES
(
  'Modern Professional',
  'modern',
  'Clean, minimalist design optimized for ATS systems',
  '["Single-column layout for perfect ATS scanning", "Bold section headers", "Bullet-point achievements", "Skills matrix", "Optional profile summary"]'::jsonb
),
(
  'Executive Classic',
  'executive',
  'Traditional format for senior leadership roles',
  '["Two-column hybrid layout", "Executive summary section", "Board affiliations area", "Strategic achievements focus", "Publications and speaking"]'::jsonb
),
(
  'Technical Hybrid',
  'technical',
  'Specialized for technical and engineering roles',
  '["Technical skills sidebar", "Project portfolio section", "Certifications highlight", "Technical achievements", "GitHub/portfolio links"]'::jsonb
);