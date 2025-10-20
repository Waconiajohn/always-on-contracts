-- Create resume_generation_analytics table for tracking generation events
CREATE TABLE IF NOT EXISTS resume_generation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resume_analytics_user_id ON resume_generation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analytics_event_type ON resume_generation_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_resume_analytics_created_at ON resume_generation_analytics(created_at DESC);

-- Enable Row Level Security
ALTER TABLE resume_generation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resume_generation_analytics
DROP POLICY IF EXISTS "Users can insert their own analytics" ON resume_generation_analytics;
CREATE POLICY "Users can insert their own analytics"
  ON resume_generation_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own analytics" ON resume_generation_analytics;
CREATE POLICY "Users can view their own analytics"
  ON resume_generation_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE resume_generation_analytics IS 'Tracks resume generation events for analytics and monitoring';
COMMENT ON COLUMN resume_generation_analytics.event_type IS 'Type of event: generation_started, generation_completed, generation_failed, version_selected, etc.';
COMMENT ON COLUMN resume_generation_analytics.metadata IS 'JSON metadata including section_type, vault_items_used, generation_time_ms, error details, etc.';