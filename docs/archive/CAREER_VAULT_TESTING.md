# Career Vault Onboarding - Testing Plan

## ✅ Code Changes Summary

### 1. Flow Restructure
- **OLD**: Focus → Upload → Research → Questions → Benchmark
- **NEW**: Upload → Focus → Research → Questions → Benchmark

### 2. Files Modified
- `src/pages/CareerVaultOnboardingRedesigned.tsx` - Reordered steps, updated state flow
- `src/components/career-vault/CareerFocusClarifier.tsx` - Complete redesign with AI suggestions
- `supabase/functions/suggest-adjacent-roles/index.ts` - New edge function for pivot suggestions
- `supabase/config.toml` - Added new edge function config

### 3. New Features
✅ Resume upload happens first
✅ AI analyzes resume to detect current role/industry
✅ Three career paths with realistic messaging:
  - **Stay in My Lane** - Pre-fills with detected role/industry
  - **Strategic Pivot** - AI suggests adjacent roles/industries
  - **Full Exploration** - Manual selection with full freedom
✅ Custom text input for roles/industries (comma-separated)
✅ Realistic timeline messaging (removed "10X" claims)
✅ Optional industry exclusions

---

## 🧪 Test Cases

### Test 1: Upload Resume First (Happy Path)
**Steps:**
1. Navigate to `/career-vault-onboarding`
2. Verify you see "Upload" step first (not "Focus")
3. Upload a sample resume (PDF or TXT)
4. Wait for upload to complete
5. Check console logs for:
   ```
   [UPLOAD] Calling process-resume for role/industry detection...
   [UPLOAD] Process-resume response: {...}
   [UPLOAD] Detected role: [role]
   [UPLOAD] Detected industry: [industry]
   ```
6. Verify toast: "Resume Uploaded! Now let's define your career direction..."
7. Verify step changes to "Focus"

**Expected Result:**
✅ Upload completes successfully
✅ Role/industry detected (or defaults to "Professional" / "General")
✅ Progress to Focus step automatically

---

### Test 2: "Stay in My Lane" Path
**Steps:**
1. Complete Test 1 (upload resume)
2. On Focus step, verify badge shows: "Detected: [role] in [industry]"
3. Click "Stay in My Lane" card
4. Verify pre-populated selections:
   - Target Roles: Should include detected role
   - Target Industries: Should include detected industry
5. Try adding custom role: "Chief Product Officer"
6. Try adding custom industry: "Artificial Intelligence"
7. Click Continue → Skip exclusions → "Start Building My Vault"

**Expected Result:**
✅ Detected role/industry appear in badge
✅ Pre-populated selections are correct
✅ Custom inputs are accepted and parsed
✅ Proceeds to Research step with combined roles/industries

---

### Test 3: "Strategic Pivot" Path with AI Suggestions
**Steps:**
1. Complete Test 1 (upload resume)
2. Click "Strategic Pivot" card
3. Verify loading state: "Analyzing your transferable skills..."
4. Wait for AI suggestions to load
5. Check console logs for edge function call:
   ```
   POST /functions/v1/suggest-adjacent-roles
   ```
6. Verify suggested roles appear (should be 3-5 adjacent roles)
7. Verify suggested industries appear (should be 3-5 adjacent industries)
8. Select 2-3 suggested roles
9. Select 2-3 suggested industries
10. Add custom role: "VP of Operations"
11. Click Continue → "Start Building My Vault"

**Expected Result:**
✅ Loading state appears immediately
✅ AI suggestions load within 5-10 seconds
✅ Suggested roles/industries are relevant to resume
✅ Both suggested and custom selections are combined
✅ Proceeds to Research step

**Edge Function Logs to Check:**
```
[SUGGEST-ADJACENT-ROLES] Analyzing resume for adjacent paths...
[SUGGEST-ADJACENT-ROLES] Successfully generated suggestions
Suggested roles: [...]
Suggested industries: [...]
```

---

### Test 4: "Full Exploration" Path
**Steps:**
1. Complete Test 1 (upload resume)
2. Click "Full Exploration" card
3. Verify generic role/industry lists appear (not AI suggestions)
4. Select 3 roles manually
5. Select 2 industries manually
6. Add custom roles: "CEO, President"
7. Add custom industries: "Healthcare, Finance"
8. Click Continue → Select exclusions → "Start Building My Vault"

**Expected Result:**
✅ Generic lists appear (not AI suggestions)
✅ Manual selections work
✅ Custom inputs are parsed (comma-separated)
✅ Exclusions are saved
✅ Proceeds to Research step with all data

---

### Test 5: Edge Function Error Handling
**Steps:**
1. Complete Test 1 (upload resume)
2. Click "Strategic Pivot" (to trigger suggest-adjacent-roles)
3. If edge function fails, verify fallback behavior:
   - Toast appears: "Could not load suggestions"
   - Generic role/industry lists appear instead
   - User can still proceed with manual selection

**Expected Result:**
✅ Graceful fallback to generic lists
✅ User is not blocked from proceeding
✅ Toast notification explains what happened

---

### Test 6: Process-Resume Detection Failure
**Steps:**
1. Upload a resume with unclear/minimal content
2. Check if process-resume fails to detect role/industry
3. Verify defaults are used:
   - detectedRole = "Professional"
   - detectedIndustry = "General"
4. Verify Focus step still works with defaults

**Expected Result:**
✅ Defaults are applied gracefully
✅ User sees "Detected: Professional in General"
✅ All career paths work with default values

---

### Test 7: Custom Input Parsing
**Steps:**
1. In Focus step, add custom roles:
   ```
   "Chief Product Officer, Head of Engineering, VP Sales"
   ```
2. Add custom industries:
   ```
   "Artificial Intelligence,Machine Learning, FinTech"
   ```
3. Complete flow
4. Check database: `career_vault` table
5. Verify `target_roles` and `target_industries` arrays include:
   - Badge selections
   - Parsed custom inputs (trimmed, no empty strings)

**Expected Result:**
✅ Comma-separated values are parsed correctly
✅ Extra spaces are trimmed
✅ All values are saved to database
✅ No duplicate entries

---

### Test 8: Progress Indicator & Step Order
**Steps:**
1. Navigate to onboarding
2. Verify progress bar and step labels:
   - **Step 1**: Upload (icon: Upload)
   - **Step 2**: Career Focus (icon: Target)
   - **Step 3**: Research (icon: Brain)
   - **Step 4**: Questions (icon: Sparkles)
   - **Step 5**: Review (icon: TrendingUp)
   - **Step 6**: Complete (icon: CheckCircle)

**Expected Result:**
✅ Correct step order matches new flow
✅ Progress bar updates correctly
✅ Current step is highlighted

---

### Test 9: Database Persistence
**Steps:**
1. Complete full onboarding flow
2. Query database:
   ```sql
   SELECT * FROM career_vault WHERE user_id = [your_user_id]
   ```
3. Verify fields are populated:
   - `career_direction`: 'stay' | 'pivot' | 'explore'
   - `target_roles`: Array of strings
   - `target_industries`: Array of strings
   - `excluded_industries`: Array of strings
   - `resume_raw_text`: Resume content

**Expected Result:**
✅ All fields are saved correctly
✅ Arrays contain expected values
✅ Career direction matches user selection

---

### Test 10: Back Navigation
**Steps:**
1. Upload resume → proceed to Focus
2. Select "Strategic Pivot" → wait for suggestions
3. Click "Back" button
4. Verify returns to Step 1 (career direction selection)
5. Select different path → verify previous selections are cleared

**Expected Result:**
✅ Back button works at each step
✅ State resets appropriately when going back

---

## 🔍 Edge Cases to Test

### Edge Case 1: No Resume Text
- Upload empty/corrupt file
- Verify error handling and user feedback

### Edge Case 2: Very Long Resume
- Upload 10+ page resume
- Verify process-resume handles it (may truncate to 3000 chars)

### Edge Case 3: Network Timeout
- Simulate slow network
- Verify loading states and timeouts are handled

### Edge Case 4: Existing Vault
- User with existing vault data
- Verify pre-population works correctly

---

## 📊 Success Criteria

✅ All 10 test cases pass
✅ No console errors
✅ Edge function logs show successful calls
✅ Database records are accurate
✅ User experience is smooth and logical
✅ Error states are handled gracefully
✅ Loading states provide feedback

---

## 🐛 Known Issues to Watch For

1. **Race condition**: detectedRole/detectedIndustry might not be set before Focus step renders
   - **Fix**: Added better logging and checks in handleUpload

2. **AI suggestion timeout**: suggest-adjacent-roles might take >10 seconds
   - **Fix**: Graceful fallback to generic lists

3. **Custom input parsing**: Edge cases with special characters
   - **Fix**: Trim and filter empty strings

4. **Network errors**: 429 rate limit or 402 payment required from Lovable AI
   - **Fix**: Catch and display user-friendly error messages

---

## 📝 Manual Testing Checklist

- [ ] Resume upload works
- [ ] Role/industry detection works (check logs)
- [ ] "Stay in My Lane" pre-populates correctly
- [ ] "Strategic Pivot" loads AI suggestions
- [ ] "Full Exploration" shows manual selection
- [ ] Custom text inputs parse correctly
- [ ] Exclusions are saved
- [ ] Progress indicator updates
- [ ] Database records are correct
- [ ] Error states show toasts
- [ ] Back navigation works
- [ ] Edge function deploys successfully
- [ ] All steps complete end-to-end

---

## 🚀 Deployment Verification

After deployment, check:
1. Edge function appears in Lovable Cloud backend
2. Function logs show successful invocations
3. No 404 errors when calling suggest-adjacent-roles
4. LOVABLE_API_KEY is configured in environment

---

## 🎯 Next Steps After Testing

1. Gather user feedback on AI suggestions quality
2. Monitor edge function performance and costs
3. A/B test messaging (timeline claims)
4. Optimize AI prompt for better suggestions
5. Add analytics tracking for career path choices
