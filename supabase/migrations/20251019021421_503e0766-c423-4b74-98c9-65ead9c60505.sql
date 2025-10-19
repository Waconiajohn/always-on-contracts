-- Add columns to track auto-populated vaults
ALTER TABLE career_vault 
ADD COLUMN IF NOT EXISTS auto_populated boolean DEFAULT false;

ALTER TABLE career_vault 
ADD COLUMN IF NOT EXISTS auto_population_confidence text DEFAULT 'medium';