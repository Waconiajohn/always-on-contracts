
# Resume Scoring & Rewrite Engine - Implementation Plan

## Overview
A production-grade, evidence-locked resume optimization system with strict anti-hallucination controls, Apple-simple UI, and full version history.

---

## Phase 1: Foundation (Prompts 1-2)

### 1.1 Database Schema Migration
Create new tables with proper RLS:

**`resume_projects`**
- `id`, `user_id`, `status`, `created_at`, `updated_at`
- `jd_text`, `jd_confidence`
- `role_title`, `seniority_level`, `industry`, `sub_industry`
- `target_confirmed`, `user_override_target` (JSONB)
- `current_score`, `original_score`

**`resume_documents`**
- `id`, `project_id`, `file_name`, `raw_text`
- `parsed_json` (JSONB: sections with summary, skills, experience[], education, certs)
- `span_index` (JSONB: section-anchored character offsets)

**`resume_evidence`**
- `id`, `project_id`, `claim_text`, `evidence_quote`
- `category` (skill | tool | domain | responsibility | metric | leadership)
- `source` (extracted | user_provided)
- `span_location` (JSONB: `{ section, jobIndex?, bulletIndex?, startChar, endChar }`)
- `confidence` (high | medium)
- `is_active`

**`resume_versions`**
- `id`, `project_id`, `section_name`, `version_number`
- `content`, `action_source` (tighten | executive | micro_edit | etc.)
- `is_active`, `created_at`
- Cleanup policy: 30-day retention, display last 5

**`keyword_decisions`**
- `id`, `project_id`, `keyword`, `decision` (add | ignore | not_true | ask_me)
- `evidence_id` (FK to resume_evidence, nullable)
- `created_at`

**`jd_requirements`**
- `id`, `project_id`, `category`, `text`, `weight`
- `exact_phrases` (JSONB), `synonyms` (JSONB), `section_hint`

**`benchmark_requirements`**
- `id`, `project_id`, `category`, `text`, `weight`, `section_hint`

### 1.2 Routing Structure
```
/resume-builder                    → Project list / Create new
/resume-builder/:projectId/upload  → Upload resume
/resume-builder/:projectId/jd      → Paste job description
/resume-builder/:projectId/target  → Confirm role/level/industry
/resume-builder/:projectId/processing → Pipeline stepper
/resume-builder/:projectId/report  → Match score report
/resume-builder/:projectId/fix     → Fix-it mode (keywords, ATS)
/resume-builder/:projectId/studio/summary
/resume-builder/:projectId/studio/skills
/resume-builder/:projectId/studio/experience/:jobId
/resume-builder/:projectId/studio/education
/resume-builder/:projectId/review  → Final review + rescore
/resume-builder/:projectId/export  → Download options
```

### 1.3 Shared Layout Components
- `ResumeBuilderShell`: Max-width container, breadcrumb, mobile responsive
- `StudioLayout`: Stepper + left/right panels + bottom controls
- `PageContainer`: Consistent padding (desktop: px-8 py-8, mobile: px-4 py-6)

### 1.4 TypeScript Types
Create `src/types/resume-builder.ts`:
- `Project`, `ResumeDocument`, `Evidence`, `Requirement`
- `Version`, `KeywordDecision`, `ScoreReport`, `GapAnalysis`

---

## Phase 2: Upload & Classification (Prompts 3-5)

### 2.1 Upload Page (`/upload`)
- Dropzone component (PDF/DOCX only)
- File validation with clear error states
- On upload: Call existing `parse-resume` edge function
- Extract `span_index` during parsing for evidence highlighting
- Save to `resume_documents` table
- Navigate → `/jd`

### 2.2 Job Description Page (`/jd`)
- Clean textarea with character count
- "I don't have a JD" link (goes to target page with manual entry)
- On Continue: Save JD text, trigger AI Call #1 (Classification)
- Navigate → `/target`

### 2.3 Target Confirmation Page (`/target`)
**AI Call #1: JD Classification** (new edge function: `classify-job-description`)
- Uses provided system/user prompts with strict JSON schema
- Model: `google/gemini-2.5-flash` (fast categorization)

**UI Components:**
- Prefilled Role / Level / Industry (editable comboboxes)
- Confidence badge: High (≥0.75) / Medium (0.65-0.74) / Low (<0.65)
- Expandable "Why we think this" with justification text
- Low confidence → warning banner requiring explicit confirmation
- "Confirm & Run Match" button
- Save `target_confirmed = true` and any overrides

---

## Phase 3: Processing Pipeline (Prompt 6)

### 3.1 Processing Page (`/processing`)
Visual stepper showing 5 stages:

**Stage 1: Extract JD Requirements**
- AI Call #2: `extract-jd-requirements` edge function
- Model: `google/gemini-2.5-flash`
- Save to `jd_requirements` table

**Stage 2: Generate Benchmark**
- AI Call #3: `generate-role-benchmark` edge function
- Model: `google/gemini-2.5-flash`
- Save to `benchmark_requirements` table

**Stage 3: Extract Resume Claims**
- AI Call #4: `extract-resume-claims` edge function (NEW)
- Model: `openai/gpt-5` (accuracy critical)
- Extracts claims with verbatim `evidence_quote`
- Save to `resume_evidence` table

**Stage 4: Gap Analysis**
- AI Call #5: `analyze-resume-gaps` edge function (rewrite existing)
- Model: `openai/gpt-5`
- Compares claims to requirements
- Outputs: met[], partial[], unmet[], questions[], safe_keyword_insertions[]

**Stage 5: Compute Score**
- Deterministic scoring based on gap analysis weights
- Calculate category scores (6 buckets max)
- Save to `resume_projects.current_score` and `original_score`

Navigate → `/report`

---

## Phase 4: Match Report (Prompts 7-8)

### 4.1 Score Report Page (`/report`)
**Header:**
- Title: "Match Report"
- Buttons: "Fix Issues First" | "Start Rewrite"

**Score Module:**
- Large score display (text-5xl font-semibold tabular-nums)
- Caption: "Based on job requirements + role benchmark"
- Bucket bar visualization (simple, not chart-heavy)

**Category Cards (max 6):**
1. Missing Keywords (from JD)
2. Missing Keywords (from Benchmark)
3. Seniority Alignment
4. Impact & Metrics Strength
5. Tools/Platforms Coverage
6. ATS Format Checks

Each card:
- Expandable evidence highlighting
- Keyword chips with actions

### 4.2 Keyword Chip Component
Reusable `<KeywordChip>` with 4 actions:
- **Add**: Only enabled if evidence exists in `resume_evidence`
- **Ask me**: Triggers question capture flow
- **Ignore**: Saves to `keyword_decisions` with `decision = 'ignore'`
- **Not true**: Saves with `decision = 'not_true'`, permanently suppressed

---

## Phase 5: Fix-It Mode (Prompt 9)

### 5.1 Fix-It Page (`/fix`)
**Two-column layout (desktop):**

**Left Column: Highest Impact Fixes**
- Prioritized list from gap analysis
- ATS quick fixes:
  - Table detection warning
  - Unusual headings warning
  - Missing dates detection
  - Overlong bullets detection
- "Auto-fix formatting" button (deterministic)

**Right Column: Keyword Chips by Section**
- Grouped by Summary / Skills / Experience
- Each chip uses `<KeywordChip>` component

**Add a Bullet Form:**
- Dropdown: Select job/position
- Action field (required)
- Result/metric field (optional)
- Tools/keywords field (optional)
- Creates new entry in `resume_evidence` with `source = 'user_provided'`

CTA: "Continue to Rewrite" → `/studio/summary`

---

## Phase 6: Rewrite Studio (Prompts 10-18)

### 6.1 Studio Shell Component
- Top: Stepper (Summary → Skills → Experience → Education → Finalize)
- Left panel: Original content (collapsible on mobile)
- Right panel: Proposed rewrite (editable)
- Bottom rail: Controls + chips + evidence panel

### 6.2 Rewrite Control Bar
Buttons triggering AI Call #6 with different `tone_preset`:
- Tighten
- More Executive
- More Specific
- Reduce Buzzwords
- Match JD Keywords
- Conservative Rewrite
- Try Another Version

Each action:
1. Calls `rewrite-section` edge function
2. Creates new version in `resume_versions`
3. Updates UI with new content

### 6.3 Version History Sheet
- Lists last 5 versions (from `resume_versions`)
- Shows action source and timestamp
- Compare mode: Side-by-side diff view
- Revert button: Sets selected version as active

### 6.4 Line-Level Selection
On text selection in rewritten panel:
- Popover with actions: Rewrite | Shorter | Stronger verb | Clarify scope | Add keyword
- Triggers AI Call #7: `micro-edit-bullet` edge function
- Model: `openai/gpt-5-mini` (fast, accurate for small edits)

### 6.5 Evidence Panel
Per bullet/line:
- Evidence label: "From your resume" | "Added by you" | "Needs confirmation"
- Reason: JD requirement or Benchmark expectation
- Confidence indicator
- Actions: Remove line | Mark inaccurate (triggers question flow)

### 6.6 Section Pages
**`/studio/summary`**: Summary rewrite with controls
**`/studio/skills`**: Categorized skills (Hard / Tools / Domain / Soft), dedupe/normalize
**`/studio/experience/:jobId`**: Per-job bullet editing, "Add bullet" inline
**`/studio/education`**: Education + certs, "hide dates" toggle per item

---

## Phase 7: Final Review & Export (Prompts 19-20)

### 7.1 Final Review Page (`/review`)
**On load:**
1. Rebuild evidence graph from active versions
2. Recompute score
3. Run AI Call #8: `hiring-manager-critique` edge function
4. Run AI Call #9: `validate-rewrite` edge function (hallucination check)

**UI:**
- Score delta: "Score improved from X to Y"
- Top remaining issues (max 10)
- Risky/vague claims flagged
- Suggested safe fixes as chips
- "Apply fixes" button for safe improvements
- "Back to Studio" | "Proceed to Export"

### 7.2 Export Page (`/export`)
**Template Selection:**
- 1-page executive
- 2-page standard
- ATS-safe (no formatting)

**Preview Panel:** Basic render of selected template

**Export Actions:**
- Download PDF (reuse `resumeExportUtils.ts`)
- Download DOCX
- "Copy sections" dropdown

**Export Rules (enforced):**
- No tables
- Standard headings only
- Consistent bullet formatting
- Clean whitespace

---

## Phase 8: Edge Functions

### 8.1 New Edge Functions to Create
| Function | AI Call | Model | Purpose |
|----------|---------|-------|---------|
| `classify-job-description` | #1 | gemini-2.5-flash | Role/level/industry inference |
| `extract-jd-requirements` | #2 | gemini-2.5-flash | Weighted requirements extraction |
| `generate-role-benchmark` | #3 | gemini-2.5-flash | Expected profile generation |
| `extract-resume-claims` | #4 | gpt-5 | Claims with evidence quotes |
| `analyze-resume-gaps` | #5 | gpt-5 | Gap analysis (replace existing) |
| `rewrite-section` | #6 | gpt-5 | Section rewrite with evidence lock |
| `micro-edit-bullet` | #7 | gpt-5-mini | Line-level improvements |
| `hiring-manager-critique` | #8 | gpt-5 | Final review critique |
| `validate-rewrite` | #9 | gpt-5 | Hallucination detection |

### 8.2 Shared Schema Validators
Create `supabase/functions/_shared/resume-builder-schemas.ts`:
- Zod schemas for all 9 AI call responses
- Validation functions with error handling
- Type exports for frontend consumption

---

## Phase 9: Anti-Hallucination Controls

### 9.1 Evidence Locking
- All AI calls receive only `resume_evidence` entries marked `is_active = true`
- Suppressed keywords from `keyword_decisions` passed as `suppressed_keywords[]`
- AI cannot reference anything outside provided evidence

### 9.2 Post-Validation
After every rewrite:
1. Run AI Call #9 (validate-rewrite)
2. If `unsupported_claims` detected:
   - Show inline warning banner
   - Highlight flagged content
   - Require user action: Keep / Remove / Edit

### 9.3 Question-Instead-of-Fabrication
When evidence is insufficient:
- AI returns `questions[]` array instead of fabricated content
- UI shows question capture modal
- User answers become new `resume_evidence` entries with `source = 'user_provided'`

---

## Visual Design Rules (Enforced Throughout)

### Layout
- Desktop: `max-w-[1100px]` centered
- Tablet: `max-w-[900px]`
- Mobile: Full width with `px-4`

### Typography
- Page title: `text-2xl font-semibold tracking-tight`
- Section title: `text-lg font-semibold`
- Body: `text-sm leading-6`
- Score display: `text-5xl font-semibold tabular-nums tracking-tight`

### Surfaces
- One primary Card per section (no card spam)
- Subtle borders: `border-border/60`
- Minimal shadows (shadcn defaults)
- No gradients, no neon, single accent color

### Icons
- Lucide only: check, alert, info, wand, refresh, history
- Used sparingly for scanning, not decoration

---

## Implementation Order

1. **Foundation**: Database migration + routing + types + shell components
2. **Upload flow**: Upload → JD → Target confirmation pages
3. **Processing pipeline**: 5-stage orchestration with edge functions
4. **Report**: Score display + category cards + keyword chips
5. **Fix-it mode**: Two-column layout + ATS fixes + manual bullet add
6. **Studio shell**: Shared layout + control bar + version history
7. **Studio sections**: Summary → Skills → Experience → Education
8. **Final review**: Rescore + critique + validation
9. **Export**: Templates + PDF/DOCX generation

---

## Acceptance Criteria Summary

- JD with clear title → confidence ≥ 0.75
- Generic JD → confidence < 0.65, requires user confirmation
- "Not true" keyword → never suggested again
- Missing evidence → AI asks question instead of fabricating
- Validator flags unsupported metric → warning shown
- 3 rewrite actions → 4 versions in history
- Revert to Version 2 → score recalculated from that version
- Score improved → delta shown in Final Review
