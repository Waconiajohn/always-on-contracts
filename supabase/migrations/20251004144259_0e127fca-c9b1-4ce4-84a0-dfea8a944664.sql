-- Create research_findings table for AI research agent
CREATE TABLE IF NOT EXISTS public.research_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT NOT NULL,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('strategy', 'technique', 'tool', 'trend', 'warning')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT,
  credibility_score INTEGER CHECK (credibility_score >= 1 AND credibility_score <= 10),
  relevance_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  published_date TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_verified BOOLEAN DEFAULT false
);

-- Create experiments table for A/B testing features
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_name TEXT NOT NULL,
  description TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  feature_flag TEXT NOT NULL UNIQUE,
  control_variant TEXT NOT NULL,
  test_variant TEXT NOT NULL,
  success_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'promoted')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  minimum_sample_size INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  results_summary JSONB DEFAULT '{}'::jsonb
);

-- Create user_experiments table for tracking user participation
CREATE TABLE IF NOT EXISTS public.user_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  opted_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opted_out_at TIMESTAMP WITH TIME ZONE,
  feedback_text TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  outcome_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, experiment_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_research_findings_type ON public.research_findings(finding_type);
CREATE INDEX IF NOT EXISTS idx_research_findings_discovered ON public.research_findings(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_findings_tags ON public.research_findings USING GIN(relevance_tags);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_feature_flag ON public.experiments(feature_flag);
CREATE INDEX IF NOT EXISTS idx_user_experiments_user ON public.user_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiments_experiment ON public.user_experiments(experiment_id);

-- Enable RLS
ALTER TABLE public.research_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for research_findings (read-only for authenticated users)
CREATE POLICY "Authenticated users can view verified research findings"
  ON public.research_findings
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_verified = true);

-- RLS Policies for experiments (read-only for authenticated users)
CREATE POLICY "Authenticated users can view active experiments"
  ON public.experiments
  FOR SELECT
  USING (auth.role() = 'authenticated' AND status IN ('active', 'completed'));

-- RLS Policies for user_experiments
CREATE POLICY "Users can view their own experiment participation"
  ON public.user_experiments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can opt into experiments"
  ON public.user_experiments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiment data"
  ON public.user_experiments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updating experiments updated_at
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();