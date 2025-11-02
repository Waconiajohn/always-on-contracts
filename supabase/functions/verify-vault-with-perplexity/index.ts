import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

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
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { claimType, claimData, industryContext } = await req.json();

    console.log('[VERIFY-VAULT] Verifying claim:', claimType);

    let verificationPrompt = '';
    
    switch (claimType) {
      case 'quantified_impact':
        verificationPrompt = `Verify if this business impact claim is realistic:

Claim: "${claimData.impact_summary}"
Metrics: ${JSON.stringify(claimData.quantified_metrics)}
Industry: ${industryContext.industry || 'Not specified'}
Role: ${industryContext.role || 'Not specified'}

Questions to answer:
1. Is this level of impact realistic for this role/industry?
2. Are the metrics in the expected range?
3. What are typical benchmarks for similar achievements?
4. Any red flags or exceptional claims?

Provide a brief verification summary with sources.`;
        break;

      case 'technical_skill':
        verificationPrompt = `Verify this technical skill claim:

Skill: ${claimData.technology}
Proficiency: ${claimData.proficiency_level}
Timeframe: ${industryContext.timeframe || 'Not specified'}

Questions:
1. Was this technology available/popular in this timeframe?
2. Is the claimed proficiency level realistic?
3. What are standard proficiency indicators for this tech?

Provide verification with current industry standards.`;
        break;

      case 'market_rate':
        verificationPrompt = `Verify salary/rate expectations:

Role: ${claimData.role}
Location: ${claimData.location}
Experience: ${claimData.years_experience} years
Expected Range: ${claimData.expected_min} - ${claimData.expected_max}

Questions:
1. Current market rates for this role/location?
2. Is the expected range realistic?
3. What factors influence compensation in this market?

Provide current market data with sources.`;
        break;

      default:
        throw new Error('Invalid claim type');
    }

    console.log('[VERIFY-VAULT] Calling Perplexity API...');

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checker verifying career claims against current market data. Be specific and cite sources.'
          },
          {
            role: 'user',
            content: verificationPrompt
          }
        ],
        model: PERPLEXITY_MODELS.HUGE,
        temperature: 0.2,
        max_tokens: 1000,
        return_related_questions: false,
        search_recency_filter: 'month',
      },
      'verify-vault-with-perplexity',
      user.id
    );

    await logAIUsage(metrics);

    const verification_result = response.choices[0]?.message?.content;
    const citations = response.citations || [];

    console.log('[VERIFY-VAULT] Verification complete');

    // Store verification result
    await supabase
      .from('vault_verifications')
      .insert({
        user_id: user.id,
        verification_type: claimType,
        original_content: JSON.stringify(claimData),
        verification_result,
        citations,
        verified_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        verification_result,
        citations,
        verified_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[VERIFY-VAULT] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});