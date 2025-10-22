-- Create feature_vault_usage table to track which vault items power which features
CREATE TABLE IF NOT EXISTS feature_vault_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  feature_name TEXT NOT NULL, -- 'linkedin_profile', 'blog_post', 'networking_email', 'interview_prep'
  feature_record_id UUID NOT NULL, -- ID of linkedin_posts, linkedin_profiles, etc.
  vault_item_type TEXT NOT NULL, -- 'power_phrase', 'skill', 'competency'
  vault_item_id UUID NOT NULL,
  context JSONB, -- How the vault item was used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_feature_vault_usage_user ON feature_vault_usage(user_id);
CREATE INDEX idx_feature_vault_usage_feature ON feature_vault_usage(feature_name, feature_record_id);

-- Enable RLS
ALTER TABLE feature_vault_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own vault usage"
  ON feature_vault_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault usage"
  ON feature_vault_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add vault_items_used column to linkedin_profile_sections
ALTER TABLE linkedin_profile_sections
  ADD COLUMN IF NOT EXISTS vault_items_used JSONB DEFAULT '[]'::jsonb;