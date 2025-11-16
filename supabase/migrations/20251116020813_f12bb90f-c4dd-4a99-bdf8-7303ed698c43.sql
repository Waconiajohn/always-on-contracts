-- Create table to track onboarding emails sent to users
CREATE TABLE IF NOT EXISTS public.user_onboarding_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX idx_user_onboarding_emails_user_id ON public.user_onboarding_emails(user_id);
CREATE INDEX idx_user_onboarding_emails_template_id ON public.user_onboarding_emails(template_id);

-- Enable RLS
ALTER TABLE public.user_onboarding_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own email history
CREATE POLICY "Users can view their own onboarding email history"
  ON public.user_onboarding_emails
  FOR SELECT
  USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE public.user_onboarding_emails IS 'Tracks which onboarding emails have been sent to users';