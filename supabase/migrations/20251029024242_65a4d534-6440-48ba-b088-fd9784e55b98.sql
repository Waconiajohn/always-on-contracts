-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.career_vault_intelligent_responses CASCADE;
DROP TABLE IF EXISTS public.career_vault_industry_research CASCADE;

-- Create table for storing industry research results
CREATE TABLE public.career_vault_industry_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vault_id UUID,
  target_role TEXT NOT NULL,
  target_industry TEXT NOT NULL,
  research_content TEXT NOT NULL,
  research_provider TEXT NOT NULL DEFAULT 'perplexity',
  common_skills JSONB DEFAULT '[]'::jsonb,
  key_metrics JSONB DEFAULT '[]'::jsonb,
  leadership_traits JSONB DEFAULT '[]'::jsonb,
  industry_trends JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.career_vault_industry_research ENABLE ROW LEVEL SECURITY;

-- RLS Policies for industry research
CREATE POLICY "Users can insert their own industry research"
  ON public.career_vault_industry_research
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own industry research"
  ON public.career_vault_industry_research
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own industry research"
  ON public.career_vault_industry_research
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create table for storing intelligent question responses
CREATE TABLE public.career_vault_intelligent_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL,
  user_id UUID NOT NULL,
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  processed_items JSONB DEFAULT '{}'::jsonb,
  items_created INTEGER DEFAULT 0,
  batch_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.career_vault_intelligent_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligent responses
CREATE POLICY "Users can insert their own responses"
  ON public.career_vault_intelligent_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own responses"
  ON public.career_vault_intelligent_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON public.career_vault_intelligent_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_career_vault_industry_research_user_id 
  ON public.career_vault_industry_research(user_id);

CREATE INDEX idx_career_vault_industry_research_vault_id 
  ON public.career_vault_industry_research(vault_id);

CREATE INDEX idx_career_vault_intelligent_responses_user_id 
  ON public.career_vault_intelligent_responses(user_id);

CREATE INDEX idx_career_vault_intelligent_responses_vault_id 
  ON public.career_vault_intelligent_responses(vault_id);

-- Add triggers
CREATE TRIGGER update_industry_research_updated_at
  BEFORE UPDATE ON public.career_vault_industry_research
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_intelligent_responses_updated_at
  BEFORE UPDATE ON public.career_vault_intelligent_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();