

# Audit Fix Plan: Resume Builder V4 World-Class Generation

## Overview

The audit identified **5 critical issues**, **4 medium issues**, and **3 minor issues** in the newly implemented World-Class Resume Generation Strategy. The core problem is a mismatch between the frontend hook/dialog and the edge function API contracts.

---

## Critical Fixes (Must Do)

### Fix 1: Correct `useTwoStageGeneration` Hook API Calls

**File**: `src/hooks/useTwoStageGeneration.ts`

**Changes**:

1. Update `IndustryResearch` interface to match actual schema:
```typescript
interface IndustryResearch {
  role_title: string;
  seniority_level: string;
  industry: string;
  keywords: Array<{ term: string; frequency: string; category: string }>;
  power_phrases: Array<{ phrase: string; impact_level: string; use_case: string }>;
  typical_qualifications: Array<{ qualification: string; importance: string; category: string }>;
  competitive_benchmarks: Array<{ area: string; top_performer: string; average: string }>;
  summary_template: string;
  experience_focus: string[];
}
```

2. Update `GenerationResult` to match `IdealSectionSchema`:
```typescript
interface IdealGenerationResult {
  section_type: string;
  ideal_content: string;
  structure_notes: string;
  key_elements: string[];
  word_count: number;
  keywords_included: string[];
}

interface PersonalizedGenerationResult {
  section_type: string;
  personalized_content: string;
  ideal_elements_preserved: string[];
  evidence_incorporated: Array<{ claim_id?: string; evidence_text: string; how_used: string }>;
  gaps_identified: string[];
  questions_for_user: string[];
  similarity_to_ideal: number;
}
```

3. Fix the `rb-generate-ideal-section` call body:
```typescript
body: {
  section_type: mapSectionName(params.sectionName),  // 'summary' | 'skills' | 'experience_bullets' | 'education'
  jd_text: params.jobDescription,
  industry_research: researchData,
  role_context: {
    role_title: params.roleTitle,
    seniority_level: params.seniorityLevel,
    industry: params.industry,
  },
}
```

4. Fix the evidence query to include `evidence_quote`:
```typescript
.select('id, claim_text, evidence_quote, source, category, confidence')
```

5. Fix the `rb-generate-personalized-section` call body:
```typescript
body: {
  section_type: mapSectionName(generationParams.sectionName),
  ideal_content: idealContent.ideal_content,
  user_evidence: evidenceClaims.map(e => ({
    claim_text: e.claim_text,
    evidence_quote: e.evidence_quote,
    category: e.category,
    confidence: e.confidence,
  })),
  role_context: {
    role_title: generationParams.roleTitle,
    seniority_level: generationParams.seniorityLevel,
    industry: generationParams.industry,
  },
}
```

6. Add section name mapping helper:
```typescript
function mapSectionName(name: string): 'summary' | 'skills' | 'experience_bullets' | 'education' {
  if (name === 'experience') return 'experience_bullets';
  return name as 'summary' | 'skills' | 'education';
}
```

---

### Fix 2: Update `TwoStageGenerationDialog` Field Access

**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

**Changes**:

1. Update field access for ideal content:
```typescript
idealContent={idealContent.ideal_content}
structureNotes={idealContent.structure_notes}
keyElements={idealContent.key_elements}
keywordsIncluded={idealContent.keywords_included}
wordCount={idealContent.word_count}
```

2. Update keywords display to handle object arrays:
```typescript
keywordsIncluded={industryResearch.keywords.slice(0, 8).map(k => k.term)}
```

3. Fix comparison data to use correct fields:
```typescript
const comparisonData = useMemo(() => ({
  idealContent: idealContent?.ideal_content || '',
  personalizedContent: personalizedContent?.personalized_content || '',
  idealWordCount: idealContent?.word_count || 0,
  personalizedWordCount: personalizedContent?.personalized_content?.split(/\s+/).filter(Boolean).length || 0,
  similarityScore: personalizedContent?.similarity_to_ideal || 0,
  gapsIdentified: personalizedContent?.gaps_identified || [],
  evidenceUsed: personalizedContent?.evidence_incorporated || [],
}), [idealContent, personalizedContent]);
```

---

### Fix 3: Update `IdealExampleCard` Props Usage

**File**: `src/components/resume-builder/IdealExampleCard.tsx`

No changes needed - props are correct, but the parent was passing wrong data.

---

## Medium Fixes

### Fix 4: Integrate Resume Strength Analyzer

**File**: `src/components/resume-builder/TwoStageGenerationDialog.tsx`

Add strength check before personalization:
```typescript
import { analyzeResumeStrength } from '@/lib/resume-strength-analyzer';
import { ResumeStrengthIndicator } from './ResumeStrengthIndicator';

// In the ready_for_personalization stage, show strength indicator
{stage === 'ready_for_personalization' && evidence && (
  <ResumeStrengthIndicator 
    strength={analyzeResumeStrength(evidence)} 
    onImprove={() => {/* navigate to fix page */}}
  />
)}
```

### Fix 5: Add `evidence` State to Hook

**File**: `src/hooks/useTwoStageGeneration.ts`

Store evidence for strength analysis:
```typescript
const [userEvidence, setUserEvidence] = useState<RBEvidence[]>([]);

// In generatePersonalized, after loading evidence:
setUserEvidence(evidence || []);
```

Export in return object for dialog to use.

---

## Minor Fixes

### Fix 6: Remove Hardcoded Values

**Files**: `TwoStageGenerationDialog.tsx`

Replace hardcoded quality indicators with actual data from responses.

### Fix 7: Add Loading State for Evidence Fetch

Add intermediate loading state while fetching evidence before personalization.

---

## Testing Checklist

After implementing fixes:

1. Click "World-Class" button on Summary page
2. Verify research phase completes without errors
3. Verify ideal section displays with correct content
4. Click "Personalize" and verify personalization completes
5. Verify side-by-side comparison shows both versions
6. Test blend editor functionality
7. Verify selected content updates the editor

---

## Estimated Effort

| Task | Complexity | Time |
|------|------------|------|
| Fix useTwoStageGeneration API calls | High | 30 min |
| Fix TwoStageGenerationDialog fields | Medium | 20 min |
| Integrate strength analyzer | Low | 15 min |
| Testing and validation | Medium | 20 min |

**Total: ~1.5 hours**

