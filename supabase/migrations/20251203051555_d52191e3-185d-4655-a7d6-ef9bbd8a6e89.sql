-- Create resume_builder_drafts table for persisting section content
CREATE TABLE public.resume_builder_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_description_hash TEXT NOT NULL,
  section_content JSONB NOT NULL DEFAULT '{}',
  selected_template_id TEXT,
  builder_state JSONB,
  current_step TEXT DEFAULT 'gap-assessment',
  score_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_description_hash)
);

-- Enable RLS
ALTER TABLE public.resume_builder_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own drafts" ON public.resume_builder_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts" ON public.resume_builder_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" ON public.resume_builder_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" ON public.resume_builder_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_resume_builder_drafts_updated_at
  BEFORE UPDATE ON public.resume_builder_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();