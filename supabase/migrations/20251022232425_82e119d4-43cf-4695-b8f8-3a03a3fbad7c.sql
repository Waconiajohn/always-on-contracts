-- Test Infrastructure Tables

-- Test runs table
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  failed_tests INTEGER NOT NULL DEFAULT 0,
  skipped_tests INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  test_suite_name TEXT,
  environment TEXT DEFAULT 'development',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test results table
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE NOT NULL,
  test_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'running')),
  duration_ms INTEGER,
  error_message TEXT,
  error_stack TEXT,
  screenshot_url TEXT,
  console_logs JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test data snapshots (for cleanup)
CREATE TABLE test_data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_test_runs_user_id ON test_runs(user_id);
CREATE INDEX idx_test_runs_started_at ON test_runs(started_at DESC);
CREATE INDEX idx_test_results_test_run_id ON test_results(test_run_id);
CREATE INDEX idx_test_results_status ON test_results(status);
CREATE INDEX idx_test_results_category ON test_results(category);

-- Enable RLS
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_data_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_runs
CREATE POLICY "Users can view their own test runs"
  ON test_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test runs"
  ON test_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test runs"
  ON test_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for test_results
CREATE POLICY "Users can view test results for their runs"
  ON test_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM test_runs 
    WHERE test_runs.id = test_results.test_run_id 
    AND test_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert test results for their runs"
  ON test_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM test_runs 
    WHERE test_runs.id = test_results.test_run_id 
    AND test_runs.user_id = auth.uid()
  ));

-- RLS Policies for test_data_snapshots
CREATE POLICY "Users can manage their test data snapshots"
  ON test_data_snapshots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM test_runs 
    WHERE test_runs.id = test_data_snapshots.test_run_id 
    AND test_runs.user_id = auth.uid()
  ));