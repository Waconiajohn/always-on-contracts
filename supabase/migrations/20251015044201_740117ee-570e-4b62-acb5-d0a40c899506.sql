-- Add source column to opportunity_matches
ALTER TABLE opportunity_matches 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'ai_suggestion' 
CHECK (source IN ('ai_suggestion', 'manual', 'agency_match', 'import'));

-- Delete existing auto-generated matches (clean slate)
DELETE FROM opportunity_matches WHERE source IS NULL OR source = 'ai_suggestion';

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_source ON opportunity_matches(source, user_id);

-- Ensure application_queue has source column
ALTER TABLE application_queue 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual' 
CHECK (source IN ('manual', 'ai_suggestion', 'agency_match', 'import'));