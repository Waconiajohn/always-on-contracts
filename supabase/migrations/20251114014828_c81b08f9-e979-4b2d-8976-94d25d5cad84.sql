-- Create extraction_errors table
CREATE TABLE IF NOT EXISTS extraction_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  vault_id UUID,
  user_id UUID,
  phase VARCHAR(100),
  error_code VARCHAR(100),
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_extraction_errors_session_id ON extraction_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_extraction_errors_vault_id ON extraction_errors(vault_id);
CREATE INDEX IF NOT EXISTS idx_extraction_errors_user_id ON extraction_errors(user_id);

-- Enable RLS
ALTER TABLE extraction_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for extraction_errors
DROP POLICY IF EXISTS "Users can view their own extraction errors" ON extraction_errors;
DROP POLICY IF EXISTS "Service role can insert extraction errors" ON extraction_errors;

CREATE POLICY "Users can view their own extraction errors"
  ON extraction_errors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert extraction errors"
  ON extraction_errors FOR INSERT
  WITH CHECK (true);

-- Add vault_id and user_id columns to extraction_checkpoints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extraction_checkpoints' 
    AND column_name = 'vault_id'
  ) THEN
    ALTER TABLE extraction_checkpoints ADD COLUMN vault_id UUID;
    CREATE INDEX idx_extraction_checkpoints_vault_id ON extraction_checkpoints(vault_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'extraction_checkpoints' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE extraction_checkpoints ADD COLUMN user_id UUID;
    CREATE INDEX idx_extraction_checkpoints_user_id ON extraction_checkpoints(user_id);
  END IF;
END $$;

-- Fix vault_benchmark_comparison constraint
ALTER TABLE vault_benchmark_comparison 
ALTER COLUMN seniority_level DROP NOT NULL;

ALTER TABLE vault_benchmark_comparison 
ALTER COLUMN seniority_level SET DEFAULT 'Mid-Level IC';