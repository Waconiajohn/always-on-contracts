import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

/**
 * Analyze Benchmark Edge Function
 *
 * Analyzes a job description and synthesizes what a REALISTIC, STRONG candidate
 * profile looks like for this role. This goes beyond simple JD parsing to create
 * an industry-aware benchmark that accounts for poorly-written job descriptions.
 */

const logger = createLogger('analyze-benchmark');

// TypeScript interfaces (mirrored from src/lib/types/benchmark.ts for Deno)
interface BenchmarkSkill {
  skill: string;
  criticality: 'must-have' | 'nice-to-have' | 'bonus';
  whyMatters: string;
  evidenceOfMastery: string;
}

interface BenchmarkAccomplishment {
  type: string;
  description: string;
  exampleBullet: string;
  metricsToInclude: string[];
}

interface BenchmarkCandidate {
  roleTitle: string;
  level: 'entry' | 'mid' | 'senior' | 'staff' | 'principal' | 'executive';
  industry: string;
  synthesisReasoning: string;
  yearsOfExperience: {
    min: number;
    max: number;
    median: number;
    reasoning: string;
  };
  coreSkills: BenchmarkSkill[];
  expectedAccomplishments: BenchmarkAccomplishment[];
  typicalMetrics: string[];
  redFlags: string[];
  scoreWeights: {
    hasRequiredSkills: number;
    hasDemonstrationOfImpact: number;
    experienceLevelMatch: number;
    culturalFitSignals: number;
  };
}

const SYSTEM_PROMPT = `You are an expert recruiter and hiring manager with 20+ years in tech hiring. Your job is to analyze a job description and synthesize what a REALISTIC, STRONG candidate profile looks like for this role.

Be specific and industry-aware. A strong candidate is someone above average who would succeed and grow in the role – not impossible to find, but clearly competent.

IMPORTANT: Account for the fact that job descriptions are often poorly written. Use your expertise to fill in gaps and infer what the hiring manager REALLY needs based on the role title, industry, and context.

Return ONLY valid JSON matching this exact structure:

{
  "synthesisReasoning": "2-3 sentence explanation of how you arrived at this benchmark. Reference key aspects of the JD that informed your assessment.",

  "roleTitle": "The extracted or inferred job title",

  "level": "entry | mid | senior | staff | principal | executive",

  "industry": "The industry this role is in (e.g., 'Technology', 'Healthcare', 'Finance')",

  "yearsOfExperience": {
    "min": 3,
    "max": 8,
    "median": 5,
    "reasoning": "Why this range makes sense for this role"
  },

  "coreSkills": [
    {
      "skill": "Name of skill (be specific: 'Distributed systems design' not 'technical skills')",
      "criticality": "must-have | nice-to-have | bonus",
      "whyMatters": "Why this skill is critical for success in this role",
      "evidenceOfMastery": "How a strong candidate demonstrates this (e.g., 'shipped product using this', 'led team adopting this', 'optimized system using this')"
    }
  ],

  "expectedAccomplishments": [
    {
      "type": "shipped_product | led_team | mentorship | optimization | technical_innovation | scale | cost_reduction | revenue_growth | process_improvement | cross_functional",
      "description": "What this looks like in context of the role",
      "exampleBullet": "A realistic resume bullet that demonstrates this (use strong action verb + context + metric)",
      "metricsToInclude": ["metric1", "metric2"]
    }
  ],

  "typicalMetrics": [
    "What metrics a strong candidate in this role typically demonstrates",
    "Examples: 'Revenue impact: $1M+', 'Performance improvement: 30%+', 'Team size managed: 3-5'"
  ],

  "redFlags": [
    "Signs that would concern you in a resume for this role",
    "Examples: 'No quantifiable impact', 'Only worked on one small project', 'No evidence of scale experience'"
  ],

  "scoreWeights": {
    "hasRequiredSkills": 0.35,
    "hasDemonstrationOfImpact": 0.30,
    "experienceLevelMatch": 0.20,
    "culturalFitSignals": 0.15
  }
}

Guidelines:
- Include 8-12 core skills, ordered by criticality
- Include 5-7 expected accomplishments
- Include 4-6 typical metrics
- Include 4-6 red flags
- Score weights must sum to 1.0
- Be realistic - this is a strong candidate, not a unicorn`;

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  try {
    const { jobDescription, jobTitle, companyName, industry, benchmarkType = 'realistic' } = await req.json();

    if (!jobDescription || jobDescription.trim().length < 50) {
      throw new Error('Job description is required and must be at least 50 characters');
    }

    logger.info('Analyzing benchmark', { jobTitle, companyName, benchmarkType });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID for cost tracking
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
      } catch (e) {
        logger.warn('Could not extract user for cost tracking', { error: e });
      }
    }

    // Build the user prompt with available context
    const contextParts = [];
    if (jobTitle) contextParts.push(`JOB TITLE: ${jobTitle}`);
    if (companyName) contextParts.push(`COMPANY: ${companyName}`);
    if (industry) contextParts.push(`INDUSTRY: ${industry}`);

    const userPrompt = `Analyze this job description and return a JSON object with the benchmark candidate profile.

${contextParts.length > 0 ? contextParts.join('\n') + '\n\n' : ''}JOB DESCRIPTION:
${jobDescription}

${benchmarkType === 'aspirational' ? 'Note: Create an ASPIRATIONAL benchmark (top 10% of candidates, stretch goals).' : 'Create a REALISTIC benchmark (strong but attainable candidate profile).'}`;

    const startTime = Date.now();

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT, // gemini-2.5-flash for cost efficiency
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      },
      'analyze-benchmark',
      userId
    );

    await logAIUsage(metrics);

    const rawContent = response.choices?.[0]?.message?.content || '{}';
    logger.debug('Raw AI response', { content: rawContent.substring(0, 500) });

    const parseResult = extractJSON(rawContent);

    if (!parseResult.success || !parseResult.data) {
      logger.error('JSON parsing failed', {
        error: parseResult.error,
        content: rawContent.substring(0, 500)
      });
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const benchmarkData = parseResult.data;

    // Validate and normalize the response
    const benchmark: BenchmarkCandidate = {
      roleTitle: benchmarkData.roleTitle || jobTitle || 'Unknown Role',
      level: validateLevel(benchmarkData.level),
      industry: benchmarkData.industry || industry || 'Technology',
      synthesisReasoning: benchmarkData.synthesisReasoning || 'Benchmark derived from job description analysis.',
      yearsOfExperience: {
        min: benchmarkData.yearsOfExperience?.min ?? 2,
        max: benchmarkData.yearsOfExperience?.max ?? 10,
        median: benchmarkData.yearsOfExperience?.median ?? 5,
        reasoning: benchmarkData.yearsOfExperience?.reasoning || 'Based on role level and requirements.'
      },
      coreSkills: (benchmarkData.coreSkills || []).map(normalizeSkill),
      expectedAccomplishments: (benchmarkData.expectedAccomplishments || []).map(normalizeAccomplishment),
      typicalMetrics: benchmarkData.typicalMetrics || [],
      redFlags: benchmarkData.redFlags || [],
      scoreWeights: normalizeScoreWeights(benchmarkData.scoreWeights)
    };

    const executionTimeMs = Date.now() - startTime;

    logger.info('Benchmark analysis complete', {
      roleTitle: benchmark.roleTitle,
      level: benchmark.level,
      skillsCount: benchmark.coreSkills.length,
      accomplishmentsCount: benchmark.expectedAccomplishments.length,
      executionTimeMs
    });

    return new Response(
      JSON.stringify({
        success: true,
        benchmark,
        metrics: {
          inputTokens: metrics.input_tokens,
          outputTokens: metrics.output_tokens,
          costUsd: metrics.cost_usd,
          executionTimeMs
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error in analyze-benchmark', { error: error.message, stack: error.stack });

    return new Response(
      JSON.stringify({
        success: false,
        benchmark: null,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: error.message?.includes('required') ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions

function validateLevel(level: string): BenchmarkCandidate['level'] {
  const validLevels = ['entry', 'mid', 'senior', 'staff', 'principal', 'executive'];
  if (validLevels.includes(level?.toLowerCase())) {
    return level.toLowerCase() as BenchmarkCandidate['level'];
  }
  return 'mid'; // Default
}

function normalizeSkill(skill: any): BenchmarkSkill {
  return {
    skill: skill.skill || 'Unknown Skill',
    criticality: ['must-have', 'nice-to-have', 'bonus'].includes(skill.criticality)
      ? skill.criticality
      : 'nice-to-have',
    whyMatters: skill.whyMatters || '',
    evidenceOfMastery: skill.evidenceOfMastery || ''
  };
}

function normalizeAccomplishment(accomplishment: any): BenchmarkAccomplishment {
  return {
    type: accomplishment.type || 'shipped_product',
    description: accomplishment.description || '',
    exampleBullet: accomplishment.exampleBullet || '',
    metricsToInclude: Array.isArray(accomplishment.metricsToInclude)
      ? accomplishment.metricsToInclude
      : []
  };
}

function normalizeScoreWeights(weights: any): BenchmarkCandidate['scoreWeights'] {
  const defaults = {
    hasRequiredSkills: 0.35,
    hasDemonstrationOfImpact: 0.30,
    experienceLevelMatch: 0.20,
    culturalFitSignals: 0.15
  };

  if (!weights || typeof weights !== 'object') {
    return defaults;
  }

  const normalized = {
    hasRequiredSkills: parseFloat(weights.hasRequiredSkills) || defaults.hasRequiredSkills,
    hasDemonstrationOfImpact: parseFloat(weights.hasDemonstrationOfImpact) || defaults.hasDemonstrationOfImpact,
    experienceLevelMatch: parseFloat(weights.experienceLevelMatch) || defaults.experienceLevelMatch,
    culturalFitSignals: parseFloat(weights.culturalFitSignals) || defaults.culturalFitSignals
  };

  // Ensure weights sum to 1.0
  const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.01) {
    // Normalize to sum to 1.0
    Object.keys(normalized).forEach(key => {
      normalized[key as keyof typeof normalized] /= sum;
    });
  }

  return normalized;
}
