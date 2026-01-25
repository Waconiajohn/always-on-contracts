-- ============================================================================
-- Resume Builder V4 - Industry Research Caching Table
-- ============================================================================

-- Create table for caching AI-generated industry research
CREATE TABLE public.rb_industry_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  seniority_level TEXT NOT NULL,
  industry TEXT NOT NULL,
  research_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  power_phrases JSONB DEFAULT '[]'::jsonb,
  typical_qualifications JSONB DEFAULT '[]'::jsonb,
  competitive_benchmarks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Create unique index for cache lookups
CREATE UNIQUE INDEX idx_rb_industry_research_lookup 
ON public.rb_industry_research (role_title, seniority_level, industry);

-- Enable RLS
ALTER TABLE public.rb_industry_research ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cached research (it's generic, not user-specific)
CREATE POLICY "Anyone can read industry research cache"
ON public.rb_industry_research
FOR SELECT
USING (true);

-- Policy: Service role can insert/update (edge functions only)
CREATE POLICY "Service role can manage industry research"
ON public.rb_industry_research
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.rb_industry_research IS 
'Caches AI-generated industry research for role/seniority/industry combinations. 
Used by rb-research-industry edge function for the two-stage generation system.';