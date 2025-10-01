-- Remove opportunity tracking from outreach_tracking table
-- This table will now be agency-specific only
ALTER TABLE outreach_tracking 
DROP COLUMN IF EXISTS opportunity_match_id;

-- Make agency_id required since this is now agency-only
ALTER TABLE outreach_tracking 
ALTER COLUMN agency_id SET NOT NULL;

-- Remove the check constraint that's no longer needed
ALTER TABLE outreach_tracking 
DROP CONSTRAINT IF EXISTS outreach_tracking_one_reference_check;