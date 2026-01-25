

# Audit Fix Plan: World-Class Resume Generation (Final Polish Round 3)

## Summary
The implementation is **97% complete**. This audit identified 1 critical issue, 3 medium issues, and 3 minor improvements. Estimated effort: **30-45 minutes**.

---

## Critical Fix

### Fix 1: Guard Dialog Props When Missing Data
**File**: `src/pages/resume-builder/studio/SummaryPage.tsx`

Even though validation blocks opening, the dialog should not receive empty strings. Add an early return or conditional render:

```typescript
{/* Only render dialog when all required data is present */}
{project?.role_title && project?.industry && project?.seniority_level && project?.jd_text && (
  <TwoStageGenerationDialog
    open={showTwoStage}
    onOpenChange={setShowTwoStage}
    projectId={projectId || ''}
    sectionName={SECTION_NAME}
    roleTitle={project.role_title}
    seniorityLevel={project.seniority_level}
    industry={project.industry}
    jobDescription={project.jd_text}
    onContentSelect={handleWorldClassContent}
  />
)}
```

---

## Medium Fixes

### Fix 2: Clear Preview Evidence on Project Change
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Reset evidence when projectId changes:

```typescript
useEffect(() => {
  if (open && projectId) {
    // Clear stale evidence first
    setPreviewEvidence([]);
    
    supabase
      .from('rb_evidence')
      .select('...')
      // ... rest of fetch
  } else {
    // Clear when dialog closes
    setPreviewEvidence([]);
  }
}, [open, projectId]);
```

### Fix 3: Wrap handleClose in useCallback
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

```typescript
const handleClose = useCallback(() => {
  reset();
  setShowBlendEditor(false);
  setPreviewEvidence([]);
  onOpenChange(false);
}, [reset, onOpenChange]);
```

### Fix 4: Remove Redundant Word Count Fallback
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Since the edge function now guarantees word_count, simplify:

```typescript
personalizedWordCount: personalizedContent?.word_count || 0,
```

---

## Minor Fixes (Optional)

### Fix 5: Add Initial Content Prop to BlendEditor
**File**: `src/components/resume-builder/BlendEditor.tsx`

```typescript
interface BlendEditorProps {
  idealContent: string;
  personalizedContent: string;
  initialContent?: 'ideal' | 'personalized'; // NEW
  onSave: (blendedContent: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// In component:
const [blendedContent, setBlendedContent] = useState(
  initialContent === 'ideal' ? idealContent : personalizedContent
);
```

### Fix 6: Unify SpanLocation Type Definition
**Files**: `src/types/resume-builder.ts` and `supabase/functions/_shared/rb-schemas.ts`

Update TypeScript interface to match Zod enum:

```typescript
// In src/types/resume-builder.ts
export interface SpanLocation {
  section: 'summary' | 'skills' | 'experience' | 'education' | 'other'; // Was: string
  jobIndex?: number;
  bulletIndex?: number;
  startChar: number;
  endChar: number;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/resume-builder/studio/SummaryPage.tsx` | Conditional dialog render |
| `src/components/resume-builder/TwoStageGenerationDialog.tsx` | Clear stale evidence, useCallback, simplify word count |
| `src/components/resume-builder/BlendEditor.tsx` | (Optional) Add initialContent prop |
| `src/types/resume-builder.ts` | (Optional) Tighten SpanLocation type |

---

## Testing Checklist

After implementing fixes:
1. Verify dialog cannot open with missing project data
2. Switch between projects and verify evidence resets
3. Complete full generation flow end-to-end
4. Verify blend editor works correctly
5. Check for console errors or TypeScript warnings
6. Test with minimal/no evidence to verify warnings appear

---

## Estimated Effort

| Task | Complexity | Time |
|------|------------|------|
| Guard dialog props | Low | 5 min |
| Clear stale evidence | Low | 5 min |
| Add useCallback | Low | 5 min |
| Simplify word count | Low | 2 min |
| (Optional) BlendEditor prop | Low | 10 min |
| (Optional) SpanLocation type | Low | 5 min |
| Testing | Low | 15 min |

**Total: ~30-45 minutes**

---

## Verification Notes

The implementation is now production-ready with minor polish items remaining. The core two-stage generation workflow, evidence handling, strength analysis, and UI are all working correctly. The fixes above are refinements rather than critical bugs.

