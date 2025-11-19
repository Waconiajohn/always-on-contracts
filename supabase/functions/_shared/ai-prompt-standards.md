# AI Prompt Engineering Standards

## Mandatory Requirements for All AI Prompts

### 1. JSON-Only Response Instruction

**ALWAYS** include this explicit instruction in your system prompt:

```
Return ONLY valid JSON, no additional text or explanations.
```

Place this at the beginning of the system prompt for maximum visibility.

### 2. Explicit JSON Schema Specification

**ALWAYS** provide the exact JSON structure expected, using the "CRITICAL:" prefix:

```
CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "field1": "string - description of what this contains",
  "field2": ["array", "of", "strings"],
  "field3": {
    "nested": "object",
    "with": "properties"
  },
  "optionalField": "string (optional) - only if available"
}
```

### 3. Field Type and Description

Each field in the schema must specify:
- **Type**: string, number, boolean, array, object
- **Description**: What the field contains
- **Required vs Optional**: Mark optional fields explicitly
- **Constraints**: min/max values, allowed values, formats

Example:
```json
{
  "confidence_score": "number (0-1) - AI confidence in the analysis",
  "categories": ["array of strings - detected categories, minimum 1"],
  "reasoning": "string (optional) - explanation of the decision"
}
```

### 4. Model Selection Guidelines

Choose the appropriate model based on task complexity:

#### LOVABLE_AI_MODELS.PREMIUM (google/gemini-2.5-pro)
**Use for:**
- Complex reasoning and analysis
- Multi-step problem solving
- Long context processing (>10k tokens)
- High-stakes decisions requiring accuracy
- Multimodal tasks (text + images)

**Temperature: 0.2-0.4** for consistent, accurate results

**Examples:**
- Resume gap analysis
- Career roadmap generation
- Interview response evaluation
- Complex job matching

#### LOVABLE_AI_MODELS.DEFAULT (google/gemini-2.5-flash)
**Use for:**
- Moderate complexity tasks
- Standard content generation
- Keyword extraction
- Quick analysis
- Most general-purpose tasks

**Temperature: 0.3-0.7** depending on creativity needs

**Examples:**
- Keyword suggestions
- Job requirement analysis
- Resume parsing
- Content optimization

#### LOVABLE_AI_MODELS.FAST (google/gemini-2.5-flash-lite)
**Use for:**
- Simple classification
- Quick summarization
- Low-complexity generation
- High-volume operations where cost matters

**Temperature: 0.3-0.5** for consistent results

**Examples:**
- Simple categorization
- Brief summaries
- Tag extraction
- Sentiment analysis

### 5. Temperature Guidelines by Use Case

| Use Case | Recommended Temperature | Reasoning |
|----------|------------------------|-----------|
| Data extraction | 0.2 - 0.3 | Need consistency and accuracy |
| Analysis | 0.3 - 0.5 | Balance accuracy with insight |
| Content generation | 0.6 - 0.8 | Allow creativity while staying on-topic |
| Creative writing | 0.7 - 0.9 | Maximize variety and originality |
| Classification | 0.2 - 0.3 | Need deterministic results |

### 6. Response Format Setting

**ALWAYS** set the response format to JSON when calling the API:

```typescript
const { response, metrics } = await callLovableAI(
  {
    messages: [...],
    model: LOVABLE_AI_MODELS.DEFAULT,
    temperature: 0.3,
    response_format: { type: 'json_object' } // REQUIRED
  },
  'function-name',
  userId
);
```

### 7. Token Limits

Set appropriate `max_tokens` based on expected response size:

- **Simple responses** (keywords, categories): 500-1000 tokens
- **Moderate responses** (analysis, recommendations): 1000-2000 tokens  
- **Complex responses** (comprehensive reports): 2000-4000 tokens
- **Very large responses** (full documents): 4000+ tokens

⚠️ **Warning**: Higher token limits = higher costs. Set the minimum needed.

### 8. Error Handling Pattern

**ALWAYS** implement this exact error handling pattern:

```typescript
// 1. Log raw response for debugging
const rawContent = response.choices[0].message.content;
console.log(`[function-name] Raw AI response:`, rawContent.substring(0, 500));

// 2. Parse with extractJSON
const parseResult = extractJSON(rawContent);

// 3. Check parse success
if (!parseResult.success || !parseResult.data) {
  console.error(`[function-name] JSON parse failed:`, parseResult.error);
  console.error(`[function-name] Full response:`, rawContent);
  throw new Error(`Failed to parse AI response: ${parseResult.error}`);
}

// 4. Validate required fields
const data = parseResult.data;
if (!data.requiredField || !Array.isArray(data.requiredArray)) {
  console.error(`[function-name] Missing required fields:`, data);
  throw new Error('AI response missing required fields: requiredField, requiredArray');
}
```

### 9. Logging Requirements

Every AI-calling function **MUST** include:

1. **Function start log** with input parameters (sanitized)
2. **Raw AI response log** (first 500 characters)
3. **Parse success/failure log**
4. **Validation result log**
5. **Final result log** with key metrics

Example:
```typescript
console.log('[enhance-vault-item] Starting enhancement:', { itemId, itemType, currentTier });
console.log('[enhance-vault-item] Raw AI response:', rawContent.substring(0, 500));
console.log('[enhance-vault-item] Parse result:', parseResult.success ? 'SUCCESS' : 'FAILED');
console.log('[enhance-vault-item] Enhancement complete:', { newTier: result.new_tier });
```

### 10. Cost Tracking

**ALWAYS** log AI usage metrics after each call:

```typescript
const { response, metrics } = await callLovableAI(...);
await logAIUsage(metrics); // REQUIRED - tracks cost and usage
```

This enables:
- Cost monitoring per function
- Usage analytics
- Performance optimization
- Budget alerting

---

## Complete Example: Standard AI Function Pattern

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();
    console.log('[my-function] Starting with input:', { input });

    // 1. Define explicit system prompt with JSON schema
    const systemPrompt = `You are an expert analyst. Return ONLY valid JSON, no additional text or explanations.

Analyze the input and extract key information.

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "analysis": "string - comprehensive analysis summary",
  "categories": ["array of strings - detected categories, minimum 1"],
  "confidence": "number (0-1) - confidence in the analysis",
  "recommendations": ["array of strings - actionable recommendations"]
}`;

    // 2. Call AI with appropriate settings
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze: ${input}` }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      },
      'my-function',
      undefined
    );

    // 3. Log usage
    await logAIUsage(metrics);

    // 4. Log raw response
    const rawContent = response.choices[0].message.content;
    console.log('[my-function] Raw AI response:', rawContent.substring(0, 500));

    // 5. Parse JSON
    const parseResult = extractJSON(rawContent);
    if (!parseResult.success || !parseResult.data) {
      console.error('[my-function] JSON parse failed:', parseResult.error);
      console.error('[my-function] Full response:', rawContent);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    // 6. Validate required fields
    const result = parseResult.data;
    if (!result.analysis || !Array.isArray(result.categories) || typeof result.confidence !== 'number') {
      console.error('[my-function] Missing required fields:', result);
      throw new Error('AI response missing required fields');
    }

    console.log('[my-function] Analysis complete:', { 
      confidence: result.confidence, 
      categories: result.categories.length 
    });

    // 7. Return structured response
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[my-function] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

---

## Validation Checklist

Before deploying any AI-calling function, verify:

- ✅ System prompt includes "Return ONLY valid JSON"
- ✅ Explicit JSON schema provided with "CRITICAL:" prefix
- ✅ All fields have type and description
- ✅ Appropriate model selected (PREMIUM/DEFAULT/FAST)
- ✅ Temperature set correctly for use case
- ✅ `response_format: { type: 'json_object' }` included
- ✅ `max_tokens` set appropriately
- ✅ Raw response logged (first 500 chars)
- ✅ Parse result validated with `extractJSON`
- ✅ Required fields validated explicitly
- ✅ Usage metrics logged with `logAIUsage`
- ✅ Comprehensive error logging included
- ✅ CORS headers properly configured

---

## Anti-Patterns to Avoid

### ❌ DON'T: Vague schema description
```typescript
const systemPrompt = `Return JSON with the results.`;
```

### ✅ DO: Explicit schema with types
```typescript
const systemPrompt = `CRITICAL: Return ONLY this exact JSON structure:
{
  "results": ["array of strings - specific items found"],
  "count": "number - total items"
}`;
```

### ❌ DON'T: Skip validation
```typescript
const result = extractJSON(content);
return result.data; // What if required fields are missing?
```

### ✅ DO: Validate required fields
```typescript
const result = extractJSON(content);
if (!result.data.requiredField) {
  throw new Error('Missing required field');
}
```

### ❌ DON'T: Silent failures
```typescript
try {
  const result = extractJSON(content);
} catch (error) {
  // Silent failure - no logging
}
```

### ✅ DO: Comprehensive error logging
```typescript
try {
  const result = extractJSON(content);
} catch (error) {
  console.error('[function-name] Parse failed:', error);
  console.error('[function-name] Raw content:', content);
  throw error;
}
```

---

## Maintenance and Updates

### When to Update Prompts

Update prompts when:
1. **Failure rate > 5%** - prompt may be unclear
2. **Inconsistent results** - schema may need refinement
3. **New requirements** - add fields to schema
4. **Model upgrade** - leverage new capabilities

### Version Control

When updating prompts:
1. Document changes in function comments
2. Track success rate before/after
3. A/B test if possible
4. Keep old version for rollback

### Performance Monitoring

Track these metrics per function:
- **Success rate**: Target > 95%
- **Average latency**: Track P50, P95, P99
- **Cost per call**: Monitor for spikes
- **Token usage**: Optimize where possible

---

## Getting Help

If you encounter persistent AI response issues:
1. Check logs for raw AI responses
2. Verify schema matches expected output
3. Try adjusting temperature
4. Consider switching models
5. Consult this standards document
6. Review working examples in codebase
