-- =====================================================
-- DIAGNOSTIC QUERIES - Management Detection Issues
-- =====================================================
-- Run these in Supabase SQL Editor to diagnose the problem
-- =====================================================

-- QUERY 1: What power phrases were actually extracted?
-- =====================================================
SELECT
  power_phrase,
  category,
  confidence_score,
  quality_tier,
  keywords,
  impact_metrics,
  created_at
FROM vault_power_phrases
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC
LIMIT 20;

-- EXPECTED: Should see phrases like "Supervised 3-4 rigs"
-- IF MISSING: AI extraction failed to find management phrases


-- QUERY 2: What's in the career context cache?
-- =====================================================
SELECT
  has_management_experience,
  management_details,
  team_sizes_managed,
  has_budget_ownership,
  budget_details,
  budget_sizes_managed,
  inferred_seniority,
  years_of_experience,
  leadership_depth,
  created_at
FROM vault_career_context
WHERE vault_id = (
  SELECT id FROM career_vault
  WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
  ORDER BY created_at DESC LIMIT 1
);

-- EXPECTED: has_management_experience = true, management_details populated
-- IF FALSE: Career analyzer didn't detect management from vault data


-- QUERY 3: What's in the leadership philosophy table?
-- =====================================================
SELECT
  COUNT(*) as leadership_item_count
FROM vault_leadership_philosophy
WHERE vault_id = (
  SELECT id FROM career_vault
  WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
  ORDER BY created_at DESC LIMIT 1
);

-- EXPECTED: At least 1-3 items
-- IF 0: Leadership extraction didn't run or failed


-- QUERY 4: Search power phrases for ANY management keywords
-- =====================================================
SELECT
  power_phrase,
  category,
  confidence_score
FROM vault_power_phrases
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
AND (
  power_phrase ILIKE '%supervis%' OR
  power_phrase ILIKE '%manag%' OR
  power_phrase ILIKE '%led %' OR
  power_phrase ILIKE '%team%' OR
  power_phrase ILIKE '%direct%' OR
  power_phrase ILIKE '%oversee%' OR
  power_phrase ILIKE '%rig%' OR
  power_phrase ILIKE '%crew%' OR
  power_phrase ILIKE '%staff%' OR
  category IN ('leadership', 'team_building', 'management')
)
ORDER BY confidence_score DESC;

-- EXPECTED: At least 2-3 hits showing management/supervision
-- IF EMPTY: AI extraction completely missed management experience


-- QUERY 5: What does the resume text actually say?
-- =====================================================
SELECT
  LEFT(resume_raw_text, 500) as resume_preview,
  LENGTH(resume_raw_text) as total_length,
  created_at
FROM career_vault
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC
LIMIT 1;

-- Look for: Does "supervis" appear in first 500 chars?
-- This tells us if the resume text even contains the management info


-- QUERY 6: Count ALL vault items by category
-- =====================================================
SELECT
  'power_phrases' as table_name,
  COUNT(*) as item_count,
  COUNT(CASE WHEN category IN ('leadership', 'team_building', 'management') THEN 1 END) as leadership_count
FROM vault_power_phrases
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)

UNION ALL

SELECT
  'leadership_philosophy',
  COUNT(*),
  COUNT(*)
FROM vault_leadership_philosophy
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)

UNION ALL

SELECT
  'executive_presence',
  COUNT(*),
  COUNT(*)
FROM vault_executive_presence
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);

-- EXPECTED: leadership_count > 0 in at least one table
-- IF ALL ZERO: Complete extraction failure for management


-- =====================================================
-- INTERPRETATION GUIDE
-- =====================================================
/*
SCENARIO A: Power phrases have management, but career context doesn't
  QUERY 1: Shows "Supervised 3-4 rigs"
  QUERY 2: has_management_experience = false
  DIAGNOSIS: Career analyzer didn't detect it from power phrases
  FIX: Apply Fix 1 (pass leadership data to analyzer)

SCENARIO B: No management in power phrases at all
  QUERY 1: No results with management keywords
  QUERY 4: Empty results
  DIAGNOSIS: AI extraction failed to extract management from resume
  FIX: Check QUERY 5 - is "supervis" even in resume text?
       If YES: AI extraction prompt too conservative
       If NO: Resume text was truncated/corrupted

SCENARIO C: Leadership table is empty
  QUERY 3: count = 0
  QUERY 6: leadership_philosophy count = 0
  DIAGNOSIS: Leadership extraction step didn't run
  FIX: Check if extract-vault-intangibles is called after auto-populate

SCENARIO D: Everything looks good but still shows 0/1
  All queries show management detected
  DIAGNOSIS: Frontend displaying wrong data
  FIX: Hard refresh browser, check dashboard data fetching
*/
