# Career Vault 2.0 - End-to-End Testing Checklist

**Version:** 2.0
**Last Updated:** October 30, 2025
**Status:** Ready for Testing

---

## Prerequisites

### Database Migrations
- [ ] All 3 migrations applied successfully
  - [ ] `20251030200000_fix_search_vault_items.sql`
  - [ ] `20251030200100_fix_gap_analysis_schema.sql`
  - [ ] `20251030200200_standardize_quality_tiers.sql`
- [ ] Verify migration status: `supabase migration list`
- [ ] No migration errors in logs

### Environment Setup
- [ ] Supabase project connected and accessible
- [ ] Environment variables configured correctly
- [ ] Frontend build successful (`npm run build`)
- [ ] No console errors on page load
- [ ] Test user account created with valid subscription

---

## 1. Onboarding Flow Testing (Critical Path)

### Step 1: Resume Upload & Analysis
**Location:** `/career-vault-onboarding`

- [ ] **Upload Resume**
  - [ ] PDF upload works
  - [ ] DOCX upload works
  - [ ] File size validation works (reject >5MB)
  - [ ] Invalid file types rejected
  - [ ] Text extraction successful
  - [ ] Error handling for corrupted files

- [ ] **AI Analysis**
  - [ ] Analysis completes in <10 seconds
  - [ ] Initial analysis displayed correctly
  - [ ] Shows: detected role, seniority, years of experience
  - [ ] Top achievements extracted
  - [ ] Key skills identified
  - [ ] Industries detected

- [ ] **Marketing Messages**
  - [ ] Success toast appears
  - [ ] `meta.message` displayed correctly
  - [ ] `meta.uniqueValue` toast appears after 2.5s
  - [ ] Marketing message emphasizes unique value

- [ ] **Auto-Save**
  - [ ] Vault record created in database
  - [ ] `onboarding_step` set to 'resume_uploaded'
  - [ ] Resume text stored correctly
  - [ ] Can refresh page and resume from this step

**Success Criteria:** User can upload resume and see instant AI analysis with marketing messages

---

### Step 2: Career Direction
**Location:** Career Direction Step

- [ ] **Direction Selection**
  - [ ] "Stay in current field" option works
  - [ ] "Pivot to new field" option works
  - [ ] "Explore options" option works
  - [ ] Selection triggers AI suggestions

- [ ] **AI Suggestions**
  - [ ] Career path suggestions load
  - [ ] Suggested roles displayed (3-5 recommendations)
  - [ ] Suggested industries displayed
  - [ ] Match scores shown for each suggestion
  - [ ] Can select multiple roles
  - [ ] Can select multiple industries
  - [ ] Can add custom role/industry

- [ ] **Marketing Messages**
  - [ ] Success toast on suggestion load
  - [ ] Unique value message appears after 2s
  - [ ] Emphasizes AI-powered career insights

- [ ] **Auto-Save**
  - [ ] `career_direction` saved to database
  - [ ] `target_roles` array saved
  - [ ] `target_industries` array saved
  - [ ] `onboarding_step` updated to 'targets_set'

**Success Criteria:** User can select career direction and get AI-powered role/industry suggestions

---

### Step 3: Industry Research
**Location:** Industry Research Progress

- [ ] **Research Initiation**
  - [ ] Research starts automatically
  - [ ] Progress indicator displays
  - [ ] Real-time status updates shown

- [ ] **Perplexity AI Integration**
  - [ ] Edge function `research-industry-standards` invoked
  - [ ] Research completes in <30 seconds
  - [ ] Market demand data retrieved
  - [ ] Salary range information shown
  - [ ] Required skills identified
  - [ ] Top companies listed
  - [ ] Cited sources displayed

- [ ] **Marketing Messages**
  - [ ] Progress updates during research
  - [ ] Completion toast with success message
  - [ ] Unique value emphasizing real-time research

- [ ] **Auto-Save**
  - [ ] `industry_research` JSON saved
  - [ ] `onboarding_step` updated to 'research_complete'
  - [ ] Research timestamp recorded

**Success Criteria:** Real-time market research completes and data is stored

---

### Step 4: Auto-Population (Intelligence Extraction)
**Location:** Auto-Population Progress

- [ ] **Extraction Process**
  - [ ] Starts automatically after research
  - [ ] Progress bar shows category-by-category extraction
  - [ ] Real-time item count updates

- [ ] **Vault Categories Populated**
  - [ ] Power Phrases extracted (expect 20-30)
  - [ ] Transferable Skills extracted (expect 15-25)
  - [ ] Hidden Competencies identified (expect 10-20)
  - [ ] Soft Skills extracted (expect 8-15)
  - [ ] Leadership Philosophy captured (expect 3-8)
  - [ ] Executive Presence indicators (expect 5-12)
  - [ ] Personality Traits identified (expect 6-12)
  - [ ] Work Style characteristics (expect 4-10)
  - [ ] Values & Motivations (expect 5-10)
  - [ ] Behavioral Indicators (expect 8-15)

- [ ] **Quality Tier Distribution**
  - [ ] Items have quality tiers (gold/silver/bronze/assumed)
  - [ ] No 'platinum' tier items (should be migrated to gold)
  - [ ] Confidence scores present (0.0-1.0)
  - [ ] Effectiveness scores present (0.0-1.0)

- [ ] **Vault Strength Calculation**
  - [ ] Vault strength percentage calculated
  - [ ] Displayed in real-time during extraction
  - [ ] Final vault strength shown (expect 45-65% before review)

- [ ] **Marketing Messages**
  - [ ] Progress updates for each category
  - [ ] Unique value messaging about depth of analysis
  - [ ] Total items extracted displayed

- [ ] **Auto-Save**
  - [ ] All vault items inserted to correct tables
  - [ ] `vault_strength_before_qa` saved
  - [ ] `onboarding_step` updated to 'auto_population_complete'

**Success Criteria:** 150-250 vault items extracted across all 10 categories

---

### Step 5: Smart Review Workflow
**Location:** Smart Review Workflow

- [ ] **Review Interface**
  - [ ] Items grouped by category tabs
  - [ ] Priority sorting (high-impact items first)
  - [ ] Item details displayed clearly
  - [ ] Quality tier badges shown

- [ ] **Batch Operations**
  - [ ] "Confirm All" button works
  - [ ] "Reject Low Confidence" button works
  - [ ] Individual item actions (confirm/reject/edit)
  - [ ] Bulk select functionality
  - [ ] Edit modal allows text changes

- [ ] **Review Actions**
  - [ ] Confirm: Updates quality_tier to 'gold'
  - [ ] Reject: Deletes item from vault
  - [ ] Edit: Updates item content
  - [ ] Actions reflected immediately in UI

- [ ] **Vault Strength Updates**
  - [ ] Vault strength recalculated after each batch
  - [ ] Progress indicator updates
  - [ ] Target strength shown (85%+)

- [ ] **Marketing Messages**
  - [ ] Batch operation success toasts
  - [ ] Time-saving messaging ("Saved 20+ minutes")
  - [ ] Unique value about smart prioritization

- [ ] **Auto-Save**
  - [ ] Review actions saved to database via edge function
  - [ ] `vault_strength_after_qa` updated
  - [ ] `onboarding_step` updated to 'review_complete'

- [ ] **Skip Option**
  - [ ] Can skip review if vault strength already high
  - [ ] Skip advances to gaps or completion

**Success Criteria:** User can efficiently review and confirm/reject vault items in batches

---

### Step 6: Gap-Filling Questions (Conditional)
**Location:** Gap Filling Questions Flow

- [ ] **Question Generation**
  - [ ] Only shown if vault strength < 85%
  - [ ] Questions generated based on identified gaps
  - [ ] Targeted to specific missing categories

- [ ] **Question Flow**
  - [ ] Questions presented in batches (5-10 at a time)
  - [ ] Multiple question types supported:
    - [ ] Text input
    - [ ] Multiple choice
    - [ ] Rating scales
    - [ ] Checkboxes
  - [ ] Progress indicator shows remaining questions
  - [ ] Can navigate back to previous questions

- [ ] **Response Processing**
  - [ ] Answers converted to vault items via edge function
  - [ ] New items inserted to correct categories
  - [ ] Quality tier set appropriately (gold for user-provided)

- [ ] **Vault Strength Progress**
  - [ ] Vault strength increases after each batch
  - [ ] Real-time progress updates
  - [ ] Stop when reaching 85%+ or all questions answered

- [ ] **Marketing Messages**
  - [ ] Progress encouragement messages
  - [ ] Unique value about intelligent gap identification
  - [ ] Achievement celebration at completion

- [ ] **Auto-Save**
  - [ ] Responses saved incrementally
  - [ ] Vault strength updated after each batch
  - [ ] `onboarding_step` updated when complete

- [ ] **Skip Option**
  - [ ] Can skip remaining questions
  - [ ] Advances to completion

**Success Criteria:** Vault strength reaches 85%+ through targeted question-answering

---

### Step 7: Vault Completion & Benchmarking
**Location:** Vault Completion Summary

- [ ] **Competitive Benchmark**
  - [ ] Edge function `generate-completion-benchmark` called
  - [ ] Percentile ranking calculated (1-100)
  - [ ] Comparison vs top 10% in industry
  - [ ] Strengths identified
  - [ ] Opportunities/gaps listed
  - [ ] Recommendations provided with impact estimates

- [ ] **Completion Summary Display**
  - [ ] Final vault strength displayed prominently
  - [ ] Percentile ranking badge shown
  - [ ] Category breakdown visualized
  - [ ] Quality tier distribution chart
  - [ ] Total items count

- [ ] **Gap Analysis Data**
  - [ ] Saved to `vault_gap_analysis` table
  - [ ] All 8 columns populated:
    - [ ] `analysis_type` = 'completion_benchmark'
    - [ ] `identified_gaps` JSON array
    - [ ] `competitive_insights` JSON object
    - [ ] `recommendations` JSON array
    - [ ] `percentile_ranking` integer
    - [ ] `vault_strength_at_analysis` integer
    - [ ] `strengths` JSON array
    - [ ] `opportunities` JSON array

- [ ] **Next Steps**
  - [ ] "Build Resume" button navigates to Resume Builder
  - [ ] "Go to Dashboard" button navigates to Career Vault Dashboard
  - [ ] "Build LinkedIn" button available

- [ ] **Marketing Messages**
  - [ ] Celebration of completion
  - [ ] Unique value about competitive positioning
  - [ ] Achievement badges/icons

- [ ] **Auto-Save**
  - [ ] `onboarding_step` set to 'onboarding_complete'
  - [ ] Completion timestamp recorded
  - [ ] Can't re-enter onboarding (redirects to dashboard)

**Success Criteria:** User sees comprehensive competitive analysis and clear next steps

---

## 2. Search Functionality Testing

### Advanced Vault Search
**Location:** Career Vault Dashboard → Search

- [ ] **Search UI**
  - [ ] Search input field present
  - [ ] Category filter dropdown (all 10 categories)
  - [ ] Quality tier filter (gold/silver/bronze/assumed)
  - [ ] Limit results slider (10-100)

- [ ] **Search Execution**
  - [ ] Edge function `search-vault-advanced` called
  - [ ] Database function `search_vault_items` executed
  - [ ] Search query properly escaped/sanitized

- [ ] **Search Results**
  - [ ] Results returned in <2 seconds
  - [ ] All 10 tables searched (not just 3)
  - [ ] Return format matches expected:
    - [ ] `item_id` UUID
    - [ ] `item_type` TEXT (category name)
    - [ ] `content` TEXT
    - [ ] `quality_tier` VARCHAR
    - [ ] `confidence_score` DECIMAL
    - [ ] `effectiveness_score` DECIMAL
    - [ ] `match_rank` REAL (relevance score)

- [ ] **Result Display**
  - [ ] Results sorted by `match_rank` (highest first)
  - [ ] Category badges shown
  - [ ] Quality tier indicators visible
  - [ ] Relevance scores displayed
  - [ ] Can click result to view details

- [ ] **Filter Combinations**
  - [ ] Search all categories (no filter)
  - [ ] Search single category (e.g., "power_phrases")
  - [ ] Filter by quality tier (e.g., only "gold")
  - [ ] Combined category + quality tier filter
  - [ ] Limit results works correctly

- [ ] **Marketing Messages**
  - [ ] Search insights displayed
  - [ ] `meta.searchTip` shown if available
  - [ ] Unique value about comprehensive search

**Success Criteria:** Search works across all 10 tables with correct filtering

---

## 3. Bulk Operations Testing

### Bulk Vault Operations
**Location:** Career Vault Dashboard → Bulk Actions

- [ ] **Item Selection**
  - [ ] Can select multiple items via checkboxes
  - [ ] "Select All" works
  - [ ] "Deselect All" works
  - [ ] Selection count displayed

- [ ] **Bulk Quality Update**
  - [ ] Can change quality tier of multiple items
  - [ ] Dropdown shows 4 tiers (gold/silver/bronze/assumed)
  - [ ] Edge function `bulk-vault-operations` called
  - [ ] Database records updated correctly
  - [ ] Vault strength recalculated

- [ ] **Bulk Delete**
  - [ ] Confirmation modal appears
  - [ ] Can delete multiple items at once
  - [ ] Items removed from database
  - [ ] Vault strength recalculated
  - [ ] Can't undo (warning shown)

- [ ] **Bulk Archive** (if implemented)
  - [ ] Items marked as archived (not deleted)
  - [ ] Can restore archived items later

- [ ] **Operation Results**
  - [ ] Success/failure count displayed
  - [ ] Error messages for failed operations
  - [ ] Vault statistics updated immediately
  - [ ] UI refreshes to reflect changes

- [ ] **Marketing Messages**
  - [ ] Time-saving messaging
  - [ ] Unique value about batch operations

**Success Criteria:** Can perform bulk operations on 10+ items successfully

---

## 4. Export Functionality Testing

### Vault Export
**Location:** Career Vault Dashboard → Export

- [ ] **Export Options**
  - [ ] Format selection (JSON, CSV, Text)
  - [ ] Category filter (select specific categories)
  - [ ] Quality tier filter
  - [ ] "Include metadata" checkbox

- [ ] **Export Execution**
  - [ ] Edge function `export-vault` called
  - [ ] Export completes in <5 seconds for 200 items
  - [ ] File download triggered

- [ ] **Export Formats**
  - [ ] **JSON Export**
    - [ ] Valid JSON structure
    - [ ] All selected items included
    - [ ] Metadata included if selected
    - [ ] Readable and properly formatted
  - [ ] **CSV Export**
    - [ ] Proper CSV headers
    - [ ] All fields present
    - [ ] Special characters escaped
    - [ ] Opens correctly in Excel/Sheets
  - [ ] **Text Export**
    - [ ] Human-readable format
    - [ ] Organized by category
    - [ ] Quality tiers indicated
    - [ ] Suitable for copy/paste

- [ ] **Export Content**
  - [ ] Correct item count matches selection
  - [ ] Content accurately reflects database data
  - [ ] No truncation or data loss
  - [ ] Timestamps formatted correctly

**Success Criteria:** Can export vault in all 3 formats with correct data

---

## 5. Error Handling & Edge Cases

### Error Boundaries
- [ ] Component errors caught by ErrorBoundary
- [ ] Fallback UI displayed
- [ ] "Try Again" button works
- [ ] "Go Home" button navigates correctly
- [ ] CareerVaultErrorBoundary shows vault-specific messages

### Network Errors
- [ ] Offline mode handling
- [ ] Timeout handling (>30s operations)
- [ ] Retry logic for failed requests
- [ ] User-friendly error messages

### Data Validation
- [ ] Empty resume upload rejected
- [ ] Invalid career direction handled
- [ ] Malformed search queries sanitized
- [ ] SQL injection prevented

### Edge Cases
- [ ] Resume with minimal content (<100 words)
- [ ] Resume with non-standard formatting
- [ ] Zero vault items after extraction (show message)
- [ ] Vault strength of 100% (skip gaps, show celebration)
- [ ] User refreshes mid-onboarding (resumes correctly)
- [ ] User navigates back/forward during onboarding

**Success Criteria:** All errors handled gracefully with helpful messages

---

## 6. Auto-Save Testing

### Progress Persistence
- [ ] **Step Transitions**
  - [ ] Auto-save triggers on step change
  - [ ] "Saving..." indicator appears
  - [ ] "Saved" checkmark appears after success
  - [ ] `onboarding_step` updated in database

- [ ] **Page Refresh**
  - [ ] Can refresh at any step
  - [ ] Resumes from correct step
  - [ ] All progress preserved
  - [ ] "Welcome Back" toast appears

- [ ] **Browser Close/Reopen**
  - [ ] Close browser mid-onboarding
  - [ ] Reopen and navigate to `/career-vault-onboarding`
  - [ ] Continues from last saved step
  - [ ] All data intact

- [ ] **Save Status Indicator**
  - [ ] Saving icon animates (pulsing)
  - [ ] Saved checkmark appears
  - [ ] Status resets to idle after 2 seconds
  - [ ] Error state shown if save fails

**Success Criteria:** Progress is never lost, even on page refresh or browser close

---

## 7. Performance Testing

### Load Times
- [ ] Initial page load <3 seconds
- [ ] Resume analysis <10 seconds
- [ ] Career suggestions <5 seconds
- [ ] Industry research <30 seconds
- [ ] Auto-population <60 seconds for 200 items
- [ ] Search results <2 seconds
- [ ] Bulk operations <5 seconds for 50 items

### Database Performance
- [ ] Full-text search uses indexes (check with EXPLAIN)
- [ ] Vault statistics query <1 second
- [ ] Gap analysis query <2 seconds
- [ ] No N+1 query problems

### UI Responsiveness
- [ ] No UI freezing during AI operations
- [ ] Progress indicators update smoothly
- [ ] Animations perform at 60fps
- [ ] No layout shifts or content jumps

**Success Criteria:** All operations complete within acceptable timeframes

---

## 8. Integration Testing

### Resume Builder Integration
- [ ] Can access Resume Builder from completion screen
- [ ] Vault items available in Resume Builder
- [ ] Can insert power phrases into resume
- [ ] Skills populate resume sections

### Dashboard Integration
- [ ] Dashboard displays vault statistics
- [ ] Category counts accurate
- [ ] Quality tier breakdown correct
- [ ] Recent items shown

### LinkedIn Profile Builder
- [ ] Vault items available for LinkedIn sections
- [ ] Summary can use extracted content
- [ ] Skills auto-populate

**Success Criteria:** Career Vault integrates seamlessly with other features

---

## 9. Quality Tier System Validation

### Database Constraints
- [ ] Can only insert valid quality tiers (gold/silver/bronze/assumed)
- [ ] Attempting 'platinum' insert fails (or auto-converts to gold)
- [ ] All 10 vault tables have check constraints
- [ ] Existing platinum items migrated to gold

### Statistics Function
- [ ] `get_vault_statistics` returns only 4 tiers
- [ ] No platinum count in response
- [ ] Tier counts match database records
- [ ] Total items calculation correct

**Success Criteria:** Quality tier system is consistent and enforced

---

## 10. Marketing Messages Validation

### Toast Displays
- [ ] Success messages show `meta.message`
- [ ] Unique value messages appear with delay
- [ ] Marketing title is "✨ What Makes Us Different"
- [ ] Duration is 5 seconds for marketing toasts
- [ ] Search tips appear when relevant

### Message Content
- [ ] Messages emphasize unique competitive advantages
- [ ] Language is compelling and specific
- [ ] No generic "success" messages
- [ ] Differentiators clearly stated

**Success Criteria:** Marketing messages consistently reinforce unique value proposition

---

## Test Execution Tracking

### Test Run Information
- **Tester Name:** _______________
- **Date:** _______________
- **Environment:** [ ] Development [ ] Staging [ ] Production
- **Browser:** _______________
- **Test Duration:** _____ hours

### Results Summary
- **Total Tests:** _____
- **Passed:** ✅ _____
- **Failed:** ❌ _____
- **Blocked:** ⛔ _____
- **Overall Status:** [ ] Pass [ ] Fail [ ] Needs Fixes

---

## Critical Bugs Found

| ID | Severity | Component | Description | Steps to Reproduce | Status |
|----|----------|-----------|-------------|-------------------|--------|
| 1  |          |           |             |                   |        |
| 2  |          |           |             |                   |        |
| 3  |          |           |             |                   |        |

**Severity Levels:**
- 🔴 Critical: Blocks core functionality, must fix before launch
- 🟠 High: Significant impact, fix before launch
- 🟡 Medium: Noticeable issue, fix soon
- 🟢 Low: Minor issue, fix when possible

---

## Sign-Off

### QA Approval
- [ ] All critical tests passed
- [ ] No critical or high severity bugs remaining
- [ ] Medium/low bugs documented for post-launch
- [ ] Performance meets acceptance criteria
- [ ] Ready for production deployment

**QA Signature:** _______________
**Date:** _______________

### Product Approval
- [ ] Feature completeness verified
- [ ] User experience meets requirements
- [ ] Marketing messaging effective
- [ ] Ready for launch

**Product Signature:** _______________
**Date:** _______________

---

**Document Version:** 1.0
**Last Updated:** October 30, 2025
**Next Review:** After Phase 4 completion
