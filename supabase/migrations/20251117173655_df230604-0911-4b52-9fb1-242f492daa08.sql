-- Create LinkedIn usage telemetry table
CREATE TABLE IF NOT EXISTS linkedin_usage_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'profile_section_accepted',
    'blog_post_used',
    'networking_message_sent',
    'series_generated'
  )),
  content_type TEXT NOT NULL,
  content_variant TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_linkedin_telemetry_user ON linkedin_usage_telemetry(user_id);
CREATE INDEX idx_linkedin_telemetry_action ON linkedin_usage_telemetry(action_type);
CREATE INDEX idx_linkedin_telemetry_date ON linkedin_usage_telemetry(created_at DESC);

-- RLS policies
ALTER TABLE linkedin_usage_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telemetry"
  ON linkedin_usage_telemetry FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telemetry"
  ON linkedin_usage_telemetry FOR INSERT
  WITH CHECK (auth.uid() = user_id);