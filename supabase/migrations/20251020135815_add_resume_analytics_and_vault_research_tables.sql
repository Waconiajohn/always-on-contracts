-- Create resume_generation_analytics table for tracking generation events
CREATE TABLE IF NOT EXISTS resume_generation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create vault_research table for caching Perplexity research results
CREATE TABLE IF NOT EXISTS vault_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  research_type text NOT NULL,
  query_params jsonb DEFAULT '{}'::jsonb,
  research_result text,
  citations jsonb DEFAULT '[]'::jsonb,
  related_questions jsonb DEFAULT '[]'::jsonb,
  researched_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resume_analytics_user_id ON resume_generation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analytics_event_type ON resume_generation_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_resume_analytics_created_at ON resume_generation_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vault_research_user_id ON vault_research(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_research_type ON vault_research(research_type);
CREATE INDEX IF NOT EXISTS idx_vault_research_researched_at ON vault_research(researched_at DESC);

-- Enable Row Level Security
ALTER TABLE resume_generation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_research ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resume_generation_analytics
CREATE POLICY "Users can insert their own analytics"
  ON resume_generation_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics"
  ON resume_generation_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for vault_research
CREATE POLICY "Users can insert their own research"
  ON vault_research
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own research"
  ON vault_research
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own research"
  ON vault_research
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE resume_generation_analytics IS 'Tracks resume generation events for analytics and monitoring';
COMMENT ON TABLE vault_research IS 'Caches Perplexity research results for job analysis and resume optimization';

COMMENT ON COLUMN resume_generation_analytics.event_type IS 'Type of event: generation_started, generation_completed, generation_failed, version_selected, etc.';
COMMENT ON COLUMN resume_generation_analytics.metadata IS 'JSON metadata including section_type, vault_items_used, generation_time_ms, error details, etc.';

COMMENT ON COLUMN vault_research.research_type IS 'Type of research: resume_job_analysis, industry_trends, salary_research, etc.';
COMMENT ON COLUMN vault_research.query_params IS 'JSON parameters used for the research query';
COMMENT ON COLUMN vault_research.research_result IS 'Full text result from Perplexity AI';
COMMENT ON COLUMN vault_research.citations IS 'Array of citation URLs from Perplexity';
COMMENT ON COLUMN vault_research.related_questions IS 'Array of related questions suggested by Perplexity';
