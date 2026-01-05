-- Create module_access table for 5-module architecture
CREATE TABLE public.module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module TEXT NOT NULL CHECK (module IN (
    'quick_score', 
    'resume_jobs_studio', 
    'career_vault', 
    'linkedin_pro', 
    'interview_mastery'
  )),
  access_type TEXT NOT NULL CHECK (access_type IN ('free', 'trial', 'paid', 'bundled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Enable RLS
ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own module access
CREATE POLICY "Users can view own module access"
  ON public.module_access FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own module access (for free tier auto-grant)
CREATE POLICY "Users can insert own module access"
  ON public.module_access FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all (for subscription sync)
CREATE POLICY "Service role can manage all module access"
  ON public.module_access FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_module_access_updated_at
  BEFORE UPDATE ON public.module_access
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for fast lookups
CREATE INDEX idx_module_access_user_id ON public.module_access(user_id);
CREATE INDEX idx_module_access_module ON public.module_access(module);