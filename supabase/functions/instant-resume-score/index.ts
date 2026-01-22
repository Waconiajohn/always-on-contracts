import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

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
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(requestOrigin);
  }

  try {
    const startTime = Date.now();

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[instant-resume-score] No auth header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth token to validate
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claims?.claims?.sub) {
      console.log('[instant-resume-score] Invalid token:', claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.claims.sub as string;
    console.log('[instant-resume-score] Authenticated user:', userId);

    // Rate limiting check (10 requests per minute)
    const rateCheck = await checkRateLimit(userId, 'instant-resume-score', 10);
    if (!rateCheck.allowed) {
      console.log('[instant-resume-score] Rate limit exceeded for user:', userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please wait before trying again.',
          retryAfter: rateCheck.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter || 60)
          } 
        }
      );
    }

    const { resumeText, jobDescription, targetRole, targetIndustry, targetLevel } = await req.json();

    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    // Use service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // STEP 2: Comprehensive structured gap analysis with keyword frequency
    const systemPrompt = `You are an expert resume analyst. Analyze the resume against the job description and return ONLY valid JSON.

IMPORTANT: Keep your response concise. Limit arrays to 8 items max for keywords, 5 for others.

Return this EXACT JSON structure:
{
  "scores": {
    "jdMatch": { "score": 0-100, "weight": 60 },
    "industryBenchmark": { "score": 0-100, "weight": 20 },
    "atsCompliance": { "score": 0-100, "weight": 12 },
    "humanVoice": { "score": 0-100, "weight": 8 }
  },
  "breakdown": {
    "jdMatch": {
      "matchedKeywords": [{"keyword": "string", "priority": "critical|high|medium", "frequency": 1}],
      "missingKeywords": [{"keyword": "string", "priority": "critical|high|medium", "frequency": 1, "prevalence": "string"}],
      "skillsMatch": 0-100,
      "experienceMatch": 0-100
    },
    "industryBenchmark": {
      "roleStandards": ["string"],
      "meetingStandards": ["string"],
      "belowStandards": ["string"],
      "competitiveRank": "string"
    },
    "atsCompliance": {
      "headerIssues": ["string"],
      "formatIssues": ["string"],
      "keywordPlacement": "good|poor|unknown"
    },
    "humanVoice": {
      "aiProbability": 0-100,
      "concerns": ["string"],
      "humanElements": ["string"]
    }
  },
  "gapAnalysis": {
    "fullMatches": [{"requirement": "string", "evidence": "string"}],
    "partialMatches": [{"requirement": "string", "currentStatus": "string", "recommendation": "string"}],
    "missingRequirements": [{"requirement": "string", "workaround": "string"}],
    "overqualifications": [{"experience": "string", "recommendation": "string"}],
    "irrelevantContent": [{"content": "string", "recommendation": "string"}],
    "gapSummary": ["string"]
  },
  "quickWins": ["string"]
}

KEYWORD FREQUENCY: Count how many times each keyword appears in the job description. Include "frequency" field for each keyword.
Keep arrays SHORT (max 8 items for keywords, 5 for others). Be concise.`;

    const userPrompt = `ROLE: ${detectedRole} | INDUSTRY: ${detectedIndustry} | LEVEL: ${detectedLevel}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}

RESUME:
${resumeText.substring(0, 4000)}

Analyze and return JSON. Keep arrays to 5 items max.`;

    const { response, metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    }, 'instant-resume-score');

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    
    // Use robust extractJSON utility to handle markdown fences and other formatting
    const parseResult = extractJSON(rawContent);
    if (!parseResult.success || !parseResult.data) {
      console.error('Failed to parse score data:', rawContent.substring(0, 500));
      console.error('Parse error:', parseResult.error);
      throw new Error('Failed to parse scoring response');
    }
    
    const scoreData = parseResult.data;
    console.log('[instant-resume-score] Parsing successful');

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

    // Ensure gapAnalysis has all required fields with defaults
    const gapAnalysis = {
      fullMatches: scoreData.gapAnalysis?.fullMatches || [],
      partialMatches: scoreData.gapAnalysis?.partialMatches || [],
      missingRequirements: scoreData.gapAnalysis?.missingRequirements || [],
      overqualifications: scoreData.gapAnalysis?.overqualifications || [],
      irrelevantContent: scoreData.gapAnalysis?.irrelevantContent || [],
      gapSummary: scoreData.gapAnalysis?.gapSummary || []
    };

    // Ensure breakdown has all required fields with defaults
    const breakdown = {
      jdMatch: {
        matchedKeywords: scoreData.breakdown?.jdMatch?.matchedKeywords || [],
        missingKeywords: scoreData.breakdown?.jdMatch?.missingKeywords || [],
        skillsMatch: scoreData.breakdown?.jdMatch?.skillsMatch || 0,
        experienceMatch: scoreData.breakdown?.jdMatch?.experienceMatch || 0
      },
      industryBenchmark: {
        roleStandards: scoreData.breakdown?.industryBenchmark?.roleStandards || [],
        meetingStandards: scoreData.breakdown?.industryBenchmark?.meetingStandards || [],
        belowStandards: scoreData.breakdown?.industryBenchmark?.belowStandards || [],
        competitiveRank: scoreData.breakdown?.industryBenchmark?.competitiveRank || 'Unknown'
      },
      atsCompliance: {
        headerIssues: scoreData.breakdown?.atsCompliance?.headerIssues || [],
        formatIssues: scoreData.breakdown?.atsCompliance?.formatIssues || [],
        keywordPlacement: scoreData.breakdown?.atsCompliance?.keywordPlacement || 'unknown'
      },
      humanVoice: {
        aiProbability: scoreData.breakdown?.humanVoice?.aiProbability || 0,
        concerns: scoreData.breakdown?.humanVoice?.concerns || [],
        humanElements: scoreData.breakdown?.humanVoice?.humanElements || []
      }
    };

    // Generate priorityFixes from gapAnalysis for backward compatibility
    const priorityFixes: any[] = [];
    let priority = 1;
    
    // Add ALL missing requirements as critical fixes
    for (const item of gapAnalysis.missingRequirements) {
      priorityFixes.push({
        priority: priority++,
        category: 'jdMatch',
        gapType: 'missing_requirement',
        issue: item.requirement,
        fix: item.workaround,
        impact: '+15 points'
      });
    }
    
    // Add ALL partial matches as important fixes
    for (const item of gapAnalysis.partialMatches) {
      priorityFixes.push({
        priority: priority++,
        category: 'jdMatch',
        gapType: 'partial_match',
        issue: item.currentStatus,
        fix: item.recommendation,
        impact: '+10 points'
      });
    }

    const result = {
      success: true,
      overallScore,
      tier,
      nextTierThreshold,
      pointsToNextTier,
      scores: scoreData.scores,
      breakdown,
      gapAnalysis,
      priorityFixes,
      quickWins: scoreData.quickWins || [],
      detected: {
        role: detectedRole,
        industry: detectedIndustry,
        level: detectedLevel
      },
      executionTimeMs: executionTime,
      analyzedAt: new Date().toISOString()
    };

    console.log('[instant-resume-score] Analysis complete:', {
      score: overallScore,
      tier: tier.tier,
      fullMatches: gapAnalysis.fullMatches.length,
      partialMatches: gapAnalysis.partialMatches.length,
      missing: gapAnalysis.missingRequirements.length
    });

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
