# Edge Function Tests

This directory contains automated tests to ensure edge function naming consistency and best practices.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test edge-functions.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Suites

### 1. Edge Function Name Consistency

Tests that verify:
- ✅ Edge functions exist in `supabase/functions/`
- ✅ Function names match between file system and code invocations
- ✅ No calls to non-existent functions
- ✅ All functions follow kebab-case naming convention
- ✅ Each function has an `index.ts` file
- ⚠️ Detects potential camelCase usage

### 2. Edge Function Invocation Patterns

Tests that check for:
- ⚠️ Direct HTTP calls instead of `supabase.functions.invoke()`
- ⚠️ Missing error handling in function calls

## Test Output

The tests produce detailed reports:

### ✅ Passing Tests
- Shows which edge functions are actively used
- Lists usage locations for each function
- Validates naming conventions

### ⚠️ Warnings (Don't Fail)
- Unused functions (may be background jobs)
- Potential naming issues (camelCase detection)
- Direct HTTP calls (should use Supabase client)
- Missing error handling

### ❌ Failing Tests
- Calls to non-existent edge functions
- Invalid function names (not kebab-case)
- Missing index.ts files

## Example Output

```
📊 Edge Function Usage Report:

✅ analyze-resume (3 usages):
   /src/components/resume/ResumeAnalyzer.tsx
   /src/lib/services/resumeAnalyzer.ts
   /src/pages/ResumeUpload.tsx

✅ optimize-resume-with-audit (2 usages):
   /src/components/ResumeOptimizer.tsx
   /src/lib/services/resumeOptimizer.ts

⚠️  Warning: The following edge functions are not called from frontend code:
   - daily-job-matcher
   - check-cost-alerts
   These may be background jobs, deprecated, or need cleanup.
```

## CI/CD Integration

Add to your `.github/workflows/test.yml`:

```yaml
name: Test Edge Functions

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

## Maintenance

### Adding New Tests

1. Add test cases to `edge-functions.test.ts`
2. Follow the existing patterns
3. Use descriptive test names
4. Add comments for complex logic

### Known Background Jobs

Update the `knownBackgroundJobs` array in the tests when adding new background jobs:

```typescript
const knownBackgroundJobs = [
  'daily-job-matcher',
  'check-cost-alerts',
  'update-competency-benchmarks',
  // Add new background jobs here
];
```

## Troubleshooting

### Test Fails: "calls to non-existent edge functions"

**Cause:** Code is calling an edge function that doesn't exist in `supabase/functions/`

**Fix:**
1. Check if function was renamed - update the call
2. Check if function was deleted - remove the call
3. Check for typos in function name

### Test Warning: "potentially missing error handling"

**Cause:** Edge function call doesn't check for errors

**Fix:**
```typescript
// Add error handling
const { data, error } = await supabase.functions.invoke('function-name', {...});
if (error) throw error;
```

### Test Warning: "potential camelCase usage"

**Cause:** Function call uses camelCase instead of kebab-case

**Fix:**
```typescript
// ❌ Wrong
supabase.functions.invoke('myFunctionName')

// ✅ Correct
supabase.functions.invoke('my-function-name')
```

## Related Documentation

- [Edge Function Developer Guide](../docs/EDGE_FUNCTION_GUIDE.md)
- [Vault Naming Conventions](../docs/VAULT_NAMING_CONVENTIONS.md)
- [Deprecation Audit Report](../COMPREHENSIVE_DEPRECATION_AUDIT.md)
