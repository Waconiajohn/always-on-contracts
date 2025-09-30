-- Add fields to job_opportunities table for external job tracking
ALTER TABLE job_opportunities
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_source TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Create index for faster lookups by external source and ID
CREATE INDEX IF NOT EXISTS idx_job_opportunities_external 
ON job_opportunities(external_source, external_id) 
WHERE is_external = true;

-- Create index for sync status
CREATE INDEX IF NOT EXISTS idx_job_opportunities_last_synced 
ON job_opportunities(last_synced_at) 
WHERE is_external = true;