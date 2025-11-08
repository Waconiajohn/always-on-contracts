-- Add missing columns to vault_career_context (CRITICAL FIX)
-- These columns are written by code but were missing from table schema

ALTER TABLE vault_career_context
ADD COLUMN IF NOT EXISTS budget_amount numeric,
ADD COLUMN IF NOT EXISTS identified_gaps jsonb DEFAULT '[]'::jsonb;

-- Add comments
COMMENT ON COLUMN vault_career_context.budget_amount IS 'Budget responsibility amount in USD (e.g., 350000000 for $350M)';
COMMENT ON COLUMN vault_career_context.identified_gaps IS 'Array of identified gaps from completion benchmark analysis (synced from vault_gap_analysis)';