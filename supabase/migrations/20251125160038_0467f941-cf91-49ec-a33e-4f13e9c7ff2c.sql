-- Create resume_reviews table for storing hiring manager reviews and ATS analyses
CREATE TABLE IF NOT EXISTS public.resume_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('hiring_manager', 'ats_analysis')),
  review_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  citations TEXT[] DEFAULT ARRAY[]::TEXT[],
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_reviews_user_id ON public.resume_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_resume_id ON public.resume_reviews(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_type ON public.resume_reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_reviewed_at ON public.resume_reviews(reviewed_at DESC);

-- Enable RLS
ALTER TABLE public.resume_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own resume reviews"
  ON public.resume_reviews
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume reviews"
  ON public.resume_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume reviews"
  ON public.resume_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume reviews"
  ON public.resume_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_resume_reviews_updated_at
  BEFORE UPDATE ON public.resume_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add citations column to vault_verifications table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vault_verifications' 
    AND column_name = 'citations'
  ) THEN
    ALTER TABLE public.vault_verifications 
    ADD COLUMN citations TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;