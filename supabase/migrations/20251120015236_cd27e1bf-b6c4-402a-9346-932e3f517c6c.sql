-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for storing verification results
CREATE TABLE IF NOT EXISTS public.resume_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.extraction_sessions(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pass', 'warning', 'fail')),
  results JSONB NOT NULL,
  discrepancies_found INTEGER DEFAULT 0,
  auto_remediation_attempted BOOLEAN DEFAULT false,
  remediation_status TEXT CHECK (remediation_status IN ('pending', 'in_progress', 'completed', 'failed')),
  remediation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_vault_id ON public.resume_verification_results(vault_id);
CREATE INDEX IF NOT EXISTS idx_verification_session_id ON public.resume_verification_results(session_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON public.resume_verification_results(verification_status);

-- Enable RLS
ALTER TABLE public.resume_verification_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own verification results"
  ON public.resume_verification_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification results"
  ON public.resume_verification_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification results"
  ON public.resume_verification_results
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_verification_results_updated_at
  BEFORE UPDATE ON public.resume_verification_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();