
# Implementation Plan: Technical Fixes + Design Refinements

Based on the user's approval of recommendations 1-3 and the requirement to trigger `rb-extract-jd-requirements` during Quick Score import, here is the complete implementation plan.

---

## Executive Summary

This plan addresses:
1. **Seniority vocabulary standardization** (use DB values everywhere, display friendly labels)
2. **HiringPrioritiesPanel background toning** (reduce colored backgrounds for Apple-simple aesthetic)
3. **Keep 15-year rule** (no changes needed)
4. **Technical bug fixes** (6 critical issues found during review)

---

## Part 1: Technical Bug Fixes

### Bug #1: Missing `doc_type` Column in `rb_documents`

**Problem**: `ReportPage.tsx` (line 149) and `FixPage.tsx` (line 129-130) query for `doc_type` column, but `rb_documents` table does NOT have this column.

**Current columns in rb_documents**: `id, project_id, file_name, raw_text, parsed_json, span_index, created_at, updated_at`

**Files affected**:
- `src/pages/resume-builder/ReportPage.tsx` 
- `src/pages/resume-builder/FixPage.tsx`

**Solution**: Add `doc_type` column to `rb_documents` via migration, then update the Quick Score import to set it properly.

**Migration SQL**:
```sql
ALTER TABLE rb_documents ADD COLUMN doc_type text DEFAULT 'resume';
```

**Code change in ResumeBuilderIndex.tsx** (line ~234):
```typescript
await supabase
  .from("rb_documents")
  .insert({
    project_id: project.id,
    file_name: "quick-score-import.txt",
    raw_text: state.resumeText,
    doc_type: "resume",  // ADD THIS
  });
```

---

### Bug #2: Wrong Column Name in FixPage Query

**Problem**: `FixPage.tsx` line 106 queries `.order('priority', ...)` but the column is actually `weight`.

**File**: `src/pages/resume-builder/FixPage.tsx`

**Fix**:
```typescript
// Line 106: Change from
.order('priority', { ascending: false })
// To
.order('weight', { ascending: false })
```

---

### Bug #3: TargetPage Saves UI Seniority Value Instead of DB Value

**Problem**: `handleConfirm` on line 197 saves `seniorityLevel` (UI value like "Senior") directly to DB, but DB constraint requires values like "Senior IC".

**File**: `src/pages/resume-builder/TargetPage.tsx`

**Solution**: Add `mapSeniorityToDB` function and use it when saving:

```typescript
// Add inverse mapping function
function mapSeniorityToDB(uiLevel: string): string {
  const mapping: Record<string, string> = {
    "Entry Level": "IC",
    "Junior": "IC",
    "Mid-Level": "IC",
    "Senior": "Senior IC",
    "Lead": "Senior IC",
    "Principal": "Senior IC",
    "Manager": "Manager",
    "Director": "Director",
    "VP": "VP",
    "C-Level": "C-Level",
  };
  return mapping[uiLevel] || uiLevel;
}

// In handleConfirm (line ~197):
seniority_level: mapSeniorityToDB(seniorityLevel),
```

---

### Bug #4: ProjectStatus Type Diverges from DB Constraint

**Problem**: `src/types/resume-builder.ts` line 8 defines:
```typescript
export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'completed' | 'archived';
```

But DB constraint allows:
```
'upload', 'jd', 'target', 'processing', 'report', 'fix', 'studio', 'review', 'export', 'complete'
```

**File**: `src/types/resume-builder.ts`

**Fix**: Update the type to match DB constraint:
```typescript
export type ProjectStatus = 
  | 'upload' 
  | 'jd' 
  | 'target' 
  | 'processing' 
  | 'report' 
  | 'fix' 
  | 'studio' 
  | 'review' 
  | 'export' 
  | 'complete';
```

---

### Bug #5: Seniority Alignment Shows 50% When Unknown

**Problem**: `ReportPage.tsx` shows 50% seniority alignment when `userLevel` is unknown, but doesn't clearly communicate this to the user.

**File**: `src/pages/resume-builder/ReportPage.tsx`

**Enhancement**: Add clarifying text when levels are unknown:
```typescript
// Around line 355-360, update the description
{!stats.userLevel && (
  <p className="text-xs text-muted-foreground mt-2 italic">
    Unable to detect your current level from resume
  </p>
)}
```

---

### Bug #6: Trigger `rb-extract-jd-requirements` During Quick Score Import

**Problem**: The `rb_jd_requirements` table stays empty after Quick Score import because the extraction edge function is never called.

**File**: `src/pages/resume-builder/ResumeBuilderIndex.tsx`

**Solution**: Add call to `rb-extract-jd-requirements` after project creation in `handleQuickScoreTransition`:

```typescript
// After line 259 (after keyword decisions insert), add:

// Trigger JD requirements extraction in background
if (state.jobDescription) {
  supabase.functions.invoke('rb-extract-jd-requirements', {
    body: { 
      project_id: project.id, 
      jd_text: state.jobDescription,
      role_title: state.jobTitle || state.scoreResult?.detected?.role || 'Unknown',
      seniority_level: mappedSeniority || 'IC',
    }
  }).then((result) => {
    if (result.error) {
      console.error('Failed to extract JD requirements:', result.error);
    } else {
      console.log('JD requirements extracted:', result.data?.requirements_count);
    }
  });
}
```

---

## Part 2: Design Refinements

### Refinement #1: Tone Down HiringPrioritiesPanel Backgrounds

**File**: `src/components/quick-score/HiringPrioritiesPanel.tsx`

**Current** (lines 26-47):
```typescript
const statusConfig = {
  strong: {
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30'
  },
  partial: {
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  missing: {
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30'
  }
};
```

**Change to**: Remove colored backgrounds, use subtle borders only:
```typescript
const statusConfig = {
  strong: {
    icon: CheckCircle2,
    label: 'Strong Match',
    color: 'text-primary',
    bgColor: 'bg-card',           // Changed from bg-primary/10
    borderColor: 'border-border'  // Subtle neutral border
  },
  partial: {
    icon: AlertCircle,
    label: 'Partial Match',
    color: 'text-amber-500',
    bgColor: 'bg-card',
    borderColor: 'border-border'
  },
  missing: {
    icon: XCircle,
    label: 'Not Shown',
    color: 'text-destructive',
    bgColor: 'bg-card',
    borderColor: 'border-border'
  }
};
```

The status is still communicated via the **badge and icon color** - the background doesn't need to reinforce it.

---

## Part 3: Centralized Seniority Mapping Utility

To reduce duplication and ensure consistency, create a shared utility:

**New file**: `src/lib/seniority-utils.ts`

```typescript
// Database-valid seniority levels
export const DB_SENIORITY_LEVELS = [
  'IC', 'Senior IC', 'Manager', 'Senior Manager', 
  'Director', 'Senior Director', 'VP', 'SVP', 'C-Level'
] as const;

export type DBSeniorityLevel = typeof DB_SENIORITY_LEVELS[number];

// UI-friendly labels for display
export const UI_SENIORITY_OPTIONS = [
  { value: 'IC', label: 'Entry Level / Junior' },
  { value: 'IC', label: 'Mid-Level' },
  { value: 'Senior IC', label: 'Senior' },
  { value: 'Senior IC', label: 'Lead / Principal' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Senior Manager', label: 'Senior Manager' },
  { value: 'Director', label: 'Director' },
  { value: 'Senior Director', label: 'Senior Director' },
  { value: 'VP', label: 'VP' },
  { value: 'SVP', label: 'SVP' },
  { value: 'C-Level', label: 'C-Level / Executive' },
];

// Map Quick Score / AI detected level to DB value
export function mapDetectedLevelToDB(detected: string | null): DBSeniorityLevel | null {
  if (!detected) return null;
  const normalized = detected.toLowerCase().trim();
  
  const mapping: Record<string, DBSeniorityLevel> = {
    'entry': 'IC',
    'junior': 'IC',
    'mid': 'IC',
    'mid-level': 'IC',
    'senior': 'Senior IC',
    'lead': 'Senior IC',
    'staff': 'Senior IC',
    'principal': 'Senior IC',
    'manager': 'Manager',
    'senior manager': 'Senior Manager',
    'director': 'Director',
    'senior director': 'Senior Director',
    'vp': 'VP',
    'vice president': 'VP',
    'svp': 'SVP',
    'c-level': 'C-Level',
    'executive': 'Director',
  };
  
  return mapping[normalized] || null;
}

// For display in UI
export function getSeniorityLabel(dbValue: DBSeniorityLevel): string {
  const labels: Record<DBSeniorityLevel, string> = {
    'IC': 'Individual Contributor',
    'Senior IC': 'Senior',
    'Manager': 'Manager',
    'Senior Manager': 'Senior Manager',
    'Director': 'Director',
    'Senior Director': 'Senior Director',
    'VP': 'VP',
    'SVP': 'SVP',
    'C-Level': 'C-Level',
  };
  return labels[dbValue] || dbValue;
}
```

---

## Summary of Changes

| File | Type | Description |
|------|------|-------------|
| **Database migration** | Schema | Add `doc_type` column to `rb_documents` |
| `src/types/resume-builder.ts` | Fix | Update `ProjectStatus` type to match DB constraint |
| `src/pages/resume-builder/ResumeBuilderIndex.tsx` | Fix + Feature | Add `doc_type: "resume"` to insert, trigger `rb-extract-jd-requirements` |
| `src/pages/resume-builder/TargetPage.tsx` | Fix | Add `mapSeniorityToDB()` and use it when saving |
| `src/pages/resume-builder/FixPage.tsx` | Fix | Change `.order('priority')` to `.order('weight')` |
| `src/pages/resume-builder/ReportPage.tsx` | Enhancement | Add messaging when seniority level is unknown |
| `src/components/quick-score/HiringPrioritiesPanel.tsx` | Design | Tone down background colors to subtle borders |
| `src/lib/seniority-utils.ts` | New | Centralized seniority mapping utility |

---

## Verification Checklist

After implementation:
- [ ] Quick Score import sets `doc_type: "resume"` on documents
- [ ] FixPage loads requirements sorted by `weight` (not `priority`)
- [ ] TargetPage saves DB-valid seniority levels
- [ ] ProjectStatus type matches DB constraint
- [ ] `rb_jd_requirements` is populated during Quick Score import
- [ ] HiringPrioritiesPanel uses subtle borders instead of colored backgrounds
- [ ] Seniority alignment shows helpful message when user level is unknown
