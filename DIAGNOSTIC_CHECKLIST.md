# Diagnostic Checklist for Management Detection Fix

## Problem
Luke's resume shows clear management experience but system still shows blocker alert.

## Root Cause
The blocker is **cached gap analysis data** from BEFORE the AI extraction fix was deployed.

## What Was Fixed
✅ Regex-based extraction → AI semantic analysis
✅ `categorizeManagementEvidence()` function deleted
✅ New AI functions: `analyzeManagementExperience()`, `analyzeEducation()`, `analyzeCareerContext()`
✅ Code committed and pushed to GitHub

## What Needs to Happen Now

### Step 1: Re-run Resume Extraction
Luke needs to trigger a **full resume re-extraction** to populate data using the NEW AI-based system.

**Options:**
1. **Nuclear Reset** (recommended for testing):
   - Go to Master Resume Dashboard
   - Find "VaultNuclearReset" component (might be hidden - check settings/admin)
   - Click "Nuclear Reset" button
   - This will:
     - Delete ALL resume items from all tables
     - Re-run `auto-populate-vault-v3` with AI extraction
     - Takes ~30-60 seconds

2. **Manual Re-upload Resume**:
   - Go to Master Resume
   - Re-upload Luke's resume
   - Select "Full" mode (not incremental)

3. **Direct API Call** (for testing):
   ```bash
   curl -X POST https://[your-project].supabase.co/functions/v1/auto-populate-vault-v3 \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json" \
     -d '{
       "resumeText": "[Luke's resume text]",
       "resumeId": "[resume_id]",
       "targetRoles": ["Drilling Engineering Supervisor"],
       "mode": "full"
     }'
   ```
   Note: `vaultId` is also accepted for backward compatibility.

### Step 2: Verify New Data
After re-extraction, check that `vault_leadership_philosophy` table has rows:

```sql
SELECT
  leadership_area,
  philosophy_statement,
  confidence_score,
  extraction_metadata->>'aiAnalyzed' as ai_analyzed,
  extraction_metadata->>'managementLevel' as management_level,
  extraction_metadata->>'teamSize' as team_size,
  extraction_metadata->>'budgetAmount' as budget_amount
FROM vault_leadership_philosophy
WHERE vault_id = '[Luke's resume_id]'
ORDER BY created_at DESC;
```

**Expected Results:**
- At least 1-3 rows
- `leadership_area` = "Manager" or "Director" or "Team Lead"
- `philosophy_statement` contains quotes like "Drilling Engineering Supervisor" or "managed team across 3-4 rigs"
- `extraction_metadata->>'budgetAmount'` = "$350M"
- `extraction_metadata->>'aiAnalyzed'` = true

### Step 3: Re-run Gap Analysis
Gap analysis needs to regenerate based on NEW resume data:

1. **Trigger gap analysis**:
   - Navigate to Master Resume Dashboard
   - Look for "Run Gap Analysis" or "Competitive Benchmark" button
   - Click to re-run

2. **Or call function directly**:
   ```bash
   curl -X POST https://[your-project].supabase.co/functions/v1/gap-analysis \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json" \
     -d '{
       "resumeId": "[resume_id]",
       "targetRoles": ["Drilling Engineering Supervisor"]
     }'
   ```
   Note: `vaultId` is also accepted for backward compatibility.

### Step 4: Verify Blocker Disappears
After gap analysis re-runs, check:

```sql
SELECT
  analysis_type,
  identified_gaps,
  strengths,
  vault_strength_at_analysis,
  percentile_ranking,
  created_at
FROM vault_gap_analysis
WHERE vault_id = '[Luke's resume_id]'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**
- `identified_gaps` array should NOT contain "Formal Management/Supervision Credentialization"
- `strengths` array SHOULD contain management/leadership strengths
- If management blocker is still present → AI extraction didn't work, need to debug

## Testing the AI Extraction

To confirm AI extraction is working correctly, check the Edge Function logs:

1. Go to Supabase Dashboard → Edge Functions → auto-populate-vault-v3
2. Look for recent invocations
3. Check logs for:
   ```
   🧠 Running AI-based management experience analysis...
   ✅ AI detected management experience:
     - Level: manager
     - Team size: 4
     - Budget: $350M
     - Confidence: 85%
   ✅ Stored 3 AI-analyzed management evidence items

   🎓 Running AI-based education analysis...
   ✅ AI detected education:
     - Degrees: 1
     - Confidence: 90%
   ✅ Stored 1 education items
   ```

If you DON'T see these logs → function hasn't been deployed yet or isn't being called.

## Deployment Status Check

Verify the new code is deployed:

```bash
cd /Users/johnschrup/always-on-contracts
git log --oneline -1
# Should show: "ARCHITECTURE: Replace regex-based career analysis with AI-powered analysis"

# Check if Supabase Edge Functions are deployed
npx supabase functions list
```

If functions aren't deployed, run:
```bash
npx supabase login
npx supabase link --project-ref [your-project-ref]
npx supabase functions deploy auto-populate-vault-v3
```

## Quick Sanity Test

To test if AI extraction works WITHOUT affecting Luke's data:

1. Create a test user account
2. Upload a simple resume with clear management indicators:
   ```
   John Smith
   Engineering Manager at Acme Corp
   - Led team of 12 engineers
   - Managed $5M annual budget
   - BS in Computer Science, MIT
   ```
3. Run extraction
4. Check if `vault_leadership_philosophy` table gets populated with AI-detected management data
5. If YES → system works, just need to re-run for Luke
6. If NO → AI extraction has a bug, need to debug

## Common Issues

**Issue 1: "No management experience detected"**
- Check AI prompt in `career-analysis-extractor.ts`
- Verify Perplexity API is working
- Check token limits aren't being hit

**Issue 2: "Function not found"**
- Edge function not deployed
- Run `npx supabase functions deploy auto-populate-vault-v3`

**Issue 3: "Blocker still appears after re-extraction"**
- Gap analysis wasn't re-run (still showing old cached gaps)
- Clear `vault_gap_analysis` table and re-run gap analysis

**Issue 4: "Permission denied"**
- RLS policies might be blocking the new columns
- Check `career_vault` table has columns: `formal_education`, `detected_industries`, etc.
