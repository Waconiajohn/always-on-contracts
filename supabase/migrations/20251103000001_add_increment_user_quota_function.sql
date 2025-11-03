-- Migration: Add increment_user_quota function for rate limiting
-- Purpose: Atomically increment user quota counters with automatic creation
-- Used by: _shared/rate-limiter.ts

CREATE OR REPLACE FUNCTION increment_user_quota(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Try to increment existing quota record
  UPDATE user_quotas
  SET
    monthly_request_count = monthly_request_count + 1,
    daily_request_count = daily_request_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no record exists, create default quota
  IF NOT FOUND THEN
    INSERT INTO user_quotas (
      user_id,
      tier,
      monthly_request_count,
      daily_request_count,
      monthly_request_limit,
      daily_request_limit,
      monthly_cost_budget_usd
    )
    VALUES (
      p_user_id,
      'free',  -- Default tier
      1,       -- First request
      1,       -- First daily request
      100,     -- Free tier monthly limit
      20,      -- Free tier daily limit
      5.00     -- Free tier budget
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      monthly_request_count = user_quotas.monthly_request_count + 1,
      daily_request_count = user_quotas.daily_request_count + 1,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_user_quota IS 'Atomically increment user quota with automatic creation for new users';
