

# Resume Builder V4 - Remaining Work Plan

## Overview
Complete the evidence-based Resume Scoring & Rewrite Engine by implementing missing features identified in the original plan. Focus on anti-hallucination controls, user-driven evidence capture, and UX polish.

---

## Phase 1: Shared Schema Validators (Priority: High)

### Task 1.1: Create Zod Schema Library
**File**: `supabase/functions/_shared/rb-schemas.ts`

Create centralized Zod schemas for all AI responses:
```typescript
// Response schemas for 9 AI calls
export const JDClassificationSchema = z.object({...});
export const RequirementsExtractionSchema = z.object({...});
export const BenchmarkGenerationSchema = z.object({...});
export const ClaimsExtractionSchema = z.object({...});
export const GapAnalysisSchema = z.object({...});
export const SectionRewriteSchema = z.object({...});
export const MicroEditSchema = z.object({...});
export const HiringManagerCritiqueSchema = z.object({...});
export const ValidationSchema = z.object({...});
```

### Task 1.2: Refactor Edge Functions
Update each `rb-*` edge function to use the shared validators instead of inline parsing.

---

## Phase 2: Question Capture Flow (Priority: High)

### Task 2.1: Question Capture Modal Component
**File**: `src/components/resume-builder/QuestionCaptureModal.tsx`

- Display questions from gap analysis
- Text input for each question
- On submit: Create `rb_evidence` entries with `source = 'user_provided'`
- Trigger re-analysis after answers submitted

### Task 2.2: Integrate into Fix Page
Update `FixPage.tsx`:
- After gap analysis loads, check if `questions[]` is non-empty
- Show "Answer Questions" prompt with badge count
- Open modal to capture answers
- Re-run gap analysis after submission

### Task 2.3: Evidence Source Differentiation
Update `EvidenceSidebar.tsx` to show source badges:
- "From Resume" (extracted)
- "You Added" (user_provided)

---

## Phase 3: Add Bullet Form (Priority: Medium)

### Task 3.1: Inline Bullet Creation Form
**File**: `src/components/resume-builder/AddBulletForm.tsx`

Form fields:
- Position dropdown (from parsed resume experience entries)
- Action verb + what you did (required)
- Result/metric (optional)
- Tools/keywords used (optional)

### Task 3.2: Integrate into Fix Page
Add collapsible "Add New Bullet" section on Fix page:
- Opens form inline below gaps
- On submit: Creates `rb_evidence` entry
- Optionally navigates to Experience Studio

---

## Phase 4: ATS Format Checks (Priority: Medium)

### Task 4.1: ATS Analysis Utility
**File**: `src/lib/ats-checks.ts`

Implement local parsing functions:
```typescript
export function detectTables(text: string): ATSIssue[];
export function detectUnusualHeadings(text: string): ATSIssue[];
export function detectMissingDates(text: string): ATSIssue[];
export function detectOverlongBullets(text: string): ATSIssue[];
```

### Task 4.2: Update Report Page
Replace static ATS card with dynamic checks:
- Run checks on `rb_documents.raw_text`
- Display issues with severity icons
- Show "Auto-fix" button for applicable issues

### Task 4.3: Auto-Fix Function
Implement deterministic fixes:
- Convert tables to plain text
- Standardize headings
- Flag missing dates (can't auto-fix)
- Split overlong bullets

---

## Phase 5: Text Selection Micro-Edit (Priority: Medium)

### Task 5.1: Selection-Triggered Popover
Update `BulletEditor.tsx`:
- Add `onMouseUp` listener to detect text selection
- Calculate selection coordinates
- Show floating popover with quick actions:
  - "Rewrite", "Shorter", "Stronger verb", "Add keyword"

### Task 5.2: Integrate with Micro-Edit
On action click:
- Extract selected text
- Call `rb-micro-edit` with action as instruction
- Replace selection with edited text

---

## Phase 6: Version History Diff View (Priority: Low)

### Task 6.1: Diff Comparison Component
**File**: `src/components/resume-builder/VersionDiff.tsx`

- Side-by-side or inline diff view
- Use `diff` library (already installed)
- Highlight additions (green) and deletions (red)

### Task 6.2: Update VersionHistory Sheet
Add "Compare" button next to each version:
- Opens diff view between selected version and current
- Option to compare any two versions

---

## Phase 7: Per-Bullet Evidence Linking (Priority: Medium)

### Task 7.1: Update Bullet Item Component
Enhance `BulletItem` in `BulletEditor.tsx`:
- Parse bullet text to find matching evidence claims
- Show small indicator: "Evidence: High/Medium/None"
- Tooltip shows source evidence quote

### Task 7.2: "Mark Inaccurate" Action
Add action to bullet popover:
- "This isn't accurate" → Opens question modal
- User provides correction → Updates `rb_evidence`

---

## Phase 8: Auto-Validation After Rewrite (Priority: High)

### Task 8.1: Post-Rewrite Hook
Update `useRewriteSection` hook:
- After successful rewrite, auto-run validation
- Store validation result in state

### Task 8.2: Inline Validation Warnings
Update Studio pages:
- If validation finds issues, show warning banner above editor
- Highlight problematic sentences with red underline
- Click to see issue details and suggestions

---

## Phase 9: Score Recalculation (Priority: Medium)

### Task 9.1: Revert + Rescore Logic
Update `useStudioPageData`:
- After `revertToVersion`, call rescore function
- Rescore compares current content against requirements
- Update `rb_projects.current_score`

### Task 9.2: Create Client-Side Scoring Utility
**File**: `src/lib/calculate-resume-score.ts`

Implement deterministic scoring based on:
- Keywords matched (from `rb_keyword_decisions`)
- Requirements met (from gap analysis cache)
- Return score 0-100

---

## Phase 10: Template-Specific Export (Priority: Low)

### Task 10.1: Template Formatting Logic
Update `ExportPage.tsx`:

**Executive (1-page)**:
- Truncate bullets to max 3 per position
- Shorter summary (2 sentences)
- Skills as comma-separated list

**Standard (2-page)**:
- Full bullets
- Complete summary
- Skills categorized

**ATS-Safe**:
- No bullets, use hyphens
- Standard headings only
- No bold/italic

### Task 10.2: Apply to DOCX/PDF Generation
Update `handleDownloadDocx` and `handleDownloadPdf` to use template config.

---

## Implementation Order

1. **High Priority (Core Functionality)**
   - Phase 2: Question Capture Flow
   - Phase 8: Auto-Validation After Rewrite
   - Phase 1: Shared Schema Validators

2. **Medium Priority (UX Improvements)**
   - Phase 3: Add Bullet Form
   - Phase 4: ATS Format Checks
   - Phase 7: Per-Bullet Evidence Linking
   - Phase 9: Score Recalculation
   - Phase 5: Text Selection Micro-Edit

3. **Low Priority (Polish)**
   - Phase 6: Version History Diff View
   - Phase 10: Template-Specific Export

---

## Estimated Effort

| Phase | Complexity | Est. Time |
|-------|------------|-----------|
| 1. Schema Validators | Medium | 2-3 hours |
| 2. Question Capture | High | 3-4 hours |
| 3. Add Bullet Form | Medium | 2 hours |
| 4. ATS Checks | Medium | 2-3 hours |
| 5. Text Selection | Medium | 2 hours |
| 6. Diff View | Low | 1-2 hours |
| 7. Per-Bullet Evidence | Medium | 2-3 hours |
| 8. Auto-Validation | High | 2-3 hours |
| 9. Score Recalculation | Medium | 2 hours |
| 10. Template Export | Low | 1-2 hours |

**Total: ~20-25 hours of implementation**

