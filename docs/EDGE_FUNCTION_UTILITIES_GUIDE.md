# Edge Function Utilities Guide

Guide for using the centralized edge function utilities with input validation and error handling.

## Overview

The edge function utilities provide:
- ✅ **Input validation** using Zod schemas (prevents injection attacks)
- ✅ **Consistent error handling** with user-friendly messages
- ✅ **Rate limit handling** with automatic retry
- ✅ **Type safety** with TypeScript
- ✅ **Automatic toast notifications** for errors

## Quick Start

### Basic Usage

```typescript
import { supabase } from '@/integrations/supabase/client';
import { 
  invokeEdgeFunction, 
  OptimizeResumeSchema, 
  validateInput 
} from '@/lib/edgeFunction';

// Validate input first
const validated = validateInput(OptimizeResumeSchema, {
  resumeText: userInput.resumeText,
  jobDescription: userInput.jobDescription
});

// Call edge function with automatic error handling
const { data, error } = await invokeEdgeFunction(
  supabase,
  'optimize-resume-with-audit',
  validated
);

if (error) {
  // Error already shown to user via toast
  console.error(error);
  return;
}

// Use the data
console.log(data);
```

### With Success Toast

```typescript
const { data, error } = await invokeEdgeFunction(
  supabase,
  'auto-populate-vault-v3',
  validated,
  {
    showSuccessToast: true,
    successMessage: 'Vault populated successfully!'
  }
);
```

### Suppress Error Toast (for custom handling)

```typescript
const { data, error } = await invokeEdgeFunction(
  supabase,
  'parse-resume',
  validated,
  {
    suppressErrorToast: true
  }
);

if (error) {
  // Handle error manually
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Custom rate limit UI
  }
}
```

## Available Schemas

All schemas are imported from `@/lib/edgeFunction/schemas`:

### Resume & Job Matching
- `OptimizeResumeSchema`
- `ScoreResumeMatchSchema`
- `ParseResumeSchema`
- `ParseResumeMilestonesSchema`
- `ParseJobDocumentSchema`

### Career Vault
- `ExtractVaultIntangiblesSchema`
- `AutoPopulateVaultSchema`
- `DiscoverHiddenCompetenciesSchema`
- `ProcessReviewActionsSchema`
- `VaultCleanupSchema`
- `DetectRoleAndIndustrySchema`
- `GenerateCompletionBenchmarkSchema`

### Research & Analysis
- `ConductIndustryResearchSchema`
- `PerplexityResearchSchema`
- `ResearchIndustryStandardsSchema`
- `ModernizeLanguageSchema`

### Interview & Validation
- `ValidateInterviewResponseSchema`
- `GenerateInterviewQuestionSchema`

### LinkedIn & Content
- `OptimizeLinkedInProfileSchema`

### Payment & Subscription
- `CreateCheckoutSchema`
- `CustomerPortalSchema`
- `RedeemRetirementCodeSchema`

## Validation Examples

### Client-Side Validation Before Submission

```typescript
import { safeValidateInput, OptimizeResumeSchema } from '@/lib/edgeFunction';

const handleSubmit = async () => {
  // Safe validation returns result object
  const validation = safeValidateInput(OptimizeResumeSchema, {
    resumeText: formData.resumeText,
    jobDescription: formData.jobDescription
  });

  if (!validation.success) {
    toast.error(validation.error);
    return;
  }

  // Proceed with validated data
  const { data, error } = await invokeEdgeFunction(
    supabase,
    'optimize-resume-with-audit',
    validation.data
  );
};
```

### Throwing Validation Errors

```typescript
import { validateInput, ParseResumeSchema } from '@/lib/edgeFunction';

try {
  const validated = validateInput(ParseResumeSchema, {
    fileData: base64Data,
    fileName: file.name,
    fileType: file.type
  });
  
  // validated is now type-safe
} catch (error) {
  // Error message includes all validation failures
  console.error(error.message); // "Validation error: File name is required, File type must be..."
}
```

## Error Handling

### Automatic Error Handling

The `invokeEdgeFunction` wrapper automatically:
- Shows toast notifications for all errors
- Handles rate limits (429) with user-friendly message
- Handles payment/credits errors (402) with action button
- Handles network errors
- Logs all errors to console

### Error Types

```typescript
interface EdgeFunctionError {
  message: string;      // User-friendly error message
  code?: string;        // Error code (RATE_LIMIT_EXCEEDED, PAYMENT_REQUIRED, etc.)
  status?: number;      // HTTP status code
  details?: any;        // Additional error details
}
```

### Error Codes

- `RATE_LIMIT_EXCEEDED` - 429 errors (too many requests)
- `PAYMENT_REQUIRED` - 402 errors (out of credits)
- `HTTP_ERROR` - Other HTTP errors (4xx, 5xx)
- `NETWORK_ERROR` - Connection/relay errors
- `APPLICATION_ERROR` - Errors from edge function response
- `UNKNOWN_ERROR` - Unexpected errors

### Custom Error Handling

```typescript
import { 
  invokeEdgeFunction, 
  isRateLimitError, 
  isPaymentError 
} from '@/lib/edgeFunction';

const { data, error } = await invokeEdgeFunction(
  supabase,
  'batch-process-resumes',
  { files: fileList },
  { suppressErrorToast: true } // Handle errors manually
);

if (error) {
  if (isRateLimitError(error)) {
    // Show custom rate limit UI
    setShowRateLimitDialog(true);
  } else if (isPaymentError(error)) {
    // Redirect to billing
    navigate('/settings/billing');
  } else {
    // Generic error handling
    toast.error(error.message);
  }
}
```

## Retry with Backoff

For rate-limited operations:

```typescript
import { retryWithBackoff, invokeEdgeFunction } from '@/lib/edgeFunction';

const { data, error } = await retryWithBackoff(
  () => invokeEdgeFunction(
    supabase,
    'generate-power-phrases',
    { vaultId }
  ),
  3, // max retries
  1000 // initial delay in ms
);
```

## Direct Error Handler

Use the error handler directly for non-invocation errors:

```typescript
import { handleEdgeFunctionError } from '@/lib/edgeFunction';

try {
  const response = await fetch(url);
  // ... processing
} catch (error) {
  const handledError = handleEdgeFunctionError(error, 'custom-operation');
  // handledError contains structured error info
}
```

## Migration Guide

### Before (Old Pattern)

```typescript
try {
  const { data, error } = await supabase.functions.invoke('function-name', {
    body: { param1, param2 }
  });

  if (error) throw error;

  if (data?.error) {
    toast.error(data.error);
    return;
  }

  // Use data
} catch (error) {
  console.error('Error:', error);
  toast.error('Something went wrong');
}
```

### After (New Pattern)

```typescript
import { validateInput, invokeEdgeFunction, FunctionNameSchema } from '@/lib/edgeFunction';

// Validate input
const validated = validateInput(FunctionNameSchema, {
  param1,
  param2
});

// Invoke with automatic error handling
const { data, error } = await invokeEdgeFunction(
  supabase,
  'function-name',
  validated
);

if (error) {
  // Error already logged and shown to user
  return;
}

// Use data (type-safe if schema exists)
```

## Creating New Schemas

When adding a new edge function:

```typescript
// In src/lib/edgeFunction/schemas.ts
export const YourFunctionSchema = z.object({
  requiredField: z.string()
    .min(1, 'Field is required')
    .max(100, 'Must be less than 100 characters'),
  optionalField: z.string().optional(),
  enumField: z.enum(['option1', 'option2'], {
    errorMap: () => ({ message: 'Must be option1 or option2' })
  }),
  arrayField: z.array(z.string().trim().min(1))
    .min(1, 'At least one item required')
    .max(50, 'Maximum 50 items')
});
```

### Schema Best Practices

1. **Always set min/max lengths** for strings to prevent abuse
2. **Use trim()** to remove whitespace
3. **Provide clear error messages** for validation failures
4. **Use enums** for known value sets
5. **Mark optional fields** explicitly
6. **Validate UUIDs** with `.uuid()` for IDs
7. **Validate URLs** with `.url()` for links
8. **Use refine()** for complex validation logic

## Service Abstraction Pattern

For complex edge functions, create service files:

```typescript
// src/lib/services/yourService.ts
import { supabase } from '@/integrations/supabase/client';
import { YourFunctionSchema, validateInput, invokeEdgeFunction } from '@/lib/edgeFunction';

export interface YourResult {
  // Define return type
}

export async function yourServiceFunction(
  param1: string,
  param2: string
): Promise<YourResult> {
  const validated = validateInput(YourFunctionSchema, { param1, param2 });

  const { data, error } = await invokeEdgeFunction<YourResult>(
    supabase,
    'your-function-name',
    validated
  );

  if (error || !data) {
    throw new Error(error?.message || 'Operation failed');
  }

  return data;
}
```

## Testing

### Unit Testing Schemas

```typescript
import { safeValidateInput, OptimizeResumeSchema } from '@/lib/edgeFunction';

describe('OptimizeResumeSchema', () => {
  it('should validate correct input', () => {
    const result = safeValidateInput(OptimizeResumeSchema, {
      resumeText: 'Valid resume text here...',
      jobDescription: 'Valid job description here...'
    });

    expect(result.success).toBe(true);
  });

  it('should reject short resume text', () => {
    const result = safeValidateInput(OptimizeResumeSchema, {
      resumeText: 'Too short',
      jobDescription: 'Valid job description here...'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 100 characters');
  });
});
```

## Security Benefits

✅ **Prevents injection attacks** - All inputs validated before reaching backend  
✅ **Length limits** - Prevents DOS via large payloads  
✅ **Type safety** - Catches type errors at compile time  
✅ **Consistent validation** - Same rules client and server  
✅ **Clear error messages** - Users know exactly what's wrong  

## Performance Considerations

- Validation is fast (microseconds)
- No network overhead (runs locally)
- Catches errors before edge function calls
- Reduces wasted API calls
- Reduces backend processing of invalid data

## Troubleshooting

### "Cannot find name 'YourSchema'"
Import the schema: `import { YourSchema } from '@/lib/edgeFunction';`

### "Validation error: ..."
Check the error message - it tells you exactly what's wrong with the input

### Toast not showing for errors
Make sure you're not suppressing errors: `suppressErrorToast: false`

### Rate limit errors not retrying
Use `retryWithBackoff` wrapper for automatic retry logic

## Related Documentation

- [Edge Functions Documentation](./EDGE_FUNCTIONS_DOCUMENTATION.md)
- [Zod Documentation](https://zod.dev/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0
