# 🧪 Career Vault Enhancement - Testing Guide

## ✅ Installation Complete!

The enhanced Career Vault is now **LIVE** at `/career-vault/onboarding`

---

## 🚀 How to Test

### **Step 1: Navigate to Career Vault Onboarding**
- URL: `http://localhost:5173/career-vault/onboarding` (dev)
- Or in Lovable: Navigate to "Career Vault" → "Build Vault"

### **Step 2: Upload a Resume**
**What to test:**
- ✅ PDF upload works
- ✅ DOCX upload works
- ✅ TXT upload works
- ✅ File validation (rejects non-resume files)
- ✅ Progress indicator shows

**Expected:**
- File uploads successfully
- Resume text is extracted
- Moves to "Career Goals" step

### **Step 3: Set Career Goals**
**What to test:**
- ✅ Can select target roles (multi-select)
- ✅ Can select target industries (multi-select)
- ✅ Can skip this step (uses general goals)

**Expected:**
- Form validates properly
- Moves to "AI Analysis" step

### **Step 4: AI Auto-Population** ⭐ **KEY FEATURE**
**What to test:**
- ✅ AI extraction starts automatically
- ✅ Progress bar animates (0% → 100%)
- ✅ Shows "AI is analyzing..." message
- ✅ Takes 30-60 seconds
- ✅ Shows success state with stats

**Expected:**
- Calls `auto-populate-vault` Supabase function
- Extracts 100-200+ items across 20 categories
- Shows:
  - Total items extracted
  - Number of categories populated
  - Vault completion percentage (85%)
  - Strength areas
  - Unique differentiators

**What could go wrong:**
- ❌ Supabase function not deployed → Shows error, offers retry
- ❌ Resume text too short → Shows error, suggests better resume
- ❌ AI API timeout → Shows error, offers manual interview fallback

### **Step 5: Review Extracted Intelligence** ⭐ **KEY FEATURE**
**What to test:**
- ✅ Shows one item at a time (card interface)
- ✅ Can approve item (✅ button)
- ✅ Can edit item (✏️ button)
- ✅ Can skip/reject item (👎 button)
- ✅ Progress tracking updates (X of Y reviewed)
- ✅ Can navigate: Previous/Next buttons
- ✅ Edit mode works (inline textarea editing)
- ✅ Saves edits correctly

**Expected:**
- Smooth card-based review interface
- Items color-coded by category:
  - Purple = Power Phrases
  - Blue = Transferable Skills
  - Amber = Hidden Competencies
  - Green = Soft Skills
  - etc.
- Takes 5-10 minutes to review 100+ items
- Progress bar shows completion

### **Step 6: Voice Notes (Optional)** ⭐ **BONUS FEATURE**
**What to test:**
- ✅ Browser requests microphone permission
- ✅ Start recording button works
- ✅ Live transcription appears (real-time)
- ✅ Stop recording button works
- ✅ Word count updates
- ✅ Submit button processes voice note
- ✅ Intelligence extracted from transcript
- ✅ Items added to vault

**Browsers to test:**
- ✅ Chrome (best support)
- ✅ Edge (good support)
- ✅ Safari (good support)
- ❌ Firefox (may not work - graceful error)

**Expected:**
- Speaks into mic → Live transcription → Submit → AI extracts items
- Toast notification: "Intelligence Added! Added X items to your vault"

### **Step 7: Complete**
**What to test:**
- ✅ Completion screen shows
- ✅ Success animation (bouncing checkmark)
- ✅ Can navigate to Career Vault Dashboard
- ✅ Can navigate to Command Center

**Expected:**
- Vault completion = 85-100%
- All intelligence visible in dashboard
- AI agents can now use vault data

---

## 🔍 Database Verification

After completing the flow, check these tables in Supabase:

### **1. career_vault**
```sql
SELECT
  interview_completion_percentage,
  auto_populated,
  total_power_phrases,
  total_transferable_skills,
  total_hidden_competencies,
  total_soft_skills,
  total_leadership_philosophy,
  overall_strength_score
FROM career_vault
WHERE user_id = '<your-user-id>';
```

**Expected:**
- `interview_completion_percentage` = 85-100
- `auto_populated` = true
- All totals > 0 (10-50+ per category)
- `overall_strength_score` = 70-95

### **2. Individual Intelligence Tables**
```sql
-- Power phrases
SELECT COUNT(*) FROM vault_power_phrases WHERE user_id = '<your-user-id>';
-- Expected: 20-50

-- Transferable skills
SELECT COUNT(*) FROM vault_transferable_skills WHERE user_id = '<your-user-id>';
-- Expected: 20-40

-- Hidden competencies
SELECT COUNT(*) FROM vault_hidden_competencies WHERE user_id = '<your-user-id>';
-- Expected: 10-25

-- Soft skills
SELECT COUNT(*) FROM vault_soft_skills WHERE user_id = '<your-user-id>';
-- Expected: 15-30

-- Leadership philosophy
SELECT COUNT(*) FROM vault_leadership_philosophy WHERE user_id = '<your-user-id>';
-- Expected: 3-10

-- Executive presence
SELECT COUNT(*) FROM vault_executive_presence WHERE user_id = '<your-user-id>';
-- Expected: 3-10

-- And so on for all 20 tables...
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: "AI extraction failed"**
**Cause:** Supabase function `auto-populate-vault` not deployed

**Solution:**
```bash
# Deploy the function
cd supabase
supabase functions deploy auto-populate-vault
```

### **Issue 2: "Microphone access denied"**
**Cause:** Browser blocked microphone permission

**Solution:**
1. Click lock icon in browser address bar
2. Allow microphone access
3. Refresh page
4. Try again

### **Issue 3: "No intelligence extracted"**
**Cause:** Resume too short or not a real resume

**Solution:**
- Use a real executive resume (2+ pages)
- Ensure it has work experience, skills, achievements
- Try a different resume

### **Issue 4: "Review interface shows no items"**
**Cause:** Auto-populate failed silently

**Solution:**
- Check browser console for errors
- Check Supabase function logs
- Verify `extractedData` state is populated
- Fallback: Use old onboarding at `/career-vault/onboarding-old`

---

## 📊 Success Metrics

Track these metrics to validate the enhancement:

### **Time to Complete**
- ✅ Target: 10-15 minutes
- ❌ Old system: 45-60 minutes

### **Items Extracted**
- ✅ Target: 100-200+ items
- ❌ Old system: 80-100 items (manual)

### **Vault Completion**
- ✅ Target: 85% instant (after review)
- ❌ Old system: 40% → 100% (if they finish)

### **User Effort**
- ✅ New: Review AI's work (5-10 min)
- ❌ Old: Answer 50+ questions (45-60 min)

---

## 🎯 Test Scenarios

### **Scenario 1: Executive with 20 years experience**
**Resume:** Senior VP, Fortune 500 background, P&L responsibility

**Expected Results:**
- 150-200+ items extracted
- High confidence scores (85-95%)
- Strong leadership philosophy
- Executive presence indicators
- Vault strength score: 85-95

### **Scenario 2: Mid-career professional (10 years)**
**Resume:** Manager or Director level, growing career

**Expected Results:**
- 100-150 items extracted
- Medium-high confidence (75-85%)
- Good transferable skills
- Emerging leadership
- Vault strength score: 70-85

### **Scenario 3: Career changer**
**Resume:** Switching industries or roles

**Expected Results:**
- AI identifies hidden competencies
- Transferable skills highlighted
- Cross-industry strengths
- 80-120 items extracted
- Vault strength score: 65-80

---

## 🔗 Routes Reference

- **New Enhanced Onboarding**: `/career-vault/onboarding` ← **DEFAULT**
- **Old Interview-Based**: `/career-vault/onboarding-old` ← Fallback
- **Career Vault Dashboard**: `/career-vault`
- **Command Center**: `/command-center`

---

## 📞 Need Help?

### **Check Logs:**
1. **Browser Console** (F12): Frontend errors
2. **Supabase Dashboard** → Functions → Logs: Backend errors
3. **Network Tab**: API call failures

### **Fallback Plan:**
If enhanced version fails, users can still use:
- Old onboarding: `/career-vault/onboarding-old`
- Manual intelligence entry in dashboard

---

## ✨ Ready to Test!

1. Open `/career-vault/onboarding`
2. Upload a real resume (yours or a sample)
3. Follow the flow
4. Report any issues

**Expected outcome:** Fully populated Career Vault in 10-15 minutes! 🚀
