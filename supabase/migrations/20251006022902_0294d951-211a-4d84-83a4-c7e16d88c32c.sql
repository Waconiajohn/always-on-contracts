-- Add new columns to war_chest_interview_responses for quality tracking and enhancement
ALTER TABLE public.war_chest_interview_responses 
  ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS validation_feedback JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add indexes for quality score lookups
CREATE INDEX IF NOT EXISTS idx_war_chest_responses_quality 
  ON public.war_chest_interview_responses(war_chest_id, quality_score);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_war_chest_interview_responses_updated_at ON public.war_chest_interview_responses;
CREATE TRIGGER update_war_chest_interview_responses_updated_at
  BEFORE UPDATE ON public.war_chest_interview_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();