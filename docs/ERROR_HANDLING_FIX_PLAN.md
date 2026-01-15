# Error Handling Migration: Systematic Fix Plan

## 🎯 Goal
Migrate all 108+ edge function calls to use the new error handling & validation utilities.

---

## 📋 Phase 1: High-Impact Components (Priority)

These are the most frequently used components that need immediate attention:

### 1.1 Interview & Career Tools (User-Facing)
- [ ] `InterviewPrepPanel.tsx` (2 edge function calls)
  - `generate-interview-question`
  - `validate-interview-response`
  - **Schema needed**: `GenerateInterviewQuestionSchema`, `ValidateInterviewResponseSchema`

- [ ] `InterviewFollowupPanel.tsx` (2 calls)
  - `generate-interview-followup`
  - `send-interview-communication`
  - **Schema needed**: `GenerateInterviewFollowupSchema`, `SendCommunicationSchema`

- [ ] `StarStoryBuilder.tsx` (1 call)
  - `generate-star-story`
  - **Schema needed**: `GenerateStarStorySchema`

- [ ] `WhyMeBuilder.tsx` (1 call)
  - `generate-why-me-questions`
  - **Schema needed**: `GenerateWhyMeQuestionsSchema`

### 1.2 Job Management (High Usage)
- [ ] `JobImportDialog.tsx` (1 call)
  - `parse-job-document`
  - **Schema**: ✅ Already exists: `ParseJobDocumentSchema`

- [ ] `ResumeOptimizer.tsx` (1 call)
  - `optimize-resume-with-audit`
  - **Schema**: ✅ Already exists: `OptimizeResumeSchema`

### 1.3 Master Resume Core (Critical Path)
- [ ] `AutoPopulateStep.tsx` (1 call) - **HIGH PRIORITY**
  - Currently uses old `executeWithRetry`
  - `auto-populate-vault-v3`
  - **Schema**: ✅ Already exists: `AutoPopulateVaultSchema`

- [ ] `AddMetricsModal.tsx` (1 call)
  - `suggest-metrics`
  - **Schema needed**: `SuggestMetricsSchema`

- [ ] `CareerGoalsStep.tsx` (1 call)
  - `infer-target-roles`
  - **Schema needed**: `InferTargetRolesSchema`

---

## 📋 Phase 2: Supporting Components

### 2.1 Master Resume Operations
- [ ] `VaultMigrationTool.tsx` (2 calls)
- [ ] `ResumeManagementModal.tsx` (2 calls)
- [ ] `VaultNuclearReset.tsx` (1 call)
- [ ] `BulkVaultOperations.tsx` (1 call)
- [ ] `VaultExportDialog.tsx` (1 call)
- [ ] `AdvancedVaultSearch.tsx` (1 call)

### 2.2 Analysis & Research
- [ ] `AIAnalysisStep.tsx` (1 call)
- [ ] `CompetencyQuizEngine.tsx` (1 call)
- [ ] `CareerFocusClarifier.tsx` (1 call)
- [ ] `CategoryRegenerateButton.tsx` (1 call)

### 2.3 Communication & Coaching
- [ ] `CoachingChat.tsx` (1 call)
- [ ] `ResponseReviewModal.tsx` (2 calls)
- [ ] `PersonaSelector.tsx` (1 call)

### 2.4 Job Tools
- [ ] `MarketInsightsPanel.tsx` (1 call)
- [ ] `AgencyMatcherPanel.tsx` (1 call)
- [ ] `JobFeedbackDialog.tsx` (1 call)
- [ ] `EnhancedQueueItem.tsx` (3 calls)

---

## 📋 Phase 3: Specialized Components

### 3.1 Resume Builder
- [ ] `SectionWizard.tsx` - Uses old `executeWithRetry`
- [ ] `DualGenerationComparison.tsx`

### 3.2 Admin & Analytics
- [ ] `AICostDashboard.tsx`
- [ ] `BatchResumeUpload.tsx`

### 3.3 Interview Responses
- [ ] `InterviewResponsesTab.tsx`
- [ ] `MicroQuestionsModal.tsx`

---

## 🛠️ Implementation Template

For each component, follow this pattern:

### Before
```typescript
// ❌ OLD PATTERN
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1, param2 }
});

if (error) throw error;
console.error('Error:', error);
toast.error('Something went wrong');
```

### After
```typescript
// ✅ NEW PATTERN
import { 
  FunctionNameSchema, 
  validateInput, 
  invokeEdgeFunction 
} from '@/lib/edgeFunction';

// 1. Validate input
const validated = validateInput(FunctionNameSchema, {
  param1,
  param2
});

// 2. Call with error handling
const { data, error } = await invokeEdgeFunction(
  supabase,
  'function-name',
  validated,
  {
    successMessage: 'Action completed!',
    showSuccessToast: true
  }
);

// 3. Handle response (errors are already handled!)
if (error) {
  // invokeEdgeFunction already showed toast
  return;
}

// Use data...
```

---

## 📝 Schemas to Create

Add these to `src/lib/edgeFunction/schemas.ts`:

```typescript
// Interview & Career Tools
export const GenerateInterviewQuestionSchema = z.object({
  jobDescription: z.string().min(50, 'Job description too short'),
  count: z.number().min(1).max(10).optional(),
  includeSTAR: z.boolean().optional(),
  questionType: z.enum(['behavioral', 'technical', 'situational', 'mixed']).optional()
});

export const ValidateInterviewResponseSchema = z.object({
  question: z.string().min(10, 'Question too short'),
  answer: z.string().min(20, 'Answer too short'),
  responseId: z.string().uuid().nullable().optional()
});

export const GenerateInterviewFollowupSchema = z.object({
  jobProjectId: z.string().uuid('Invalid job project ID'),
  communicationType: z.enum(['thank_you', 'follow_up', 'check_in']),
  customInstructions: z.string().optional()
});

export const SendCommunicationSchema = z.object({
  communicationId: z.string().uuid(),
  recipientEmail: z.string().email('Invalid email'),
  recipientName: z.string().min(1).optional(),
  subject: z.string().min(1, 'Subject required'),
  body: z.string().min(10, 'Body too short'),
  scheduledFor: z.string().datetime().nullable().optional()
});

export const GenerateStarStorySchema = z.object({
  rawStory: z.string().min(50, 'Story description too short').max(2000),
  action: z.enum(['generate', 'refine'])
});

export const GenerateWhyMeQuestionsSchema = z.object({
  jobDescription: z.string().min(50),
  vaultId: z.string().uuid().optional()
});

export const SuggestMetricsSchema = z.object({
  phrase: z.string().min(10, 'Phrase too short').max(500),
  context: z.string().max(1000).optional()
});

export const InferTargetRolesSchema = z.object({
  vaultId: z.string().uuid(),
  currentRole: z.string().optional(),
  yearsExperience: z.number().min(0).optional()
});

// Add more as needed...
```

---

## ✅ Acceptance Criteria

For each migrated component:
- [x] Uses `validateInput()` for all edge function calls
- [x] Uses `invokeEdgeFunction()` wrapper
- [x] Removed `console.error` (use `logger` if needed)
- [x] Removed manual error toasts
- [x] Removed manual retry logic
- [x] Added proper TypeScript types from schema
- [x] Tested error scenarios:
  - Rate limit (429)
  - Credit error (402)
  - Network timeout
  - Invalid input
  - Server error (500)

---

## 🧪 Testing Checklist

For each component:
1. **Happy path**: Normal usage works
2. **Validation errors**: Shows clear message
3. **Rate limit**: Shows retry message
4. **Credit error**: Shows "add credits" message
5. **Network error**: Auto-retries, then fails gracefully
6. **Server error**: Shows helpful error message

---

## 📊 Progress Tracking

| Phase | Components | Schemas Needed | Status |
|-------|------------|----------------|--------|
| Phase 1 | 9 | 8 new | 🔴 Not Started |
| Phase 2 | 15+ | ~10 new | 🔴 Not Started |
| Phase 3 | 10+ | ~5 new | 🔴 Not Started |

**Total**: 34+ components, 23+ new schemas

---

## 🚀 Quick Start Instructions

### Step 1: Create Missing Schemas
Edit `src/lib/edgeFunction/schemas.ts` and add all schemas from the "Schemas to Create" section above.

### Step 2: Pick a Component
Start with Phase 1.1 components (highest impact).

### Step 3: Follow Template
Use the "Before/After" template for each migration.

### Step 4: Test Thoroughly
Use the Testing Checklist.

### Step 5: Move to Next
Repeat until all phases complete.

---

## 🎓 Learning Resources

- **Error Handler Code**: `src/lib/edgeFunction/errorHandler.ts`
- **Schema Examples**: `src/lib/edgeFunction/schemas.ts`
- **Service Example**: `src/lib/services/resumeOptimizer.ts`
- **Component Examples**: 
  - `AIResearchProgress.tsx`
  - `ModernizeLanguageModal.tsx`

---

**Created**: 2025-11-09  
**Estimated Time**: 38-52 developer hours  
**Priority**: 🔴 HIGH - Security & UX issues
