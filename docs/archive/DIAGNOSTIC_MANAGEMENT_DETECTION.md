# DIAGNOSTIC: Management Experience Detection Failure

## Problem Statement
User's resume contains CLEAR management experience:
- "Drilling Engineering Supervisor"
- "Guided a drilling team over 3-4 rigs"
- "$350MM annual budget"
- "Led the Eagle Ford drilling engineering team"

Yet system reports: **"Zero management experience"**

## Root Cause Analysis

### Hypothesis #1: AI Extraction Failure ⚠️ **MOST LIKELY**
The problem is NOT in `career-context-analyzer.ts` (the regex is now correct).

The problem is in `auto-populate-vault-v2/index.ts` - the AI extraction might be:
1. **NOT extracting management phrases** because they don't have hard metrics
2. **Categorizing them incorrectly** (not as "leadership" or "team_building")
3. **Giving them low confidence scores** and filtering them out

#### Evidence:
Look at the power phrases prompt (lines 114-152):
```
REQUIREMENTS:
1. Each power phrase MUST have metrics (numbers, percentages, timeframes, amounts)
2. Focus on IMPACT and RESULTS, not responsibilities
```

❌ **THIS IS THE BUG** ❌

The phrase "Guided a drilling team over 3-4 rigs" might be:
- Getting SKIPPED because AI thinks "guided" is a responsibility, not an achievement
- Getting LOW confidence score because no $ impact metrics
- Getting filtered out before it ever reaches career-context-analyzer.ts

### Hypothesis #2: Database Field Mismatch (ALREADY RULED OUT)
Line 190 shows: `power_phrase: pp.phrase` - this is correct.
AI returns `{phrase: "..."}` and we store it as `power_phrase` in database.

### Hypothesis #3: Regex Pattern (ALREADY FIXED)
Lines 53-54 of career-context-analyzer.ts show expanded regex with "guided", "supervised", "directed", etc.
✅ This was fixed in commit 016f1ce

## The Real Problem: AI Prompt is Too Strict

The auto-populate-vault-v2 prompt is filtering OUT management context because:

**Current Requirement:**
> "Each power phrase MUST have metrics (numbers, percentages, timeframes, amounts)"

**User's Resume Says:**
> "Guided a drilling team over 3-4 rigs"

**AI's Decision:**
- ❌ "This is a responsibility statement, not an achievement"
- ❌ "No clear $ or % metric"
- ❌ "Skip it or give it confidence < 0.6"

**Result:** The phrase never makes it into `vault_power_phrases` table, so `career-context-analyzer.ts` never sees it.

## The Fix Required

### Option A: Relax Extraction Requirements (RECOMMENDED)
Modify `auto-populate-vault-v2/index.ts` prompt to explicitly extract management/leadership context even without hard metrics:

```typescript
REQUIREMENTS:
1. Each power phrase SHOULD have metrics when possible
2. EXCEPTION: Management/leadership scope (team sizes, report counts, budget oversight)
   MUST be extracted even without outcome metrics
3. Examples of must-extract phrases:
   - "Managed team of 12 engineers" ✅ (team size IS a metric)
   - "Guided drilling operations across 3-4 rigs" ✅ (scope IS a metric)
   - "$350MM budget responsibility" ✅ (budget IS a metric)
   - "Led cross-functional team" ⚠️ (extract, but mark for clarification)
```

### Option B: Add Separate Leadership Extraction Pass
Create a 5th extraction pass specifically for management/leadership scope:
- Extract ALL phrases with: managed, led, guided, supervised, directed, oversaw
- Extract ALL team sizes and budget mentions
- Don't require outcome metrics for this pass

### Option C: Post-Processing Enhancement
After all 4 extraction passes, run a final scan of resume_raw_text for:
- Job titles containing: supervisor, manager, director, lead, head, chief
- Phrases with team sizes: "team of X", "X engineers", "X-Y rigs"
- Budget mentions: "$XM", "$XMM", "$XB"

Create synthetic power phrases from these patterns.

## Recommended Action Plan

### Step 1: Verify the Hypothesis ⏳ **DO THIS FIRST**
Ask user to check their vault in Supabase Studio:

```sql
SELECT power_phrase, category, confidence_score
FROM vault_power_phrases
WHERE vault_id = '[user's vault ID]'
AND (
  power_phrase ILIKE '%guid%' OR
  power_phrase ILIKE '%supervis%' OR
  power_phrase ILIKE '%manag%' OR
  power_phrase ILIKE '%led%' OR
  power_phrase ILIKE '%team%' OR
  power_phrase ILIKE '%rig%'
)
ORDER BY confidence_score DESC;
```

**Expected Result:**
- If query returns 0 rows → Hypothesis #1 confirmed (extraction failure)
- If query returns rows → career-context-analyzer.ts bug (regex still not matching)

### Step 2: Fix Based on Verification
- **If Hypothesis #1**: Modify auto-populate-vault-v2 prompt (Option A recommended)
- **If career-context-analyzer bug**: Debug regex matching logic

### Step 3: Test Fix
1. Delete user's existing vault data
2. Re-run auto-populate-vault-v2 with drilling engineer resume
3. Verify management phrases extracted
4. Verify career-context-analyzer detects them
5. Verify competitive analysis shows management experience

## Files to Modify

### Primary Fix (Hypothesis #1):
📁 `supabase/functions/auto-populate-vault-v2/index.ts`
- Lines 114-152: Modify power phrases extraction prompt
- Add explicit instruction to extract management/leadership scope

### Backup Fix (if H#1 wrong):
📁 `supabase/functions/_shared/career-context-analyzer.ts`
- Lines 53-77: Further expand regex or add console.log debugging

## Test Cases After Fix

Resume phrase → Should be extracted? → Should be detected?

1. "Drilling Engineering Supervisor" (title)
   - ✅ Extract: Yes (job title)
   - ✅ Detect: Yes (regex: "supervis")

2. "Guided a drilling team over 3-4 rigs"
   - ✅ Extract: Yes (team scope)
   - ✅ Detect: Yes (regex: "guided" + "3-4 rigs")

3. "$350MM annual budget"
   - ✅ Extract: Yes (budget scope)
   - ✅ Detect: Yes (budget detection, lines 86-117)

4. "Led the Eagle Ford drilling engineering team"
   - ✅ Extract: Yes (leadership)
   - ✅ Detect: Yes (regex: "led")

**All 4 should pass after fix.**

---

## Next Steps

**User Action Required:**
1. Run SQL query above to check what's actually in vault_power_phrases
2. Report findings (0 rows? Has rows but wrong?)

**My Action Based on Results:**
- Modify auto-populate-vault-v2 extraction prompt (most likely fix)
- Deploy updated function to Supabase
- Have user delete vault and re-extract
- Verify management experience detected correctly

**Timeline:**
- Diagnosis: 5 minutes (user runs SQL)
- Fix implementation: 30 minutes
- Testing: 15 minutes
- **Total: ~1 hour to resolution**
