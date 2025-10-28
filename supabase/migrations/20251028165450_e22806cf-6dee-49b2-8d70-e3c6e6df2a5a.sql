-- Phase 3: Clean up inconsistent vault completion data
-- Reset review_completion_percentage to 0 for vaults that have been cleared
-- (detected by having 0 items but non-zero review_completion_percentage)

UPDATE career_vault
SET review_completion_percentage = 0
WHERE (
  total_power_phrases = 0 AND
  total_transferable_skills = 0 AND
  total_hidden_competencies = 0 AND
  review_completion_percentage > 0
);

-- For clarity: vaults with items but interview_completion_percentage at 100% 
-- and review at 0% are CORRECT - they need user review
-- No action needed for those cases