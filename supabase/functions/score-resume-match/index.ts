import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { GenericAIResponseSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'score-resume-match',
  schema: GenericAIResponseSchema,
  requireAuth: true,
  rateLimit: { maxPerMinute: 10, maxPerHour: 100 },

  inputValidation: (body) => {
    if (!body.keywords || !Array.isArray(body.keywords)) {
      throw new Error('keywords must be an array');
    }
    if (!body.resumeContent) {
      throw new Error('resumeContent is required');
    }
  },

  handler: async ({ user, body, logger }) => {
    const { keywords, resumeContent } = body;

    logger.info('Scoring resume match', {
      keywordCount: keywords.length,
      hasExecutiveSummary: !!resumeContent.executive_summary
    });

    const prompt = `Analyze this resume content against the required keywords and provide a detailed scoring:

REQUIRED KEYWORDS: ${keywords.join(", ")}

RESUME CONTENT:
Executive Summary: ${resumeContent.executive_summary || ""}
Key Achievements: ${resumeContent.key_achievements?.join("; ") || ""}
Core Competencies: ${resumeContent.core_competencies?.join(", ") || ""}

TASK:
1. Check which keywords appear in the resume (exact match or close variants)
2. Calculate overall match percentage
3. Score different categories (technical, leadership, domain)
4. Identify strengths and gaps
5. Provide specific improvement recommendations

Return ONLY valid JSON with this structure:
{
  "overallMatch": 85,
  "categoryScores": {
    "technical": 90,
    "leadership": 80,
    "domain": 85
  },
  "strengths": ["Strong technical background", "Proven leadership"],
  "gaps": ["Missing cloud certifications", "Limited agile experience"],
  "recommendation": "Strong candidate with minor gaps in cloud technologies"
}`;

    const startTime = Date.now();

    const model = selectOptimalModel({
      taskType: 'analysis',
      complexity: 'medium',
      requiresReasoning: true,
      estimatedOutputTokens: 600
    });

    logger.info('Selected model', { model });

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are an expert ATS scoring specialist. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model,
        temperature: 0.2,
        max_tokens: 2000,
        return_citations: false,
      },
      'score-resume-match',
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

    const content = cleanCitations(response.choices[0].message.content);

    const result = extractJSON(content, GenericAIResponseSchema);

    if (!result.success || !result.data) {
      logger.error('Parsing failed', { error: result.error });
      throw new Error(`Invalid response: ${result.error}`);
    }

    const responseData = JSON.parse(result.data.content || '{}');

    logger.info('Scoring complete', {
      overallMatch: responseData.overallMatch,
      gapsCount: responseData.gaps?.length || 0
    });

    return responseData;
  }
}));
