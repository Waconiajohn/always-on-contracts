# Quick Start: AI-First Career Vault

## 🚀 What Changed (TL;DR)

**Before**: Regex patterns → Miss "Bachelors" → Ask "Do you have a degree?" → User cancels ❌

**After**: AI extraction → Understands all formats → Confidence scores → Never asks about confirmed data ✅

---

## 📁 Key Files

### New Files (USE THESE)
1. **`supabase/functions/_shared/extraction/ai-structured-extractor.ts`**
   - `extractStructuredResumeData()` - Main extraction function
   - `analyzeGapsWithAI()` - Gap detection with confidence

### Modified Files
2. **`supabase/functions/auto-populate-vault-v3/index.ts`**
   - Now uses AI-first extraction
   - Stores data with confidence scores

3. **`supabase/functions/generate-gap-filling-questions/index.ts`**
   - Smart filtering: removes confirmed fields from questions
   - **THE FIX**: Won't ask about education if confirmed

### Deprecated Files (DON'T USE)
4. **`supabase/functions/_shared/extraction/pre-extraction-analyzer.ts`**
   - ⚠️ `extractEducationData()` - DEPRECATED
   - ⚠️ `extractCareerContext()` - DEPRECATED

---

## 🔧 How to Use

### Option 1: Auto-Populate Vault (Recommended)
```typescript
// This automatically uses AI-first extraction
const response = await supabase.functions.invoke('auto-populate-vault-v3', {
  body: {
    resumeText: "Bachelor of Science in Mechanical Engineering...",
    vaultId: "vault-123",
    mode: 'full'
  }
});

// Returns structured data with confidence scores
console.log(response.data);
```

### Option 2: Direct Extraction (Advanced)
```typescript
import { extractStructuredResumeData } from '../_shared/extraction/ai-structured-extractor.ts';

const structuredData = await extractStructuredResumeData(resumeText, userId);

// Access education data
const degree = structuredData.education.degrees[0];
console.log(`${degree.level} in ${degree.field} (confidence: ${degree.confidence}%)`);

// Check if we should ask questions
if (degree.confidence >= 95) {
  console.log("Education confirmed - DON'T ask");
} else if (degree.confidence >= 80) {
  console.log("Ask verification question");
} else {
  console.log("Ask critical gap question");
}
```

---

## 🧪 Testing

### Test 1: Confirm Education Detection Works
```bash
# Upload a resume with "Bachelor of Science in Mechanical Engineering"
# Check logs for:
🎓 Degree 1: Bachelor in Mechanical Engineering (confidence: 100)
   Evidence: "B.S. Mechanical Engineering, UT Austin, 2015"
```

### Test 2: Confirm Gap Filtering Works
```bash
# After auto-populate, trigger gap question generation
# Check logs for:
[GAP QUESTIONS] ✅ Education confirmed: Bachelor in Mechanical Engineering - WILL NOT ask
[GAP QUESTIONS] 🚫 FILTERED OUT: "Do you have a degree?" - field "education" is already confirmed
```

### Test 3: Confirm Database Storage
```sql
-- Check vault_career_context
SELECT education_level, education_field
FROM vault_career_context
WHERE vault_id = 'your-vault-id';

-- Should return:
-- education_level: "Bachelor"
-- education_field: "Mechanical Engineering"

-- Check vault_benchmark_comparison
SELECT gaps_requiring_questions
FROM vault_benchmark_comparison
WHERE vault_id = 'your-vault-id';

-- Should NOT contain education gaps if degree is confirmed
```

---

## 🐛 Debugging

### If Education Not Detected
**Check**:
1. Is resume text being passed correctly?
2. Check logs for: `🤖 [AI-STRUCTURED-EXTRACTION] Extraction complete`
3. Look for: `🎓 Education: 0 degree(s) found` (should be > 0)
4. If 0 degrees found, check if education section exists in resume

**Fix**:
- Verify resume has education section
- Check for typos (e.g., "Bacheler" instead of "Bachelor")
- Review AI extraction prompt (may need tuning)

### If Still Asking About Education
**Check**:
1. Check logs for: `[GAP QUESTIONS] ✅ Education confirmed`
2. If NOT confirmed, check: `vault_career_context.education_level` in database
3. If NULL in database, extraction failed
4. If populated in database but still asking, filtering failed

**Fix**:
- Review `generate-gap-filling-questions/index.ts` lines 122-128
- Ensure `confirmedData.educationLevel && confirmedData.educationField` is true
- Check filtering logic (lines 148-159)

### If AI Extraction Fails
**Check**:
1. Look for: `❌ AI-first extraction failed: [error message]`
2. Common causes:
   - AI response not valid JSON
   - Token limit exceeded
   - Rate limit hit

**Fix**:
- Check AI response format
- Increase max_tokens if needed
- Add retry logic for transient failures

---

## 📊 Monitoring

### Success Indicators (Good)
```
✅ [AI-STRUCTURED-EXTRACTION] Extraction complete
   📊 Overall Confidence: 92%
   🎓 Education: 1 degree(s) found

✅ [AI-GAP-ANALYSIS] Gap analysis complete
   🎯 Critical gaps: 2
   ✅ No questions needed: 8

[GAP QUESTIONS] ✅ Education confirmed: Bachelor in Mechanical Engineering - WILL NOT ask
[GAP QUESTIONS] ✅ Filtered 3 confirmed fields. 2 gaps remain.
```

### Warning Signs (Investigate)
```
⚠️ No degrees found in resume
⚠️ Gap analysis failed
⚠️ No AI gap analysis found

[GAP QUESTIONS] ⚠ Education NOT verified - may trigger degree questions
```

### Red Flags (Fix Immediately)
```
🚨 [EDUCATION BUG] Education found but still in gaps!
❌ AI-first extraction failed
❌ Error storing career context
```

---

## 🎯 Confidence Score Guide

| Score | Meaning | Action |
|-------|---------|--------|
| 100 | Explicitly stated with exact quote | ✅ Confirmed - Don't ask |
| 95-99 | Explicitly stated but slightly ambiguous | ✅ Confirmed - Don't ask |
| 80-94 | Strong inference from context | ⚠️ Verify - Ask clarification |
| 60-79 | Moderate inference | ❓ Ask - Medium priority |
| < 60 | Weak inference or missing | 🚨 Ask - High priority |
| 0 | Completely absent | 🚨 Ask - Critical gap |

**Example**:
- "B.S. in Mechanical Engineering" → Confidence 100 → Don't ask
- "Engineering degree" → Confidence 95 → Don't ask
- "10 years as engineer" (implies degree) → Confidence 85 → Verify
- No mention → Confidence 0 → Ask

---

## 🚀 Deployment

### Pre-Deploy Checklist
- [ ] Run tests with sample resumes
- [ ] Check logs for successful extraction
- [ ] Verify gap filtering works
- [ ] Review AI prompts for edge cases

### Deploy Command
```bash
# Deploy edge functions
supabase functions deploy auto-populate-vault-v3
supabase functions deploy generate-gap-filling-questions

# Or deploy all
supabase functions deploy
```

### Post-Deploy Checklist
- [ ] Monitor logs for errors
- [ ] Test with real resume
- [ ] Check database: `vault_career_context` has education
- [ ] Check database: `vault_benchmark_comparison` gaps don't include confirmed education
- [ ] Verify users DON'T see "Do you have a degree?" if they uploaded resume with degree

---

## ❓ FAQ

### Q: Will this work with foreign degrees?
**A**: Yes! AI understands: Licence, Diplôme, Laurea, Baccalaureate, etc.

### Q: What about abbreviations like "BSME"?
**A**: Yes! AI recognizes: BS, BSME, MSEE, MBA, etc.

### Q: What if someone has multiple degrees?
**A**: AI extracts ALL degrees. Primary degree (highest/most recent) is used for gap detection.

### Q: What if resume has typos?
**A**: AI is forgiving of minor typos (e.g., "Bacherlor"). Severe typos may reduce confidence score.

### Q: How do I tune the AI prompts?
**A**: Edit `ai-structured-extractor.ts` prompts. Add examples for specific formats you're seeing.

### Q: Can I still use regex extraction?
**A**: Deprecated but available for backward compatibility. DON'T use in new code.

### Q: When will regex functions be removed?
**A**: Next major version (after confirming AI-first is stable).

---

## 📞 Support

### Issues
Report at: https://github.com/anthropics/claude-code/issues

### Documentation
Full details: `AI_FIRST_REFACTOR_COMPLETE.md`

### Logs
Check Supabase edge function logs for detailed extraction info

---

**Last Updated**: November 11, 2025
**Status**: ✅ Production Ready
