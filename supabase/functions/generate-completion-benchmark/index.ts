// =====================================================
// GENERATE COMPLETION BENCHMARK - Master Resume 2.0
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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { analyzeCareerContextAI, getCareerLevelGuidance, type CareerContext } from '../_shared/career-context-analyzer-ai.ts';

interface BenchmarkRequest {
  resumeId: string;
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

    const body = await req.json();
    // Support both resumeId and vaultId for backward compatibility
    const resumeId = body.resumeId || body.vaultId;
    const {
      targetRoles,
      targetIndustries,
      forceRegenerate = false,
    }: BenchmarkRequest = body;

    console.log('📊 GENERATING COMPLETION BENCHMARK:', {
      resumeId,
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
        .eq('vault_id', resumeId)
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

    // ===== STEP 2: FETCH MASTER RESUME DATA =====
    const { data: resumeStats } = await supabase
      .rpc('get_vault_statistics', { p_vault_id: resumeId });

    if (!resumeStats) {
      throw new Error('Could not fetch resume statistics');
    }

    // Fetch industry research for benchmarks
    const { data: industryResearch } = await supabase
      .from('vault_industry_research')
      .select('*')
      .eq('vault_id', resumeId)
      .order('created_at', { ascending: false })
      .limit(1);

    const benchmarks = industryResearch?.[0]?.results || {};

    // Fetch actual resume items for detailed analysis
    const [powerPhrases, skills, competencies, softSkills, leadershipPhilosophy, executivePresence, confirmedSkills] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', resumeId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', resumeId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', resumeId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', resumeId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', resumeId),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', resumeId),
      supabase.from('vault_confirmed_skills').select('*').eq('vault_id', resumeId),
    ]);

    // ===== STEP 3: GET CACHED CAREER CONTEXT (NO AI CALL) =====
    console.log('📊 Fetching cached career context...');
    
    let careerContext: any;
    const { data: cachedContext } = await supabase
      .from('vault_career_context')
      .select('*')
      .eq('vault_id', resumeId)
      .single();

    if (cachedContext) {
      careerContext = {
        hasManagementExperience: cachedContext.has_management_experience,
        managementDetails: cachedContext.management_details,
        teamSizesManaged: Array.isArray(cachedContext.team_sizes_managed) ? cachedContext.team_sizes_managed : [],
        hasBudgetOwnership: cachedContext.has_budget_ownership,
        budgetDetails: cachedContext.budget_details,
        budgetSizesManaged: Array.isArray(cachedContext.budget_sizes_managed) ? cachedContext.budget_sizes_managed : [],
        hasExecutiveExposure: cachedContext.has_executive_exposure,
        inferredSeniority: cachedContext.inferred_seniority,
        seniorityConfidence: cachedContext.seniority_confidence,
        yearsOfExperience: cachedContext.years_of_experience,
        technicalDepth: cachedContext.technical_depth,
        leadershipDepth: cachedContext.leadership_depth,
        strategicDepth: cachedContext.strategic_depth,
        careerArchetype: cachedContext.career_archetype,
        impactScale: cachedContext.impact_scale,
        companySizes: [],
        primaryResponsibilities: [],
        nextLikelyRole: 'Senior IC',
        executiveDetails: cachedContext.has_executive_exposure ? 'Executive exposure documented' : 'No executive exposure documented',
        aiReasoning: 'Loaded from cached career context'
      };
      console.log('✅ Using cached career context');
    } else {
      console.warn('⚠️ No cached context, using fallback');
      careerContext = {
        hasManagementExperience: false,
        managementDetails: 'No management experience documented',
        teamSizesManaged: [],
        inferredSeniority: 'Mid-Level IC',
        seniorityConfidence: 50,
        yearsOfExperience: 5,
        technicalDepth: 50,
        leadershipDepth: 30,
        strategicDepth: 40,
        companySizes: [],
        primaryResponsibilities: [],
        careerArchetype: 'generalist',
        impactScale: 'individual',
        nextLikelyRole: 'Senior IC',
        hasExecutiveExposure: false,
        executiveDetails: 'No executive exposure documented',
        hasBudgetOwnership: false,
        budgetDetails: 'No budget ownership documented',
        budgetSizesManaged: [],
        aiReasoning: 'Using fallback context due to missing cached data'
      };
    }

    console.log('📊 CAREER CONTEXT DETECTED (AI-POWERED):', {
      seniority: careerContext.inferredSeniority,
      confidence: careerContext.seniorityConfidence,
      years: careerContext.yearsOfExperience,
      nextRole: careerContext.nextLikelyRole,
      archetype: careerContext.careerArchetype,
      management: careerContext.hasManagementExperience,
      managementDetails: careerContext.managementDetails,
      executive: careerContext.hasExecutiveExposure,
      budgetOwnership: careerContext.hasBudgetOwnership,
      aiReasoning: careerContext.aiReasoning,
    });

    // ===== STEP 4: BUILD EXPERT-LEVEL AI PROMPT =====
    const benchmarkPrompt = `You are an elite executive career strategist and talent assessor with 20+ years of experience evaluating senior leadership candidates at Fortune 500 companies and high-growth startups.

<TASK>
Perform a hyper-personalized, career-level-appropriate competitive positioning analysis for this professional's Master Resume. Your analysis will directly impact their career trajectory for the next 2-5 years.
</TASK>

<CONTEXT>
TARGET ROLES: ${targetRoles.join(', ')}
TARGET INDUSTRIES: ${targetIndustries.join(', ')}

CAREER PROFILE (AI-INFERRED FROM VAULT CONTENT):
├─ Seniority Level: ${careerContext.inferredSeniority} (${careerContext.seniorityConfidence}% confidence)
├─ Years of Experience: ${careerContext.yearsOfExperience}
├─ Management Experience: ${careerContext.hasManagementExperience ? '✅ CONFIRMED - ' + careerContext.managementDetails : 'NOT FOUND'}
   ${careerContext.hasManagementExperience ? '**CRITICAL: Management experience IS DOCUMENTED. Do NOT suggest management/supervision gaps.**' : ''}
├─ Executive Exposure: ${careerContext.hasExecutiveExposure ? 'YES' : 'NO'}
   ${careerContext.executiveDetails || ''}
├─ Budget Ownership: ${careerContext.hasBudgetOwnership ? '✅ CONFIRMED - ' + (careerContext.budgetDetails || 'Budget responsibility documented') : 'NOT FOUND'}
   ${careerContext.hasBudgetOwnership ? '**Do NOT suggest budget ownership gaps.**' : ''}
├─ Company Types: ${careerContext.companySizes.join(', ')}
├─ Technical Depth: ${careerContext.technicalDepth}/100
├─ Leadership Depth: ${careerContext.leadershipDepth}/100
├─ Strategic Depth: ${careerContext.strategicDepth}/100
├─ Impact Scale: ${careerContext.impactScale}
├─ Career Archetype: ${careerContext.careerArchetype}
└─ Next Likely Role: ${careerContext.nextLikelyRole}

PRIMARY RESPONSIBILITIES (from their actual achievements):
${careerContext.primaryResponsibilities.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

MASTER RESUME CONTENTS ANALYSIS:
├─ Power Phrases: ${powerPhrases.data?.length || 0} quantified achievements
├─ ✅ TECHNICAL SKILLS: ${(skills.data?.length ?? 0)} extracted from resume (vault_transferable_skills)
├─ User-Confirmed Skills: ${(confirmedSkills.data?.length ?? 0)} manually validated (vault_confirmed_skills)
├─ Hidden Competencies: ${competencies.data?.length || 0} deep capabilities
├─ Soft Skills: ${softSkills.data?.length || 0} interpersonal strengths
├─ Leadership Philosophy: ${leadershipPhilosophy.data?.length || 0} leadership insights
└─ Executive Presence: ${executivePresence.data?.length || 0} strategic indicators

**CRITICAL RULE: User has ${(skills.data?.length ?? 0)} technical skills already extracted from their resume.**
- If this count is > 0, DO NOT suggest "add technical skills" gaps
- These are REAL skills from their resume (Python, Java, SQL, etc.)
- Focus on QUALITY or MISSING SKILL CATEGORIES, not quantity

SAMPLE ACHIEVEMENTS (their actual work):
${powerPhrases.data?.slice(0, 10).map((pp: any, i: number) => `${i + 1}. ${pp.power_phrase}`).join('\n') || 'None documented yet'}

EXTRACTED TECHNICAL SKILLS (from resume):
${(skills.data && skills.data.length > 0) ? skills.data.slice(0, 20).map((s: any) => `✓ ${s.stated_skill} (confidence: ${s.confidence_score}%)`).join('\n') : 'None documented yet'}

ADDITIONAL USER-CONFIRMED SKILLS (manually added):
${(confirmedSkills.data && confirmedSkills.data.length > 0) ? confirmedSkills.data.slice(0, 10).map((s: any) => `✓ ${s.skill_name} (${s.proficiency_level || 'confirmed'})`).join('\n') : 'None manually confirmed yet'}

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

**CRITICAL RULE #3: EVIDENCE-BASED & RESPECT CAREER CONTEXT**
Base ALL assessments on actual resume content AND career context cache:
- If career context shows has_management_experience=true, NEVER suggest management/supervision gaps
- If career context shows has_budget_ownership=true, NEVER suggest budget responsibility gaps
- If they have ${skills.data?.length || 0} technical skills (vault_transferable_skills), NEVER suggest "add technical skills" gaps - they already have them!
- If they have 45 power phrases, don't say they need more - focus on QUALITY gaps or MISSING CATEGORIES
- Career context represents AI-verified facts from their resume - treat as ground truth
- vault_transferable_skills contains REAL technical skills extracted from resume - respect this data

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
   - Resume Strength: ${resumeStats.resumeStrength || resumeStats.vaultStrength}%
   - Quality Distribution: ${JSON.stringify(resumeStats.qualityBreakdown)}
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
   - **CRITICAL**: Each gap MUST map to an actual resume section:
     * "achievements" = quantified results, impact stories, regulatory/safety achievements
     * "skills" = technical skills, domain expertise
     * "leadership" = leadership philosophy, executive presence
     * "education" = degrees, certifications
     * "experience" = roles, management, budget ownership

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
      "description": "What's missing and why it matters",
      "relevanceReason": "Why this gap matters specifically for ${careerContext.nextLikelyRole}",
      "howToFill": "Specific, actionable 2-3 sentence guidance on what to add",
      "priority": "critical | high",
      "estimatedEffort": "15 min | 30 min | 1 hour",
      "impact": "Concrete expected outcome (e.g., +10% vault strength, closes top 10% gap)",
      "categoryKey": "achievements | skills | leadership | education | experience"
    }
    // 3-5 gaps ONLY, prioritized by impact
    //
    // CRITICAL: categoryKey MUST be one of these EXACT values (maps to actual resume dashboard sections):
    // - "achievements" = For power phrases, quantified results, impact stories, regulatory/safety achievements
    // - "skills" = For technical skills, domain expertise, certifications
    // - "leadership" = For leadership philosophy, executive presence, management style
    // - "education" = For degrees, certifications, formal education
    // - "experience" = For roles, companies, management/budget experience
    //
    // DO NOT use: "power-phrases", "competencies", "soft-skills", "executive-presence" (these don't exist)
  ],
  "recommendations": [
    {
      "title": "Action title",
      "description": "Clear, specific action they can take TODAY",
      "impact": "Expected outcome with metrics",
      "estimatedBoost": "+X% resume strength",
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

    // ===== STEP 5: CALL LOVABLE AI =====
    console.log('🧠 Calling Lovable AI (Gemini Flash)');

    const startTime = Date.now();
    const { response, metrics } = await callLovableAI(
      {
        messages: [{ role: 'user', content: benchmarkPrompt }],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 4500,
        response_format: { type: 'json_object' }
      },
      'generate-completion-benchmark',
      user.id
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
        vault_id: resumeId,
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
        resume_strength_at_analysis: resumeStats.resumeStrength || resumeStats.vaultStrength || 0,
      });

    if (insertError) {
      console.error('Failed to cache benchmark:', insertError);
    } else {
      console.log('💾 CACHED for future requests');
    }

    // CRITICAL FIX: Sync gaps to vault_career_context cache
    // This ensures generate-gap-filling-questions can see the identified gaps
    console.log('🔄 Syncing gaps to career context cache...');
    const { error: syncError } = await supabase
      .from('vault_career_context')
      .update({ 
        identified_gaps: benchmarkAnalysis.gaps || [],
        updated_at: new Date().toISOString()
      })
      .eq('vault_id', resumeId);
    
    if (syncError) {
      console.error('Failed to sync gaps to cache:', syncError);
    } else {
      console.log('✅ Gaps synced to cache for gap-filling questions');
    }

    // ===== STEP 8: RETURN RESULTS =====
    return new Response(
      JSON.stringify({
        success: true,
        data: benchmarkAnalysis,
        meta: {
          cached: false,
          cost: `$${metrics.cost_usd.toFixed(4)}`,
          model: LOVABLE_AI_MODELS.DEFAULT,
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
