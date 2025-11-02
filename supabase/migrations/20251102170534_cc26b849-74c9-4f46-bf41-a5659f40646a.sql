-- Phase 5.1: Processing Metrics Table
CREATE TABLE IF NOT EXISTS processing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES resume_processing_queue(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  
  -- Timing metrics
  total_time_ms INTEGER NOT NULL,
  parse_time_ms INTEGER,
  validation_time_ms INTEGER,
  analysis_time_ms INTEGER,
  
  -- Success metrics
  success BOOLEAN NOT NULL,
  was_cached BOOLEAN DEFAULT false,
  cache_hit_count INTEGER DEFAULT 0,
  
  -- Quality metrics
  extracted_text_length INTEGER,
  validation_confidence DECIMAL(3,2),
  analysis_confidence VARCHAR(10),
  
  -- Error tracking
  error_type TEXT,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_processing_metrics_user ON processing_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_created ON processing_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_success ON processing_metrics(success);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_file_type ON processing_metrics(file_type);

-- RLS policies
ALTER TABLE processing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics" ON processing_metrics
  FOR SELECT USING (auth.uid() = user_id);