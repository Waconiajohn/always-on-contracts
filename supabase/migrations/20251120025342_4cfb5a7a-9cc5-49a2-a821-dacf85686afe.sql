-- Add missing columns to vault_resume_milestones for extraction compatibility
ALTER TABLE public.vault_resume_milestones 
ADD COLUMN IF NOT EXISTS milestone_title TEXT,
ADD COLUMN IF NOT EXISTS context TEXT,
ADD COLUMN IF NOT EXISTS metric_type TEXT,
ADD COLUMN IF NOT EXISTS metric_value TEXT,
ADD COLUMN IF NOT EXISTS quality_tier VARCHAR(20) DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS extraction_source TEXT;