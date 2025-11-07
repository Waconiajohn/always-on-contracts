-- =====================================================
-- V3 EXTRACTION OBSERVABILITY TABLES
-- Tracks extraction sessions, events, and quality metrics
-- =====================================================

-- 1. Extraction Sessions
CREATE TABLE IF NOT EXISTS public.extraction_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  extraction_version TEXT NOT NULL DEFAULT 'v3',
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_extraction_sessions_vault ON extraction_sessions(vault_id);
CREATE INDEX idx_extraction_sessions_user ON extraction_sessions(user_id);
CREATE INDEX idx_extraction_sessions_status ON extraction_sessions(status);

-- 2. Extraction Events (fine-grained logging)
CREATE TABLE IF NOT EXISTS public.extraction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_extraction_events_session ON extraction_events(session_id);
CREATE INDEX idx_extraction_events_type ON extraction_events(event_type);

-- 3. Extraction Checkpoints (state snapshots)
CREATE TABLE IF NOT EXISTS public.extraction_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  checkpoint_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_extraction_checkpoints_session ON extraction_checkpoints(session_id);

-- 4. AI Responses (track all AI calls)
CREATE TABLE IF NOT EXISTS public.ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL,
  raw_response TEXT,
  parsed_data JSONB,
  usage JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_responses_session ON ai_responses(session_id);
CREATE INDEX idx_ai_responses_pass ON ai_responses(pass_type);

-- 5. Extraction Validations
CREATE TABLE IF NOT EXISTS public.extraction_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES extraction_sessions(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  confidence NUMERIC(5, 2),
  issues JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_extraction_validations_session ON extraction_validations(session_id);

-- Enable RLS
ALTER TABLE extraction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role only for now, user access via functions)
CREATE POLICY "Service role can manage extraction_sessions"
  ON extraction_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage extraction_events"
  ON extraction_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage extraction_checkpoints"
  ON extraction_checkpoints
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage ai_responses"
  ON ai_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage extraction_validations"
  ON extraction_validations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);