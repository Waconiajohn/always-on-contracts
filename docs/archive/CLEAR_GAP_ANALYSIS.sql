-- Quick fix: Delete cached gap analysis data to force regeneration
-- This removes the old "Formal Management/Supervision Credentialization" blocker
-- that was generated BEFORE the AI extraction fix

-- Option 1: Delete ALL gap analysis for Luke's vault
-- Replace 'VAULT_ID_HERE' with Luke's actual vault ID
DELETE FROM vault_gap_analysis
WHERE vault_id = 'VAULT_ID_HERE';

-- Option 2: Delete all gap analysis for all users (use with caution)
-- DELETE FROM vault_gap_analysis;

-- After running this, the UI should trigger a new gap analysis
-- which will detect the management experience that was just extracted by AI

-- Verify the deletion worked:
SELECT
  vault_id,
  analysis_type,
  created_at,
  identified_gaps->>0 as first_gap
FROM vault_gap_analysis
WHERE vault_id = 'VAULT_ID_HERE'
ORDER BY created_at DESC;
