-- Phase 1: Add search origin tracking to job_search_sessions
ALTER TABLE public.job_search_sessions 
ADD COLUMN IF NOT EXISTS search_origin TEXT DEFAULT 'typed_query',
ADD COLUMN IF NOT EXISTS vault_title_used TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_job_search_sessions_origin 
ON public.job_search_sessions(search_origin);

CREATE INDEX IF NOT EXISTS idx_job_search_sessions_user_date 
ON public.job_search_sessions(user_id, created_at DESC);

-- Add tracking columns to job_listings
ALTER TABLE public.job_listings
ADD COLUMN IF NOT EXISTS search_origin TEXT,
ADD COLUMN IF NOT EXISTS vault_derived BOOLEAN DEFAULT false;

COMMENT ON COLUMN job_search_sessions.search_origin IS 'Source of search: vault_title, typed_query, saved_search, or boolean_ai';
COMMENT ON COLUMN job_search_sessions.vault_title_used IS 'The vault-suggested job title used for this search';
COMMENT ON COLUMN job_listings.vault_derived IS 'Whether this job was found via a vault-powered search';