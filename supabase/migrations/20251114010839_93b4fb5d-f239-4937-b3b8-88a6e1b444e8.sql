-- Fix Phase 1 & 4: Progress tracking with proper unique constraint

-- First check and drop existing table if needed
DROP TABLE IF EXISTS public.extraction_progress CASCADE;

-- Extraction progress table for real-time streaming (with unique vault_id)
CREATE TABLE public.extraction_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL UNIQUE REFERENCES public.career_vault(id) ON DELETE CASCADE,
  phase VARCHAR(100) NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  message TEXT NOT NULL,
  items_extracted INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_extraction_progress_vault_id ON public.extraction_progress(vault_id);
CREATE INDEX idx_extraction_progress_updated_at ON public.extraction_progress(updated_at DESC);

-- Enable realtime for progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.extraction_progress;

-- RLS Policies for extraction_progress
ALTER TABLE public.extraction_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extraction progress"
  ON public.extraction_progress
  FOR SELECT
  USING (
    vault_id IN (
      SELECT id FROM public.career_vault WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert extraction progress"
  ON public.extraction_progress
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update extraction progress"
  ON public.extraction_progress
  FOR UPDATE
  USING (true);

-- Trigger to update extraction_progress updated_at
CREATE OR REPLACE FUNCTION update_extraction_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_extraction_progress_timestamp
  BEFORE UPDATE ON public.extraction_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_progress_updated_at();