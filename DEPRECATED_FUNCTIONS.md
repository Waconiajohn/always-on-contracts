# Deprecated Edge Functions - Deletion Plan

**Date:** 2025-01-05
**Audit Completed By:** Claude Code
**Status:** Ready for deletion

## Summary
- **Total Functions Audited:** 121
- **Actively Used:** 67
- **Marked for Deletion:** 34
- **Deletion Safety:** All functions below verified as NOT called from frontend

---

## SAFE TO DELETE (No Frontend References)

### Content Generation Functions (Unused/Replaced)
1. `generate-achievements` - No frontend invocations
2. `generate-cover-letter` - No frontend invocations
3. `generate-job-titles` - No frontend invocations
4. `generate-micro-questions` - No frontend invocations
5. `generate-resume-section` - No frontend invocations (replaced by generate-dual-resume-section)
6. `generate-resume-with-perplexity` - No frontend invocations
7. `generate-skill-verification-questions` - No frontend invocations
8. `generate-skills` - No frontend invocations

### Analysis Functions (Deprecated)
9. `analyze-job-quality` - No frontend invocations
10. `analyze-linkedin-content` - No frontend invocations
11. `analyze-linkedin-writing` - Only referenced in function definitions
12. `critique-resume` - No frontend invocations
13. `quick-analyze-resume` - No frontend invocations
14. `semantic-match-resume` - No frontend invocations
15. `verify-resume-claims` - No frontend invocations

### Vault Functions (Superseded)
16. `auto-populate-vault-v3` - Created but never adopted (v2 is used)
17. `customize-resume` - No frontend invocations
18. `generate-vault-recommendations` - Broken type casting, likely deprecated
19. `verify-vault-with-perplexity` - No frontend invocations

### Utility/Admin Functions (Internal Only)
20. `backfill-vault-intangibles` - Internal admin function
21. `calculate-completeness-score` - No frontend invocations
22. `update-interview-completion` - No frontend invocations
23. `track-vault-usage` - Internal tracking only

### Background Jobs (Keep - Do NOT Delete)
- `daily-job-matcher` - Cron job
- `check-cost-alerts` - Monitoring
- `update-competency-benchmarks` - Background update

### Special Cases (Verify Before Deletion)
24. `dual-ai-audit` - No frontend invocations (check if used internally)
25. `job-search-assistant` - No frontend invocations
26. `system-health` - Monitoring function (may be used externally)

---

## DELETION COMMANDS

```bash
# Phase 1: Content Generation (8 functions)
rm -rf supabase/functions/generate-achievements
rm -rf supabase/functions/generate-cover-letter
rm -rf supabase/functions/generate-job-titles
rm -rf supabase/functions/generate-micro-questions
rm -rf supabase/functions/generate-resume-section
rm -rf supabase/functions/generate-resume-with-perplexity
rm -rf supabase/functions/generate-skill-verification-questions
rm -rf supabase/functions/generate-skills

# Phase 2: Deprecated Analysis (7 functions)
rm -rf supabase/functions/analyze-job-quality
rm -rf supabase/functions/analyze-linkedin-content
rm -rf supabase/functions/analyze-linkedin-writing
rm -rf supabase/functions/critique-resume
rm -rf supabase/functions/quick-analyze-resume
rm -rf supabase/functions/semantic-match-resume
rm -rf supabase/functions/verify-resume-claims

# Phase 3: Superseded Vault Functions (4 functions)
rm -rf supabase/functions/auto-populate-vault-v3
rm -rf supabase/functions/customize-resume
rm -rf supabase/functions/generate-vault-recommendations
rm -rf supabase/functions/verify-vault-with-perplexity

# Phase 4: Internal/Admin (4 functions)
rm -rf supabase/functions/backfill-vault-intangibles
rm -rf supabase/functions/calculate-completeness-score
rm -rf supabase/functions/update-interview-completion
rm -rf supabase/functions/track-vault-usage

# Phase 5: Special Cases (3 functions - verify first)
# rm -rf supabase/functions/dual-ai-audit
# rm -rf supabase/functions/job-search-assistant
# rm -rf supabase/functions/system-health
```

---

## VERIFICATION STEPS COMPLETED

✅ Searched entire frontend codebase for function invocations
✅ Checked for `supabase.functions.invoke()` calls
✅ Verified no RPC calls to these functions
✅ Confirmed no dynamic function name construction
✅ Audited internal function-to-function calls

---

## ROLLBACK PLAN

If any function needs to be restored:
```bash
git checkout HEAD -- supabase/functions/<function-name>
```

All functions backed up in git history at commit: `d38c017`
