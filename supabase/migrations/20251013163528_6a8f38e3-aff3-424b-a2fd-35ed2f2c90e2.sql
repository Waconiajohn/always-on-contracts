-- Step 1: Clean duplicate and NULL milestones for all users
DELETE FROM vault_resume_milestones 
WHERE company_name IS NULL 
   OR job_title IS NULL 
   OR start_date IS NULL 
   OR end_date IS NULL;

-- Step 2: Delete exact duplicates (keep one copy of each unique milestone)
DELETE FROM vault_resume_milestones a
USING vault_resume_milestones b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.company_name = b.company_name
  AND a.job_title = b.job_title
  AND a.start_date = b.start_date
  AND a.end_date = b.end_date;

-- Step 3: Add career focus fields to career_vault table
ALTER TABLE career_vault 
ADD COLUMN IF NOT EXISTS vault_name TEXT DEFAULT 'Primary Vault',
ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS focus_set_at TIMESTAMP WITH TIME ZONE;

-- Step 4: Add index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_vault_milestones_user_job 
ON vault_resume_milestones(user_id, company_name, job_title, start_date);