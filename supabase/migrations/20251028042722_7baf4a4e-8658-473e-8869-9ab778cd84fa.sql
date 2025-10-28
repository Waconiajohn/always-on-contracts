-- Phase 3: Add extraction metadata to career_vault
ALTER TABLE career_vault 
ADD COLUMN IF NOT EXISTS extraction_run_id TEXT,
ADD COLUMN IF NOT EXISTS extraction_item_count INTEGER,
ADD COLUMN IF NOT EXISTS extraction_timestamp TIMESTAMPTZ DEFAULT now();

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_career_vault_extraction_run 
ON career_vault(extraction_run_id);