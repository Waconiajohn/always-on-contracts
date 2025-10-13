-- Create linkedin_series table for managing blog series
CREATE TABLE IF NOT EXISTS public.linkedin_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_topic TEXT NOT NULL,
  series_title TEXT NOT NULL,
  series_length INTEGER NOT NULL CHECK (series_length IN (8, 12, 16)),
  target_audience TEXT,
  user_role TEXT,
  industry TEXT,
  experience_years INTEGER,
  outline_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add series-related columns to linkedin_posts
ALTER TABLE public.linkedin_posts
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.linkedin_series(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS part_number INTEGER,
ADD COLUMN IF NOT EXISTS total_parts INTEGER,
ADD COLUMN IF NOT EXISTS focus_statement TEXT;

-- Enable RLS on linkedin_series
ALTER TABLE public.linkedin_series ENABLE ROW LEVEL SECURITY;

-- RLS policies for linkedin_series
CREATE POLICY "Users can view their own series"
ON public.linkedin_series FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own series"
ON public.linkedin_series FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own series"
ON public.linkedin_series FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series"
ON public.linkedin_series FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_linkedin_series_updated_at
BEFORE UPDATE ON public.linkedin_series
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();