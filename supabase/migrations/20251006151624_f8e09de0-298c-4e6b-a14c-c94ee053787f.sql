-- Create interview_communications table
CREATE TABLE interview_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_project_id uuid REFERENCES job_projects(id) ON DELETE CASCADE NOT NULL,
  communication_type text NOT NULL CHECK (communication_type IN ('thank_you', 'follow_up', 'check_in', 'acceptance', 'decline')),
  sent_at timestamp with time zone,
  scheduled_for timestamp with time zone,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  subject_line text,
  body_content text NOT NULL,
  recipient_email text,
  recipient_name text,
  template_id uuid REFERENCES communication_templates(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE interview_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own interview communications"
  ON interview_communications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add interview tracking fields to job_projects
ALTER TABLE job_projects 
  ADD COLUMN interview_date timestamp with time zone,
  ADD COLUMN interviewer_name text,
  ADD COLUMN interviewer_email text,
  ADD COLUMN interview_stage text CHECK (interview_stage IN ('screening', 'technical', 'behavioral', 'final', 'offer_discussion')),
  ADD COLUMN follow_up_sent boolean DEFAULT false,
  ADD COLUMN next_follow_up_date timestamp with time zone;

-- Add trigger for updated_at on interview_communications
CREATE TRIGGER update_interview_communications_updated_at
  BEFORE UPDATE ON interview_communications
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();