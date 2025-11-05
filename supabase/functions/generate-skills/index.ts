import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { SkillExtractionSchema } from '../_shared/ai-response-schemas.ts';
import { extractArray } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'generate-skills',
  requireAuth: false, // Called from other functions
  parseResponse: false, // Custom parsing below

  handler: async ({ body, logger }) => {
    const { resumeAnalysis, currentSkills } = body;

    logger.info('Generating skill suggestions', {
      yearsExperience: resumeAnalysis?.years_experience,
      currentSkillsCount: currentSkills?.length || 0
    });

    const prompt = `Based on this resume analysis, suggest 5-8 additional core skills that would strengthen this executive profile for contract/interim positions.

Resume Details:
- Experience: ${resumeAnalysis.years_experience} years
- Current Skills: ${currentSkills?.join(", ") || "None listed"}
- Existing Resume Skills: ${resumeAnalysis.skills?.join(", ") || "Not specified"}
- Industries: ${resumeAnalysis.industry_expertise?.join(", ") || "Not specified"}
- Management Capabilities: ${resumeAnalysis.management_capabilities?.join(", ") || "Not specified"}

Requirements:
1. Skills should be relevant to executive-level roles (permanent, contract, and interim positions)
2. Focus on leadership, strategic, and specialized technical skills
3. Avoid duplicating existing skills
4. Include a mix of hard and soft skills
5. Keep each skill concise (2-5 words)

Return ONLY a JSON array of skill strings, nothing else. Example format:
["Change Management", "P&L Leadership", "Digital Transformation", "M&A Integration"]`;

    const startTime = Date.now();

    const model = selectOptimalModel({
      taskType: 'generation',
      complexity: 'low',
      requiresReasoning: false,
      estimatedOutputTokens: 200
    });

    logger.info('Selected model', { model });

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are an expert career coach specializing in executive skill assessment. Return valid JSON only."
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
      'generate-skills'
    );

    await logAIUsage(metrics);

    const latencyMs = Date.now() - startTime;

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs,
      cost: metrics.cost_usd,
      success: true
    });

    const content = cleanCitations(response.choices[0].message.content);

    // Extract and validate array
    const result = extractArray<string>(content);

    if (!result.success || !result.data) {
      logger.error('Failed to extract skills array', {
        error: result.error,
        response: content.substring(0, 300)
      });
      throw new Error(`AI returned invalid skills array: ${result.error}`);
    }

    logger.info('Skills generated', { count: result.data.length });

    return { skills: result.data };
  }
}));
