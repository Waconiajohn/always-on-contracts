import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

/**
 * Score vs Benchmark Edge Function
 *
 * Compares a resume against a benchmark candidate profile and returns
 * a detailed breakdown of how well the candidate matches.
 */

const logger = createLogger('score-vs-benchmark');

// ============================================================================
// Types (mirrored from src/lib/types/benchmark.ts for Deno)
// ============================================================================

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
  level: string;
  industry: string;
  yearsOfExperience: { min: number; max: number; median: number; reasoning: string };
  coreSkills: BenchmarkSkill[];
  expectedAccomplishments: BenchmarkAccomplishment[];
  typicalMetrics: string[];
  redFlags: string[];
  scoreWeights: Record<string, number>;
}

interface MatchScoreBreakdown {
  overallScore: number;
  scoreExplanation: string;
  categories: {
    keywords: {
      score: number;
      matched: string[];
      missing: string[];
      missingByPriority: { keyword: string; criticality: string }[];
      summary: string;
    };
    experience: {
      score: number;
      userYearsOfExperience: number;
      benchmarkYearsOfExperience: { min: number; max: number; median: number };
      levelMatch: 'below' | 'aligned' | 'above';
      gaps: string[];
      summary: string;
    };
    accomplishments: {
      score: number;
      userHasMetrics: boolean;
      userMetrics: string[];
      benchmarkMetrics: string[];
      missingMetrics: string[];
      accomplishmentTypes: { type: string; found: boolean; evidence?: string }[];
      summary: string;
    };
    atsCompliance: {
      score: number;
      issues: string[];
      warnings: string[];
      sectionsFound: string[];
      sectionsMissing: string[];
      summary: string;
    };
  };
  strengths: string[];
  gaps: string[];
  weights: { keywords: number; experience: number; accomplishments: number; atsCompliance: number };
}

// ============================================================================
// Scoring Weights
// ============================================================================

const SCORING_WEIGHTS = {
  keywords: 0.40,
  experience: 0.25,
  accomplishments: 0.20,
  atsCompliance: 0.15
};

// ============================================================================
// Experience Extraction
// ============================================================================

function extractYearsOfExperience(resumeText: string): number {
  const currentYear = new Date().getFullYear();
  const dateRanges: { start: number; end: number }[] = [];

  // Pattern 1: "2020 - 2024" or "2020-2024"
  const yearRangePattern = /\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b/g;
  let match;
  while ((match = yearRangePattern.exec(resumeText)) !== null) {
    const years = match[0].match(/\d{4}/g);
    if (years && years.length >= 2) {
      dateRanges.push({ start: parseInt(years[0]), end: parseInt(years[1]) });
    }
  }

  // Pattern 2: "2020 - Present" or "2020 - Current"
  const presentPattern = /\b(19|20)\d{2}\s*[-–—]\s*(Present|Current|Now|Ongoing)/gi;
  while ((match = presentPattern.exec(resumeText)) !== null) {
    const year = match[0].match(/\d{4}/);
    if (year) {
      dateRanges.push({ start: parseInt(year[0]), end: currentYear });
    }
  }

  // Pattern 3: "Jan 2020 - Dec 2024" or "January 2020 - Present"
  const monthYearPattern = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(19|20)\d{2}\s*[-–—]\s*(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(19|20)\d{2}|(Present|Current|Now))/gi;
  while ((match = monthYearPattern.exec(resumeText)) !== null) {
    const years = match[0].match(/\d{4}/g);
    const isPresent = /present|current|now/i.test(match[0]);
    if (years && years.length >= 1) {
      const startYear = parseInt(years[0]);
      const endYear = isPresent ? currentYear : (years.length >= 2 ? parseInt(years[1]) : currentYear);
      dateRanges.push({ start: startYear, end: endYear });
    }
  }

  // Pattern 4: Standalone years like "Since 2018" or "From 2015"
  const sincePattern = /\b(?:Since|From)\s*(19|20)\d{2}\b/gi;
  while ((match = sincePattern.exec(resumeText)) !== null) {
    const year = match[0].match(/\d{4}/);
    if (year) {
      dateRanges.push({ start: parseInt(year[0]), end: currentYear });
    }
  }

  if (dateRanges.length === 0) {
    // Fallback: count number of job entries as proxy (assume ~2 years each)
    const jobIndicators = resumeText.match(/\b(experience|worked at|employed|position|role)\b/gi);
    return jobIndicators ? Math.min(jobIndicators.length * 2, 15) : 3;
  }

  // Calculate total unique years (accounting for overlapping positions)
  const allYears = new Set<number>();
  for (const range of dateRanges) {
    for (let y = range.start; y <= range.end; y++) {
      allYears.add(y);
    }
  }

  return allYears.size;
}

// ============================================================================
// Keyword Matching
// ============================================================================

function matchKeywords(
  resumeText: string,
  benchmarkSkills: BenchmarkSkill[]
): {
  score: number;
  matched: string[];
  missing: string[];
  missingByPriority: { keyword: string; criticality: string }[];
  summary: string;
} {
  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  const missingByPriority: { keyword: string; criticality: string }[] = [];

  // Weight by criticality: must-have = 3, nice-to-have = 2, bonus = 1
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const skill of benchmarkSkills) {
    const weight = skill.criticality === 'must-have' ? 3 : skill.criticality === 'nice-to-have' ? 2 : 1;
    totalWeight += weight;

    // Check for skill in resume (case-insensitive, word boundary)
    const skillLower = skill.skill.toLowerCase();
    const skillWords = skillLower.split(/\s+/);

    // For multi-word skills, check if all words appear in resume
    const isMatched = skillWords.length > 1
      ? skillWords.every(word => resumeLower.includes(word))
      : resumeLower.includes(skillLower);

    if (isMatched) {
      matched.push(skill.skill);
      matchedWeight += weight;
    } else {
      missing.push(skill.skill);
      missingByPriority.push({ keyword: skill.skill, criticality: skill.criticality });
    }
  }

  // Sort missing by priority (must-have first)
  missingByPriority.sort((a, b) => {
    const order = { 'must-have': 0, 'nice-to-have': 1, 'bonus': 2 };
    return (order[a.criticality as keyof typeof order] || 2) - (order[b.criticality as keyof typeof order] || 2);
  });

  const score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  const mustHaveMissing = missingByPriority.filter(m => m.criticality === 'must-have').length;
  const summary = mustHaveMissing > 0
    ? `Missing ${mustHaveMissing} must-have skill${mustHaveMissing > 1 ? 's' : ''}: ${missingByPriority.filter(m => m.criticality === 'must-have').map(m => m.keyword).slice(0, 3).join(', ')}${mustHaveMissing > 3 ? '...' : ''}`
    : matched.length > 0
      ? `Strong skill match: ${matched.slice(0, 3).join(', ')}${matched.length > 3 ? ` and ${matched.length - 3} more` : ''}`
      : 'Limited skill alignment with benchmark';

  return { score, matched, missing, missingByPriority, summary };
}

// ============================================================================
// Experience Level Matching
// ============================================================================

function matchExperience(
  userYears: number,
  benchmark: { min: number; max: number; median: number }
): {
  score: number;
  levelMatch: 'below' | 'aligned' | 'above';
  gaps: string[];
  summary: string;
} {
  let levelMatch: 'below' | 'aligned' | 'above';
  let score: number;
  const gaps: string[] = [];

  if (userYears < benchmark.min) {
    levelMatch = 'below';
    const deficit = benchmark.min - userYears;
    score = Math.max(0, 100 - (deficit * 15)); // -15 points per year below min
    gaps.push(`${deficit} year${deficit > 1 ? 's' : ''} below minimum experience requirement`);
  } else if (userYears > benchmark.max) {
    levelMatch = 'above';
    score = Math.min(100, 100 + 10); // Slight bonus for exceeding, capped at 100
  } else {
    levelMatch = 'aligned';
    // Score based on proximity to median
    const distanceFromMedian = Math.abs(userYears - benchmark.median);
    score = Math.max(80, 100 - (distanceFromMedian * 5));
  }

  const summary = levelMatch === 'below'
    ? `Experience (${userYears} years) is below the ${benchmark.min}-${benchmark.max} year range for this role`
    : levelMatch === 'above'
      ? `Experience (${userYears} years) exceeds the typical ${benchmark.max} year ceiling - consider if this role is a step back`
      : `Experience (${userYears} years) aligns well with the ${benchmark.min}-${benchmark.max} year range`;

  return { score, levelMatch, gaps, summary };
}

// ============================================================================
// ATS Compliance Check
// ============================================================================

function checkATSCompliance(resumeText: string): {
  score: number;
  issues: string[];
  warnings: string[];
  sectionsFound: string[];
  sectionsMissing: string[];
  summary: string;
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  const sectionsFound: string[] = [];
  const sectionsMissing: string[] = [];

  const resumeLower = resumeText.toLowerCase();

  // Check for common sections
  const expectedSections = [
    { name: 'Summary', patterns: ['summary', 'objective', 'profile', 'about'] },
    { name: 'Experience', patterns: ['experience', 'employment', 'work history', 'professional background'] },
    { name: 'Skills', patterns: ['skills', 'technical skills', 'core competencies', 'expertise'] },
    { name: 'Education', patterns: ['education', 'academic', 'degree', 'university', 'college'] },
    { name: 'Contact', patterns: ['email', 'phone', 'linkedin', '@'] }
  ];

  for (const section of expectedSections) {
    const found = section.patterns.some(p => resumeLower.includes(p));
    if (found) {
      sectionsFound.push(section.name);
    } else {
      sectionsMissing.push(section.name);
    }
  }

  // Check for issues

  // Issue: Too short (likely missing content)
  if (resumeText.length < 500) {
    issues.push('Resume appears too short - may be missing important content');
  }

  // Issue: No bullet points or very short lines
  const lines = resumeText.split('\n').filter(l => l.trim().length > 0);
  const shortLines = lines.filter(l => l.trim().length < 20 && l.trim().length > 0);
  if (shortLines.length > lines.length * 0.4) {
    warnings.push('Many very short lines detected - consider using complete bullet points');
  }

  // Issue: No metrics/numbers
  const hasNumbers = /\d+%|\$\d+|\d+\s*(users|customers|team|people|members|million|k\b)/i.test(resumeText);
  if (!hasNumbers) {
    issues.push('No quantifiable metrics detected - add numbers to demonstrate impact');
  }

  // Issue: Missing contact info
  const hasEmail = /@/.test(resumeText);
  const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
  if (!hasEmail && !hasPhone) {
    issues.push('No contact information detected');
  }

  // Warning: Very long resume
  if (resumeText.length > 8000) {
    warnings.push('Resume may be too long - consider condensing to 1-2 pages');
  }

  // Warning: Excessive special characters (formatting issues)
  const specialChars = resumeText.match(/[●○■□▪▫◆◇★☆]/g);
  if (specialChars && specialChars.length > 20) {
    warnings.push('Many special characters detected - may cause ATS parsing issues');
  }

  // Calculate score
  let score = 100;
  score -= issues.length * 15; // -15 per issue
  score -= warnings.length * 5; // -5 per warning
  score -= sectionsMissing.length * 10; // -10 per missing section
  score = Math.max(0, Math.min(100, score));

  const summary = score >= 80
    ? 'Good ATS compatibility - resume should parse well'
    : score >= 60
      ? 'Moderate ATS compatibility - some improvements recommended'
      : 'Low ATS compatibility - significant issues may prevent parsing';

  return { score, issues, warnings, sectionsFound, sectionsMissing, summary };
}

// ============================================================================
// AI-Powered Accomplishment Analysis
// ============================================================================

async function analyzeAccomplishments(
  resumeText: string,
  benchmark: BenchmarkCandidate,
  userId?: string
): Promise<{
  score: number;
  userHasMetrics: boolean;
  userMetrics: string[];
  benchmarkMetrics: string[];
  missingMetrics: string[];
  accomplishmentTypes: { type: string; found: boolean; evidence?: string }[];
  summary: string;
  aiMetrics?: any;
}> {
  const systemPrompt = `You are an expert resume analyst. Analyze the resume against the benchmark accomplishment types and metrics. Return ONLY valid JSON.`;

  const accomplishmentTypes = benchmark.expectedAccomplishments.map(a => a.type);
  const benchmarkMetrics = benchmark.typicalMetrics;

  const userPrompt = `Analyze this resume for accomplishments and metrics:

RESUME:
${resumeText.substring(0, 4000)}

BENCHMARK ACCOMPLISHMENT TYPES TO LOOK FOR:
${accomplishmentTypes.join(', ')}

BENCHMARK METRICS EXPECTED:
${benchmarkMetrics.join('\n')}

Return JSON:
{
  "accomplishmentScore": 0-100,
  "hasMetrics": true/false,
  "foundMetrics": ["specific metrics found in resume"],
  "missingMetricTypes": ["types of metrics not found"],
  "accomplishmentAnalysis": [
    {"type": "shipped_product", "found": true, "evidence": "Launched mobile app..."}
  ],
  "summary": "Brief 1-2 sentence assessment"
}`;

  try {
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.FAST, // Use fast model for cost efficiency
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      },
      'score-vs-benchmark-accomplishments',
      userId
    );

    await logAIUsage(metrics);

    const content = response.choices?.[0]?.message?.content || '{}';
    const parseResult = extractJSON(content);

    if (!parseResult.success || !parseResult.data) {
      throw new Error('Failed to parse AI response');
    }

    const data = parseResult.data;

    return {
      score: data.accomplishmentScore || 50,
      userHasMetrics: data.hasMetrics ?? false,
      userMetrics: data.foundMetrics || [],
      benchmarkMetrics,
      missingMetrics: data.missingMetricTypes || [],
      accomplishmentTypes: data.accomplishmentAnalysis || accomplishmentTypes.map(t => ({ type: t, found: false })),
      summary: data.summary || 'Unable to fully analyze accomplishments',
      aiMetrics: metrics
    };

  } catch (error) {
    logger.error('AI accomplishment analysis failed', { error });

    // Fallback: basic metric detection
    const hasNumbers = /\d+%|\$\d+|\d+\s*(users|customers|million|k\b)/i.test(resumeText);
    const foundMetrics = resumeText.match(/\d+%|\$[\d,]+[KMB]?|\d+\s*(users|customers|team members)/gi) || [];

    return {
      score: hasNumbers ? 60 : 30,
      userHasMetrics: hasNumbers,
      userMetrics: foundMetrics.slice(0, 5),
      benchmarkMetrics,
      missingMetrics: hasNumbers ? [] : ['Quantified impact metrics'],
      accomplishmentTypes: accomplishmentTypes.map(t => ({ type: t, found: false })),
      summary: hasNumbers
        ? 'Some metrics detected, but full analysis unavailable'
        : 'No clear metrics detected - consider adding quantified achievements'
    };
  }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  const startTime = Date.now();
  let totalAIMetrics = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

  try {
    const { resumeText, benchmark, jobDescription } = await req.json();

    // Validation
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Resume text is required and must be at least 100 characters');
    }
    if (!benchmark || !benchmark.coreSkills) {
      throw new Error('Valid benchmark candidate is required');
    }

    logger.info('Scoring resume against benchmark', {
      resumeLength: resumeText.length,
      benchmarkRole: benchmark.roleTitle,
      skillsCount: benchmark.coreSkills.length
    });

    // Get user ID for cost tracking
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
      } catch (e) {
        logger.warn('Could not extract user for cost tracking');
      }
    }

    // 1. Extract years of experience
    const userYearsOfExperience = extractYearsOfExperience(resumeText);
    logger.debug('Extracted experience', { years: userYearsOfExperience });

    // 2. Match keywords against benchmark skills
    const keywordsResult = matchKeywords(resumeText, benchmark.coreSkills);
    logger.debug('Keywords matched', {
      matched: keywordsResult.matched.length,
      missing: keywordsResult.missing.length
    });

    // 3. Match experience level
    const experienceResult = matchExperience(
      userYearsOfExperience,
      benchmark.yearsOfExperience
    );
    logger.debug('Experience matched', { levelMatch: experienceResult.levelMatch });

    // 4. AI-powered accomplishment analysis
    const accomplishmentsResult = await analyzeAccomplishments(resumeText, benchmark, userId);
    if (accomplishmentsResult.aiMetrics) {
      totalAIMetrics.inputTokens += accomplishmentsResult.aiMetrics.input_tokens || 0;
      totalAIMetrics.outputTokens += accomplishmentsResult.aiMetrics.output_tokens || 0;
      totalAIMetrics.costUsd += accomplishmentsResult.aiMetrics.cost_usd || 0;
    }
    logger.debug('Accomplishments analyzed', { score: accomplishmentsResult.score });

    // 5. ATS compliance check
    const atsResult = checkATSCompliance(resumeText);
    logger.debug('ATS checked', { score: atsResult.score });

    // 6. Calculate weighted overall score
    const overallScore = Math.round(
      keywordsResult.score * SCORING_WEIGHTS.keywords +
      experienceResult.score * SCORING_WEIGHTS.experience +
      accomplishmentsResult.score * SCORING_WEIGHTS.accomplishments +
      atsResult.score * SCORING_WEIGHTS.atsCompliance
    );

    // 7. Generate strengths and gaps
    const strengths: string[] = [];
    const gaps: string[] = [];

    if (keywordsResult.score >= 70) {
      strengths.push(`Strong skill alignment (${keywordsResult.matched.length} of ${benchmark.coreSkills.length} skills matched)`);
    } else if (keywordsResult.score < 50) {
      gaps.push(`Skill gaps: missing ${keywordsResult.missingByPriority.filter(m => m.criticality === 'must-have').length} must-have skills`);
    }

    if (experienceResult.levelMatch === 'aligned') {
      strengths.push(`Experience level (${userYearsOfExperience} years) aligns with role requirements`);
    } else if (experienceResult.levelMatch === 'below') {
      gaps.push(...experienceResult.gaps);
    }

    if (accomplishmentsResult.userHasMetrics) {
      strengths.push('Resume includes quantified achievements');
    } else {
      gaps.push('Add metrics to quantify your impact (e.g., percentages, dollar amounts, user counts)');
    }

    if (atsResult.score >= 80) {
      strengths.push('Resume structure is ATS-friendly');
    } else {
      gaps.push(...atsResult.issues.slice(0, 2));
    }

    // Generate score explanation
    const scoreExplanation = overallScore >= 80
      ? `Strong match for ${benchmark.roleTitle} role. Your resume aligns well with the benchmark in most areas.`
      : overallScore >= 60
        ? `Moderate match for ${benchmark.roleTitle} role. Some improvements would strengthen your candidacy.`
        : `Below target for ${benchmark.roleTitle} role. Focus on the identified gaps to improve your match.`;

    // Build final result
    const result: MatchScoreBreakdown = {
      overallScore,
      scoreExplanation,
      categories: {
        keywords: {
          score: keywordsResult.score,
          matched: keywordsResult.matched,
          missing: keywordsResult.missing,
          missingByPriority: keywordsResult.missingByPriority,
          summary: keywordsResult.summary
        },
        experience: {
          score: experienceResult.score,
          userYearsOfExperience,
          benchmarkYearsOfExperience: benchmark.yearsOfExperience,
          levelMatch: experienceResult.levelMatch,
          gaps: experienceResult.gaps,
          summary: experienceResult.summary
        },
        accomplishments: {
          score: accomplishmentsResult.score,
          userHasMetrics: accomplishmentsResult.userHasMetrics,
          userMetrics: accomplishmentsResult.userMetrics,
          benchmarkMetrics: accomplishmentsResult.benchmarkMetrics,
          missingMetrics: accomplishmentsResult.missingMetrics,
          accomplishmentTypes: accomplishmentsResult.accomplishmentTypes,
          summary: accomplishmentsResult.summary
        },
        atsCompliance: {
          score: atsResult.score,
          issues: atsResult.issues,
          warnings: atsResult.warnings,
          sectionsFound: atsResult.sectionsFound,
          sectionsMissing: atsResult.sectionsMissing,
          summary: atsResult.summary
        }
      },
      strengths,
      gaps,
      weights: SCORING_WEIGHTS
    };

    const executionTimeMs = Date.now() - startTime;

    logger.info('Scoring complete', {
      overallScore,
      executionTimeMs,
      keywordsScore: keywordsResult.score,
      experienceScore: experienceResult.score,
      accomplishmentsScore: accomplishmentsResult.score,
      atsScore: atsResult.score
    });

    return new Response(
      JSON.stringify({
        success: true,
        score: result,
        metrics: {
          inputTokens: totalAIMetrics.inputTokens,
          outputTokens: totalAIMetrics.outputTokens,
          costUsd: totalAIMetrics.costUsd,
          executionTimeMs
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Error in score-vs-benchmark', { error: error.message, stack: error.stack });

    return new Response(
      JSON.stringify({
        success: false,
        score: null,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: error.message?.includes('required') ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
