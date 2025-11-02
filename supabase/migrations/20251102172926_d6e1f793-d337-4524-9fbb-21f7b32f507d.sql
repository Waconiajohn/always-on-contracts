-- Enable RLS on vault_fix_audit table
ALTER TABLE vault_fix_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit records for their own vaults
CREATE POLICY "Users can view their own vault fix audit records"
  ON vault_fix_audit
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Only system can insert audit records (no direct inserts from users)
-- This is intentionally restrictive - only migrations should insert