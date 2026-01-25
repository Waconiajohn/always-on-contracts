

# Remaining Work Plan

## Overview
There are two categories of remaining work:
1. **Technical Debt**: Refactor edge functions to use shared schemas
2. **Major Enhancement**: Implement the World-Class Resume Generation Strategy

---

## Part A: Technical Debt Cleanup (Estimated: 2-3 hours)

### Task A.1: Refactor Edge Functions to Use Shared Zod Schemas

**Goal**: All 9 `rb-*` edge functions should import and use schemas from `rb-schemas.ts` instead of inline interfaces.

**Files to update**:
- `supabase/functions/rb-classify-jd/index.ts` - Use `JDClassificationSchema`
- `supabase/functions/rb-extract-jd-requirements/index.ts` - Use `RequirementsExtractionSchema`
- `supabase/functions/rb-generate-benchmark/index.ts` - Use `BenchmarkGenerationSchema`
- `supabase/functions/rb-extract-resume-claims/index.ts` - Use `ClaimsExtractionSchema`
- `supabase/functions/rb-analyze-gaps/index.ts` - Use `GapAnalysisSchema`
- `supabase/functions/rb-rewrite-section/index.ts` - Use `SectionRewriteSchema`
- `supabase/functions/rb-micro-edit/index.ts` - Use `MicroEditSchema`
- `supabase/functions/rb-hiring-manager-critique/index.ts` - Use `HiringManagerCritiqueSchema`
- `supabase/functions/rb-validate-rewrite/index.ts` - Use `ValidationSchema`

**Changes per file**:
1. Import schema from shared module: `import { XxxSchema, parseAndValidate } from '../_shared/rb-schemas.ts'`
2. Remove inline interface definitions
3. Replace JSON parsing with `parseAndValidate(XxxSchema, content, 'rb-xxx')`

### Task A.2: Integrate VersionDiff into VersionHistory Sheet

**File**: `src/components/resume-builder/VersionHistory.tsx`

- Add "Compare" button next to each version entry
- Open `VersionDiff` component in a dialog/sheet
- Allow comparison between any two versions

---

## Part B: World-Class Resume Generation Strategy (Estimated: 12-15 hours)

This is a major new feature based on user feedback requesting:
- Industry research before generation
- "Ideal example" shown first
- Side-by-side comparison between ideal and personalized versions

### Phase B.1: Industry Research Infrastructure

**New Edge Function**: `rb-research-industry/index.ts`

- Input: Job title, industry, seniority level
- Process: Use AI to generate industry-specific insights
- Output: Common keywords, power phrases, typical qualifications, competitive benchmarks
- Cache results in new table `rb_industry_research`

**Database Migration**:
```sql
CREATE TABLE rb_industry_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  seniority_level TEXT NOT NULL,
  industry TEXT NOT NULL,
  research_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase B.2: Two-Stage Generation System

**New Edge Functions**:

1. `rb-generate-ideal-section/index.ts`
   - Uses ONLY job description + industry research
   - Does NOT use Master Resume data
   - Produces "platinum standard" content

2. `rb-generate-personalized-section/index.ts`
   - Takes ideal example as input
   - Injects user's real evidence/claims
   - Maintains industry-standard structure

### Phase B.3: Comparison UI Components

**New Components**:
- `IndustryResearchProgress.tsx` - Shows research progress with steps
- `IdealExampleCard.tsx` - Displays industry standard with quality indicators
- `SideBySideComparison.tsx` - Two-column view with highlighting
- `BlendEditor.tsx` - Allows mixing parts from both versions

**Updated Flow**:
```
Report Page → "Generate Sections" → Research Progress UI →
  → Show Ideal Example → "Personalize with My Data" →
    → Side-by-Side Comparison → Choose/Blend → Studio
```

### Phase B.4: Low Data Detection

**New Utility**: `src/lib/resume-strength-analyzer.ts`

- Analyze Master Resume completeness
- Detect: real achievements vs assumed, quantified results, category diversity
- Return strength score (0-100%)
- Show warning if below threshold (65%)

---

## Implementation Order

### Priority 1: Technical Debt (Do First)
1. Refactor all 9 edge functions to use shared schemas
2. Integrate VersionDiff into VersionHistory sheet

### Priority 2: World-Class Generation (Major Feature)
1. Create industry research edge function + caching
2. Build ideal section generator
3. Build personalized section generator
4. Create comparison UI components
5. Update flow to use two-stage generation
6. Add resume strength analyzer and warnings

---

## Estimated Effort

| Category | Complexity | Time |
|----------|------------|------|
| Edge function refactoring | Medium | 2-3 hours |
| VersionDiff integration | Low | 1 hour |
| Industry research system | High | 3-4 hours |
| Two-stage generation | High | 4-5 hours |
| Comparison UI | Medium | 3-4 hours |
| Resume strength analyzer | Low | 1-2 hours |

**Total: ~15-20 hours**

