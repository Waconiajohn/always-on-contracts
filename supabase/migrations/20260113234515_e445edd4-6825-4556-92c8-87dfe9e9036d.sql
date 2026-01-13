-- Create master_resume table
CREATE TABLE public.master_resume (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  structured_data JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  word_count INTEGER DEFAULT 0,
  last_enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT master_resume_user_unique UNIQUE (user_id)
);

-- Create master_resume_history table for version tracking
CREATE TABLE public.master_resume_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_resume_id UUID NOT NULL REFERENCES public.master_resume(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  structured_data JSONB DEFAULT '{}',
  version INTEGER NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_resume ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_resume_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for master_resume
CREATE POLICY "Users can view their own master resume"
  ON public.master_resume FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own master resume"
  ON public.master_resume FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own master resume"
  ON public.master_resume FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own master resume"
  ON public.master_resume FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for master_resume_history
CREATE POLICY "Users can view their own master resume history"
  ON public.master_resume_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own master resume history"
  ON public.master_resume_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at and word_count
CREATE OR REPLACE FUNCTION public.update_master_resume_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.word_count = array_length(regexp_split_to_array(trim(NEW.content), '\s+'), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic metadata updates
CREATE TRIGGER update_master_resume_metadata
  BEFORE UPDATE ON public.master_resume
  FOR EACH ROW
  EXECUTE FUNCTION public.update_master_resume_metadata();

-- Function to save history on content change
CREATE OR REPLACE FUNCTION public.save_master_resume_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.master_resume_history (master_resume_id, user_id, content, structured_data, version)
    VALUES (OLD.id, OLD.user_id, OLD.content, OLD.structured_data, OLD.version);
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to save history before update
CREATE TRIGGER save_master_resume_history
  BEFORE UPDATE ON public.master_resume
  FOR EACH ROW
  EXECUTE FUNCTION public.save_master_resume_history();

-- Create indexes for performance
CREATE INDEX idx_master_resume_user_id ON public.master_resume(user_id);
CREATE INDEX idx_master_resume_history_master_resume_id ON public.master_resume_history(master_resume_id);
CREATE INDEX idx_master_resume_history_user_id ON public.master_resume_history(user_id);