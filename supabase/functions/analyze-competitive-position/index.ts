import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!;
    
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

    // Step 4: Use Lovable AI to analyze competitive position
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a career positioning analyst. Analyze candidate strength vs market requirements.'
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

Calculate:
1. Competitive positioning score (0-100)
2. Skills that command salary premiums for this role
3. Specific achievements that justify above-market compensation
4. Gaps that might limit negotiation leverage
5. Recommended positioning strategy`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_position',
            description: 'Analyze candidate competitive position',
            parameters: {
              type: 'object',
              properties: {
                competitive_score: { 
                  type: 'integer',
                  description: '0-100 score of candidate strength vs market'
                },
                skill_premiums: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      has_skill: { type: 'boolean' },
                      estimated_value_add: { type: 'number' },
                      reasoning: { type: 'string' }
                    }
                  }
                },
                above_market_strengths: {
                  type: 'array',
                  items: { type: 'string' }
                },
                potential_gaps: {
                  type: 'array',
                  items: { type: 'string' }
                },
                recommended_positioning: { type: 'string' },
                salary_range_recommendation: {
                  type: 'object',
                  properties: {
                    minimum_acceptable: { type: 'number' },
                    target: { type: 'number' },
                    stretch: { type: 'number' }
                  }
                }
              },
              required: ['competitive_score', 'skill_premiums', 'above_market_strengths']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_position' } }
      }),
    });

    const analysisData = await analysisResponse.json();
    const toolCall = analysisData.choices[0]?.message?.tool_calls?.[0];
    const analysis = JSON.parse(toolCall?.function?.arguments || '{}');

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
    console.error('Error in analyze-competitive-position:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
