-- Phase 1: Enhance staffing_agencies table with contract-specific fields
ALTER TABLE public.staffing_agencies 
ADD COLUMN contract_focus_rating integer CHECK (contract_focus_rating >= 1 AND contract_focus_rating <= 5),
ADD COLUMN typical_contract_duration_min integer,
ADD COLUMN typical_contract_duration_max integer,
ADD COLUMN typical_rate_min numeric,
ADD COLUMN typical_rate_max numeric,
ADD COLUMN contract_permanent_split text;

COMMENT ON COLUMN public.staffing_agencies.contract_focus_rating IS 'Rating 1-5 of how focused this agency is on contract placements';
COMMENT ON COLUMN public.staffing_agencies.typical_contract_duration_min IS 'Minimum typical contract length in months';
COMMENT ON COLUMN public.staffing_agencies.typical_contract_duration_max IS 'Maximum typical contract length in months';
COMMENT ON COLUMN public.staffing_agencies.typical_rate_min IS 'Minimum typical hourly rate';
COMMENT ON COLUMN public.staffing_agencies.typical_rate_max IS 'Maximum typical hourly rate';
COMMENT ON COLUMN public.staffing_agencies.contract_permanent_split IS 'Percentage split like "70% contract, 30% permanent"';

-- Phase 3: Create job_opportunities table for tracking contract openings
CREATE TABLE public.job_opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid REFERENCES public.staffing_agencies(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  job_description text,
  required_skills text[],
  location text,
  contract_duration_months integer,
  hourly_rate_min numeric,
  hourly_rate_max numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'on_hold')),
  source text,
  external_url text,
  posted_date timestamp with time zone DEFAULT now(),
  expiry_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.job_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active job opportunities"
ON public.job_opportunities
FOR SELECT
USING (status = 'active');

-- Phase 4: Create agency_ratings table for user feedback
CREATE TABLE public.agency_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agency_id uuid NOT NULL REFERENCES public.staffing_agencies(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  contract_obtained boolean DEFAULT false,
  response_time_rating integer CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  professionalism_rating integer CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, agency_id)
);

ALTER TABLE public.agency_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all agency ratings"
ON public.agency_ratings
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own ratings"
ON public.agency_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.agency_ratings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.agency_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Phase 2: Enhance outreach_tracking with email campaign features
ALTER TABLE public.outreach_tracking
ADD COLUMN email_sent_count integer DEFAULT 0,
ADD COLUMN last_email_sent_date timestamp with time zone,
ADD COLUMN response_received boolean DEFAULT false,
ADD COLUMN response_date timestamp with time zone,
ADD COLUMN next_follow_up_date timestamp with time zone,
ADD COLUMN campaign_id uuid;

-- Create table for tracking matched opportunities
CREATE TABLE public.opportunity_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  opportunity_id uuid NOT NULL REFERENCES public.job_opportunities(id) ON DELETE CASCADE,
  match_score numeric CHECK (match_score >= 0 AND match_score <= 100),
  matching_skills text[],
  ai_recommendation text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'applied', 'rejected', 'not_interested')),
  applied_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

ALTER TABLE public.opportunity_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own opportunity matches"
ON public.opportunity_matches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own opportunity matches"
ON public.opportunity_matches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunity matches"
ON public.opportunity_matches
FOR UPDATE
USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_job_opportunities_updated_at
BEFORE UPDATE ON public.job_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_agency_ratings_updated_at
BEFORE UPDATE ON public.agency_ratings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();