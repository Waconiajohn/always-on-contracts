-- =====================================================
-- EXTRACTION OBSERVABILITY TABLES
-- Comprehensive tracking for vault extraction sessions
-- =====================================================

-- Track extraction sessions
CREATE TABLE IF NOT EXISTS extraction_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extraction_version TEXT NOT NULL DEFAULT 'v3',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
  metadata JSONB DEFAULT '{}',
  final_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track individual events during extraction
CREATE TABLE IF NOT EXISTS extraction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Capture AI responses for debugging and improvement
CREATE TABLE IF NOT EXISTS ai_response_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL, -- 'power_phrases', 'skills', 'competencies', 'soft_skills'
  prompt_version TEXT NOT NULL,
  model_used TEXT NOT NULL,
  raw_response TEXT,
  parsed_data JSONB,
  token_usage JSONB, -- { prompt: number, completion: number, total: number }
  latency_ms INTEGER,
  ai_reasoning TEXT,
  confidence_score DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track validation results
CREATE TABLE IF NOT EXISTS extraction_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL, -- 'completeness', 'consistency', 'plausibility', 'redundancy'
  passed BOOLEAN NOT NULL,
  confidence INTEGER,
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track extraction checkpoints for recovery
CREATE TABLE IF NOT EXISTS extraction_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'pre_extraction', 'pass_1', 'pass_2', etc.
  checkpoint_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add extraction tracking to career_vault
ALTER TABLE career_vault
  ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS last_extraction_session_id UUID REFERENCES extraction_sessions(id);

-- Add extraction metadata to vault items
ALTER TABLE vault_power_phrases
  ADD COLUMN IF NOT EXISTS extraction_session_id UUID REFERENCES extraction_sessions(id),
  ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';

ALTER TABLE vault_transferable_skills
  ADD COLUMN IF NOT EXISTS extraction_session_id UUID REFERENCES extraction_sessions(id),
  ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';

ALTER TABLE vault_hidden_competencies
  ADD COLUMN IF NOT EXISTS extraction_session_id UUID REFERENCES extraction_sessions(id),
  ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';

ALTER TABLE vault_soft_skills
  ADD COLUMN IF NOT EXISTS extraction_session_id UUID REFERENCES extraction_sessions(id),
  ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_vault ON extraction_sessions(vault_id);
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_user ON extraction_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_status ON extraction_sessions(status);
CREATE INDEX IF NOT EXISTS idx_extraction_events_session ON extraction_events(session_id);
CREATE INDEX IF NOT EXISTS idx_extraction_events_type ON extraction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_captures_session ON ai_response_captures(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_captures_pass ON ai_response_captures(pass_type);
CREATE INDEX IF NOT EXISTS idx_validation_logs_session ON extraction_validation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_session ON extraction_checkpoints(session_id);

-- Enable Row Level Security
ALTER TABLE extraction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own extraction data
CREATE POLICY "Users can view their own extraction sessions"
  ON extraction_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own extraction events"
  ON extraction_events FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM extraction_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own AI captures"
  ON ai_response_captures FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM extraction_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own validation logs"
  ON extraction_validation_logs FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM extraction_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own checkpoints"
  ON extraction_checkpoints FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM extraction_sessions WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON extraction_sessions TO authenticated;
GRANT SELECT ON extraction_events TO authenticated;
GRANT SELECT ON ai_response_captures TO authenticated;
GRANT SELECT ON extraction_validation_logs TO authenticated;
GRANT SELECT ON extraction_checkpoints TO authenticated;

-- Comments for documentation
COMMENT ON TABLE extraction_sessions IS 'Tracks complete extraction sessions from start to finish';
COMMENT ON TABLE extraction_events IS 'Logs individual events during extraction for debugging and monitoring';
COMMENT ON TABLE ai_response_captures IS 'Stores AI responses for quality analysis and prompt improvement';
COMMENT ON TABLE extraction_validation_logs IS 'Records validation results to track extraction quality over time';
COMMENT ON TABLE extraction_checkpoints IS 'Stores intermediate state for recovery from failures';

COMMENT ON COLUMN extraction_sessions.extraction_version IS 'Version of extraction system used (v2, v3, etc.)';
COMMENT ON COLUMN extraction_sessions.metadata IS 'Session configuration and context (resume length, target roles, etc.)';
COMMENT ON COLUMN extraction_sessions.final_data IS 'Summary of extraction results (item counts, confidence, etc.)';
COMMENT ON COLUMN ai_response_captures.ai_reasoning IS 'AI explanation of its decisions (why it classified items certain ways)';
COMMENT ON COLUMN extraction_validation_logs.issues IS 'Array of validation issues found (missing fields, inconsistencies, etc.)';
