

# Audit Fix Plan: World-Class Resume Generation (Final Polish)

## Summary
The implementation is **90% complete and functional**. This audit identified 3 critical issues, 5 medium issues, and 4 minor issues that need to be addressed. Estimated effort: **2 hours**.

---

## Critical Fixes

### Fix 1: Verify and Create Unique Constraint on `rb_industry_research`
**Location**: Database migration

Check if the unique constraint exists, and if not, create it:
```sql
ALTER TABLE rb_industry_research 
ADD CONSTRAINT rb_industry_research_unique_key 
UNIQUE (role_title, seniority_level, industry);
```

### Fix 2: Fix Unsafe Type Casting for RBEvidence
**File**: `src/hooks/useTwoStageGeneration.ts`

Create a proper evidence mapping function instead of double-casting:
```typescript
interface PartialEvidence {
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

function mapToRBEvidence(data: PartialEvidence[]): RBEvidence[] {
  return data.map(item => ({
    ...item,
    evidence_quote: item.evidence_quote || item.claim_text,
    category: item.category as EvidenceCategory,
    source: item.source as EvidenceSource,
    confidence: item.confidence as EvidenceConfidence,
    span_location: item.span_location as SpanLocation | null,
  }));
}
```

### Fix 3: Remove Ineffective AbortController Pattern
**File**: `src/hooks/useTwoStageGeneration.ts`

Since Supabase SDK doesn't support abort signals, replace with a simpler "mounted" check:
```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);

// In async functions:
if (!isMountedRef.current) return;
```

---

## Medium Fixes

### Fix 4: Unify Progress Step Index Logic
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Remove the duplicate `currentStepIndex` calculation and use a single source of truth:
```typescript
const { researchSteps, progressPercent } = useMemo(() => {
  let activeIndex = -1;
  if (stage === 'researching') activeIndex = 0;
  else if (stage === 'generating_ideal') activeIndex = 2;
  else if (stage !== 'idle') activeIndex = 4;
  
  const steps = defaultResearchSteps.map((step, index) => ({
    ...step,
    status: index < activeIndex ? 'complete' : index === activeIndex ? 'active' : 'pending',
  }));
  
  const percent = Math.round((Math.max(0, activeIndex) / steps.length) * 100);
  
  return { researchSteps: steps, progressPercent: percent };
}, [stage]);
```

### Fix 5: Show Strength Indicator in Idle State
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Load evidence on dialog open (not just on start generation):
```typescript
useEffect(() => {
  if (open && projectId) {
    // Pre-fetch evidence for strength preview
    supabase
      .from('rb_evidence')
      .select('...')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .then(({ data }) => setPreviewEvidence(data || []));
  }
}, [open, projectId]);
```

### Fix 6: Handle Empty Relevant Evidence
**File**: `supabase/functions/rb-generate-personalized-section/index.ts`

Add a check and warning:
```typescript
if (relevantEvidence.length === 0) {
  console.warn('[rb-generate-personalized-section] No relevant evidence found for section');
  // Return a response indicating the content will be generic
}
```

### Fix 7: Consolidate Section Mapping to Single Utility
**Files**: Create `src/lib/resume-section-utils.ts`

```typescript
export function mapUISectionToAPIType(name: string): 'summary' | 'skills' | 'experience_bullets' | 'education' {
  if (name === 'experience') return 'experience_bullets';
  return name as 'summary' | 'skills' | 'education';
}
```

Then import and use consistently in both hook and dialog.

### Fix 8: Ensure AI Returns Word Count
**File**: `supabase/functions/rb-generate-personalized-section/index.ts`

Update the JSON schema in the prompt to explicitly request word_count:
```typescript
{
  // ... existing fields
  "word_count": "number - count the words in personalized_content"
}
```

---

## Minor Fixes

### Fix 9: Remove Misleading Insight Counter
**File**: `src/components/resume-builder/IndustryResearchProgress.tsx`

Either remove the insight counter entirely or base it on actual data:
```typescript
{industryResearch?.keywords?.length ? (
  <p>Discovered {industryResearch.keywords.length}+ industry keywords</p>
) : null}
```

### Fix 10: BlendEditor Default Content Choice
**File**: `src/components/resume-builder/BlendEditor.tsx`

Consider starting with an empty editor or prompting user choice, but this is low priority.

### Fix 11: Remove Duplicate Evidence Fetch
**File**: `src/hooks/useTwoStageGeneration.ts`

Since evidence is pre-loaded in `startGeneration`, reuse `userEvidence` state in `generatePersonalized` instead of fetching again.

### Fix 12: Add Debounce to Start Button
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

```typescript
const [isStarting, setIsStarting] = useState(false);

const handleStart = async () => {
  if (isStarting) return;
  setIsStarting(true);
  try {
    await startGeneration({...});
  } finally {
    setIsStarting(false);
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add unique constraint on `rb_industry_research` |
| `src/hooks/useTwoStageGeneration.ts` | Fix type casting, remove AbortController, remove duplicate fetch |
| `src/components/resume-builder/TwoStageGenerationDialog.tsx` | Unify step logic, pre-load evidence, add debounce |
| `src/components/resume-builder/IndustryResearchProgress.tsx` | Remove misleading insight counter |
| `supabase/functions/rb-generate-personalized-section/index.ts` | Handle empty evidence, ensure word_count in prompt |
| `src/lib/resume-section-utils.ts` (new) | Create shared section mapping utility |

---

## Estimated Effort

| Task | Complexity | Time |
|------|------------|------|
| Database unique constraint | Low | 5 min |
| Fix type casting | Medium | 15 min |
| Fix AbortController pattern | Low | 10 min |
| Unify progress step logic | Low | 10 min |
| Pre-load evidence for strength | Medium | 15 min |
| Handle empty evidence | Low | 10 min |
| Create shared section utility | Low | 10 min |
| Ensure word_count in prompt | Low | 5 min |
| Remove misleading counter | Low | 5 min |
| Remove duplicate fetch | Low | 10 min |
| Add button debounce | Low | 5 min |
| Testing | Medium | 20 min |

**Total: ~2 hours**

