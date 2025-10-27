-- Add fields from job_projects to application_queue
ALTER TABLE application_queue 
ADD COLUMN IF NOT EXISTS interview_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS offer_amount numeric,
ADD COLUMN IF NOT EXISTS offer_bonus numeric,
ADD COLUMN IF NOT EXISTS offer_equity text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS project_name text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_application_queue_user_status 
ON application_queue(user_id, application_status);

CREATE INDEX IF NOT EXISTS idx_application_queue_interview_date 
ON application_queue(interview_date) 
WHERE interview_date IS NOT NULL;