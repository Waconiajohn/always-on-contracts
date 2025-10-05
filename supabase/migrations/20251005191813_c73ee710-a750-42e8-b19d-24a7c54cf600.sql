-- Create linkedin_posts table for blog content
CREATE TABLE public.linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  hashtags TEXT[],
  post_type TEXT,
  tone TEXT,
  engagement_score INTEGER,
  analysis_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own posts"
ON public.linkedin_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts"
ON public.linkedin_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.linkedin_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.linkedin_posts FOR DELETE
USING (auth.uid() = user_id);

-- Create linkedin_profiles table
CREATE TABLE public.linkedin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  headline TEXT,
  about TEXT,
  featured_skills TEXT[],
  optimized_content JSONB DEFAULT '{}'::jsonb,
  optimization_score INTEGER,
  last_optimized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
ON public.linkedin_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.linkedin_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.linkedin_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.linkedin_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Create career_trends table
CREATE TABLE public.career_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_title TEXT NOT NULL,
  trend_category TEXT NOT NULL,
  description TEXT NOT NULL,
  source_url TEXT,
  relevance_score INTEGER,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_verified BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.career_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies - public read access
CREATE POLICY "Anyone can view verified trends"
ON public.career_trends FOR SELECT
USING (is_verified = true);

-- Create networking_contacts table
CREATE TABLE public.networking_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  contact_company TEXT,
  contact_linkedin TEXT,
  contact_email TEXT,
  relationship_strength TEXT,
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.networking_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own contacts"
ON public.networking_contacts FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_linkedin_posts_updated_at
BEFORE UPDATE ON public.linkedin_posts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_linkedin_profiles_updated_at
BEFORE UPDATE ON public.linkedin_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_networking_contacts_updated_at
BEFORE UPDATE ON public.networking_contacts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();