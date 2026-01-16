# DEPLOY: Management Detection Fix

## What Was Fixed

**Root Cause:** The AI extraction prompt in `auto-populate-vault-v2` was TOO STRICT about what counts as "metrics". It required outcome metrics (%, $ saved) and was SKIPPING management scope phrases like:
- ❌ "Guided a drilling team over 3-4 rigs" (has scope metrics but no outcome metrics)
- ❌ "$350MM budget oversight" (has budget metric but no savings outcome)
- ❌ "Managed team of 12 engineers" (has team size but no efficiency gain)

**The Fix:** Modified the extraction prompt to recognize TWO types of power phrases:
- **TYPE A**: Impact achievements (40% reduction, $2M saved)
- **TYPE B**: Management scope (team sizes, budgets, operational scale) ← **THIS IS NEW**

## Deployment Steps

### Step 1: Deploy to Supabase (Lovable)

Ask Lovable to deploy this edge function:
```
Deploy the updated auto-populate-vault-v2 edge function to Supabase
```

**File to deploy:**
- `supabase/functions/auto-populate-vault-v2/index.ts`

### Step 2: Clear Existing Vault Data (REQUIRED)

The existing vault data was extracted with the OLD buggy prompt. You need to delete it and re-extract with the NEW prompt.

**Option A: Delete via Supabase Studio UI**
1. Go to Supabase Studio → Table Editor
2. Select `vault_power_phrases` table
3. Delete all rows where `vault_id = '[your vault ID]'`
4. Repeat for: `vault_transferable_skills`, `vault_hidden_competencies`, `vault_soft_skills`

**Option B: SQL Query (Faster)**
```sql
-- Get your vault_id first
SELECT id FROM career_vault WHERE user_id = '[your user ID]';

-- Delete all vault data (replace [vault_id] with actual ID)
DELETE FROM vault_power_phrases WHERE vault_id = '[vault_id]';
DELETE FROM vault_transferable_skills WHERE vault_id = '[vault_id]';
DELETE FROM vault_hidden_competencies WHERE vault_id = '[vault_id]';
DELETE FROM vault_soft_skills WHERE vault_id = '[vault_id]';

-- Reset vault completion
UPDATE career_vault
SET completion_percentage = 0,
    last_updated = NOW()
WHERE id = '[vault_id]';
```

### Step 3: Re-Run Vault Population

1. Go to Career Vault Dashboard
2. Upload your drilling engineer resume again
3. Let the extraction run (takes 2-3 minutes)
4. Check completion percentage

### Step 4: Verify Management Detection

After re-extraction, check if management experience is detected:

**SQL Verification Query:**
```sql
-- Check if management phrases were extracted
SELECT power_phrase, category, confidence_score
FROM vault_power_phrases
WHERE vault_id = '[vault_id]'
AND (
  power_phrase ILIKE '%guid%' OR
  power_phrase ILIKE '%supervis%' OR
  power_phrase ILIKE '%manag%' OR
  power_phrase ILIKE '%led%' OR
  power_phrase ILIKE '%team%' OR
  power_phrase ILIKE '%rig%' OR
  power_phrase ILIKE '%budget%'
)
ORDER BY confidence_score DESC;
```

**Expected Results:**
- ✅ "Guided a drilling team over 3-4 rigs" (or similar)
- ✅ "$350MM budget" or "350 million budget"
- ✅ "Drilling Engineering Supervisor" or similar title
- ✅ "Led Eagle Ford drilling team" or similar

**If you see 5+ management-related phrases:** Extraction working! ✅

### Step 5: Test Competitive Analysis

1. Complete any remaining gap-filling questions
2. Run competitive analysis
3. Check the "Critical Items" section

**Expected Result:**
- ✅ Should show "Management Experience: Yes"
- ✅ Should show team size (e.g., "managed teams of 3-4")
- ✅ Should show budget (e.g., "$350MM budget oversight")
- ❌ Should NOT say "Zero management experience"

## What This Fixes

### Before Fix:
```
Critical Items to Complete:
#1 critical - Formal Management/Supervision Credentialization
Current profile shows zero management experience ❌ WRONG
```

### After Fix:
```
Your Competitive Strengths:
- Management Experience: Led teams of 3-4 rigs with $350MM budget oversight
- Leadership credibility with drilling operations supervision
```

## If It Still Doesn't Work

If management experience STILL shows as "zero" after re-extraction:

### Debug Step 1: Check extraction logs
Ask Lovable to check Supabase edge function logs:
```
Show me the logs for auto-populate-vault-v2 for the most recent run
```

Look for:
- "✅ Extracted X power phrases" - should be 20-50
- Any errors or warnings

### Debug Step 2: Check what was actually extracted
Run the SQL verification query above. If it returns 0 rows, the AI is still not extracting the phrases (possible Perplexity API issue).

### Debug Step 3: Check career-context-analyzer logic
If phrases ARE extracted but still showing "zero management experience", the bug is in `career-context-analyzer.ts` regex matching.

Run this query to see what's being passed to the analyzer:
```sql
SELECT COUNT(*) as management_phrase_count
FROM vault_power_phrases
WHERE vault_id = '[vault_id]'
AND (
  power_phrase ~* 'led|managed?|directed|guided|supervised|oversaw|coordinated|spearheaded'
);
```

If count > 0 but still showing zero management, the career-context-analyzer regex needs more debugging.

## Timeline

- ⏱️ **Deploy function**: 2 minutes
- ⏱️ **Delete vault data**: 1 minute
- ⏱️ **Re-extract resume**: 3 minutes
- ⏱️ **Verify results**: 2 minutes

**Total: ~8 minutes**

## Success Criteria

✅ Management phrases extracted (SQL query returns 5+ rows)
✅ Competitive analysis shows "Management Experience: Yes"
✅ Gap-filling questions are drilling-specific (not executive)
✅ Team size detected (3-4 rigs or similar)
✅ Budget detected ($350MM or similar)

---

**Commit:** c9c2e3b
**Files Changed:**
- `supabase/functions/auto-populate-vault-v2/index.ts`
- `DIAGNOSTIC_MANAGEMENT_DETECTION.md`
