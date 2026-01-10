import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // STEP 2: Comprehensive structured gap analysis
    const systemPrompt = `You are an expert resume analyst. Your task is to perform a STRUCTURED COMPARISON between a resume and job description.

CRITICAL: Analyze BOTH documents thoroughly and produce a detailed comparison in the exact format below.

Return ONLY valid JSON with this EXACT structure:
{
  "scores": {
    "jdMatch": { "score": 0-100, "weight": 60 },
    "industryBenchmark": { "score": 0-100, "weight": 20 },
    "atsCompliance": { "score": 0-100, "weight": 12 },
    "humanVoice": { "score": 0-100, "weight": 8 }
  },
  "breakdown": {
    "jdMatch": {
      "matchedKeywords": [{ "keyword": "Python", "priority": "critical" }],
      "missingKeywords": [{ "keyword": "AWS", "priority": "critical", "prevalence": "87% of jobs" }],
      "skillsMatch": 75,
      "experienceMatch": 80
    },
    "industryBenchmark": {
      "roleStandards": ["Standard 1"],
      "meetingStandards": ["What they meet"],
      "belowStandards": ["What they're missing"],
      "competitiveRank": "Top 30%"
    },
    "atsCompliance": {
      "headerIssues": ["Issue 1"],
      "formatIssues": ["Issue 1"],
      "keywordPlacement": "good"
    },
    "humanVoice": {
      "aiProbability": 25,
      "concerns": ["Concern 1"],
      "humanElements": ["Element 1"]
    }
  },
  "gapAnalysis": {
    "fullMatches": [
      {
        "requirement": "8+ years in product management",
        "evidence": "15+ years in product leadership across SaaS, RegTech, AI/ML"
      }
    ],
    "partialMatches": [
      {
        "requirement": "LLMs, RAG, vector DBs",
        "currentStatus": "AI/ML mentioned broadly, no technical depth",
        "recommendation": "Add specific technical terms from JD"
      }
    ],
    "missingRequirements": [
      {
        "requirement": "STEM degree",
        "workaround": "Address with technical certifications or emphasize technical skills"
      }
    ],
    "overqualifications": [
      {
        "experience": "VP and Director experience (15+ years)",
        "recommendation": "Emphasize as strategic asset"
      }
    ],
    "irrelevantContent": [
      {
        "content": "Early career marketing roles",
        "recommendation": "Compress or reframe"
      }
    ],
    "gapSummary": [
      "AI architecture detail",
      "STEM education"
    ]
  },
  "quickWins": [
    "Add specific AI/ML technical terms",
    "Quantify team sizes"
  ]
}

ANALYSIS GUIDELINES:
1. fullMatches: Requirements from JD that resume CLEARLY demonstrates with evidence
2. partialMatches: Resume shows related experience but needs enhancement
3. missingRequirements: JD requirements not present - provide workaround strategies
4. overqualifications: Experience exceeding requirements - frame as value-add
5. irrelevantContent: Resume content not relevant - suggest compression
6. gapSummary: 3-6 bullet points summarizing key gaps
7. quickWins: 2-4 easy changes that can be made immediately`;

    const userPrompt = `ROLE: ${detectedRole}
INDUSTRY: ${detectedIndustry}
LEVEL: ${detectedLevel}

=== JOB DESCRIPTION ===
${jobDescription}

=== RESUME ===
${resumeText}

Analyze comprehensively and provide structured comparison.`;

    const { response, metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.2,
      max_tokens: 8000, // Increased from 4000 to prevent truncation
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
    // Now returns ALL fixes, not just top 5
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
      // Return ALL priorityFixes and quickWins for comprehensive display
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
