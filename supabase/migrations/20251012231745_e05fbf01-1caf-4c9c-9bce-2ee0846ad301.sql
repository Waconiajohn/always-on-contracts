-- Migration: Enhance Existing Tables for Full Workflow
-- Add columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_profile_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS salary_expectations_min NUMERIC,
ADD COLUMN IF NOT EXISTS salary_expectations_max NUMERIC,
ADD COLUMN IF NOT EXISTS resume_template_preference UUID REFERENCES public.resume_templates(id) ON DELETE SET NULL;

-- Add columns to job_projects table
ALTER TABLE public.job_projects
ADD COLUMN IF NOT EXISTS resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS networking_campaign_id UUID REFERENCES public.outreach_tracking(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS salary_negotiation_id UUID REFERENCES public.salary_negotiations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS offer_amount NUMERIC,
ADD COLUMN IF NOT EXISTS offer_equity NUMERIC,
ADD COLUMN IF NOT EXISTS offer_bonus NUMERIC,
ADD COLUMN IF NOT EXISTS offer_received_date TIMESTAMPTZ;

-- Add columns to application_queue table
ALTER TABLE public.application_queue
ADD COLUMN IF NOT EXISTS networking_initiated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS networking_contacts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interview_prep_session_id UUID REFERENCES public.interview_prep_sessions(id) ON DELETE SET NULL;

-- Add columns to linkedin_posts table
ALTER TABLE public.linkedin_posts
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS posted_to_groups TEXT[],
ADD COLUMN IF NOT EXISTS engagement_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS vault_sources UUID[];

-- Create indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_profiles_resume_template ON public.profiles(resume_template_preference);
CREATE INDEX IF NOT EXISTS idx_job_projects_resume_version ON public.job_projects(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_job_projects_salary_negotiation ON public.job_projects(salary_negotiation_id);
CREATE INDEX IF NOT EXISTS idx_application_queue_interview_prep ON public.application_queue(interview_prep_session_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_scheduled ON public.linkedin_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;