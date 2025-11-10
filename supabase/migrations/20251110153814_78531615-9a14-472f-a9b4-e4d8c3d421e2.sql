-- Create admin prompt management tables

-- Table for prompt overrides
CREATE TABLE IF NOT EXISTS public.admin_prompt_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL UNIQUE,
  original_prompt TEXT NOT NULL,
  override_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for prompt version history
CREATE TABLE IF NOT EXISTS public.prompt_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  prompt_content TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for prompt test results
CREATE TABLE IF NOT EXISTS public.prompt_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL,
  test_input JSONB NOT NULL,
  test_output TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  cost_usd DECIMAL(10, 6),
  success BOOLEAN,
  error_message TEXT,
  tested_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_prompt_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
CREATE POLICY "Admin users can view prompt overrides"
  ON public.admin_prompt_overrides FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can insert prompt overrides"
  ON public.admin_prompt_overrides FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can update prompt overrides"
  ON public.admin_prompt_overrides FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can delete prompt overrides"
  ON public.admin_prompt_overrides FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can view version history"
  ON public.prompt_version_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can insert version history"
  ON public.prompt_version_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can view test results"
  ON public.prompt_test_results FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can insert test results"
  ON public.prompt_test_results FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_prompt_overrides_prompt_id ON public.admin_prompt_overrides(prompt_id);
CREATE INDEX idx_prompt_overrides_active ON public.admin_prompt_overrides(is_active);
CREATE INDEX idx_version_history_prompt_id ON public.prompt_version_history(prompt_id);
CREATE INDEX idx_version_history_created_at ON public.prompt_version_history(created_at DESC);
CREATE INDEX idx_test_results_prompt_id ON public.prompt_test_results(prompt_id);
CREATE INDEX idx_test_results_created_at ON public.prompt_test_results(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_admin_prompt_overrides_updated_at
  BEFORE UPDATE ON public.admin_prompt_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();