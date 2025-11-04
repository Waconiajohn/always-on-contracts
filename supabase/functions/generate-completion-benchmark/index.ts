// =====================================================
// GENERATE COMPLETION BENCHMARK - Career Vault 2.0
// =====================================================
// COMPETITIVE POSITIONING ANALYSIS WITH DEEP REASONING
//
// Uses Perplexity's sonar-reasoning-pro model for deep
// career analysis and personalized gap identification.
//
// FEATURES:
// - Career-level-appropriate gap detection
// - Intelligent caching (user-controlled regeneration)
// - 300 second timeout for deep thinking
// - Hyper-personalized recommendations
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { analyzeCareerContext, getCareerLevelGuidance, type CareerContext } from '../_shared/career-context-analyzer.ts';

interface BenchmarkRequest {
  vaultId: string;
  targetRoles: string[];
  targetIndustries: string[];
  forceRegenerate?: boolean;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      vaultId,
      targetRoles,
      targetIndustries,
      forceRegenerate = false,
    }: BenchmarkRequest = await req.json();

    console.log('📊 GENERATING COMPLETION BENCHMARK:', {
      vaultId,
      targetRoles,
      targetIndustries,
      forceRegenerate,
      userId: user.id,
    });

    // ===== STEP 1: CHECK CACHE (unless forced regeneration) =====
    if (!forceRegenerate) {
      const { data: cached } = await supabase
        .from('vault_gap_analysis')
        .select('*')
        .eq('vault_id', vaultId)
        .eq('analysis_type', 'completion_benchmark')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        console.log('✅ RETURNING CACHED BENCHMARK (no cost)');

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              percentileRanking: {
                percentile: cached.percentile_ranking,
                ranking: `top ${cached.percentile_ranking}%`,
                comparisonStatement: `You rank higher than ${100 - cached.percentile_ranking}% of professionals`
              },
              strengths: cached.strengths,
              opportunities: cached.opportunities,
              gaps: cached.identified_gaps,
              recommendations: cached.recommendations,
              competitiveInsights: cached.competitive_insights,
            },
            meta: {
              cached: true,
              cachedAt: cached.created_at,
              message: 'Loaded from cache - click "Regenerate Analysis" for fresh insights'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('⚡ Generating fresh analysis with deep reasoning model...');

    // ===== STEP 2: FETCH VAULT DATA =====
    const { data: vaultStats } = await supabase
      .rpc('get_vault_statistics', { p_vault_id: vaultId });

    if (!vaultStats) {
      throw new Error('Could not fetch vault statistics');
    }

    // Fetch industry research for benchmarks
    const { data: industryResearch } = await supabase
      .from('vault_industry_research')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })
      .limit(1);

    const benchmarks = industryResearch?.[0]?.results || {};

    // Fetch actual vault items for detailed analysis
    const [powerPhrases, skills, competencies, softSkills, leadershipPhilosophy, executivePresence] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId),
    ]);

    // ===== STEP 3: ANALYZE CAREER CONTEXT =====
    const careerContext: CareerContext = analyzeCareerContext({
      powerPhrases: powerPhrases.data || [],
      skills: skills.data || [],
      competencies: competencies.data || [],
      softSkills: softSkills.data || [],
      leadership: leadershipPhilosophy.data || [],
      executivePresence: executivePresence.data || [],
      certifications: [],
    });

    console.log('📊 CAREER CONTEXT DETECTED:', {
      seniority: careerContext.inferredSeniority,
      confidence: careerContext.seniorityConfidence,
      years: careerContext.yearsOfExperience,
      nextRole: careerContext.nextLikelyRole,
      archetype: careerContext.careerArchetype,
      management: careerContext.hasManagementExperience,
      executive: careerContext.hasExecutiveExposure,
    });

    // ===== STEP 4: BUILD EXPERT-LEVEL AI PROMPT =====
    const benchmarkPrompt = `You are an elite executive career strategist and talent assessor with 20+ years of experience evaluating senior leadership candidates at Fortune 500 companies and high-growth startups.

<TASK>
Perform a hyper-personalized, career-level-appropriate competitive positioning analysis for this professional's Career Vault. Your analysis will directly impact their career trajectory for the next 2-5 years.
</TASK>

<CONTEXT>
TARGET ROLES: ${targetRoles.join(', ')}
TARGET INDUSTRIES: ${targetIndustries.join(', ')}

CAREER PROFILE (AI-INFERRED FROM VAULT CONTENT):
├─ Seniority Level: ${careerContext.inferredSeniority} (${careerContext.seniorityConfidence}% confidence)
├─ Years of Experience: ${careerContext.yearsOfExperience}
├─ Management Experience: ${careerContext.hasManagementExperience ? `Yes (managed teams of ${careerContext.teamSizesManaged.join(', ')})` : 'No (Individual Contributor)'}
├─ Executive Exposure: ${careerContext.hasExecutiveExposure ? 'Yes (worked with C-suite/board)' : 'No'}
├─ Budget Ownership: ${careerContext.hasBudgetOwnership ? `Yes ($${careerContext.budgetSizesManaged.map(b => (b/1000000).toFixed(1)).join(', ')}M)` : 'No'}
├─ Company Types: ${careerContext.companySizes.join(', ')}
├─ Technical Depth: ${careerContext.technicalDepth}/100
├─ Leadership Depth: ${careerContext.leadershipDepth}/100
├─ Strategic Depth: ${careerContext.strategicDepth}/100
├─ Impact Scale: ${careerContext.impactScale}
├─ Career Archetype: ${careerContext.careerArchetype}
└─ Next Likely Role: ${careerContext.nextLikelyRole}

PRIMARY RESPONSIBILITIES (from their actual achievements):
${careerContext.primaryResponsibilities.map((r, i) => `${i + 1}. ${r}`).join('\n')}

VAULT CONTENTS ANALYSIS:
├─ Power Phrases: ${powerPhrases.data?.length || 0} quantified achievements
├─ Transferable Skills: ${skills.data?.length || 0} documented skills
├─ Hidden Competencies: ${competencies.data?.length || 0} deep capabilities
├─ Soft Skills: ${softSkills.data?.length || 0} interpersonal strengths
├─ Leadership Philosophy: ${leadershipPhilosophy.data?.length || 0} leadership insights
└─ Executive Presence: ${executivePresence.data?.length || 0} strategic indicators

SAMPLE ACHIEVEMENTS (their actual work):
${powerPhrases.data?.slice(0, 10).map((pp: any, i: number) => `${i + 1}. ${pp.power_phrase}`).join('\n') || 'None documented yet'}

SAMPLE SKILLS (their actual capabilities):
${skills.data?.slice(0, 15).map((s: any) => `- ${s.stated_skill}`).join('\n') || 'None documented yet'}

INDUSTRY BENCHMARKS FOR ${targetRoles[0]} IN ${targetIndustries[0]}:
├─ Must-Have Skills: ${benchmarks.mustHaveSkills?.slice(0, 15).join(', ') || 'N/A'}
├─ Preferred Skills: ${benchmarks.preferredSkills?.slice(0, 10).join(', ') || 'N/A'}
├─ Leadership Competencies: ${benchmarks.executiveCompetencies?.slice(0, 8).join(', ') || 'N/A'}
└─ Expected Experience Level: ${benchmarks.seniorityExpectations || 'N/A'}
</CONTEXT>

<ANALYSIS_FRAMEWORK>

**CRITICAL RULE #1: CAREER-LEVEL APPROPRIATE GAPS**
You MUST tailor gaps to their current seniority level (${careerContext.inferredSeniority}) and next career step (${careerContext.nextLikelyRole}):

${getCareerLevelGuidance(careerContext.inferredSeniority)}

**CRITICAL RULE #2: ACHIEVABLE & HIGH-IMPACT**
Only suggest gaps they can REALISTICALLY fill in 3-6 months that will SIGNIFICANTLY impact their competitiveness for ${careerContext.nextLikelyRole}.

**CRITICAL RULE #3: EVIDENCE-BASED**
Base ALL assessments on actual vault content, not assumptions. If they have 45 power phrases, don't say they need more - focus on QUALITY gaps or MISSING CATEGORIES.

**CRITICAL RULE #4: INDUSTRY-SPECIFIC**
For ${targetIndustries[0]}, prioritize domain-relevant gaps over generic advice.

**CRITICAL RULE #5: PRIORITIZATION**
- "Critical" priority = Must-have for ${careerContext.nextLikelyRole}, fixable in < 1 hour
- "High" priority = Strongly recommended, fixable in 1-4 hours
- "Medium" priority = Nice-to-have, may take 1+ weeks

</ANALYSIS_FRAMEWORK>

<REASONING_PROCESS>
Before generating your analysis, think step-by-step:

1. **Percentile Calculation**:
   - Vault Strength: ${vaultStats.vaultStrength}%
   - Quality Distribution: ${JSON.stringify(vaultStats.qualityBreakdown)}
   - For ${careerContext.inferredSeniority} with ${careerContext.yearsOfExperience} YOE, what percentile does this represent?

2. **Strengths Identification**:
   - What does this person do EXCEPTIONALLY WELL vs peers at ${careerContext.inferredSeniority} level?
   - Look for: achievement count, quantification quality, skill breadth, leadership depth
   - Be SPECIFIC with numbers: "45 power phrases with metrics" not "good documentation"

3. **Gap Analysis**:
   - What is MISSING or WEAK that matters for ${careerContext.nextLikelyRole}?
   - What do TOP PERFORMERS at this level have that they don't?
   - Is this gap FIXABLE in 3-6 months?
   - Focus on 3-5 HIGH-IMPACT gaps, not 10 minor ones

4. **Recommendations**:
   - What are the FASTEST, HIGHEST-IMPACT actions to close critical gaps?
   - Prioritize quick wins (15-60 min) over long-term projects

</REASONING_PROCESS>

<OUTPUT_SCHEMA>
Return ONLY valid JSON (no markdown, no code blocks, no explanations):

{
  "percentileRanking": {
    "percentile": <number 1-100>,
    "ranking": "top X%",
    "comparisonStatement": "Clear statement of competitive position at their level"
  },
  "strengths": [
    {
      "area": "Specific strength area",
      "description": "What they do well with NUMBERS and EVIDENCE",
      "advantage": "Why this matters for ${targetRoles[0]} roles",
      "evidence": ["Specific example 1", "Specific example 2"]
    }
    // 3-5 strengths that are REAL competitive advantages
  ],
  "opportunities": [
    {
      "area": "Enhancement area",
      "description": "Current state with room for growth",
      "impact": "Potential benefit if enhanced",
      "priority": "medium",
      "estimatedEffort": "1 hour | 1 week"
    }
    // 2-3 medium-priority opportunities
  ],
  "gaps": [
    {
      "area": "Critical gap name (relevant to ${careerContext.nextLikelyRole})",
      "description": "What's missing and current count vs industry standard",
      "relevanceReason": "Why this gap matters specifically for ${careerContext.nextLikelyRole}",
      "howToFill": "Specific, actionable 2-3 sentence guidance",
      "priority": "critical | high",
      "currentCount": <number>,
      "targetCount": <number>,
      "estimatedEffort": "15 min | 30 min | 1 hour",
      "impact": "Concrete expected outcome (e.g., +10% vault strength, closes top 10% gap)",
      "categoryKey": "power-phrases | skills | competencies | leadership | executive-presence | certifications"
    }
    // 3-5 gaps ONLY, prioritized by impact
  ],
  "recommendations": [
    {
      "title": "Action title",
      "description": "Clear, specific action they can take TODAY",
      "impact": "Expected outcome with metrics",
      "estimatedBoost": "+X% vault strength",
      "timeToImplement": "15 min | 30 min | 1 hour | 1 week",
      "category": "power-phrases | skills | leadership | etc",
      "order": <number 1-5, in priority order>
    }
    // 3-5 recommendations, ORDERED by priority (1 = most important)
  ],
  "competitiveInsights": {
    "vsTopPerformers": "How they compare to top 10% at ${careerContext.inferredSeniority} level",
    "marketPosition": "Current market positioning for ${targetRoles[0]} roles",
    "differentiators": ["Unique strength 1", "Unique strength 2"],
    "areasToWatch": ["Emerging requirement 1", "Emerging requirement 2"]
  }
}
</OUTPUT_SCHEMA>

IMPORTANT: Return ONLY the JSON object. No markdown formatting, no code blocks, no explanations.`;

    // ===== STEP 5: CALL PERPLEXITY WITH DEEP REASONING =====
    console.log('🧠 Calling Perplexity sonar-reasoning-pro (deep thinking mode)');

    const startTime = Date.now();
    const { response, metrics } = await callPerplexity(
      {
        messages: [{ role: 'user', content: benchmarkPrompt }],
        model: PERPLEXITY_MODELS.HUGE, // sonar-reasoning-pro
        temperature: 0.3,
        max_tokens: 4500,
      },
      'generate-completion-benchmark',
      user.id,
      300000 // 300 seconds (5 minutes) - ample time for deep reasoning
    );

    const executionTime = Date.now() - startTime;

    await logAIUsage(metrics);

    console.log('💰 Deep Reasoning Complete:', {
      cost: `$${metrics.cost_usd.toFixed(4)}`,
      tokens: `${metrics.input_tokens} + ${metrics.output_tokens}`,
      time: `${Math.round(executionTime / 1000)}s`
    });

    // ===== STEP 6: PARSE AND VALIDATE =====
    const aiContent = response.choices[0].message.content;
    let benchmarkAnalysis;

    try {
      // Remove <think>...</think> tags, markdown code blocks, and trim
      const cleanedContent = aiContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove thinking tags
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      benchmarkAnalysis = JSON.parse(cleanedContent);

      // Validation
      if (!benchmarkAnalysis.gaps || !Array.isArray(benchmarkAnalysis.gaps)) {
        throw new Error('Missing or invalid gaps array');
      }
      if (!benchmarkAnalysis.percentileRanking || !benchmarkAnalysis.percentileRanking.percentile) {
        throw new Error('Missing percentile ranking');
      }

      console.log('✅ ANALYSIS COMPLETE:', {
        percentile: benchmarkAnalysis.percentileRanking.percentile,
        strengths: benchmarkAnalysis.strengths?.length || 0,
        gaps: benchmarkAnalysis.gaps?.length || 0,
        recommendations: benchmarkAnalysis.recommendations?.length || 0,
      });

    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid JSON format');
    }

    // ===== STEP 7: CACHE RESULTS =====
    const { error: insertError } = await supabase
      .from('vault_gap_analysis')
      .insert({
        vault_id: vaultId,
        user_id: user.id,
        analysis_type: 'completion_benchmark',
        gap_type: 'comprehensive',
        gap_description: `Completion benchmark analysis for ${targetRoles.join(', ')} in ${targetIndustries.join(', ')}`,
        identified_gaps: benchmarkAnalysis.gaps || [],
        competitive_insights: benchmarkAnalysis.competitiveInsights || {},
        recommendations: benchmarkAnalysis.recommendations || [],
        strengths: benchmarkAnalysis.strengths || [],
        opportunities: benchmarkAnalysis.opportunities || [],
        percentile_ranking: benchmarkAnalysis.percentileRanking?.percentile || 50,
        vault_strength_at_analysis: vaultStats.vaultStrength || 0,
      });

    if (insertError) {
      console.error('Failed to cache benchmark:', insertError);
    } else {
      console.log('💾 CACHED for future requests');
    }

    // ===== STEP 8: RETURN RESULTS =====
    return new Response(
      JSON.stringify({
        success: true,
        data: benchmarkAnalysis,
        meta: {
          cached: false,
          cost: `$${metrics.cost_usd.toFixed(4)}`,
          model: PERPLEXITY_MODELS.HUGE,
          executionTime: `${Math.round(executionTime / 1000)}s`,
          careerContext: {
            seniority: careerContext.inferredSeniority,
            nextRole: careerContext.nextLikelyRole,
            confidence: careerContext.seniorityConfidence,
          },
          message: 'Fresh analysis generated with deep reasoning'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Benchmark generation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate benchmark analysis',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
