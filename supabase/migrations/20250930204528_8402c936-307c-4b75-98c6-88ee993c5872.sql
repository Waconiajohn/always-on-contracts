-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  current_employment_status TEXT CHECK (current_employment_status IN ('unemployed', 'employed', 'contract')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'active_search', 'autopilot', 'concierge')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  parsed_content JSONB,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resume_analysis table
CREATE TABLE public.resume_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  years_experience INTEGER,
  key_achievements TEXT[],
  industry_expertise TEXT[],
  management_capabilities TEXT[],
  skills TEXT[],
  target_hourly_rate_min DECIMAL(10,2),
  target_hourly_rate_max DECIMAL(10,2),
  recommended_positions TEXT[],
  analysis_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create strategies table
CREATE TABLE public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.resume_analysis(id) ON DELETE CASCADE,
  target_positions TEXT[],
  target_industries TEXT[],
  geographic_markets TEXT[],
  timeline_weeks INTEGER,
  positioning_strategy TEXT,
  value_proposition TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staffing_agencies table
CREATE TABLE public.staffing_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL,
  specialization TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create outreach_tracking table
CREATE TABLE public.outreach_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.staffing_agencies(id) ON DELETE SET NULL,
  outreach_type TEXT CHECK (outreach_type IN ('email', 'linkedin', 'phone', 'application')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'interested', 'rejected')),
  last_contact_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rate_history table
CREATE TABLE public.rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_title TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  hourly_rate DECIMAL(10,2),
  contract_length_months INTEGER,
  recorded_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffing_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for resumes
CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for resume_analysis
CREATE POLICY "Users can view their own analysis"
  ON public.resume_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis"
  ON public.resume_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for strategies
CREATE POLICY "Users can view their own strategies"
  ON public.strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategies"
  ON public.strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for staffing_agencies (public read)
CREATE POLICY "Anyone can view staffing agencies"
  ON public.staffing_agencies FOR SELECT
  USING (true);

-- RLS Policies for outreach_tracking
CREATE POLICY "Users can view their own outreach"
  ON public.outreach_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own outreach"
  ON public.outreach_tracking FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for rate_history (public read)
CREATE POLICY "Anyone can view rate history"
  ON public.rate_history FOR SELECT
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to profiles
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample staffing agencies
INSERT INTO public.staffing_agencies (agency_name, specialization, contact_email, website, location) VALUES
('Robert Half', ARRAY['Finance', 'Accounting', 'Operations'], 'contact@roberthalf.com', 'https://www.roberthalf.com', 'National'),
('Kforce', ARRAY['Technology', 'Finance', 'Professional Services'], 'info@kforce.com', 'https://www.kforce.com', 'National'),
('Beacon Hill', ARRAY['Interim Executive', 'Leadership', 'Operations'], 'contact@beaconhillstaffing.com', 'https://www.beaconhillstaffing.com', 'National'),
('Heidrick & Struggles', ARRAY['Executive Search', 'Interim Leadership'], 'info@heidrick.com', 'https://www.heidrick.com', 'Global'),
('Russell Reynolds', ARRAY['Executive Search', 'Board Services'], 'contact@russellreynolds.com', 'https://www.russellreynolds.com', 'Global');