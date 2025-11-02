-- Phase 2: Enhance ai_usage_metrics table with additional performance fields

ALTER TABLE ai_usage_metrics 
ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prompt_tokens_cached INTEGER DEFAULT 0;

-- Create index for performance queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_function_created 
ON ai_usage_metrics(function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_user_created 
ON ai_usage_metrics(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_error_code 
ON ai_usage_metrics(error_code) WHERE error_code IS NOT NULL;

-- Create view for monthly AI costs per user
CREATE OR REPLACE VIEW user_ai_costs_monthly AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as request_count,
  SUM(cost_usd) as total_cost_usd,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  AVG(execution_time_ms) as avg_execution_time_ms,
  COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) as error_count
FROM ai_usage_metrics
WHERE user_id IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- Create view for function performance metrics
CREATE OR REPLACE VIEW function_performance_metrics AS
SELECT 
  function_name,
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as request_count,
  AVG(execution_time_ms) as avg_latency_ms,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY execution_time_ms) as p50_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_latency_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as p99_latency_ms,
  COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) as error_count,
  ROUND(100.0 * COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) / COUNT(*), 2) as error_rate_percent,
  SUM(cost_usd) as total_cost_usd,
  AVG(retry_count) as avg_retries
FROM ai_usage_metrics
GROUP BY function_name, DATE_TRUNC('day', created_at);

-- Create view for real-time AI health metrics
CREATE OR REPLACE VIEW ai_health_metrics AS
SELECT 
  COUNT(*) as total_requests_last_hour,
  COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) as errors_last_hour,
  ROUND(100.0 * COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) / NULLIF(COUNT(*), 0), 2) as error_rate_percent,
  AVG(execution_time_ms) as avg_latency_ms,
  SUM(cost_usd) as total_cost_last_hour,
  COUNT(DISTINCT function_name) as active_functions,
  COUNT(DISTINCT user_id) as active_users
FROM ai_usage_metrics
WHERE created_at >= NOW() - INTERVAL '1 hour';