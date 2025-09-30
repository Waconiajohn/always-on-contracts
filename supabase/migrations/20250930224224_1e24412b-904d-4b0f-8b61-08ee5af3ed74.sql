-- Add unique constraint for external job deduplication
ALTER TABLE job_opportunities 
ADD CONSTRAINT job_opportunities_external_unique 
UNIQUE (external_source, external_id);