import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { GenericAIResponseSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'analyze-linkedin-resume-consistency',
  schema: GenericAIResponseSchema,
  requireAuth: true,
  rateLimit: { maxPerMinute: 10, maxPerHour: 50 },

  inputValidation: (body) => {
    if (!body.resumeContent || body.resumeContent.length < 100) {
      throw new Error('Resume content is required (minimum 100 characters)');
    }
    if (!body.linkedInContent || body.linkedInContent.length < 10) {
      throw new Error('LinkedIn content is required');
    }
  },

  handler: async ({ body, logger }) => {
    const { resumeContent, linkedInContent } = body;

    logger.info('Analyzing LinkedIn-Resume consistency', {
      resumeLength: resumeContent.length,
      linkedInLength: linkedInContent.length
    });

    const systemPrompt = `You are an expert career coach analyzing consistency between a professional's resume and LinkedIn profile.

Your task: Compare skills, keywords, and expertise mentioned in both documents to identify alignment and gaps.

Return ONLY valid JSON in this exact format:
{
  "alignmentScore": <number 0-100>,
  "matchingSkills": ["array of skills/keywords found in BOTH documents"],
  "resumeOnlySkills": ["skills found in resume but NOT on LinkedIn"],
  "linkedInOnlySkills": ["skills found on LinkedIn but NOT in resume"],
  "recommendations": {
    "addToLinkedIn": ["specific skills from resume to add to LinkedIn profile"],
    "addToResume": ["relevant LinkedIn skills that should be on resume"],
    "keywordGaps": ["industry keywords missing from both that could help"]
  },
  "summary": "Brief 1-2 sentence assessment of overall alignment"
}

ANALYSIS RULES:
1. Extract hard skills, soft skills, tools, technologies, and certifications
2. Consider synonyms (e.g., "leadership" = "team management")
3. Focus on recruiter-relevant keywords
4. Prioritize technical skills for tech roles, soft skills for management roles
5. Alignment score:
   - 90-100: Excellent consistency
   - 70-89: Good with minor gaps
   - 50-69: Moderate inconsistencies
   - Below 50: Significant misalignment`;

    const userPrompt = `Compare these two documents for keyword and skill consistency:

=== MASTER RESUME CONTENT ===
${resumeContent.substring(0, 4000)}

=== LINKEDIN PROFILE CONTENT ===
${linkedInContent.substring(0, 2000)}

Analyze:
1. What skills/keywords appear in BOTH documents?
2. What's on the resume but missing from LinkedIn?
3. What's on LinkedIn but missing from the resume?
4. What industry-standard keywords are missing from both?

Return the JSON analysis.`;

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
      'analyze-linkedin-resume-consistency'
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

    const responseText = aiResponse.choices[0].message.content.trim();
    logger.debug('Received consistency analysis', {
      responseLength: responseText.length
    });

    const result = extractJSON(responseText, GenericAIResponseSchema);

    if (!result.success) {
      logger.error('Consistency analysis parsing failed', {
        error: result.error,
        response: responseText.substring(0, 300)
      });
      throw new Error(`Invalid analysis response: ${result.error}`);
    }

    const analysisData = JSON.parse(result.data?.content || responseText);

    // Validate required fields
    if (typeof analysisData.alignmentScore !== 'number') {
      analysisData.alignmentScore = 70;
    }
    if (!Array.isArray(analysisData.matchingSkills)) {
      analysisData.matchingSkills = [];
    }
    if (!Array.isArray(analysisData.resumeOnlySkills)) {
      analysisData.resumeOnlySkills = [];
    }
    if (!Array.isArray(analysisData.linkedInOnlySkills)) {
      analysisData.linkedInOnlySkills = [];
    }
    if (!analysisData.recommendations) {
      analysisData.recommendations = {
        addToLinkedIn: [],
        addToResume: [],
        keywordGaps: []
      };
    }
    if (!analysisData.summary) {
      analysisData.summary = `LinkedIn-Resume alignment: ${analysisData.alignmentScore}%`;
    }

    logger.info('LinkedIn-Resume consistency analysis complete', {
      alignmentScore: analysisData.alignmentScore,
      matchingCount: analysisData.matchingSkills.length,
      resumeOnlyCount: analysisData.resumeOnlySkills.length,
      linkedInOnlyCount: analysisData.linkedInOnlySkills.length
    });

    return analysisData;
  }
}));
