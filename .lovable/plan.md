

# Audit Fix Plan: World-Class Resume Generation (Post-Implementation Review)

## Summary
The implementation is **85% complete and functional**, but requires fixes for 5 critical issues, 6 medium issues, and minor polish. Estimated effort: **2-3 hours**.

---

## Critical Fixes

### Fix 1: Display Error State in Dialog
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Add error display after destructuring and in the idle/loading states:
```typescript
// Destructure error from hook
const { stage, isLoading, error, ... } = useTwoStageGeneration();

// Add error banner before stage-specific content
{error && (
  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
    <div className="flex items-center gap-2 text-destructive">
      <AlertTriangle className="h-5 w-5" />
      <p className="text-sm font-medium">{error}</p>
    </div>
    <Button variant="outline" size="sm" onClick={reset} className="mt-2">
      Try Again
    </Button>
  </div>
)}
```

### Fix 2: Correct Progress Step Indexing
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Fix the step index mapping to properly align with 4-step array (0-3):
```typescript
const researchSteps: ResearchStep[] = useMemo(() => {
  let currentIndex = -1; // -1 = all pending
  if (stage === 'researching') currentIndex = 0;
  else if (stage === 'generating_ideal') currentIndex = 2;
  else if (stage !== 'idle') currentIndex = 3; // Mark last step complete
  
  return defaultResearchSteps.map((step, index) => ({
    ...step,
    status: index < currentIndex ? 'complete' : index === currentIndex ? 'active' : 'pending',
  }));
}, [stage]);
```

### Fix 3: Pre-load Evidence Before Personalization
**File**: `src/hooks/useTwoStageGeneration.ts`

Move evidence loading to `startGeneration` so strength can be shown during `ready_for_personalization`:
```typescript
const startGeneration = useCallback(async (params: StartGenerationParams) => {
  // ... after setGenerationParams(params)
  
  // Pre-load evidence for strength analysis
  const { data: evidence } = await supabase
    .from('rb_evidence')
    .select('id, claim_text, evidence_quote, source, category, confidence, is_active, project_id, span_location, created_at')
    .eq('project_id', params.projectId)
    .eq('is_active', true);
  
  setUserEvidence((evidence as RBEvidence[]) || []);
  
  // Continue with research...
}, []);
```

### Fix 4: Show Strength Indicator BEFORE Personalization
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Add strength indicator in `ready_for_personalization` stage:
```typescript
{stage === 'ready_for_personalization' && idealContent && industryResearch && (
  <div className="space-y-6">
    {/* Strength indicator shown BEFORE clicking personalize */}
    {resumeStrength && (
      <ResumeStrengthIndicator 
        strength={resumeStrength} 
        compact={resumeStrength.isStrongEnough}
        onImprove={() => { /* Navigate to fix page */ }}
      />
    )}
    
    <IdealExampleCard ... />
  </div>
)}
```

### Fix 5: Add Empty JD/Project Validation
**File**: `src/hooks/useTwoStageGeneration.ts`

Add validation at start of `startGeneration`:
```typescript
const startGeneration = useCallback(async (params: StartGenerationParams) => {
  // Validate required inputs
  if (!params.jobDescription?.trim()) {
    setError('Please add a job description before generating content');
    toast.error('Job description is required');
    return;
  }
  if (!params.roleTitle?.trim() || !params.industry?.trim()) {
    setError('Please confirm your target role and industry first');
    toast.error('Target role information is required');
    return;
  }
  // ... rest of function
}, []);
```

---

## Medium Fixes

### Fix 6: Remove Misleading UI Copy
**File**: `src/components/resume-builder/IndustryResearchProgress.tsx`

Update step descriptions to be accurate:
```typescript
{
  id: 'research',
  label: 'Researching Industry Standards',
  description: 'Analyzing best practices for this role and seniority level',
  status: 'pending',
},
```

### Fix 7: Add Request Cleanup on Unmount
**File**: `src/hooks/useTwoStageGeneration.ts`

Add AbortController pattern:
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const startGeneration = useCallback(async (params) => {
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();
  
  try {
    // ... existing logic
  } catch (err) {
    if (err.name === 'AbortError') return; // Silent exit on abort
    // ... error handling
  }
}, []);

const reset = useCallback(() => {
  abortControllerRef.current?.abort();
  // ... existing reset logic
}, []);
```

### Fix 8: Validate Project Has Required Data Before Dialog Opens
**File**: `src/pages/resume-builder/studio/SummaryPage.tsx`

Add validation before opening dialog:
```typescript
const handleWorldClass = () => {
  if (!project?.jd_text) {
    toast.error('Please add a job description first');
    return;
  }
  if (!project?.role_title || !project?.industry) {
    toast.error('Please confirm your target role first');
    return;
  }
  setShowTwoStage(true);
};

// Update callback
onWorldClass={handleWorldClass}
```

### Fix 9: Fix Evidence Category Filtering
**File**: `supabase/functions/rb-generate-personalized-section/index.ts`

Expand category mappings:
```typescript
const sectionCategories: Record<string, string[]> = {
  summary: ["skill", "domain", "leadership", "metric", "responsibility"],
  skills: ["skill", "tool", "domain", "metric"],
  experience_bullets: ["responsibility", "metric", "leadership", "skill", "tool"],
  education: ["domain", "skill"],
};
```

### Fix 10: Add Word Count to Personalized Schema
**File**: `supabase/functions/_shared/rb-schemas.ts`

Add optional word_count to PersonalizedSectionSchema for consistency:
```typescript
word_count: z.number().optional().describe("Word count of personalized content"),
```

### Fix 11: Consistent Word Count Source in Dialog
**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Use API-provided word count when available:
```typescript
personalizedWordCount: personalizedContent?.word_count || 
  personalizedContent?.personalized_content?.split(/\s+/).filter(Boolean).length || 0,
```

---

## Testing Checklist

After fixes:
1. Open Summary Studio page with project that has JD and target role confirmed
2. Click "World-Class" button
3. Verify research progress shows correct step highlighting (not jumping to 100%)
4. Verify strength indicator shows BEFORE clicking "Personalize"
5. Complete personalization and verify comparison view works
6. Test blend editor functionality
7. Test error states by disconnecting network mid-request
8. Test with empty evidence to verify warnings appear

---

## Estimated Effort

| Task | Complexity | Time |
|------|------------|------|
| Error display + retry button | Low | 15 min |
| Progress step index fix | Low | 10 min |
| Pre-load evidence for strength | Medium | 20 min |
| JD/project validation | Low | 15 min |
| Update misleading UI copy | Low | 5 min |
| Add AbortController cleanup | Medium | 20 min |
| Category filtering expansion | Low | 10 min |
| Word count consistency | Low | 10 min |
| Testing & verification | Medium | 30 min |

**Total: ~2.5 hours**

