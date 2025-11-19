import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { GenericAIResponseSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'validate-interview-response',
  schema: GenericAIResponseSchema,
  requireAuth: false, // Can be called without auth for demo purposes
  rateLimit: { maxPerMinute: 20, maxPerHour: 200 },

  inputValidation: (body) => {
    if (!body.question || !body.answer) {
      throw new Error('question and answer are required');
    }
  },

  handler: async ({ body, logger }) => {
    const { question, answer, selected_guided_options } = body;

    // Handle both formats: checkbox selections + custom text, or plain text
    let combinedAnswer = '';
    if (typeof answer === 'object' && 'selected_options' in answer) {
      const selectedOptions = (answer.selected_options || []).join('; ');
      const customText = answer.custom_text || '';
      combinedAnswer = selectedOptions + (customText ? `\n\nAdditional details: ${customText}` : '');
    } else {
      combinedAnswer = answer;
    }

    logger.info('Building validation prompt', {
      answerLength: combinedAnswer.length,
      hasImprovementContext: !!selected_guided_options?.length
    });

    // PHASE 4 FIX: Acknowledge improvement efforts
    const improvementContext = selected_guided_options && selected_guided_options.length > 0
      ? `\n\nUSER IS ACTIVELY IMPROVING: They selected ${selected_guided_options.length} enhancement areas: ${selected_guided_options.join(', ')}

CRITICAL: If they added ANY additional detail, increase score by 10-20 points minimum to acknowledge effort. Be encouraging!`
      : '';

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are an expert interview coach validating response quality using STAR methodology.

Your task: Evaluate interview answers for completeness and provide guided improvement suggestions.

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "is_sufficient": boolean,
  "quality_score": number,
  "missing_elements": ["array of missing elements"],
  "follow_up_prompt": "Encouraging feedback message",
  "strengths": ["what they did well"],
  "guided_prompts": {
    // ONLY include if quality_score < 70
    // Structure for each missing element with question and options array
  }
}

SCORING RULES:
1. Count checkboxes selected (semicolons in selected_options)
2. Apply MINIMUM scores:
   - 3-4 checkboxes: MIN score = 65
   - 5-6 checkboxes: MIN score = 75
   - 7+ checkboxes: MIN score = 85
3. If custom text + 5+ checkboxes: score = 85+
4. Score < 60 ONLY if: <3 checkboxes AND no meaningful custom text

VALIDATION RULES:
- quality_score >= 70: DO NOT include guided_prompts, set is_sufficient=true
- quality_score 60-69: Include minimal guided_prompts, acknowledge foundation
- quality_score < 60: Include full guided_prompts for all missing elements
- Always be encouraging and constructive`;

    // STANDARDIZED USER PROMPT
    const userPrompt = `Validate this interview response for completeness:

QUESTION:
${question}

USER'S ANSWER:
${combinedAnswer}${improvementContext}

EVALUATION CRITERIA:
1. Specificity: Concrete details vs vague statements
2. Quantification: Numbers, metrics, percentages, dollar amounts
3. Context: Team size, timeline, technologies/tools
4. Impact: Results, outcomes, what changed

TASK: Return validation results in the required JSON format.

If quality_score < 70, include guided_prompts with this structure for each missing element:
{
  "specificity": {
    "question": "Can you add more specific details?",
    "options": ["Name specific technologies/tools", "Mention methodologies", "Reference projects", "Describe examples", "I don't remember more"]
  },
  "quantification": {
    "question": "What was the measurable impact?",
    "options": ["10-25% improvement", "25-50%", "50-100%", "100%+", "Saved $ or hours", "I don't remember numbers"]
  },
  "context": {
    "question": "What was the team/project context?",
    "options": ["Solo project", "Small team (2-5)", "Medium (6-15)", "Large (15+)", "Timeline: weeks/months/years", "I don't remember"]
  },
  "impact": {
    "question": "What were the outcomes?",
    "options": ["Improved efficiency", "Increased revenue", "Reduced costs", "Enhanced satisfaction", "Solved problem", "New capabilities", "Recognition", "Can't recall"]
  }
}`;

    logger.debug('Calling Lovable AI for validation');
    const startTime = Date.now();

    const { response: aiResponse, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      },
      'validate-interview-response'
    );

    await logAIUsage(metrics);

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    const validationText = aiResponse.choices[0].message.content.trim();
    logger.debug('Received validation response', {
      responseLength: validationText.length,
      preview: validationText.substring(0, 200)
    });

    const result = extractJSON(validationText, GenericAIResponseSchema);

    if (!result.success) {
      logger.error('Validation parsing failed', {
        error: result.error,
        response: validationText.substring(0, 300)
      });
      throw new Error(`Invalid validation response: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('No validation data returned');
    }

    const responseData = JSON.parse(result.data.content || '{}');

    // EXPLICIT FIELD VALIDATION
    if (typeof responseData.is_sufficient !== 'boolean') {
      logger.error('Missing or invalid is_sufficient field');
      throw new Error('AI response missing required field: is_sufficient (boolean)');
    }
    
    if (typeof responseData.quality_score !== 'number' || responseData.quality_score < 0 || responseData.quality_score > 100) {
      logger.error('Missing or invalid quality_score field', { score: responseData.quality_score });
      throw new Error('AI response missing required field: quality_score (0-100)');
    }
    
    if (!Array.isArray(responseData.missing_elements)) {
      logger.error('Missing or invalid missing_elements array');
      throw new Error('AI response missing required field: missing_elements array');
    }
    
    if (!responseData.follow_up_prompt || typeof responseData.follow_up_prompt !== 'string') {
      logger.error('Missing or invalid follow_up_prompt field');
      throw new Error('AI response missing required field: follow_up_prompt');
    }

    logger.info('Interview response validation complete', {
      qualityScore: responseData.quality_score,
      isSufficient: responseData.is_sufficient,
      missingElements: responseData.missing_elements.length
    });

    return responseData;
  }
}));
