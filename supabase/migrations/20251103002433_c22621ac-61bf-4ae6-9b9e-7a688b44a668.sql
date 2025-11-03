-- Fix user_quota_status view to include all required columns
DROP VIEW IF EXISTS user_quota_status;

CREATE OR REPLACE VIEW user_quota_status AS
SELECT 
  uq.user_id,
  uq.tier,
  uq.monthly_request_limit,
  uq.monthly_request_count,
  uq.daily_request_limit,
  uq.monthly_cost_limit_usd as monthly_cost_budget_usd, -- Renamed for consistency
  uq.monthly_cost_spent_usd,
  
  -- Calculate daily metrics from today's usage
  COALESCE(
    (SELECT COUNT(*) 
     FROM ai_usage_metrics 
     WHERE user_id = uq.user_id 
     AND DATE(created_at) = CURRENT_DATE), 
    0
  ) as daily_request_count,
  
  COALESCE(
    (SELECT COALESCE(SUM(cost_usd), 0.0) 
     FROM ai_usage_metrics 
     WHERE user_id = uq.user_id 
     AND DATE(created_at) = CURRENT_DATE), 
    0.0
  ) as daily_cost_spent_usd,
  
  -- Percentage calculations
  ROUND(100.0 * uq.monthly_request_count / NULLIF(uq.monthly_request_limit, 0), 2) as percent_used,
  ROUND(100.0 * uq.monthly_cost_spent_usd / NULLIF(uq.monthly_cost_limit_usd, 0), 2) as cost_usage_percent,
  
  -- Status flags
  (uq.monthly_request_count >= uq.monthly_request_limit OR uq.monthly_cost_spent_usd >= uq.monthly_cost_limit_usd) as is_over_limit,
  (uq.monthly_cost_spent_usd >= uq.monthly_cost_limit_usd) as budget_exceeded,
  
  -- Days until reset calculation
  EXTRACT(DAY FROM (uq.reset_date - CURRENT_DATE))::INTEGER as days_until_reset,
  
  uq.reset_date
FROM user_quotas uq;