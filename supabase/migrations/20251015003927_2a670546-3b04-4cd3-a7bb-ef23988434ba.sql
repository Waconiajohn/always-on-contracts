-- Add unique constraint to external_url to allow upsert operations
ALTER TABLE public.job_opportunities 
ADD CONSTRAINT job_opportunities_external_url_key 
UNIQUE (external_url);

-- Add index for better query performance on external_url lookups
CREATE INDEX IF NOT EXISTS idx_job_opportunities_external_url 
ON public.job_opportunities(external_url);