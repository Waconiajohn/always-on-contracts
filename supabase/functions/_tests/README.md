# Edge Function Test Suite

Comprehensive test suite for hardened AI edge functions.

## Test Coverage

### 8 Hardened Functions Tested

**Simple Functions (5):**
1. `generate-requirement-options` - RequirementOptionsSchema
2. `generate-requirement-questions` - QuestionResponseSchema  
3. `discover-hidden-competencies` - HiddenCompetencySchema
4. `analyze-competitive-position` - CompetitivePositionSchema
5. `customize-resume` - CustomResumeSchema

**Complex Functions (3):**
6. `generate-salary-report` - SalaryReportSchema
7. `gap-analysis` - GapAnalysisSchema
8. `extract-vault-intelligence` - VaultIntelligenceSchema

## Test Suites

### 1. Schema Validation (`schema-validation.test.ts`)
- ✅ Valid data acceptance
- ✅ Invalid data rejection  
- ✅ Optional field handling
- ✅ Type enforcement
- ✅ Range validation (0-100 scores)
- ✅ Enum validation
- ✅ Array structure validation

### 2. JSON Extraction (`json-extraction.test.ts`)
- ✅ Direct JSON parsing
- ✅ Markdown code block extraction
- ✅ Embedded JSON in text
- ✅ Citation marker removal
- ✅ Trailing comma cleanup
- ✅ Comment removal
- ✅ Malformed JSON handling
- ✅ Multiple code block scenarios

### 3. Error Handling (`error-handling.test.ts`)
- ✅ Rate limit (429) detection
- ✅ Payment required (402) handling
- ✅ Timeout error recovery
- ✅ Invalid JSON response handling
- ✅ Server error (500) classification
- ✅ Exponential backoff calculation
- ✅ Jitter variation
- ✅ Retry logic (1-3 attempts)
- ✅ Non-retryable error detection
- ✅ Retry callback invocation

### 4. Integration Tests (`integration.test.ts`)
- ✅ Complete function flows
- ✅ Multi-step processes
- ✅ Data structure validation
- ✅ Performance benchmarks
- ✅ Error recovery
- ✅ Graceful degradation

## Running Tests

### Run All Tests
```bash
deno test --allow-env --allow-net supabase/functions/_tests/
```

### Run Specific Test Suite
```bash
deno test --allow-env supabase/functions/_tests/schema-validation.test.ts
deno test --allow-env supabase/functions/_tests/json-extraction.test.ts
deno test --allow-env supabase/functions/_tests/error-handling.test.ts
deno test --allow-env supabase/functions/_tests/integration.test.ts
```

### Run with Coverage
```bash
deno test --coverage=coverage --allow-env --allow-net supabase/functions/_tests/
deno coverage coverage
```

### Run in Watch Mode
```bash
deno test --watch --allow-env supabase/functions/_tests/
```

## Test Helpers

Located in `test-helpers.ts`:

- `createMockPerplexityResponse()` - Mock AI responses
- `createMockRequest()` - Mock HTTP requests with auth
- `MockSupabaseClient` - Mock database client
- `testSchemaValidation()` - Schema test helper
- `createRetryTestScenario()` - Retry logic testing
- `mockErrors` - Common error scenarios
- `assertValidResponse()` - Response validation
- `assertErrorResponse()` - Error response validation
- `measureExecutionTime()` - Performance testing

## Hardening Pattern Verification

Each test suite verifies the hardening pattern implementation:

1. **Retry Logic**
   - Exponential backoff with jitter
   - Configurable max retries (default: 3)
   - Non-retryable error detection
   - Retry callback support

2. **Schema Validation**
   - Type-safe Zod schemas
   - Comprehensive validation
   - Clear error messages
   - Optional field support

3. **JSON Extraction**
   - Multiple format support
   - Robust parsing strategies
   - Fallback mechanisms
   - Schema validation integration

4. **Error Handling**
   - Detailed error classification
   - User-friendly messages
   - Appropriate status codes
   - Retry hints (retryAfter)

5. **Structured Logging**
   - Request timing
   - AI call metrics
   - Error context
   - Performance tracking

## Test Metrics

- **Total Tests**: 40+
- **Coverage Target**: 80%+
- **Performance**: < 5s total execution
- **Success Rate**: 100%

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Edge Function Tests
  run: deno test --allow-env --allow-net supabase/functions/_tests/
```

## Future Enhancements

- [ ] End-to-end function deployment tests
- [ ] Load testing for concurrent requests
- [ ] Real Perplexity API integration tests (with flag)
- [ ] Database integration tests
- [ ] WebSocket streaming tests
- [ ] Cost tracking validation
