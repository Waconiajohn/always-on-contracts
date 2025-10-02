-- Add job context fields to job_projects table
ALTER TABLE job_projects
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS job_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_job_url TEXT,
ADD COLUMN IF NOT EXISTS job_listing_id UUID REFERENCES job_listings(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_projects_job_listing_id ON job_projects(job_listing_id);
CREATE INDEX IF NOT EXISTS idx_job_projects_user_id ON job_projects(user_id);