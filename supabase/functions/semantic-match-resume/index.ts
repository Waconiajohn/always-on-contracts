import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { SemanticMatchSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

/**
 * Semantic Matching: Find hidden qualifications using AI context understanding
 *
 * Goes beyond keyword matching to find:
 * - Similar concepts expressed differently
 * - Transferable skills from other industries
 * - Hidden qualifications user doesn't realize they have
 */
serve(createAIHandler({
  functionName: 'semantic-match-resume',
  schema: SemanticMatchSchema,
  requireAuth: true,
  rateLimit: { maxPerMinute: 10, maxPerHour: 100 },

  inputValidation: (body) => {
    if (!body.resumeContent || body.resumeContent.length < 100) {
      throw new Error('Resume content must be at least 100 characters');
    }
    if (!body.jobRequirements || !Array.isArray(body.jobRequirements)) {
      throw new Error('Job requirements must be an array');
    }
    if (body.jobRequirements.length === 0) {
      throw new Error('At least one job requirement is required');
    }
  },

  handler: async ({ user, body, logger }) => {
    const {
      resumeContent,
      jobRequirements,
      jobDescription,
      industry = 'General',
      targetIndustry = 'General'
    } = body;

    logger.info('Starting semantic matching', {
      resumeLength: resumeContent.length,
      requirementsCount: jobRequirements.length,
      industryTransition: `${industry} → ${targetIndustry}`
    });

    const prompt = `You are an expert career transition analyst. Perform SEMANTIC MATCHING between resume and job requirements.

CRITICAL: Go BEYOND keyword matching. Find:
1. Similar concepts expressed with different terminology
2. Transferable skills from ${industry} to ${targetIndustry}
3. Hidden qualifications the candidate doesn't realize they have

RESUME CONTENT:
${resumeContent}

JOB REQUIREMENTS:
${jobRequirements.map((req: string, idx: number) => `${idx + 1}. ${req}`).join('\n')}

JOB DESCRIPTION CONTEXT:
${jobDescription?.substring(0, 1000) || 'Not provided'}

EXAMPLES OF SEMANTIC MATCHING:
- Job requires: "Stakeholder management"
  Resume says: "Coordinated with C-suite, board members, and external partners"
  Match: ✅ This IS stakeholder management (keyword matching would miss this)

- Job requires: "Agile methodology"
  Resume says: "Led iterative development cycles with 2-week sprints"
  Match: ✅ This demonstrates Agile understanding without using the exact term

- Job requires: "Change management"
  Resume says: "Guided organization through digital transformation affecting 500+ employees"
  Match: ✅ This is change management at scale

ANALYZE AND RETURN ONLY VALID JSON:
{
  "overallFit": 85,
  "requirementMatches": [
    {
      "requirement": "Stakeholder management",
      "matchStrength": "strong",
      "evidence": ["Coordinated with C-suite executives", "Board member relationships"],
      "reasoning": "Demonstrates stakeholder management through executive coordination"
    }
  ],
  "hiddenStrengths": [
    "Change leadership (not explicitly stated but evident in transformation work)",
    "Cross-functional collaboration (shown through multi-team coordination)"
  ],
  "criticalGaps": [
    "Requirement: Technical skill X - Not found in resume",
    "Requirement: Certification Y - Missing but could be obtained"
  ],
  "recommendation": "Strong candidate - 7/10 requirements matched semantically",
  "nextSteps": [
    "Highlight stakeholder management more explicitly",
    "Add specific metrics to transformation examples"
  ]
}`;

    const startTime = Date.now();

    const model = selectOptimalModel({
      taskType: 'analysis',
      complexity: 'high',
      requiresReasoning: true,
      estimatedInputTokens: Math.ceil((resumeContent.length + (jobDescription?.length || 0)) / 4) + 400,
      estimatedOutputTokens: 1200
    });

    logger.info('Selected model', { model });

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are an expert career analyst specializing in semantic matching and transferable skills analysis. Look beyond keywords to find true capability matches. Return valid JSON only."
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
      'semantic-match-resume',
      user.id
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

    const content_text = cleanCitations(response.choices[0].message.content);

    const result = extractJSON(content_text, SemanticMatchSchema);

    if (!result.success) {
      logger.error('JSON parsing failed', {
        error: result.error,
        response: content_text.substring(0, 500)
      });
      throw new Error(`AI returned invalid response: ${result.error}`);
    }

    logger.info('Semantic matching complete', {
      overallFit: result.data.overallFit,
      matchesFound: result.data.requirementMatches.length,
      hiddenStrengths: result.data.hiddenStrengths.length
    });

    return result.data;
  }
}));
