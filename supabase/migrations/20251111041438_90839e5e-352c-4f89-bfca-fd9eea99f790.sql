-- Create vault_benchmark_comparison table to store industry benchmark analysis
CREATE TABLE IF NOT EXISTS public.vault_benchmark_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Benchmark data
  job_title TEXT NOT NULL,
  industry TEXT NOT NULL,
  seniority_level TEXT NOT NULL,
  benchmark_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Comparison results
  confirmed_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  likely_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  gaps_requiring_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  comparison_confidence NUMERIC(3,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT vault_benchmark_comparison_vault_id_key UNIQUE(vault_id)
);

-- Enable RLS
ALTER TABLE public.vault_benchmark_comparison ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own benchmark comparisons"
  ON public.vault_benchmark_comparison
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own benchmark comparisons"
  ON public.vault_benchmark_comparison
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own benchmark comparisons"
  ON public.vault_benchmark_comparison
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_vault_benchmark_comparison_vault_id ON public.vault_benchmark_comparison(vault_id);
CREATE INDEX idx_vault_benchmark_comparison_user_id ON public.vault_benchmark_comparison(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_vault_benchmark_comparison_updated_at
  BEFORE UPDATE ON public.vault_benchmark_comparison
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();