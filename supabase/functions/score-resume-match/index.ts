import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { GenericAIResponseSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'score-resume-match',
  schema: GenericAIResponseSchema,
  requireAuth: true,
  rateLimit: { maxPerMinute: 10, maxPerHour: 100 },

  inputValidation: (body) => {
    if (!body.jobDescription || typeof body.jobDescription !== 'string') {
      throw new Error('jobDescription must be a string');
    }
    if (!body.resumeContent || typeof body.resumeContent !== 'string') {
      throw new Error('resumeContent must be a string');
    }
  },

  handler: async ({ user, body, logger }) => {
    const { jobDescription, resumeContent } = body;

    logger.info('Scoring resume match', {
      jobDescriptionLength: jobDescription.length,
      resumeContentLength: resumeContent.length
    });

    const systemPrompt = `You are an expert ATS scoring specialist. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:`;

    const userPrompt = `Analyze this resume against the job description and provide detailed scoring:

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeContent}

TASK:
1. Detect the role, industry, and seniority level
2. Calculate overall match score (0-100)
3. Identify ALL priority gaps with fixes (not just top 5)
4. List ALL missing keywords from the job description
5. List ALL matching keywords found in resume
6. List key strengths

Return this exact structure:
{
  "overallScore": 75,
  "detected": {
    "role": "Target Role Title",
    "industry": "Industry Name",
    "level": "senior"
  },
  "priorityFixes": [
    {
      "category": "technical",
      "issue": "Missing specific skill",
      "fix": "Specific action to address gap",
      "details": "Detailed explanation",
      "priority": 1
    }
  ],
  "missingKeywords": ["keyword1", "keyword2", "...all missing keywords"],
  "matchedKeywords": ["keyword1", "keyword2", "...all matched keywords"],
  "breakdown": {
    "hardSkills": {
      "matched": ["Python", "JavaScript"],
      "missing": ["AWS", "Docker"]
    },
    "softSkills": {
      "matched": ["Leadership"],
      "missing": ["Communication"]
    },
    "strengths": [
      { "description": "Specific strength description" }
    ]
  }
}`;

    const startTime = Date.now();

    logger.info('Using Lovable AI model', { model: LOVABLE_AI_MODELS.DEFAULT });

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
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

    const rawContent = response.choices[0].message.content;
    console.log('[score-resume-match] Raw AI response:', rawContent.substring(0, 500));

    // Extract JSON without schema validation (AI returns the response object directly)
    const result = extractJSON(rawContent);

    if (!result.success || !result.data) {
      console.error('[score-resume-match] JSON parse failed:', result.error);
      console.error('[score-resume-match] Full response:', rawContent);
      logger.error('Parsing failed', { error: result.error });
      throw new Error(`Failed to parse AI response: ${result.error}`);
    }

    // result.data is already the parsed response object
    const responseData = result.data;

    logger.info('Scoring complete', {
      overallScore: responseData.overallScore,
      gapsCount: responseData.priorityFixes?.length || 0
    });

    return responseData;
  }
}));
