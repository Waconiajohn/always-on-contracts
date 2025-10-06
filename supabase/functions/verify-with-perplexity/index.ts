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
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')!;
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
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
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
        temperature: 0.2,
        max_tokens: 2000,
        return_related_questions: true,
        search_recency_filter: 'month',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API failed: ${response.status}`);
    }

    const data = await response.json();
    const verification_result = data.choices[0]?.message?.content;
    const citations = data.citations || [];

    // Store verification result
    const { error: insertError } = await supabase
      .from('war_chest_verifications')
      .insert({
        user_id: user.id,
        verification_type,
        original_content: content_to_verify,
        verification_result,
        citations,
        verified_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing verification:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification_result,
        citations,
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