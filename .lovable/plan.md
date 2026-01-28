

# Fix Plan: Quick Score to Match Report Data Flow + Metric Calculations

## Executive Summary

The Match Report shows **33 missing keywords** because of an import bug, while Quick Score correctly identified only **1 missing keyword**. Additionally, "Seniority Alignment" and "Requirement Coverage" metrics are placeholders with made-up calculations.

---

## Problem #1: All Keywords Marked as "To Add"

### Current (Broken) Code

In `src/pages/resume-builder/ResumeBuilderIndex.tsx` lines 236-253:

```typescript
const keywordDecisions = [
  ...state.keywordAnalysis.matched.map((k) => ({
    project_id: project.id,
    keyword: k.keyword,
    decision: "add" as const, // ← BUG: Matched keywords shouldn't be "add"
  })),
  ...state.keywordAnalysis.missing.map((k) => ({
    project_id: project.id,
    keyword: k.keyword,
    decision: "add" as const,
  })),
];
```

### Fixed Code

```typescript
const keywordDecisions = [
  // Matched keywords: mark as "ignore" (already present in resume)
  ...state.keywordAnalysis.matched.map((k) => ({
    project_id: project.id,
    keyword: k.keyword,
    decision: "ignore" as const, // Already in resume, no action needed
  })),
  // Missing keywords: mark as "add" (need to be added)
  ...state.keywordAnalysis.missing.map((k) => ({
    project_id: project.id,
    keyword: k.keyword,
    decision: "add" as const,
  })),
];
```

---

## Problem #2: Seniority Alignment is a Made-Up Formula

### Current (Fake) Code

```typescript
const seniorityScore = totalReqs > 0 
  ? Math.min(100, Math.round((approved.length / Math.max(totalReqs, 1)) * 100) + 30)
  : 50;
```

This formula has **no relationship to actual seniority**.

### How Seniority Alignment SHOULD Work

**Compare two things:**
1. **Target seniority** from JD (stored in `rb_projects.seniority_level`)
2. **User's demonstrated seniority** (inferred from resume experience)

**Seniority ladder:**
```text
IC < Senior IC < Manager < Senior Manager < Director < Senior Director < VP < SVP < C-Level
```

**Scoring logic:**
- **Match**: 100 points (user level = target level)
- **Underqualified**: 50-80 points (user is 1 level below)
- **Significantly underqualified**: 20-50 points (user is 2+ levels below)
- **Overqualified**: 70-90 points (user is above target)

### Implementation Approach

For the Quick Score import, we can infer user's seniority by looking at:
- Years of experience mentioned
- Job titles held (Manager, Director, VP, etc.)
- Team size managed

Since this requires parsing the resume, we have two options:
1. **Simple approach**: Use the AI's `detected.level` from Quick Score as the user's level
2. **Full approach**: Add a new AI call to extract career trajectory from resume

**I recommend the simple approach** for now: compare `project.seniority_level` (target) against the Quick Score detected level.

---

## Problem #3: Requirement Coverage Shows 0/0

### Why It Happens

The `rb_jd_requirements` table is **empty** because the JD requirements extraction step (`rb-extract-jd-requirements`) is never called during the Quick Score import flow.

### Two Solutions

**Option A: Skip the metric**
- Don't show "Requirement Coverage" if `rb_jd_requirements` is empty
- Show a message: "Run full analysis to see requirement breakdown"

**Option B: Trigger extraction (preferred)**
- After creating the project, call the `rb-extract-jd-requirements` edge function
- This populates `rb_jd_requirements` with the proper requirements
- Then the coverage calculation will be meaningful

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/resume-builder/ResumeBuilderIndex.tsx` | Fix keyword decision mapping (matched → "ignore", missing → "add") |
| `src/pages/resume-builder/ReportPage.tsx` | Fix seniority calculation, add fallback for empty requirements |

### Detailed Changes

#### 1. Fix Keyword Import (ResumeBuilderIndex.tsx)

**Lines 236-253**: Change matched keywords from `decision: "add"` to `decision: "ignore"`

This ensures:
- Matched keywords (32) → marked as already present
- Missing keywords (1) → marked as needing to be added
- Match Report will correctly show "1 to add"

#### 2. Fix Seniority Calculation (ReportPage.tsx)

Replace the fake formula with actual seniority comparison:

```typescript
const SENIORITY_ORDER = [
  'IC', 'Senior IC', 'Manager', 'Senior Manager', 
  'Director', 'Senior Director', 'VP', 'SVP', 'C-Level'
];

function calculateSeniorityMatch(
  userLevel: string | null, 
  targetLevel: string | null
): number {
  if (!userLevel || !targetLevel) return 50; // Unknown

  const userIndex = SENIORITY_ORDER.indexOf(userLevel);
  const targetIndex = SENIORITY_ORDER.indexOf(targetLevel);
  
  if (userIndex === -1 || targetIndex === -1) return 50;
  
  const diff = userIndex - targetIndex;
  
  if (diff === 0) return 100; // Perfect match
  if (diff === -1) return 75; // 1 level under
  if (diff === 1) return 85; // 1 level over
  if (diff < -1) return Math.max(30, 70 + diff * 15); // Underqualified
  return Math.max(60, 100 - diff * 10); // Overqualified
}
```

#### 3. Handle Empty Requirements (ReportPage.tsx)

Show appropriate state when `rb_jd_requirements` is empty:

```tsx
{stats.totalRequirements > 0 ? (
  <Progress value={requirementCoverage} className="h-2" />
) : (
  <p className="text-xs text-muted-foreground">
    Run full analysis to see requirement breakdown
  </p>
)}
```

---

## Technical Details

### How Each Metric Should Be Calculated

| Metric | Data Source | Calculation |
|--------|-------------|-------------|
| **Missing Keywords** | `rb_keyword_decisions` where `decision = 'add'` | Count of keywords to add |
| **Seniority Alignment** | Compare `project.seniority_level` vs user's level | Ladder-based comparison (0-100) |
| **Requirement Coverage** | `rb_jd_requirements` vs `rb_evidence` | Requirements matched by evidence |
| **ATS Compatibility** | `rb_documents.raw_text` | Deterministic text checks (already working) |

### Database State After Fix

For the current project (`dd98b930-c2cb-4e19-8a03-cb31b7c0e803`):

| Before | After |
|--------|-------|
| 33 keywords with `decision: 'add'` | 32 with `decision: 'ignore'`, 1 with `decision: 'add'` |
| Seniority: fake 50% | Seniority: actual comparison |
| Requirements: 0/0 | Requirements: placeholder or extracted |

---

## Verification Checklist

After implementation:
- [ ] Quick Score import creates correct keyword decisions (matched → ignore, missing → add)
- [ ] Match Report shows "1 to add" instead of "33 to add"
- [ ] Seniority Alignment uses actual level comparison
- [ ] Requirement Coverage shows helpful message when no requirements extracted
- [ ] ATS Compatibility continues working (no changes needed)

---

## Optional Enhancement: Trigger JD Extraction

For a complete solution, add this after project creation in `handleQuickScoreTransition`:

```typescript
// Trigger JD requirements extraction in background
supabase.functions.invoke('rb-extract-jd-requirements', {
  body: { project_id: project.id, jd_text: state.jobDescription }
});
```

This would populate `rb_jd_requirements` and make the "Requirement Coverage" metric meaningful.

