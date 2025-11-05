# Production Hardening Migration Guide

**Date:** November 4, 2025
**Status:** Infrastructure Complete - Ready for Batch Migration
**Progress:** 2/22 Critical Functions Hardened ✅

---

## Quick Start

### Infrastructure Created ✅

All shared utilities are production-ready:

1. **`_shared/ai-response-schemas.ts`** - Zod validation schemas
2. **`_shared/ai-function-wrapper.ts`** - Standardized handler with auth, rate limiting, logging
3. **`_shared/json-parser.ts`** - Robust JSON extraction
4. **`_shared/logger.ts`** - Structured logging with AI metrics
5. **`_shared/rate-limiter.ts`** - User quotas and cost tracking

### Hardened Functions ✅

- ✅ `analyze-section-quality`
- ✅ `analyze-linkedin-writing`

### Remaining Critical Functions (20)

These have **unsafe JSON parsing** and need immediate hardening:

#### With Schemas (Priority 1 - 6 functions):
1. `semantic-match-resume` → SemanticMatchSchema
2. `generate-salary-report` → SalaryReportSchema
3. `gap-analysis` → GapAnalysisSchema
4. `generate-interview-prep` → InterviewPrepSchema
5. `generate-skills` → SkillExtractionSchema
6. `extract-vault-intelligence` → SkillExtractionSchema

#### Need Schemas (Priority 2 - 14 functions):
7. `suggest-linkedin-topics-from-vault`
8. `update-strong-answer`
9. `validate-interview-response`
10. `score-resume-match`
11. `optimize-linkedin-with-audit`
12. `optimize-resume-detailed`
13. `generate-transferable-skills`
14. `generate-why-me-questions`
15. `generate-power-phrases`
16. `generate-requirement-options`
17. `generate-requirement-questions`
18. `generate-achievements`
19. `customize-resume`
20. `discover-hidden-competencies`

---

## Step-by-Step Migration

### For Functions WITH Existing Schemas (5 minutes per function)

#### Example: `semantic-match-resume`

**Before:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

serve(async (req) => {
  // ... existing code ...
  const { response, metrics } = await callPerplexity(/* ... */);
  const content_text = cleanCitations(response.choices[0].message.content);

  // ❌ UNSAFE PATTERN
  const jsonMatch = content_text.match(/\{[\s\S]*\}/);
  const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

  return new Response(JSON.stringify(analysis), { headers: corsHeaders });
});
```

**After:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { SemanticMatchSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'semantic-match-resume',
  schema: SemanticMatchSchema,
  requireAuth: true,
  rateLimit: { maxPerMinute: 10, maxPerHour: 100 },

  inputValidation: (body) => {
    if (!body.resumeContent) throw new Error('Missing resumeContent');
    if (!body.jobRequirements) throw new Error('Missing jobRequirements');
  },

  handler: async ({ user, body, logger }) => {
    const { resumeContent, jobRequirements, industry, targetIndustry } = body;

    logger.info('Starting semantic match', {
      resumeLength: resumeContent.length,
      requirementsCount: jobRequirements.length
    });

    // ... existing prompt logic ...
    const startTime = Date.now();
    const { response, metrics } = await callPerplexity(/* ... */, user.id);
    await logAIUsage(metrics);

    // ✅ SAFE PATTERN
    const content_text = cleanCitations(response.choices[0].message.content);
    const result = extractJSON(content_text, SemanticMatchSchema);

    if (!result.success) {
      logger.error('Parsing failed', { error: result.error });
      throw new Error(`Invalid AI response: ${result.error}`);
    }

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    return result.data; // Automatically wrapped by handler
  }
}));
```

**Changes:**
1. Add imports: `createAIHandler`, schema, `extractJSON`
2. Remove: `createClient`, manual auth logic
3. Wrap `serve()` with `createAIHandler({...})`
4. Move auth code → handled by wrapper
5. Replace unsafe regex → `extractJSON(content, Schema)`
6. Add structured logging

**Time:** ~5 minutes per function

---

### For Functions WITHOUT Schemas (10 minutes per function)

#### Example: `generate-achievements`

**Step 1: Create Schema (3 min)**

Add to `_shared/ai-response-schemas.ts`:

```typescript
export const AchievementSchema = z.object({
  achievements: z.array(z.object({
    text: z.string(),
    impact: z.string(),
    metrics: z.array(z.string()).optional()
  })),
  recommendations: z.array(z.string())
});

export type Achievement = z.infer<typeof AchievementSchema>;
```

**Step 2: Apply Hardening Pattern (7 min)**

Same as above, using `AchievementSchema`.

---

## Batch Migration Script

For speed, use find/replace in your editor:

### Pattern 1: Replace Imports

**Find:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
```

**Replace:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { YOUR_SCHEMA_HERE } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';
```

### Pattern 2: Replace Unsafe Parsing

**Find:**
```typescript
const jsonMatch = content_text.match(/\{[\s\S]*\}/);
const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

if (!analysis) {
  throw new Error("Failed to parse AI response");
}
```

**Replace:**
```typescript
const result = extractJSON(content_text, YOUR_SCHEMA_HERE);

if (!result.success) {
  logger.error('JSON parsing failed', {
    error: result.error,
    response: content_text.substring(0, 500)
  });
  throw new Error(`AI returned invalid response: ${result.error}`);
}

const analysis = result.data;
```

---

## Testing Checklist

After hardening each function:

- [ ] Function deploys without errors
- [ ] Auth still works (JWT validation)
- [ ] Rate limiting triggers at expected thresholds
- [ ] JSON parsing handles malformed responses gracefully
- [ ] Logs appear in structured format
- [ ] AI metrics tracked in database
- [ ] Error messages are user-friendly

---

## Rollout Strategy

### Phase 1: Critical Functions (Week 1)
**Priority 1** - Harden 6 functions with existing schemas:
- Day 1: `semantic-match-resume`, `gap-analysis`
- Day 2: `generate-salary-report`, `generate-interview-prep`
- Day 3: `generate-skills`, `extract-vault-intelligence`

**Deploy & Monitor:** Watch logs for errors, verify cost tracking

### Phase 2: High Priority (Week 1-2)
**Priority 2** - Create schemas and harden 14 functions:
- Days 4-5: Create 14 schemas (1-2 hours)
- Days 6-8: Apply hardening (3-4 functions/day)

### Phase 3: General Optimization (Week 2)
**Priority 3** - Optimize remaining 65 AI functions:
- Add structured logging
- Verify model selection
- Add input validation
- Improve error messages

---

## Common Issues & Solutions

### Issue 1: Schema Validation Fails
**Symptom:** `Schema validation failed: ...`

**Solution:** AI might be returning extra fields. Update schema or use `.passthrough()`:
```typescript
const MySchema = z.object({
  requiredField: z.string()
}).passthrough(); // Allow extra fields
```

### Issue 2: Rate Limit Too Strict
**Symptom:** Users getting 429 errors frequently

**Solution:** Adjust limits in function config:
```typescript
rateLimit: { maxPerMinute: 20, maxPerHour: 200 } // Increased
```

### Issue 3: Timeout on Complex Requests
**Symptom:** 504 Gateway Timeout

**Solution:** In `_shared/ai-config.ts`, increase timeout for specific functions:
```typescript
const FUNCTION_TIMEOUTS: Record<string, number> = {
  'semantic-match-resume': 90000, // 90 seconds
  'default': 45000
};
```

---

## Progress Tracking

Use this checklist to track migrations:

### Critical (With Schemas) - 6 functions
- [x] analyze-section-quality
- [x] analyze-linkedin-writing
- [ ] semantic-match-resume
- [ ] generate-salary-report
- [ ] gap-analysis
- [ ] generate-interview-prep
- [ ] generate-skills
- [ ] extract-vault-intelligence

### High Priority (Need Schemas) - 14 functions
- [ ] suggest-linkedin-topics-from-vault
- [ ] update-strong-answer
- [ ] validate-interview-response
- [ ] score-resume-match
- [ ] optimize-linkedin-with-audit
- [ ] optimize-resume-detailed
- [ ] generate-transferable-skills
- [ ] generate-why-me-questions
- [ ] generate-power-phrases
- [ ] generate-requirement-options
- [ ] generate-requirement-questions
- [ ] generate-achievements
- [ ] customize-resume
- [ ] discover-hidden-competencies

**Total Progress:** 2/22 (9%) ✅

---

## Next Steps

1. **Now:** Complete Priority 1 functions (6 remaining)
2. **This week:** Create schemas for Priority 2 (14 functions)
3. **Next week:** Apply hardening to all 20 critical functions
4. **Week 3:** Build cost dashboard UI
5. **Week 4:** Create test suite and deploy to production

---

## Support

If you encounter issues:
1. Check logs: `supabase functions logs <function-name>`
2. Review schema: Does AI response match expected structure?
3. Test locally: Use Supabase CLI to invoke function
4. Rollback: Keep `.backup` files for each migration

**Estimated Total Time:**
- Priority 1: 30 minutes (6 functions × 5 min)
- Priority 2: 140 minutes (14 functions × 10 min)
- **Total: ~3 hours of focused migration work**

---

**Ready to proceed?** Start with `semantic-match-resume` (already has schema, high usage).
