import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { extractArray } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'generate-why-me-questions',
  requireAuth: false,
  parseResponse: false,

  inputValidation: (body) => {
    if (!body.category) {
      throw new Error('category is required');
    }
  },

  handler: async ({ body, logger }) => {
    const { category } = body;

    const prompt = `Generate 3-5 specific, thoughtful questions to help an executive articulate their achievements in the category of "${category}".

The questions should:
- Help extract specific, measurable results
- Encourage storytelling about challenges overcome
- Focus on leadership impact and strategic thinking
- Draw out unique differentiators

Return ONLY a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]`;

    const startTime = Date.now();

    const model = selectOptimalModel({
      taskType: 'generation',
      complexity: 'low',
      requiresReasoning: false,
      estimatedOutputTokens: 300
    });

    logger.info('Selected model', { model, category });

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are an expert executive career coach. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model,
        temperature: 0.7,
        max_tokens: 600,
        return_citations: false,
      },
      'generate-why-me-questions'
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

    const content = cleanCitations(response.choices[0].message.content);

    const result = extractArray<string>(content);

    if (!result.success || !result.data) {
      logger.error('Questions extraction failed', {
        error: result.error,
        response: content.substring(0, 300)
      });
      throw new Error(`Invalid questions array: ${result.error}`);
    }

    logger.info('Questions generated', { count: result.data.length });

    return { questions: result.data };
  }
}));
