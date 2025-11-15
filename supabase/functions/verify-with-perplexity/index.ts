import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

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

    const { content_to_verify, verification_type, context } = await req.json();

    if (!content_to_verify || !verification_type) {
      throw new Error('content_to_verify and verification_type are required');
    }

    let verificationPrompt = '';
    
    switch (verification_type) {
      case 'skills':
        verificationPrompt = `Verify the accuracy and relevance of these skills for ${context?.target_roles?.join(', ')} in ${context?.target_industries?.join(', ')} industries:

Skills to verify:
${JSON.stringify(content_to_verify, null, 2)}

For each skill, provide:
1. Is this skill actually relevant and in-demand?
2. Is the market frequency estimate accurate?
3. Are the sub-attributes realistic and current?
4. Any critical missing skills for these roles?

Be specific and cite current market data.`;
        break;
        
      case 'salary':
        verificationPrompt = `Verify salary ranges and compensation data:

${content_to_verify}

Provide current, accurate salary data for ${context?.role} in ${context?.location} including:
- Base salary ranges
- Total compensation
- Market trends
- Source credibility`;
        break;
        
      case 'company':
        verificationPrompt = `Verify company information and recent news:

${content_to_verify}

Provide accurate, up-to-date information about this company including:
- Recent news (last 6 months)
- Financial status
- Company culture insights
- Interview process insights`;
        break;
        
      case 'market_trends':
        verificationPrompt = `Verify job market trends and demand:

${content_to_verify}

For ${context?.role} in ${context?.industry}, provide:
- Current hiring trends
- Skill demand changes
- Remote work prevalence
- Career path insights`;
        break;
        
      default:
        verificationPrompt = `Verify the accuracy of this information:

${content_to_verify}

Provide factual verification with current sources.`;
    }

    console.log('Calling Perplexity for verification...');
    
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checker that provides accurate, up-to-date market intelligence. Always cite sources and be specific about data recency.'
          },
          {
            role: 'user',
            content: verificationPrompt
          }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.2,
        max_tokens: 2000,
      },
      'verify-with-perplexity',
      user.id
    );

    await logAIUsage(metrics);

    const verification_result = response.choices[0]?.message?.content;

    // Store verification result
    const { error: insertError } = await supabase
      .from('vault_verifications')
      .insert({
        user_id: user.id,
        verification_type,
        original_content: content_to_verify,
        verification_result,
        verified_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing verification:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification_result,
        verified_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-with-perplexity:', error);
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