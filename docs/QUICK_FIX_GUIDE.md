# Quick Fix Guide: Migrate Edge Function Calls

## 🎯 5-Minute Migration Guide

Use this guide when migrating any component to use the new error handling utilities.

---

## Step 1: Import New Utilities

```typescript
// Add these imports at the top
import { 
  validateInput, 
  invokeEdgeFunction,
  // Import the schema for your function
  YourFunctionNameSchema 
} from '@/lib/edgeFunction';
```

---

## Step 2: Replace the Edge Function Call

### ❌ BEFORE (Remove this pattern)
```typescript
const { data, error } = await supabase.functions.invoke('your-function', {
  body: {
    param1: value1,
    param2: value2
  }
});

if (error) {
  console.error('Error:', error);
  toast({
    title: "Error",
    description: "Something went wrong",
    variant: "destructive"
  });
  return;
}

// Use data...
```

### ✅ AFTER (Use this pattern)
```typescript
// Validate input first
const validated = validateInput(YourFunctionNameSchema, {
  param1: value1,
  param2: value2
});

// Call with automatic error handling
const { data, error } = await invokeEdgeFunction(
  supabase,
  'your-function',
  validated,
  {
    successMessage: 'Action completed successfully!',
    showSuccessToast: true // optional
  }
);

// Check for error (already handled with toast)
if (error) {
  return; // Just return, error was already shown to user
}

// Use data...
```

---

## Step 3: Create Schema (If Needed)

If the schema doesn't exist yet, add it to `src/lib/edgeFunction/schemas.ts`:

```typescript
export const YourFunctionNameSchema = z.object({
  param1: z.string().min(1, 'Parameter 1 is required'),
  param2: z.number().min(0, 'Must be positive'),
  optionalParam: z.string().optional(),
  // Add validation rules
});

// Export type for TypeScript
export type YourFunctionNameInput = z.infer<typeof YourFunctionNameSchema>;
```

### Common Validation Rules

```typescript
// Strings
z.string().min(1, 'Required')
z.string().max(500, 'Too long')
z.string().email('Invalid email')
z.string().url('Invalid URL')
z.string().uuid('Invalid ID')

// Numbers
z.number().min(0, 'Must be positive')
z.number().max(100, 'Too large')
z.number().int('Must be integer')

// Enums
z.enum(['option1', 'option2', 'option3'])

// Arrays
z.array(z.string())
z.array(z.string()).min(1, 'At least one required')

// Optional
z.string().optional()
z.string().nullable()

// Complex objects
z.object({
  nested: z.string()
})
```

---

## Step 4: Remove Old Error Handling

### Delete These Patterns

```typescript
// ❌ Remove console.error
console.error('Error:', error);

// ❌ Remove manual error toasts
toast({
  title: "Error",
  description: "Failed to...",
  variant: "destructive"
});

// ❌ Remove manual try-catch for edge functions
try {
  const { data } = await supabase.functions.invoke(...);
} catch (error) {
  console.error(error);
  toast.error('Failed');
}

// ❌ Remove old retry logic
import { executeWithRetry } from '@/lib/errorHandling'; // DELETE THIS
```

---

## Common Patterns

### Pattern 1: Simple Call (No Success Toast)
```typescript
const validated = validateInput(Schema, input);
const { data, error } = await invokeEdgeFunction(supabase, 'function-name', validated);

if (error) return;
// Use data
```

### Pattern 2: With Success Toast
```typescript
const validated = validateInput(Schema, input);
const { data, error } = await invokeEdgeFunction(
  supabase, 
  'function-name', 
  validated,
  {
    successMessage: 'Success!',
    showSuccessToast: true
  }
);

if (error) return;
// Use data
```

### Pattern 3: Suppress Error Toast (Rare)
```typescript
const validated = validateInput(Schema, input);
const { data, error } = await invokeEdgeFunction(
  supabase,
  'function-name',
  validated,
  { suppressErrorToast: true }
);

if (error) {
  // Handle error silently or with custom logic
  return;
}
```

### Pattern 4: Loading State
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  
  try {
    const validated = validateInput(Schema, input);
    const { data, error } = await invokeEdgeFunction(
      supabase,
      'function-name',
      validated
    );
    
    if (error) return;
    
    // Success handling
    setResult(data);
  } finally {
    setLoading(false);
  }
};
```

---

## Error Messages You'll See

The new system automatically shows these user-friendly messages:

| Error | Message | Behavior |
|-------|---------|----------|
| 429 Rate Limit | "Too many requests. Please wait 60 seconds..." | Auto-retry after delay |
| 402 Credits | "Your AI credits are depleted. Add credits to continue." | Show link to billing |
| Network | "Network error. Please check your connection." | Auto-retry 3 times |
| Timeout | "Request took too long. Please try again." | Suggest retry |
| Validation | "Invalid input: [specific field error]" | Show what's wrong |
| Server 500 | "Server error. Our team has been notified." | Log error |

---

## Testing Your Migration

### Test These Scenarios

1. **Happy Path**: Normal usage works ✅
2. **Empty Input**: Shows validation error ✅
3. **Invalid Input**: Shows specific field error ✅
4. **Slow Connection**: Shows loading state ✅
5. **Rate Limit**: (Hard to test, trust the handler) ✅

### Manual Test
```typescript
// Test validation by passing bad data
try {
  validateInput(YourSchema, {
    requiredField: '', // Empty string
    numberField: -5 // Negative number
  });
} catch (error) {
  console.log('Validation error:', error.message);
  // Should see clear error message
}
```

---

## Real Examples

### Example 1: Interview Question Generator

**Before**:
```typescript
const generateQuestions = async () => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-interview-question',
      { body: { jobDescription, count: 5 } }
    );
    
    if (error) throw error;
    setQuestions(data.questions);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to generate questions');
  }
};
```

**After**:
```typescript
import { GenerateInterviewQuestionSchema, validateInput, invokeEdgeFunction } from '@/lib/edgeFunction';

const generateQuestions = async () => {
  const validated = validateInput(GenerateInterviewQuestionSchema, {
    jobDescription,
    count: 5,
    includeSTAR: true
  });
  
  const { data, error } = await invokeEdgeFunction(
    supabase,
    'generate-interview-question',
    validated,
    { successMessage: 'Questions generated!' }
  );
  
  if (error) return;
  
  setQuestions(data.questions);
};
```

### Example 2: Resume Optimizer

**Before**:
```typescript
const { data, error } = await supabase.functions.invoke('optimize-resume', {
  body: { resumeText, jobDescription }
});

if (error) {
  console.error(error);
  toast.error('Optimization failed');
  return;
}
```

**After**:
```typescript
import { OptimizeResumeSchema, validateInput, invokeEdgeFunction } from '@/lib/edgeFunction';

const validated = validateInput(OptimizeResumeSchema, {
  resumeText,
  jobDescription
});

const { data, error } = await invokeEdgeFunction(
  supabase,
  'optimize-resume',
  validated,
  { successMessage: 'Resume optimized!' }
);

if (error) return;
```

---

## Checklist

Before considering migration complete:

- [ ] Imported `validateInput` and `invokeEdgeFunction`
- [ ] Imported or created schema
- [ ] Replaced `supabase.functions.invoke` call
- [ ] Added validation before call
- [ ] Removed `console.error`
- [ ] Removed manual error toasts
- [ ] Removed old retry logic
- [ ] Tested happy path
- [ ] Tested validation errors
- [ ] Checked TypeScript types are correct

---

## Need Help?

**Reference Files**:
- Error handler implementation: `src/lib/edgeFunction/errorHandler.ts`
- All schemas: `src/lib/edgeFunction/schemas.ts`
- Working examples: 
  - `src/components/career-vault/AIResearchProgress.tsx`
  - `src/components/career-vault/ModernizeLanguageModal.tsx`
  - `src/lib/services/resumeOptimizer.ts`

**Common Issues**:
- "Schema not found" → Create it in `schemas.ts`
- "Validation failed" → Check your schema matches input
- "Type errors" → Make sure validated input types match

---

**Migration Time**: ~5-10 minutes per component  
**Total Migrations Needed**: 108+ components  
**Priority**: Start with Phase 1 components (highest impact)
