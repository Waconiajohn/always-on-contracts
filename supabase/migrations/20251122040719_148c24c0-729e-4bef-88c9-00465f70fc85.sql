-- Sprint 2: Evidence Matrix Storage
CREATE TABLE IF NOT EXISTS public.evidence_matrix_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.application_queue(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  requirements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  selections_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_complete BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_matrix_user_id ON public.evidence_matrix_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_matrix_job_id ON public.evidence_matrix_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_evidence_matrix_completed ON public.evidence_matrix_sessions(is_complete);

-- Enable RLS
ALTER TABLE public.evidence_matrix_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own evidence matrix sessions"
  ON public.evidence_matrix_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evidence matrix sessions"
  ON public.evidence_matrix_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evidence matrix sessions"
  ON public.evidence_matrix_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evidence matrix sessions"
  ON public.evidence_matrix_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_evidence_matrix_sessions_updated_at
  BEFORE UPDATE ON public.evidence_matrix_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Sprint 4: Add evidence quality scoring to existing mappings table
ALTER TABLE public.resume_requirement_mappings 
ADD COLUMN IF NOT EXISTS evidence_quality_score TEXT CHECK (evidence_quality_score IN ('strong', 'good', 'weak')),
ADD COLUMN IF NOT EXISTS quality_feedback TEXT,
ADD COLUMN IF NOT EXISTS gap_suggestions TEXT[];