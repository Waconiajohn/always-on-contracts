import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { CompetitivePositionSchema } from '../_shared/ai-response-schemas.ts';

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
          error: 'Career Vault not found. Complete your Career Vault first.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Get vault intelligence details
    const { data: vaultIntelligence } = await supabase
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

    // Step 4: Use Perplexity to analyze competitive position
    const model = selectOptimalModel({
      taskType: 'analysis',
      complexity: 'medium',
      estimatedInputTokens: 2000,
      estimatedOutputTokens: 600,
      requiresReasoning: true,
      requiresLatestData: false
    });

    const { response, metrics } = await retryWithBackoff(
      async () => await callPerplexity(
        {
          messages: [
            {
              role: 'system',
              content: 'You are a career positioning analyst. Analyze candidate strength vs market requirements. Return valid JSON only.'
            },
            {
              role: 'user',
              content: `Analyze competitive position:

TARGET ROLE: ${job_title}

MARKET DATA:
${JSON.stringify(market_data, null, 2)}

CANDIDATE PROFILE:
- Current Title: ${profile?.current_title || 'N/A'}
- Years Experience: ${profile?.years_experience || 'N/A'}
- Core Skills: ${profile?.core_skills?.join(', ') || 'N/A'}
- Key Achievements: ${profile?.key_achievements?.join(', ') || 'N/A'}

CAREER VAULT INTELLIGENCE:
- Total Vault Strength: ${vaultData.overall_strength_score || 0}/100
- Power Phrases: ${vaultData.total_power_phrases || 0}
- Hidden Competencies: ${vaultData.total_hidden_competencies || 0}
- Transferable Skills: ${vaultData.total_transferable_skills || 0}

DETAILED INTELLIGENCE:
${JSON.stringify(vaultIntelligence, null, 2)}

Return JSON with:
{
  "competitive_score": 0-100,
  "skill_premiums": {},
  "above_market_strengths": [],
  "potential_gaps": [],
  "recommended_positioning": "",
  "salary_range_recommendation": { "minimum_acceptable": 0, "target": 0, "stretch": 0 }
}`
            }
          ],
          model,
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

    const content = response.choices[0].message.content;
    const result = extractJSON(content, CompetitivePositionSchema);

    if (!result.success) {
      logger.error('JSON parsing failed', { 
        error: result.error,
        content: content.substring(0, 500)
      });
      throw new Error(`Invalid AI response: ${result.error}`);
    }

    const analysis = result.data;

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
        vault_strength_score: vaultData.overall_strength_score,
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
