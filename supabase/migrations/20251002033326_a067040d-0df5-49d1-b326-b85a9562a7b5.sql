-- Enhanced job search and scraping system
CREATE TABLE IF NOT EXISTS public.job_search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

ALTER TABLE public.job_search_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own search sessions"
ON public.job_search_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enhanced job listings with better tracking
CREATE TABLE IF NOT EXISTS public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_session_id UUID REFERENCES public.job_search_sessions(id) ON DELETE SET NULL,
  external_id TEXT,
  source TEXT NOT NULL, -- 'linkedin', 'indeed', 'glassdoor', etc
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  location TEXT,
  remote_type TEXT, -- 'remote', 'hybrid', 'onsite'
  employment_type TEXT, -- 'full-time', 'contract', 'part-time'
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'USD',
  salary_period TEXT, -- 'hourly', 'annual'
  job_description TEXT,
  requirements TEXT[],
  benefits TEXT[],
  posted_date TIMESTAMPTZ,
  apply_url TEXT,
  company_url TEXT,
  raw_data JSONB,
  is_active BOOLEAN DEFAULT true,
  match_score NUMERIC,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(external_id, source)
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active job listings"
ON public.job_listings
FOR SELECT
TO authenticated
USING (is_active = true);

-- User saved jobs and applications
CREATE TABLE IF NOT EXISTS public.user_saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved', -- 'saved', 'applied', 'interviewing', 'rejected', 'accepted'
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT now(),
  applied_at TIMESTAMPTZ,
  UNIQUE(user_id, job_listing_id)
);

ALTER TABLE public.user_saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved jobs"
ON public.user_saved_jobs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Job alerts and notifications
CREATE TABLE IF NOT EXISTS public.job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_name TEXT NOT NULL,
  search_criteria JSONB NOT NULL,
  frequency TEXT DEFAULT 'daily', -- 'realtime', 'daily', 'weekly'
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job alerts"
ON public.job_alerts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_listings_source ON public.job_listings(source);
CREATE INDEX IF NOT EXISTS idx_job_listings_posted_date ON public.job_listings(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_location ON public.job_listings(location);
CREATE INDEX IF NOT EXISTS idx_job_listings_match_score ON public.job_listings(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_saved_jobs_status ON public.user_saved_jobs(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON public.job_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_job_alerts_updated_at
  BEFORE UPDATE ON public.job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();