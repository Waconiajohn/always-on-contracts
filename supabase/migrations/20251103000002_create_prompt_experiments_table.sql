-- Migration: Create prompt_experiments table for A/B testing
-- Purpose: Track prompt performance for continuous optimization
-- Used by: _shared/ab-testing.ts

CREATE TABLE IF NOT EXISTS prompt_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name TEXT NOT NULL,
  prompt_variant TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  system_prompt TEXT,
  model TEXT NOT NULL DEFAULT 'llama-3.1-sonar-large-128k-online',
  temperature DECIMAL(2,1) DEFAULT 0.3,
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT true,

  -- Performance tracking
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  avg_token_count INTEGER DEFAULT 0,
  avg_cost_usd DECIMAL(10,6) DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique experiment variants
  UNIQUE(experiment_name, prompt_variant)
);

-- Indexes for performance
CREATE INDEX idx_prompt_experiments_name ON prompt_experiments(experiment_name);
CREATE INDEX idx_prompt_experiments_active ON prompt_experiments(is_active);
CREATE INDEX idx_prompt_experiments_created ON prompt_experiments(created_at DESC);
CREATE INDEX idx_prompt_experiments_performance ON prompt_experiments(success_count, total_count, avg_latency_ms);

-- Enable RLS
ALTER TABLE prompt_experiments ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read active experiments, admins can manage
CREATE POLICY "Anyone can view active experiments"
  ON prompt_experiments FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage experiments"
  ON prompt_experiments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email LIKE '%@admin.com'
        OR auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Function to update experiment metrics
CREATE OR REPLACE FUNCTION update_experiment_metrics(
  p_experiment_name TEXT,
  p_variant TEXT,
  p_success BOOLEAN,
  p_latency_ms INTEGER,
  p_token_count INTEGER,
  p_cost_usd DECIMAL(10,6)
)
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_success INTEGER;
  v_avg_latency INTEGER;
  v_avg_tokens INTEGER;
  v_avg_cost DECIMAL(10,6);
BEGIN
  -- Get current stats
  SELECT total_count, success_count, avg_latency_ms, avg_token_count, avg_cost_usd
  INTO v_total, v_success, v_avg_latency, v_avg_tokens, v_avg_cost
  FROM prompt_experiments
  WHERE experiment_name = p_experiment_name
    AND prompt_variant = p_variant;

  -- Calculate new rolling averages
  v_total := v_total + 1;
  v_success := v_success + CASE WHEN p_success THEN 1 ELSE 0 END;
  v_avg_latency := ((v_avg_latency * (v_total - 1)) + p_latency_ms) / v_total;
  v_avg_tokens := ((v_avg_tokens * (v_total - 1)) + p_token_count) / v_total;
  v_avg_cost := ((v_avg_cost * (v_total - 1)) + p_cost_usd) / v_total;

  -- Update experiment
  UPDATE prompt_experiments
  SET
    total_count = v_total,
    success_count = v_success,
    error_count = v_total - v_success,
    avg_latency_ms = v_avg_latency,
    avg_token_count = v_avg_tokens,
    avg_cost_usd = v_avg_cost,
    updated_at = NOW()
  WHERE experiment_name = p_experiment_name
    AND prompt_variant = p_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE prompt_experiments IS 'A/B testing framework for prompt optimization';
COMMENT ON FUNCTION update_experiment_metrics IS 'Update experiment performance metrics with rolling averages';

-- Insert example experiments for resume generation
INSERT INTO prompt_experiments (experiment_name, prompt_variant, prompt_content, system_prompt, model, temperature, is_active)
VALUES
  (
    'resume-generation',
    'control',
    'Generate a professional resume section for: {job_title}',
    'You are an expert resume writer.',
    'llama-3.1-sonar-large-128k-online',
    0.3,
    true
  ),
  (
    'resume-generation',
    'variant-a',
    'Create a compelling, ATS-optimized resume section showcasing achievements for: {job_title}',
    'You are a certified professional resume writer (CPRW) with 15 years of experience.',
    'llama-3.1-sonar-large-128k-online',
    0.4,
    true
  )
ON CONFLICT (experiment_name, prompt_variant) DO NOTHING;
