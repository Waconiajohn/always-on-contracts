import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { GenericAIResponseSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'update-strong-answer',
  schema: GenericAIResponseSchema,
  requireAuth: true,
  rateLimit: { maxPerMinute: 10, maxPerHour: 100 },

  inputValidation: (body) => {
    if (!body.question || !body.currentAnswer) {
      throw new Error('question and currentAnswer are required');
    }
  },

  handler: async ({ user, body, logger }) => {
    const { question, currentAnswer, validationFeedback } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Fetching vault data for answer enhancement');

    // Get Career Vault data for resume context
    const { data: vault } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const enhancementPrompt = `You are helping improve an interview answer by providing an enhanced example.

QUESTION:
${question}

USER'S CURRENT ANSWER:
${currentAnswer}

VALIDATION FEEDBACK:
${JSON.stringify(validationFeedback || {})}

RESUME CONTEXT:
${JSON.stringify(vault?.initial_analysis || {})}

Your task: Create an ENHANCED version of their answer that:
1. BUILDS ON what they already said (don't ignore their input)
2. Adds specific details from their resume where relevant
3. Includes the missing elements (specificity, quantification, context, impact)
4. Uses STAR format (Situation, Task, Action, Result)
5. Feels natural and authentic to their career story

Return JSON with:
{
  "enhanced_answer": "The improved answer with specific details",
  "what_was_added": "Brief explanation of what you enhanced",
  "resume_details_used": ["List of specific resume details incorporated"]
}

Keep the enhanced answer realistic and grounded in their actual experience. Don't fabricate - enhance.`;

    const startTime = Date.now();

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach creating enhanced answer examples. Return only valid JSON.'
          },
          { role: 'user', content: enhancementPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      },
      'update-strong-answer',
      user.id
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

    const enhancedText = response.choices[0].message.content.trim();

    const result = extractJSON(enhancedText, GenericAIResponseSchema);

    if (!result.success) {
      logger.error('JSON extraction failed', {
        error: result.error,
        response: enhancedText.substring(0, 300)
      });
      throw new Error(`Invalid enhancement response: ${result.error}`);
    }

    logger.info('Answer enhancement complete');

    return result.data;
  }
}));
