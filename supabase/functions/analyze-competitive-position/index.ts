import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { analyzeCareerContextAI } from '../_shared/career-context-analyzer-ai.ts';

/**
 * @fileoverview Analyze Competitive Position Edge Function
 * 
 * CRITICAL NAMING CONVENTIONS:
 * 
 * 1. VAULT ID REFERENCE:
 *    - When querying career_vault: Use vaultData.id
 *    - When querying vault_* tables: Filter by vault_id column
 *    - Example:
 *      const { data: vault } = await supabase.from('career_vault').select('*').single();
 *      const { data: context } = await supabase.from('vault_career_context').eq('vault_id', vault.id);
 *      // ✅ CORRECT: vault.id
 *      // ❌ WRONG: vault.vault_id (does not exist)
 * 
 * 2. DATABASE COLUMNS:
 *    - Always use snake_case: vault_id, user_id, created_at, role_level
 * 
 * 3. TYPESCRIPT VARIABLES:
 *    - Always use camelCase: vaultId, userId, createdAt, roleLevel
 * 
 * 4. RESPONSE STRUCTURE:
 *    - Returns: { success: true, data: { analysis: {...} } }
 *    - Frontend accesses: result.data.data.analysis
 * 
 * @see docs/VAULT_NAMING_CONVENTIONS.md for complete guide
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const startTime = Date.now();
  const logger = createLogger('analyze-competitive-position');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    const { user_id, job_title, market_data } = await req.json();

    console.log('Analyzing competitive position for:', { user_id, job_title });

    // Step 1: Retrieve Career Vault data
    const { data: vaultData } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!vaultData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Master Resume not found. Complete your Master Resume first.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Get resume intelligence details
    const { data: resumeIntelligence } = await supabase
      .from('vault_intelligence')
      .select('*')
      .eq('user_id', user_id)
      .in('intelligence_type', ['power_phrase', 'skill', 'achievement', 'hidden_competency']);

    // Step 3: Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('core_skills, key_achievements, years_experience, current_title')
      .eq('user_id', user_id)
      .single();

    // Step 3.5: Get cached career context (NO AI CALL)
    console.log('[analyze-competitive-position] Fetching cached career context...');
    
    let careerContext: any;
    const { data: cachedContext } = await supabase
      .from('vault_career_context')
      .select('*')
      .eq('vault_id', vaultData.id)
      .single();

    if (cachedContext) {
      careerContext = {
        hasManagementExperience: cachedContext.has_management_experience,
        managementDetails: cachedContext.management_details,
        teamSizesManaged: cachedContext.team_sizes_managed || [],
        hasBudgetOwnership: cachedContext.has_budget_ownership,
        budgetDetails: cachedContext.budget_details,
        budgetSizesManaged: cachedContext.budget_sizes_managed || [],
        hasExecutiveExposure: cachedContext.has_executive_exposure,
        inferredSeniority: cachedContext.inferred_seniority,
        yearsOfExperience: cachedContext.years_of_experience,
        technicalDepth: cachedContext.technical_depth,
        leadershipDepth: cachedContext.leadership_depth,
        strategicDepth: cachedContext.strategic_depth
      };
      console.log('[analyze-competitive-position] ✅ Using cached career context');
    } else {
      console.warn('[analyze-competitive-position] ⚠️ No cached context, using fallback');
      careerContext = {
        hasManagementExperience: false,
        managementDetails: 'Not analyzed',
        teamSizesManaged: [],
        hasBudgetOwnership: false,
        budgetDetails: '',
        budgetSizesManaged: [],
        hasExecutiveExposure: false,
        inferredSeniority: 'Mid-Level',
        yearsOfExperience: 5,
        technicalDepth: 50,
        leadershipDepth: 30,
        strategicDepth: 40
      };
    }

    // Step 4: Use Lovable AI to analyze competitive position WITH AI career context
    const systemPrompt = `You are an executive career strategist. Analyze competitive positioning against market standards. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:`;

    const userPrompt = `Analyze competitive positioning for this professional:

**CAREER CONTEXT:**
${JSON.stringify(careerContext, null, 2)}

**TARGET ROLE:** ${job_title}

**MARKET DATA:**
${JSON.stringify(market_data, null, 2)}

**CANDIDATE PROFILE:**
- Current Title: ${profile?.current_title || 'N/A'}
- Years Experience: ${profile?.years_experience || careerContext.yearsOfExperience}
- Core Skills: ${profile?.core_skills?.join(', ') || 'N/A'}
- Key Achievements: ${profile?.key_achievements?.join(', ') || 'N/A'}

**MASTER RESUME INTELLIGENCE:**
- Total Resume Strength: ${vaultData.overall_strength_score || 0}/100
- Power Phrases: ${vaultData.total_power_phrases || 0}
- Hidden Competencies: ${vaultData.total_hidden_competencies || 0}
- Transferable Skills: ${vaultData.total_transferable_skills || 0}

DETAILED INTELLIGENCE:
${JSON.stringify(resumeIntelligence, null, 2)}

Provide analysis:
1. Strengths vs market (specific evidence)
2. Gaps vs benchmarks (prioritized)
3. Differentiators (unique value)
4. Strategic positioning recommendations
5. Career velocity assessment

Return JSON with:
{
  "competitive_score": 0-100,
  "skill_premiums": {},
  "above_market_strengths": [],
  "potential_gaps": [],
  "recommended_positioning": "",
  "salary_range_recommendation": { "minimum_acceptable": 0, "target": 0, "stretch": 0 }
}`;

    // PHASE 1: Get AI analysis
    const { response, metrics } = await retryWithBackoff(
      async () => await callLovableAI(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.4,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        },
        'analyze-competitive-position',
        user.id
      ),
      3,
      (attempt, error) => {
        logger.warn(`Retry attempt ${attempt}`, { error: error.message });
      }
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    console.log('[analyze-competitive-position] Raw AI response:', rawContent.substring(0, 500));
    
    const result = extractJSON(rawContent);
    
    if (!result.success) {
      logger.error('JSON parsing failed', { 
        error: result.error,
        content: rawContent.substring(0, 500)
      });
      throw new Error(`Invalid AI response: ${result.error}`);
    }

    let analysis = result.data;

    // PHASE 2: PERPLEXITY MARKET INTELLIGENCE LAYER
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    let marketIntelligence = null;
    let citations: string[] = [];
    
    if (perplexityApiKey) {
      console.log('[analyze-competitive-position] Adding Perplexity market intelligence...');
      
      const marketPrompt = `Validate competitive positioning for ${job_title} with ${profile?.years_experience || careerContext.yearsOfExperience} years experience.

CANDIDATE ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Provide 2025 market intelligence:
1. Current salary trends and market rates
2. In-demand skills and their market value
3. Competitive landscape insights
4. Hiring trends for this role
5. Red flags or concerns for this level

Cite all sources.`;

      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: 'You are a market intelligence analyst. Provide data-driven competitive analysis.' },
              { role: 'user', content: marketPrompt }
            ],
            temperature: 0.2,
            max_tokens: 1500,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityJson = await perplexityResponse.json();
          marketIntelligence = perplexityJson.choices?.[0]?.message?.content || '';
          citations = perplexityJson.citations || [];
          
          // Enhance analysis with market intelligence
          analysis.market_intelligence = marketIntelligence;
          analysis.data_sources = citations;
          
          console.log('[analyze-competitive-position] ✅ Market intelligence added with', citations.length, 'citations');
        }
      } catch (error) {
        console.error('[analyze-competitive-position] Perplexity error:', error);
      }
    }

    // Validate required fields
    if (typeof analysis.competitive_score !== 'number') {
      throw new Error('Missing or invalid competitive_score');
    }
    if (!analysis.above_market_strengths || !Array.isArray(analysis.above_market_strengths)) {
      throw new Error('Missing or invalid above_market_strengths array');
    }
    if (!analysis.potential_gaps || !Array.isArray(analysis.potential_gaps)) {
      throw new Error('Missing or invalid potential_gaps array');
    }

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    // Step 5: Calculate overall percentile positioning
    const marketMedian = market_data?.extracted_data?.percentile_50 || 0;
    const competitiveScore = analysis.competitive_score || 0;
    
    // Higher competitive score = justification for higher percentile
    let targetPercentile;
    if (competitiveScore >= 90) targetPercentile = 90;
    else if (competitiveScore >= 75) targetPercentile = 75;
    else if (competitiveScore >= 60) targetPercentile = 60;
    else targetPercentile = 50;

    console.log('Competitive analysis complete:', {
      competitive_score: competitiveScore,
      target_percentile: targetPercentile
    });

    return new Response(
      JSON.stringify({
        success: true,
        competitive_score: competitiveScore,
        target_percentile: targetPercentile,
        skill_premiums: analysis.skill_premiums || {},
        above_market_strengths: analysis.above_market_strengths || [],
        potential_gaps: analysis.potential_gaps || [],
        recommended_positioning: analysis.recommended_positioning || '',
        salary_range_recommendation: analysis.salary_range_recommendation || {},
        market_intelligence: analysis.market_intelligence || null,
        data_sources: citations,
        resume_strength_score: vaultData.overall_strength_score,
        analyzed_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - startTime
    });

    const errorResponse = handlePerplexityError(error);
    return new Response(
      JSON.stringify({
        success: false,
        ...errorResponse
      }),
      {
        status: errorResponse.statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
