-- Phase 3: Rate Limiting & User Quotas

-- Create table for tracking API rate limits
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, function_name, window_start)
);

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_function_window 
ON api_rate_limits(user_id, function_name, window_start DESC);

-- Create table for user subscription tiers and quotas
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  monthly_request_limit INTEGER NOT NULL DEFAULT 100,
  monthly_request_count INTEGER NOT NULL DEFAULT 0,
  daily_request_limit INTEGER NOT NULL DEFAULT 20,
  monthly_cost_limit_usd DECIMAL(10, 4) DEFAULT 5.00,
  monthly_cost_spent_usd DECIMAL(10, 4) DEFAULT 0.00,
  reset_date TIMESTAMPTZ NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- RLS policies for api_rate_limits
CREATE POLICY "Users can view their own rate limits"
  ON api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
  ON api_rate_limits FOR ALL
  USING (true);

-- RLS policies for user_quotas
CREATE POLICY "Users can view their own quotas"
  ON user_quotas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas"
  ON user_quotas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage quotas"
  ON user_quotas FOR ALL
  USING (true);

-- Function to automatically create default quota for new users
CREATE OR REPLACE FUNCTION create_default_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_quotas (user_id, tier, monthly_request_limit, daily_request_limit)
  VALUES (NEW.id, 'free', 100, 20)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create quota when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_quota ON auth.users;
CREATE TRIGGER on_auth_user_created_quota
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_quota();

-- Function to reset monthly quotas (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE user_quotas
  SET 
    monthly_request_count = 0,
    monthly_cost_spent_usd = 0.00,
    reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
    updated_at = NOW()
  WHERE reset_date <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- View for checking user quota status
CREATE OR REPLACE VIEW user_quota_status AS
SELECT 
  uq.user_id,
  uq.tier,
  uq.monthly_request_limit,
  uq.monthly_request_count,
  uq.daily_request_limit,
  uq.monthly_cost_limit_usd,
  uq.monthly_cost_spent_usd,
  ROUND(100.0 * uq.monthly_request_count / NULLIF(uq.monthly_request_limit, 0), 2) as usage_percent,
  ROUND(100.0 * uq.monthly_cost_spent_usd / NULLIF(uq.monthly_cost_limit_usd, 0), 2) as cost_usage_percent,
  (uq.monthly_request_count >= uq.monthly_request_limit) as quota_exceeded,
  (uq.monthly_cost_spent_usd >= uq.monthly_cost_limit_usd) as budget_exceeded,
  uq.reset_date
FROM user_quotas uq;