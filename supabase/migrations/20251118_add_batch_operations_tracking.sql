-- Add batch operations tracking table for real-time progress updates
CREATE TABLE IF NOT EXISTS batch_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID,
  operation_type TEXT NOT NULL, -- 'enhance', 'keyword_suggest', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_items INTEGER NOT NULL,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_batch_operations_user_id ON batch_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status);
CREATE INDEX IF NOT EXISTS idx_batch_operations_created_at ON batch_operations(created_at DESC);

-- Enable RLS
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own batch operations
CREATE POLICY "Users can view own batch operations"
  ON batch_operations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own batch operations
CREATE POLICY "Users can create own batch operations"
  ON batch_operations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own batch operations
CREATE POLICY "Users can update own batch operations"
  ON batch_operations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role has full access to batch operations"
  ON batch_operations
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add function to update timestamp automatically
CREATE OR REPLACE FUNCTION update_batch_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS trigger_update_batch_operations_updated_at ON batch_operations;
CREATE TRIGGER trigger_update_batch_operations_updated_at
  BEFORE UPDATE ON batch_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_operations_updated_at();
