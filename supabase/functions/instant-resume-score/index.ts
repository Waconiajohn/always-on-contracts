import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Instant Resume Score - The Quick Win Orchestrator
 * 
 * Combines multiple scoring dimensions into one fast response:
 * 1. JD Match Score (60% weight) - PRIMARY DRIVER
 * 2. Industry Benchmark Score (20% weight)
 * 3. ATS Compliance Score (12% weight)
 * 4. AI Detection Risk (8% weight)
 * 
 * Returns thermometer tier and actionable recommendations.
 */

interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

function getScoreTier(score: number): ScoreTier {
  if (score <= 20) return { tier: 'FREEZING', emoji: '🥶', color: '#1E40AF', message: 'Major gaps - needs significant work' };
  if (score <= 40) return { tier: 'COLD', emoji: '❄️', color: '#3B82F6', message: 'Many missing keywords and gaps' };
  if (score <= 60) return { tier: 'LUKEWARM', emoji: '😐', color: '#F59E0B', message: 'Getting there, but improvements needed' };
  if (score <= 75) return { tier: 'WARM', emoji: '🔥', color: '#F97316', message: 'Good match, minor optimizations left' };
  if (score <= 90) return { tier: 'HOT', emoji: '🌟', color: '#EF4444', message: 'Strong match - ready to apply!' };
  return { tier: 'ON_FIRE', emoji: '🚀', color: '#DC2626', message: 'Exceptional match - top candidate!' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { resumeText, jobDescription, targetRole, targetIndustry, targetLevel } = await req.json();

    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 1: Detect role and industry if not provided
    let detectedRole = targetRole;
    let detectedIndustry = targetIndustry;
    let detectedLevel = targetLevel;

    if (!detectedRole || !detectedIndustry) {
      const roleDetectionPrompt = `Analyze this job description and resume to detect:
1. Target job title/role
2. Industry
3. Seniority level (Entry-Level, Mid-Level, Senior, Executive)

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

RESUME (first 1000 chars):
${resumeText.substring(0, 1000)}

Return JSON: { "role": "...", "industry": "...", "level": "..." }`;

      const { response: roleResponse } = await callLovableAI({
        messages: [
          { role: 'system', content: 'Return only valid JSON, no explanation.' },
          { role: 'user', content: roleDetectionPrompt }
        ],
        model: LOVABLE_AI_MODELS.FAST,
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      }, 'instant-resume-score-detect');

      try {
        const detected = JSON.parse(roleResponse.choices[0].message.content);
        detectedRole = detected.role || 'Professional';
        detectedIndustry = detected.industry || 'General';
        detectedLevel = detected.level || 'Mid-Level';
      } catch {
        detectedRole = 'Professional';
        detectedIndustry = 'General';
        detectedLevel = 'Mid-Level';
      }
    }

    // STEP 2: Comprehensive scoring analysis
    const systemPrompt = `You are an expert resume analyst combining ATS expertise, hiring manager perspective, and industry knowledge.

Perform a comprehensive 4-dimensional analysis WITH GAP CLASSIFICATION:

1. JD MATCH (60% weight): How well does the resume match THIS specific job description?
   - Keyword coverage (critical, important, nice-to-have)
   - Skills alignment
   - Experience relevance
   - CLASSIFY GAPS by type and severity

2. INDUSTRY BENCHMARK (20% weight): How does this resume compare to industry standards for ${detectedRole} at ${detectedLevel} level?
   - Typical requirements for this role/level
   - Missing critical industry-standard skills
   - Competitive positioning

3. ATS COMPLIANCE (12% weight): Will this pass Applicant Tracking Systems?
   - Section headers (standard vs non-standard)
   - Format issues (tables, graphics, columns)
   - Keyword placement optimization

4. AI DETECTION RISK (8% weight): Does this sound human-written?
   - Sentence variety
   - Specific vs generic language
   - Natural flow vs robotic patterns

GAP TYPES TO CLASSIFY:
- missing_skill_or_tool: Required skill not mentioned
- weak_achievement_story: Bullets lack metrics/impact
- missing_metrics_or_scope: Need quantification
- missing_domain_experience: Industry background gap
- unclear_level_or_seniority: Level not evident
- positioning_issue: Right experience, wrong framing

Return ONLY valid JSON with this structure:
{
  "scores": {
    "jdMatch": { "score": 0-100, "weight": 60 },
    "industryBenchmark": { "score": 0-100, "weight": 20 },
    "atsCompliance": { "score": 0-100, "weight": 12 },
    "humanVoice": { "score": 0-100, "weight": 8 }
  },
  "overallScore": 0-100,
  "breakdown": {
    "jdMatch": {
      "matchedKeywords": [{ "keyword": "...", "priority": "critical|important|nice_to_have" }],
      "missingKeywords": [{ "keyword": "...", "priority": "critical|important|nice_to_have", "prevalence": "87% of jobs" }],
      "skillsMatch": 0-100,
      "experienceMatch": 0-100
    },
    "industryBenchmark": {
      "roleStandards": ["Standard 1", "Standard 2"],
      "meetingStandards": ["What they meet"],
      "belowStandards": ["What they're missing"],
      "competitiveRank": "Top X%"
    },
    "atsCompliance": {
      "headerIssues": ["Issue 1"],
      "formatIssues": ["Issue 1"],
      "keywordPlacement": "good|needs_work|poor"
    },
    "humanVoice": {
      "aiProbability": 0-100,
      "concerns": ["Concern 1"],
      "humanElements": ["Element 1"]
    }
  },
  "gaps": [
    {
      "gapType": "missing_skill_or_tool",
      "severity": "critical|important|nice-to-have",
      "requirement": "Python expertise",
      "currentState": "No Python mentioned",
      "impactOnScore": 15
    }
  ],
  "priorityFixes": [
    {
      "priority": 1,
      "category": "jdMatch|industryBenchmark|atsCompliance|humanVoice",
      "gapType": "missing_skill_or_tool",
      "issue": "What's wrong",
      "fix": "How to fix it",
      "impact": "+X points"
    }
  ],
  "quickWins": ["Easy fix 1", "Easy fix 2", "Easy fix 3"]
}`;

    const userPrompt = `ROLE: ${detectedRole}
INDUSTRY: ${detectedIndustry}
LEVEL: ${detectedLevel}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Analyze comprehensively across all 4 dimensions.`;

    const { response, metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    }, 'instant-resume-score');

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    let scoreData;
    
    try {
      const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scoreData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse score data:', rawContent);
      throw new Error('Failed to parse scoring response');
    }

    // Calculate weighted overall score (60/20/12/8)
    const weightedScore = 
      (scoreData.scores.jdMatch.score * 0.60) +
      (scoreData.scores.industryBenchmark.score * 0.20) +
      (scoreData.scores.atsCompliance.score * 0.12) +
      (scoreData.scores.humanVoice.score * 0.08);

    const overallScore = Math.round(weightedScore);
    const tier = getScoreTier(overallScore);

    // Calculate next tier threshold
    let nextTierThreshold = 100;
    let pointsToNextTier = 0;
    if (overallScore <= 20) { nextTierThreshold = 21; pointsToNextTier = 21 - overallScore; }
    else if (overallScore <= 40) { nextTierThreshold = 41; pointsToNextTier = 41 - overallScore; }
    else if (overallScore <= 60) { nextTierThreshold = 61; pointsToNextTier = 61 - overallScore; }
    else if (overallScore <= 75) { nextTierThreshold = 76; pointsToNextTier = 76 - overallScore; }
    else if (overallScore <= 90) { nextTierThreshold = 91; pointsToNextTier = 91 - overallScore; }

    const executionTime = Date.now() - startTime;

    const result = {
      success: true,
      overallScore,
      tier,
      nextTierThreshold,
      pointsToNextTier,
      scores: scoreData.scores,
      breakdown: scoreData.breakdown,
      priorityFixes: scoreData.priorityFixes?.slice(0, 5) || [],
      quickWins: scoreData.quickWins?.slice(0, 3) || [],
      detected: {
        role: detectedRole,
        industry: detectedIndustry,
        level: detectedLevel
      },
      executionTimeMs: executionTime,
      analyzedAt: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in instant-resume-score:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
