-- Add automation settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS match_threshold_auto_apply integer DEFAULT 90,
ADD COLUMN IF NOT EXISTS match_threshold_queue integer DEFAULT 70,
ADD COLUMN IF NOT EXISTS max_daily_applications integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS automation_mode text DEFAULT 'queue',
ADD COLUMN IF NOT EXISTS key_achievements text[],
ADD COLUMN IF NOT EXISTS core_skills text[];

-- Add check constraint for automation mode
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_automation_mode 
CHECK (automation_mode IN ('auto', 'queue', 'notify'));

-- Create table for application queue
CREATE TABLE IF NOT EXISTS public.application_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.job_opportunities(id) ON DELETE CASCADE,
  match_score numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  customized_resume_url text,
  customized_resume_content jsonb,
  ai_customization_notes text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  applied_at timestamp with time zone,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'applied', 'failed'))
);

-- Enable RLS on application_queue
ALTER TABLE public.application_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for application_queue
CREATE POLICY "Users can view their own queue"
  ON public.application_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own queue"
  ON public.application_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue"
  ON public.application_queue
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own queue"
  ON public.application_queue
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_application_queue_user_status 
  ON public.application_queue(user_id, status);

CREATE INDEX IF NOT EXISTS idx_application_queue_created 
  ON public.application_queue(created_at DESC);