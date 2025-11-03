-- Migration: Create proper admin infrastructure
-- Purpose: Replace generic email pattern with role-based admin system

-- 1. Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only superadmins can manage admin users
CREATE POLICY "Superadmins can manage admins"
  ON admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
      AND is_active = true
    )
  );

-- Anyone can view active admins
CREATE POLICY "Anyone can view active admins"
  ON admin_users FOR SELECT
  USING (is_active = true);

-- 2. Create audit log for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Service role can insert audit logs
CREATE POLICY "Service can insert audit logs"
  ON admin_audit_log FOR INSERT
  WITH CHECK (true);

-- 3. Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id
    AND role = 'superadmin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update ai_usage_metrics RLS policy to use new admin function
DROP POLICY IF EXISTS "Admins can view all metrics" ON ai_usage_metrics;
CREATE POLICY "Admins can view all metrics"
  ON ai_usage_metrics FOR SELECT
  USING (is_admin());

-- 7. Setup cron job for monthly quota resets
-- This requires pg_cron extension (enabled by default in Supabase)
SELECT cron.schedule(
  'reset-monthly-quotas',
  '0 0 1 * *',  -- Run at midnight UTC on the 1st of each month
  $$SELECT reset_monthly_quotas()$$
);

-- 8. Setup cron job for daily quota resets
SELECT cron.schedule(
  'reset-daily-quotas',
  '0 0 * * *',  -- Run at midnight UTC every day
  $$
  UPDATE user_quotas
  SET
    daily_request_count = 0,
    daily_cost_spent_usd = 0,
    updated_at = NOW()
  WHERE daily_request_count > 0;
  $$
);

-- 9. Setup cron job for cache cleanup (remove expired entries)
SELECT cron.schedule(
  'cleanup-expired-cache',
  '0 */6 * * *',  -- Run every 6 hours
  $$
  DELETE FROM resume_cache
  WHERE expires_at < NOW();
  $$
);

COMMENT ON TABLE admin_users IS 'Role-based admin system with audit trail';
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit log for all admin actions';
COMMENT ON FUNCTION is_admin IS 'Check if user has admin privileges';
COMMENT ON FUNCTION is_superadmin IS 'Check if user has superadmin privileges';
COMMENT ON FUNCTION log_admin_action IS 'Log admin action to audit trail';
