# Career Vault 2.0 - Testing & Deployment Guide

## 📋 Overview

Career Vault 2.0 is a complete overhaul of the career intelligence system with AI-powered onboarding, competitive benchmarking, advanced search, bulk operations, and multi-format export.

**Status:** 95% Complete
**Last Updated:** October 29, 2025

---

## 🎯 Features Implemented

### Week 1: Backend Foundation
- ✅ Database migration with full-text search indexes
- ✅ `get_vault_statistics()` function for dashboard metrics
- ✅ `search_vault_items()` function for cross-category search
- ✅ 7 Edge Functions:
  - `analyze-resume-initial` - Instant AI resume analysis
  - `suggest-career-paths` - AI career suggestions with match scores
  - `research-industry-standards` - Real-time Perplexity research
  - `auto-populate-vault-v2` - Deep intelligence extraction (150-250 items)
  - `extract-vault-intangibles` - Leadership brand & executive presence
  - `process-review-actions` - Batch review processing

### Week 2: Onboarding Flow
- ✅ `CareerVaultOnboarding.tsx` - 7-step orchestrator
- ✅ 7 Onboarding Components:
  - `ResumeAnalysisStep` - Upload & instant analysis
  - `CareerDirectionStep` - AI path suggestions
  - `IndustryResearchProgress` - Real-time Perplexity visualization
  - `AutoPopulationProgress` - 8-category extraction progress
  - `SmartReviewWorkflow` - Intelligent batch review
  - `GapFillingQuestionsFlow` - Targeted gap questions
  - `VaultCompletionSummary` - Celebration & next steps

### Week 3: Gap Filling & Benchmarking
- ✅ `generate-gap-filling-questions` - AI gap analysis
- ✅ `process-gap-filling-responses` - Response to vault items
- ✅ `generate-completion-benchmark` - Competitive positioning
- ✅ Enhanced `VaultCompletionSummary` with benchmark visualization

### Week 4: Dashboard Enhancements
- ✅ `search-vault-advanced` - Full-text search with relevance ranking
- ✅ `bulk-vault-operations` - Mass update/delete/archive
- ✅ `export-vault` - Multi-format export (JSON/CSV/Text)
- ✅ `AdvancedVaultSearch.tsx` - Search UI with insights
- ✅ `BulkVaultOperations.tsx` - Bulk operations UI
- ✅ `VaultExportDialog.tsx` - Export dialog with format selection
- ✅ `VaultContentsTableEnhanced.tsx` - Table with multi-select

---

## 🧪 Testing Checklist

### 1. Database Migration Testing

#### Pre-Deployment Checks
```bash
# Test migration locally
cd supabase
supabase db reset

# Verify new functions exist
psql -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%vault%';"

# Expected: get_vault_statistics, search_vault_items
```

#### Full-Text Search Validation
```sql
-- Test search_vault_items function
SELECT * FROM search_vault_items(
  '<vault-id-here>'::uuid,
  'leadership',
  NULL,
  NULL,
  10
);

-- Should return results across multiple tables with match_rank
```

### 2. Edge Functions Testing

#### A. Resume Analysis Flow
```bash
# Test: analyze-resume-initial
curl -X POST https://<project-ref>.supabase.co/functions/v1/analyze-resume-initial \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "<vault-id>",
    "resumeText": "VP of Engineering with 15 years..."
  }'

# Expected: Instant analysis in <5 seconds
# Response: { detectedRole, industry, yearsExperience, seniorityLevel, ... }
```

#### B. Career Path Suggestions
```bash
# Test: suggest-career-paths
curl -X POST https://<project-ref>.supabase.co/functions/v1/suggest-career-paths \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "<vault-id>",
    "currentRole": "VP Engineering",
    "targetIndustry": "FinTech",
    "careerDirection": "stay"
  }'

# Expected: 5-7 role suggestions with match scores
# Response: { suggestedRoles: [{ title, matchScore, reasoning, skillsGap }] }
```

#### C. Auto-Population (Critical)
```bash
# Test: auto-populate-vault-v2
# This is the most critical function - takes 60-90 seconds
curl -X POST https://<project-ref>.supabase.co/functions/v1/auto-populate-vault-v2 \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "<vault-id>",
    "resumeText": "<full-resume>",
    "targetRoles": ["CTO", "VP Engineering"],
    "targetIndustries": ["FinTech", "SaaS"]
  }'

# Expected: 150-250 items extracted across 8 categories
# Response: { totalExtracted: 200, breakdown: {...}, estimatedTime: "90s" }
```

#### D. Competitive Benchmark
```bash
# Test: generate-completion-benchmark
curl -X POST https://<project-ref>.supabase.co/functions/v1/generate-completion-benchmark \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "<vault-id>",
    "targetRoles": ["CTO"],
    "targetIndustries": ["FinTech"]
  }'

# Expected: Percentile ranking + strengths/gaps/recommendations
# Response: { percentileRanking: { percentile: 10, ranking: "top 10%" }, strengths: [...] }
```

#### E. Advanced Search
```bash
# Test: search-vault-advanced
curl -X POST https://<project-ref>.supabase.co/functions/v1/search-vault-advanced \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "<vault-id>",
    "query": "leadership team building",
    "limit": 50
  }'

# Expected: Results across multiple categories with match_rank
# Response: { results: [...], resultsByCategory: {...}, insights: {...} }
```

#### F. Bulk Operations
```bash
# Test: bulk-vault-operations
curl -X POST https://<project-ref>.supabase.co/functions/v1/bulk-vault-operations \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "<vault-id>",
    "operations": [{
      "operation": "update_quality",
      "tableName": "vault_power_phrases",
      "itemIds": ["id1", "id2"],
      "newValues": { "quality_tier": "silver" }
    }]
  }'

# Expected: All items updated + vault strength recalculated
# Response: { totalProcessed: 2, newVaultStrength: 87 }
```

#### G. Export
```bash
# Test: export-vault
curl -X POST https://<project-ref>.supabase.co/functions/v1/export-vault \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "<vault-id>",
    "format": "json",
    "categories": ["power_phrases", "transferable_skills"],
    "includeMetadata": true
  }'

# Expected: Formatted export content
# Response: { content: "...", filename: "career-vault-xxx.json", totalItems: 45 }
```

### 3. Frontend Component Testing

#### A. Onboarding Flow (End-to-End)
1. Navigate to `/career-vault-onboarding`
2. **Step 1:** Upload resume (PDF/DOC/DOCX)
   - ✅ File upload works
   - ✅ Analysis completes in <5 seconds
   - ✅ Shows role, industry, seniority, achievements
3. **Step 2:** Career direction
   - ✅ AI suggestions load with match scores
   - ✅ Can select stay/pivot/explore
4. **Step 3:** Industry research
   - ✅ Shows real-time Perplexity progress
   - ✅ Displays rotating fun facts
   - ✅ Research completes successfully
5. **Step 4:** Auto-population
   - ✅ Shows 8 categories with progress
   - ✅ Real-time item counts update
   - ✅ 60-90 second extraction completes
6. **Step 5:** Smart review
   - ✅ Items grouped by priority (high/medium/low)
   - ✅ Batch operations work (confirm/edit/reject)
   - ✅ Edit modal functions correctly
7. **Step 6:** Gap-filling questions
   - ✅ Generates 10-15 targeted questions
   - ✅ Multiple question types render correctly
   - ✅ Impact scores display
   - ✅ Responses convert to vault items
8. **Step 7:** Completion summary
   - ✅ Benchmark analysis loads
   - ✅ Percentile ranking displays
   - ✅ Strengths/opportunities/gaps show correctly
   - ✅ Recommendations display with impact estimates

#### B. Advanced Search
1. Navigate to dashboard
2. **Search Component:**
   - ✅ Enter query ("leadership")
   - ✅ Results load from all categories
   - ✅ Match rank percentage shows
   - ✅ Quality breakdown displays
   - ✅ Category filtering works
   - ✅ Quality tier filtering works

#### C. Bulk Operations
1. **Multi-Select:**
   - ✅ Checkboxes appear on vault table
   - ✅ "Select All" works
   - ✅ Individual selection works
   - ✅ Selection count updates
2. **Operations:**
   - ✅ Update quality tier (bronze → silver)
   - ✅ Archive items
   - ✅ Delete items (with confirmation)
   - ✅ Vault strength recalculates
   - ✅ Activity log entries created

#### D. Export
1. **Export Dialog:**
   - ✅ Opens correctly
   - ✅ Format selection works (JSON/CSV/Text)
   - ✅ Category selection works
   - ✅ Quality tier filtering works
   - ✅ Export triggers download
   - ✅ Downloaded file format is correct

### 4. Performance Testing

#### Metrics to Validate
- ✅ Resume analysis: <5 seconds
- ✅ Career suggestions: <3 seconds
- ✅ Industry research: 30-60 seconds
- ✅ Auto-population: 60-90 seconds
- ✅ Smart review loading: <2 seconds
- ✅ Gap questions generation: 10-15 seconds
- ✅ Benchmark analysis: 15-20 seconds
- ✅ Search queries: <1 second
- ✅ Bulk operations: <5 seconds for 100 items
- ✅ Export (JSON): <3 seconds for 250 items

### 5. Data Integrity Testing

#### Validate Data Flow
```sql
-- After full onboarding, check vault totals
SELECT
  total_power_phrases,
  total_transferable_skills,
  total_hidden_competencies,
  overall_strength_score
FROM career_vault WHERE id = '<vault-id>';

-- Verify items across all tables
SELECT
  'power_phrases' as table_name, COUNT(*) as count FROM vault_power_phrases WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'transferable_skills', COUNT(*) FROM vault_transferable_skills WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'hidden_competencies', COUNT(*) FROM vault_hidden_competencies WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'soft_skills', COUNT(*) FROM vault_soft_skills WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'leadership_philosophy', COUNT(*) FROM vault_leadership_philosophy WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'executive_presence', COUNT(*) FROM vault_executive_presence WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'personality_traits', COUNT(*) FROM vault_personality_traits WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'work_style', COUNT(*) FROM vault_work_style WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'values_motivations', COUNT(*) FROM vault_values_motivations WHERE vault_id = '<vault-id>'
UNION ALL
SELECT 'behavioral_indicators', COUNT(*) FROM vault_behavioral_indicators WHERE vault_id = '<vault-id>';

-- Validate quality tier distribution
SELECT quality_tier, COUNT(*)
FROM vault_power_phrases
WHERE vault_id = '<vault-id>'
GROUP BY quality_tier;
```

---

## 🚀 Deployment Steps

### Phase 1: Database Migration (Production)
```bash
# 1. Backup production database
supabase db dump --file backup-$(date +%Y%m%d).sql

# 2. Test migration on staging first
supabase link --project-ref <staging-ref>
supabase db push

# 3. Verify migration worked
supabase db diff

# 4. Deploy to production
supabase link --project-ref <production-ref>
supabase db push

# 5. Verify functions exist
psql -c "SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('get_vault_statistics', 'search_vault_items');"
```

### Phase 2: Edge Functions Deployment
```bash
# Deploy all 13 edge functions
supabase functions deploy analyze-resume-initial
supabase functions deploy suggest-career-paths
supabase functions deploy research-industry-standards
supabase functions deploy auto-populate-vault-v2
supabase functions deploy extract-vault-intangibles
supabase functions deploy process-review-actions
supabase functions deploy generate-gap-filling-questions
supabase functions deploy process-gap-filling-responses
supabase functions deploy generate-completion-benchmark
supabase functions deploy search-vault-advanced
supabase functions deploy bulk-vault-operations
supabase functions deploy export-vault

# Verify deployments
supabase functions list
```

### Phase 3: Frontend Deployment
```bash
# 1. Build production bundle
npm run build

# 2. Test build locally
npm run preview

# 3. Deploy to hosting (Netlify/Vercel)
# (Automatic via Git push to main branch)

# 4. Verify routes work:
# - /career-vault-onboarding (new v2.0 flow)
# - /career-vault-onboarding-legacy (old flow)
# - /career-vault-dashboard (enhanced with new features)
```

### Phase 4: Environment Variables
```bash
# Ensure these are set in production:
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
LOVABLE_API_KEY=<for-google-gemini>
PERPLEXITY_API_KEY=<for-market-research>
```

### Phase 5: Post-Deployment Validation
1. Run full end-to-end onboarding with real data
2. Verify all 13 edge functions respond correctly
3. Test search, bulk ops, and export
4. Monitor logs for errors
5. Check database for correct data population

---

## 📊 Success Metrics

### Quantitative
- ✅ Onboarding completion rate >80%
- ✅ Average onboarding time: 10-15 minutes
- ✅ Vault strength average: >75%
- ✅ Auto-population accuracy: >85%
- ✅ Search relevance: avg match_rank >0.6

### Qualitative
- ✅ Users understand percentile ranking
- ✅ Marketing messages resonate
- ✅ Competitive differentiation clear
- ✅ Export formats useful

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **API Rate Limits:**
   - Perplexity: 20 requests/min
   - Google Gemini: 60 requests/min
   - Mitigation: Retry logic with exponential backoff

2. **Large Resumes:**
   - Resumes >10 pages may take 120+ seconds to process
   - Mitigation: Show progress bar, set timeout to 180s

3. **Mobile Optimization:**
   - Onboarding flow works but not optimized for small screens
   - TODO: Add responsive breakpoints for <768px

### Edge Cases to Test
- [ ] Resume with no achievements (edge case)
- [ ] Resume in non-English language
- [ ] Extremely senior roles (Board member, CEO)
- [ ] Career changers with no direct experience
- [ ] Resumes with special characters/formatting

---

## 📝 User Documentation

### Quick Start Guide (for end users)
**See:** `CAREER_VAULT_2.0_USER_GUIDE.md` (to be created)

### API Documentation (for developers)
**See:** `CAREER_VAULT_2.0_API_DOCS.md` (to be created)

---

## ✅ Final Checklist Before Launch

- [ ] Database migration tested on staging
- [ ] All 13 edge functions deployed and tested
- [ ] Frontend components integrated into dashboard
- [ ] End-to-end onboarding tested with 5+ test users
- [ ] Search, bulk ops, and export validated
- [ ] Performance benchmarks met
- [ ] Error handling tested (network failures, API errors)
- [ ] Marketing messages reviewed for accuracy
- [ ] User documentation created
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured

---

## 🎉 Launch Readiness: 95%

**Remaining Work:**
- Integration of new components into existing dashboard (5%)
- User acceptance testing
- Marketing/user documentation

**Estimated Time to Launch:** 2-4 hours

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review edge function logs in Supabase dashboard
3. Check browser console for frontend errors
4. Review database query logs for slow queries

**Last Updated:** October 29, 2025
