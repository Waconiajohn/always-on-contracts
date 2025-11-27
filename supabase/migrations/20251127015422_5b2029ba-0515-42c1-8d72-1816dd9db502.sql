-- Make job_project_id nullable and add application_queue_id to interview_prep_sessions
-- This allows interview prep to work with either job_projects or application_queue

ALTER TABLE interview_prep_sessions 
ALTER COLUMN job_project_id DROP NOT NULL;

ALTER TABLE interview_prep_sessions 
ADD COLUMN IF NOT EXISTS application_queue_id UUID REFERENCES application_queue(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_application_queue_id 
ON interview_prep_sessions(application_queue_id);

COMMENT ON COLUMN interview_prep_sessions.application_queue_id IS 'Reference to application_queue for interview prep without formal job_projects';
COMMENT ON COLUMN interview_prep_sessions.job_project_id IS 'Optional reference to job_projects if user has structured project tracking';