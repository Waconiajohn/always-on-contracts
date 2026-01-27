-- Drop the existing status check constraint
ALTER TABLE public.rb_projects DROP CONSTRAINT IF EXISTS rb_projects_status_check;

-- Add new constraint with all workflow statuses
ALTER TABLE public.rb_projects ADD CONSTRAINT rb_projects_status_check 
CHECK (status IN ('upload', 'jd', 'target', 'processing', 'report', 'fix', 'studio', 'review', 'export', 'complete'));