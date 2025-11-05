import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { extractArray } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'generate-achievements',
  requireAuth: false,
  parseResponse: false,

  handler: async ({ body, logger }) => {
    const { resumeAnalysis, currentAchievements } = body;

    const prompt = `Based on this resume analysis, suggest 3-5 additional key achievements that would be compelling for contract/interim executive positions.

Resume Details:
- Experience: ${resumeAnalysis.years_experience} years
- Current Achievements: ${currentAchievements?.join(", ") || "None listed"}
- Skills: ${resumeAnalysis.skills?.join(", ") || "Not specified"}
- Industries: ${resumeAnalysis.industry_expertise?.join(", ") || "Not specified"}
- Management Capabilities: ${resumeAnalysis.management_capabilities?.join(", ") || "Not specified"}

Requirements:
1. Achievements should be specific, quantifiable, and impressive
2. Focus on leadership impact, transformation, and business results
3. Avoid duplicating existing achievements
4. Make them relevant to contract/interim executive roles
5. Each achievement should be 1-2 sentences maximum

Return ONLY a JSON array of achievement strings, nothing else. Example format:
["Led $50M digital transformation resulting in 40% efficiency gain", "Restructured global operations across 12 countries, reducing costs by $15M annually"]`;

    const startTime = Date.now();

    const model = selectOptimalModel({
      taskType: 'generation',
      complexity: 'low',
      requiresReasoning: false,
      estimatedOutputTokens: 300
    });

    logger.info('Selected model', { model });

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
      'generate-achievements'
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

    if (!result.success) {
      logger.error('Array extraction failed', { error: result.error });
      throw new Error(`Invalid achievements array: ${result.error}`);
    }

    logger.info('Achievements generated', { count: result.data?.length });

    return { achievements: result.data };
  }
}));
