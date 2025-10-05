-- Create user_feature_progress table for milestone tracking
CREATE TABLE IF NOT EXISTS public.user_feature_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  milestone_percentage INTEGER DEFAULT 0 CHECK (milestone_percentage >= 0 AND milestone_percentage <= 100),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.user_feature_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feature progress"
  ON public.user_feature_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature progress"
  ON public.user_feature_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature progress"
  ON public.user_feature_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_feature_progress_updated_at
  BEFORE UPDATE ON public.user_feature_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add application_success_modal_shown tracking to application_tracking table
ALTER TABLE public.application_tracking 
ADD COLUMN IF NOT EXISTS success_modal_shown BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_feature_progress_user_id ON public.user_feature_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_progress_feature_name ON public.user_feature_progress(feature_name);