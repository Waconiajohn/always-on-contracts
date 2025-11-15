// =====================================================
// SUGGEST CAREER PATHS - Career Vault 2.0
// =====================================================
// AI-POWERED CAREER INTELLIGENCE
//
// This function uses advanced AI to suggest career paths based on:
// - Your actual experience and skills
// - Market demand and trends
// - Transferability of your background
// - Industry growth patterns
//
// UNIQUE VALUE: Unlike job boards that just match keywords,
// we identify opportunities you might never have considered.
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface CareerPathRequest {
  resumeAnalysis: {
    detectedRole: string;
    detectedIndustry: string;
    yearsExperience: number;
    seniorityLevel: string;
    keyAchievements: string[];
  };
  careerDirection: 'stay' | 'pivot' | 'explore';
  currentRole: string;
  currentIndustry: string;
}

interface SuggestedRole {
  title: string;
  reasoning: string;
  matchScore: number; // 0-1
  matchBreakdown?: {
    technicalSkills: number; // 0-1
    leadership: number; // 0-1
    industryAlignment: number; // 0-1
  };
  resumeEvidence?: string[]; // Quotes from resume that support this match
  skillsAlignment: string[];
  skillsGap: string[];
  marketDemand: 'high' | 'medium' | 'low';
  salaryPotential: string;
}

interface SuggestedIndustry {
  industry: string;
  reasoning: string;
  transferability: number; // 0-1
  growthTrend: 'growing' | 'stable' | 'declining';
  whyYouMatch: string;
}

interface CareerPathResponse {
  suggestedRoles: SuggestedRole[];
  suggestedIndustries: SuggestedIndustry[];
  marketInsights: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      resumeAnalysis,
      careerDirection,
      currentRole,
      currentIndustry,
    }: CareerPathRequest = await req.json();

    console.log('🚀 Generating career path suggestions:', {
      direction: careerDirection,
      currentRole,
      seniority: resumeAnalysis.seniorityLevel,
    });

    // Build context-aware prompt based on career direction
    let systemPrompt = '';
    let userPrompt = '';

    if (careerDirection === 'stay') {
      systemPrompt = `You are an elite executive career strategist specializing in SAME-FIELD ADVANCEMENT.

Your task: Suggest roles that represent natural progression within the same industry/function.

FOCUS ON:
- Next-level roles (promotions)
- Lateral moves to stronger companies
- Specialist → Generalist or vice versa
- Individual contributor → Leadership or vice versa

Return 5-8 role suggestions ranked by fit.`;

      userPrompt = `Current: ${currentRole} in ${currentIndustry}
Seniority: ${resumeAnalysis.seniorityLevel}
Experience: ${resumeAnalysis.yearsExperience} years
Key Achievements: ${resumeAnalysis.keyAchievements.slice(0, 3).join('; ')}

Suggest career advancement opportunities within this field.`;

    } else if (careerDirection === 'pivot') {
      systemPrompt = `You are an elite executive career strategist specializing in CAREER TRANSITIONS.

Your task: Identify adjacent roles/industries where skills are HIGHLY TRANSFERABLE.

FOCUS ON:
- Cross-industry moves (e.g., Finance → FinTech)
- Cross-functional pivots (e.g., Engineering → Product)
- Emerging fields where experience is valuable
- Underrated opportunities with high demand

BE CREATIVE but REALISTIC. Don't suggest impossible pivots.

Return 6-10 suggestions: mix of roles and industries.`;

      userPrompt = `Current: ${currentRole} in ${currentIndustry}
Seniority: ${resumeAnalysis.seniorityLevel}
Experience: ${resumeAnalysis.yearsExperience} years
Key Skills/Achievements: ${resumeAnalysis.keyAchievements.slice(0, 5).join('; ')}

Suggest realistic career pivot opportunities. What adjacent fields or roles leverage their background?`;

    } else { // explore
      systemPrompt = `You are an elite executive career strategist specializing in CAREER EXPLORATION.

Your task: Present a DIVERSE portfolio of options across multiple paths.

INCLUDE:
- Advancement in current field (2-3 options)
- Adjacent pivots (3-4 options)
- Bold career changes (2-3 options)
- Entrepreneurial/consultant paths (1-2 options)

Return 8-12 suggestions that span the opportunity landscape.`;

      userPrompt = `Current: ${currentRole} in ${currentIndustry}
Seniority: ${resumeAnalysis.seniorityLevel}
Experience: ${resumeAnalysis.yearsExperience} years
Background: ${resumeAnalysis.keyAchievements.slice(0, 5).join('; ')}

Suggest a DIVERSE range of career options. Show them possibilities they might not have considered.`;
    }

    // Call Perplexity AI
    const { response: aiData, metrics: aiMetrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

RETURN VALID JSON ONLY:
{
  "suggestedRoles": [
    {
      "title": "VP of Engineering",
      "reasoning": "Natural progression from Director role with strong technical leadership",
      "matchScore": 0.95,
      "matchBreakdown": {
        "technicalSkills": 0.98,
        "leadership": 0.95,
        "industryAlignment": 0.92
      },
      "resumeEvidence": [
        "$350M budget management demonstrates executive-level financial responsibility",
        "Led team across 3-4 rigs shows multi-site leadership capability",
        "20% BHA failure reduction proves operational excellence"
      ],
      "skillsAlignment": ["Technical leadership", "Team scaling", "Architecture"],
      "skillsGap": ["Board-level communication", "P&L management"],
      "marketDemand": "high",
      "salaryPotential": "$200-300K"
    }
  ],
  "suggestedIndustries": [
    {
      "industry": "FinTech",
      "reasoning": "Financial services background + tech skills = high demand",
      "transferability": 0.9,
      "growthTrend": "growing",
      "whyYouMatch": "Regulatory expertise and technical depth are rare combination"
    }
  ],
  "marketInsights": "2-3 sentence summary of current market trends relevant to this person"
}

CRITICAL: For each role, EXTRACT 2-3 SPECIFIC QUOTES from the user's achievements that prove the match. Use exact phrases or numbers from their background.

NO MARKDOWN. ONLY JSON.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'high',
          requiresReasoning: true
        }),
        temperature: 0.7,
        max_tokens: 3000,
      },
      'suggest-career-paths',
      user.id
    );

    await logAIUsage(aiMetrics);

    const aiContent = cleanCitations(aiData.choices[0].message.content);

    let suggestions: CareerPathResponse;
    try {
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid format');
    }

    console.log('✅ Career paths generated:', {
      roles: suggestions.suggestedRoles.length,
      industries: suggestions.suggestedIndustries.length,
    });

    // Return with marketing messaging
    return new Response(
      JSON.stringify({
        success: true,
        data: suggestions,
        meta: {
          message: `🎯 AI-Powered Career Intelligence: We've analyzed ${suggestions.suggestedRoles.length} role opportunities and ${suggestions.suggestedIndustries.length} industry paths tailored to your background.`,
          uniqueValue: 'Unlike generic job boards, our AI identifies opportunities based on deep analysis of your transferable skills and market demand—not just keyword matching.',
          confidenceNote: `Match scores indicate how well your background aligns. Scores above 0.8 are excellent fits; above 0.6 are worth exploring.`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in suggest-career-paths:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'We encountered an issue generating career suggestions. Please try again.',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
