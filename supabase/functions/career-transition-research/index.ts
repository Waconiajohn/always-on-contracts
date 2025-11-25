import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, successResponse, errorResponse, corsPreflightResponse } from '../_shared/response-helpers.ts';

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(new Error('Missing authorization header'), 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return errorResponse(new Error('Unauthorized'), 401);
    }

    // Get user's vault data
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (vaultError || !vault) {
      return errorResponse(new Error('Vault not found. Please complete your career vault first.'), 404);
    }

    // Fetch career context
    const { data: context } = await supabase
      .from('vault_career_context')
      .select('*')
      .eq('vault_id', vault.id)
      .single();

    // Fetch work positions
    const { data: workPositions } = await supabase
      .from('vault_work_positions')
      .select('*')
      .eq('vault_id', vault.id)
      .order('start_date', { ascending: false });

    // Fetch transferable skills
    const { data: skills } = await supabase
      .from('vault_transferable_skills')
      .select('*')
      .eq('vault_id', vault.id)
      .order('confidence_score', { ascending: false })
      .limit(20);

    // Fetch power phrases
    const { data: powerPhrases } = await supabase
      .from('vault_power_phrases')
      .select('*')
      .eq('vault_id', vault.id)
      .order('confidence_score', { ascending: false })
      .limit(10);

    // Fetch hidden competencies
    const { data: competencies } = await supabase
      .from('vault_hidden_competencies')
      .select('*')
      .eq('vault_id', vault.id)
      .order('confidence_score', { ascending: false })
      .limit(10);

    // Build research prompt for Perplexity
    const currentIndustry = workPositions?.[0]?.industry || 'Unknown';
    const currentRole = workPositions?.[0]?.job_title || 'Unknown';
    const yearsExperience = context?.years_of_experience || 0;
    const keySkills = skills?.slice(0, 10).map(s => s.stated_skill).join(', ') || 'No skills listed';
    const topAchievements = powerPhrases?.slice(0, 5).map(p => p.power_phrase).join('\n') || 'No achievements listed';
    const hiddenStrengths = competencies?.slice(0, 5).map(c => `${c.competency_area}: ${c.inferred_capability}`).join('\n') || 'No competencies listed';

    const systemPrompt = `You are an elite career transition strategist with access to real-time job market data and industry intelligence. Your mission is to identify high-value career pivots where professionals can leverage their existing skills in new industries.

CRITICAL ANALYSIS FRAMEWORK:

1. SKILL ARBITRAGE ANALYSIS
   - Identify skills that are "commodity" in their current industry but premium elsewhere
   - Calculate value multipliers (e.g., 2.5x means their skills are worth 2.5x more in target industry)
   - Real-world example: Banking security protocols are commoditized in finance but premium in manufacturing

2. DYING INDUSTRY DETECTION
   - Research current trajectory of their industry using latest data
   - Identify AI/automation threats to their specific role
   - Provide urgency assessment: stable/declining/critical

3. EMERGING OPPORTUNITY MAPPING
   - Find industries desperately needing their skills but lacking talent
   - Identify "blue ocean" opportunities with low competition
   - Focus on roles where their experience is rare and valuable

4. TRANSFERABLE SKILLS VALUATION
   - Price each skill across different industries
   - Show where skills are overvalued vs undervalued
   - Highlight hidden competencies that translate

RESPONSE FORMAT (JSON):
{
  "currentIndustryOutlook": {
    "status": "declining|stable|growing",
    "aiThreatLevel": "low|medium|high|critical",
    "timeHorizon": "realistic timeframe",
    "reasoning": "detailed explanation with data",
    "sources": ["url1", "url2"]
  },
  "transitionOpportunities": [
    {
      "targetIndustry": "specific industry name",
      "targetRoles": ["specific job title 1", "specific job title 2"],
      "skillArbitrage": {
        "premiumSkills": ["skill that's premium here"],
        "valueMultiplier": "1.5x-3x",
        "reasoning": "why their skills are valuable here"
      },
      "salaryRange": "$XXK-$XXXK",
      "demandTrend": "high growth|moderate|stable",
      "competitionLevel": "low|medium|high",
      "transitionDifficulty": "easy|medium|hard",
      "timeToTransition": "realistic timeframe",
      "actionableSteps": ["step 1", "step 2", "step 3"],
      "certifications": ["cert 1", "cert 2"],
      "networkingTargets": ["company type", "role to connect with"],
      "sources": ["url1", "url2"]
    }
  ],
  "hiddenAdvantages": [
    "unique advantage 1",
    "unique advantage 2"
  ],
  "immediateActions": [
    "action 1",
    "action 2"
  ],
  "researchSources": ["all urls used"],
  "lastUpdated": "2025-MM-DD"
}

CRITICAL RULES:
- Use ONLY data from the last 6 months
- Provide specific job titles, not generic roles
- Include actual salary ranges from reliable sources
- Cite all sources with URLs
- Focus on realistic transitions, not fantasy careers
- Prioritize opportunities with low competition but high demand`;

    const userPrompt = `ANALYZE THIS PROFESSIONAL'S CAREER TRANSITION OPPORTUNITIES:

CURRENT SITUATION:
- Industry: ${currentIndustry}
- Role: ${currentRole}
- Years of Experience: ${yearsExperience}

KEY SKILLS:
${keySkills}

TOP ACHIEVEMENTS:
${topAchievements}

HIDDEN COMPETENCIES:
${hiddenStrengths}

MISSION:
1. Research their current industry's outlook and AI threats
2. Identify 3-5 target industries where their skills are premium
3. Provide specific job titles they should target
4. Show the skill arbitrage opportunity (where are they undervalued now?)
5. Give actionable transition steps with timelines

Focus on realistic, high-value transitions where they have competitive advantages.`;

    console.log('[TRANSITION-RESEARCH] Calling Perplexity API...');

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month'
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('[TRANSITION-RESEARCH] Perplexity API error:', errorText);
      return errorResponse(new Error(`Perplexity API error: ${errorText}`), perplexityResponse.status);
    }

    const perplexityData = await perplexityResponse.json();
    const researchResult = perplexityData.choices[0].message.content;

    console.log('[TRANSITION-RESEARCH] Raw result:', researchResult.substring(0, 500));

    // Parse JSON response
    let parsedResult;
    try {
      const jsonMatch = researchResult.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : researchResult);
    } catch (e) {
      console.error('[TRANSITION-RESEARCH] Failed to parse JSON:', e);
      return errorResponse(new Error('Failed to parse research results'), 500);
    }

    // Store research in database
    const { data: savedResearch, error: saveError } = await supabase
      .from('vault_transition_research')
      .insert({
        vault_id: vault.id,
        user_id: user.id,
        current_industry_outlook: parsedResult.currentIndustryOutlook,
        transition_opportunities: parsedResult.transitionOpportunities,
        hidden_advantages: parsedResult.hiddenAdvantages || [],
        research_sources: parsedResult.researchSources || [],
        perplexity_query_used: userPrompt,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[TRANSITION-RESEARCH] Failed to save research:', saveError);
    }

    return successResponse({
      success: true,
      research: parsedResult,
      savedId: savedResearch?.id,
    });

  } catch (error) {
    console.error('[TRANSITION-RESEARCH] Error:', error);
    return errorResponse(error instanceof Error ? error : new Error('Unknown error'), 500);
  }
});