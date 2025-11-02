-- Create AI usage metrics table for cost tracking
CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'perplexity',
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  request_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_ai_usage_metrics_created_at ON ai_usage_metrics(created_at DESC);
CREATE INDEX idx_ai_usage_metrics_user_id ON ai_usage_metrics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ai_usage_metrics_function_name ON ai_usage_metrics(function_name);

-- Add RLS policies
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admin can view all AI usage metrics"
  ON ai_usage_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com'
    )
  );

-- Users can view their own metrics
CREATE POLICY "Users can view their own AI usage metrics"
  ON ai_usage_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert metrics
CREATE POLICY "Service role can insert AI usage metrics"
  ON ai_usage_metrics
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE ai_usage_metrics IS 'Tracks all AI API usage and costs for observability and cost analysis';
COMMENT ON COLUMN ai_usage_metrics.provider IS 'AI provider name - should always be perplexity in this project';
COMMENT ON COLUMN ai_usage_metrics.cost_usd IS 'Calculated cost in USD based on token usage and model pricing';
