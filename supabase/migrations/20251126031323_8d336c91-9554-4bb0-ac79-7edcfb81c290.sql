-- ========================================================================
-- CAREER VAULT CLEANUP: Remove duplicate work positions
-- ========================================================================
-- This migration cleans up duplicate work positions that may have been
-- created before the clearVaultData fix was implemented

-- Delete older duplicates, keeping only the most recent by created_at
DELETE FROM vault_work_positions 
WHERE id NOT IN (
  SELECT DISTINCT ON (vault_id, company_name, job_title, start_date) id
  FROM vault_work_positions
  ORDER BY vault_id, company_name, job_title, start_date, created_at DESC
);