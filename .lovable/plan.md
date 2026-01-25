

# Audit Fix Plan: World-Class Resume Generation (Final Polish Round 2)

## Summary
The implementation is **92% complete**. This audit identified 3 critical issues, 5 medium issues, and 4 minor issues. Estimated effort: **1.5-2 hours**.

---

## Critical Fixes

### Fix 1: Extract Shared `mapToRBEvidence` to Utility File
**Current State**: The same function is duplicated in two files.

**Solution**: Move to `src/lib/resume-section-utils.ts` and export from there.

```typescript
// Add to src/lib/resume-section-utils.ts
import type { 
  RBEvidence, 
  EvidenceCategory, 
  EvidenceSource, 
  EvidenceConfidence,
  SpanLocation 
} from '@/types/resume-builder';

export interface PartialEvidence {
  id: string;
  claim_text: string;
  evidence_quote: string | null;
  source: string;
  category: string;
  confidence: string;
  is_active: boolean;
  project_id: string;
  span_location: unknown;
  created_at: string;
}

export function mapToRBEvidence(data: PartialEvidence[]): RBEvidence[] {
  return data.map(item => ({
    id: item.id,
    project_id: item.project_id,
    claim_text: item.claim_text,
    evidence_quote: item.evidence_quote || item.claim_text,
    category: item.category as EvidenceCategory,
    source: item.source as EvidenceSource,
    confidence: item.confidence as EvidenceConfidence,
    span_location: item.span_location as SpanLocation | null,
    is_active: item.is_active,
    created_at: item.created_at,
  }));
}
```

Then update both files to import from the shared utility.

### Fix 2: Rename `currentStepIndex` Prop for Clarity
**File**: `src/components/resume-builder/IndustryResearchProgress.tsx`

The prop is actually receiving a percentage, so rename it:

```typescript
interface IndustryResearchProgressProps {
  steps: ResearchStep[];
  progressPercent: number; // Renamed from currentStepIndex
  roleTitle: string;
  industry: string;
  seniorityLevel: string;
}
```

Update the caller in `TwoStageGenerationDialog.tsx`:
```typescript
<IndustryResearchProgress
  steps={researchSteps}
  progressPercent={progressPercent} // Renamed
  roleTitle={roleTitle}
  ...
/>
```

### Fix 3: Add Database Unique Constraint
**Location**: Database migration

```sql
-- Check if constraint exists first, then add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rb_industry_research_unique_key'
  ) THEN
    ALTER TABLE rb_industry_research 
    ADD CONSTRAINT rb_industry_research_unique_key 
    UNIQUE (role_title, seniority_level, industry);
  END IF;
END
$$;
```

---

## Medium Fixes

### Fix 4: Add Error Handling to Evidence Pre-fetch
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

```typescript
useEffect(() => {
  if (open && projectId) {
    supabase
      .from('rb_evidence')
      .select('...')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error) {
          console.error('[TwoStageGenerationDialog] Evidence pre-fetch failed:', error);
          return;
        }
        if (data) {
          setPreviewEvidence(mapToRBEvidence(data as PartialEvidence[]));
        }
      });
  }
}, [open, projectId]);
```

### Fix 5: Add `onImprove` Callback to All Strength Indicators
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Create a navigation handler:
```typescript
const handleImproveStrength = () => {
  handleClose();
  // Navigate to fix page with achievement builder
  window.location.href = `/resume-builder/${projectId}/fix`;
};
```

Then pass to all `ResumeStrengthIndicator` instances:
```typescript
<ResumeStrengthIndicator 
  strength={resumeStrength} 
  compact={resumeStrength.isStrongEnough}
  onImprove={handleImproveStrength}
/>
```

### Fix 6: Move Evidence Fetch After Session Check
**File**: `src/hooks/useTwoStageGeneration.ts`

Reorder operations:
```typescript
const startGeneration = useCallback(async (params: StartGenerationParams) => {
  // Validation first
  if (!params.jobDescription?.trim()) {...}
  if (!params.roleTitle?.trim() || !params.industry?.trim()) {...}
  
  setIsLoading(true);
  setError(null);
  setStage('researching');
  setGenerationParams(params);

  try {
    // Session check FIRST
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Please sign in to continue');
    }

    // THEN fetch evidence
    const { data: evidenceData } = await supabase
      .from('rb_evidence')
      .select('...')
      .eq('project_id', params.projectId)
      .eq('is_active', true);
    
    // ... rest of function
  }
}, []);
```

### Fix 7: Replace Hardcoded Fallbacks with Error State
**File**: `src/pages/resume-builder/studio/SummaryPage.tsx`

Instead of silent fallbacks, show error:
```typescript
const handleWorldClass = () => {
  if (!project?.jd_text) {
    toast.error('Please add a job description first');
    return;
  }
  if (!project?.role_title) {
    toast.error('Please confirm your target role first');
    return;
  }
  if (!project?.industry) {
    toast.error('Please confirm your target industry first');
    return;
  }
  if (!project?.seniority_level) {
    toast.error('Please confirm your seniority level first');
    return;
  }
  setShowTwoStage(true);
};

// In TwoStageGenerationDialog props, don't pass fallbacks:
roleTitle={project?.role_title || ''}
seniorityLevel={project?.seniority_level || ''}
industry={project?.industry || ''}
```

### Fix 8: Verify SpanLocation Type Export
**File**: `src/types/resume-builder.ts`

Ensure SpanLocation is exported:
```typescript
export interface SpanLocation {
  section: 'summary' | 'skills' | 'experience' | 'education' | 'other';
  jobIndex?: number;
  bulletIndex?: number;
}
```

---

## Minor Fixes

### Fix 9: Remove Unused `getSectionType` Function
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Delete lines 179-182:
```typescript
// DELETE THIS:
const getSectionType = (): APISectionType => {
  return mapUISectionToAPIType(sectionName);
};
```

### Fix 10: Simplify Evidence State Naming
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Rename for clarity:
```typescript
// Before
const [previewEvidence, setPreviewEvidence] = useState<RBEvidence[]>([]);

// After
const [prefetchedEvidence, setPrefetchedEvidence] = useState<RBEvidence[]>([]);
```

### Fix 11: Remove Duplicate Category Definitions
**File**: `src/lib/resume-section-utils.ts`

The `SECTION_EVIDENCE_CATEGORIES` should only exist in one place. Since the backend also defines this in `rb-generate-personalized-section/index.ts`, consider importing from a shared location or accepting the duplication with a comment explaining why.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/resume-section-utils.ts` | Add shared `mapToRBEvidence` function and `PartialEvidence` interface |
| `src/hooks/useTwoStageGeneration.ts` | Remove duplicate function, import from utility, reorder session check |
| `src/components/resume-builder/TwoStageGenerationDialog.tsx` | Import shared function, add error handling, add onImprove callback, remove dead code |
| `src/components/resume-builder/IndustryResearchProgress.tsx` | Rename prop from `currentStepIndex` to `progressPercent` |
| `src/pages/resume-builder/studio/SummaryPage.tsx` | Strengthen validation, remove fallback values |
| `src/types/resume-builder.ts` | Verify SpanLocation export |
| Database migration | Add unique constraint on rb_industry_research |

---

## Estimated Effort

| Task | Complexity | Time |
|------|------------|------|
| Extract shared mapToRBEvidence | Low | 15 min |
| Rename currentStepIndex prop | Low | 5 min |
| Add database unique constraint | Low | 5 min |
| Add error handling to pre-fetch | Low | 5 min |
| Add onImprove callbacks | Low | 10 min |
| Reorder session check | Low | 5 min |
| Remove hardcoded fallbacks | Low | 10 min |
| Verify SpanLocation export | Low | 5 min |
| Remove dead code | Low | 5 min |
| Testing & verification | Medium | 25 min |

**Total: ~1.5 hours**

---

## Testing Checklist

After implementing fixes:
1. Open Summary Studio page - verify validation blocks dialog if data missing
2. Click "World-Class" button with valid project
3. Verify progress UI shows correctly during research phase
4. Verify strength indicator shows with working "Improve" button
5. Complete full generation flow
6. Test blend editor functionality
7. Verify no console errors or TypeScript warnings
8. Test with minimal evidence to verify strength warnings appear

