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
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')!;
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

    const { 
      job_title, 
      location, 
      years_experience, 
      offer_details,
      job_project_id 
    } = await req.json();

    console.log('Generating salary report for:', { job_title, location, years_experience });

    // Step 1: Check for cached market data (within 30 days)
    const { data: cachedData } = await supabase
      .from('salary_market_data')
      .select('*')
      .eq('job_title', job_title)
      .eq('location', location)
      .gte('expires_at', new Date().toISOString())
      .order('researched_at', { ascending: false })
      .limit(1)
      .single();

    let marketData;
    let marketDataId;

    if (cachedData) {
      console.log('Using cached market data');
      marketData = cachedData.market_data;
      marketDataId = cachedData.id;
    } else {
      console.log('Researching fresh market data...');

      // Step 2: Query internal rate history
      const { data: rateHistory } = await supabase
        .from('rate_history')
        .select('*')
        .ilike('position_title', `%${job_title}%`)
        .ilike('location', `%${location}%`)
        .order('recorded_date', { ascending: false })
        .limit(50);

      // Step 3: Query job opportunities for salary data
      const { data: jobOpps } = await supabase
        .from('job_opportunities')
        .select('job_title, location, hourly_rate_min, hourly_rate_max, market_rate_min, market_rate_max')
        .ilike('job_title', `%${job_title}%`)
        .ilike('location', `%${location}%`)
        .order('posted_date', { ascending: false })
        .limit(50);

      // Step 4: Call Perplexity for real-time market research
      const perplexityQuery = `Provide detailed salary data for ${job_title} position in ${location} with ${years_experience} years of experience. Include:
1. Salary ranges from Glassdoor, Levels.fyi, LinkedIn Salary, Indeed
2. 25th, 50th, 75th, and 90th percentile salaries
3. Total compensation including bonus, equity, benefits
4. Regional cost of living adjustments
5. In-demand skills that command premium pay
6. Recent salary trends (last 6 months)

Cite all sources with URLs.`;

      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: 'You are a salary research specialist. Provide accurate, cited salary data with specific numbers and sources.'
            },
            {
              role: 'user',
              content: perplexityQuery
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          return_related_questions: false,
          search_recency_filter: 'month',
        }),
      });

      if (!perplexityResponse.ok) {
        throw new Error('Perplexity API request failed');
      }

      const perplexityData = await perplexityResponse.json();
      const researchResults = perplexityData.choices[0]?.message?.content || '';
      const citations = perplexityData.citations || [];

      // Step 5: Use Lovable AI to extract structured salary data
      const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: 'Extract salary data into structured JSON format. Return percentile data, skill premiums, and sources.'
            },
            {
              role: 'user',
              content: `Extract from this research:\n\n${researchResults}\n\nInternal data: ${JSON.stringify({ rateHistory, jobOpps })}`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'extract_salary_data',
              description: 'Extract structured salary data',
              parameters: {
                type: 'object',
                properties: {
                  percentile_25: { type: 'number' },
                  percentile_50: { type: 'number' },
                  percentile_75: { type: 'number' },
                  percentile_90: { type: 'number' },
                  average_total_comp: { type: 'number' },
                  skill_premiums: { 
                    type: 'object',
                    additionalProperties: { type: 'number' }
                  },
                  regional_adjustment: { type: 'number' },
                  data_sources: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['percentile_25', 'percentile_50', 'percentile_75', 'percentile_90']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'extract_salary_data' } }
        }),
      });

      const extractionData = await extractionResponse.json();
      const toolCall = extractionData.choices[0]?.message?.tool_calls?.[0];
      const extractedData = JSON.parse(toolCall?.function?.arguments || '{}');

      // Step 6: Store market data
      const { data: newMarketData, error: insertError } = await supabase
        .from('salary_market_data')
        .insert({
          job_title,
          location,
          years_experience,
          market_data: {
            research_summary: researchResults,
            internal_rates: rateHistory,
            job_opportunities: jobOpps,
            extracted_data: extractedData
          },
          data_sources: [...citations, 'Internal CareerIQ Database'],
          percentile_25: extractedData.percentile_25,
          percentile_50: extractedData.percentile_50,
          percentile_75: extractedData.percentile_75,
          percentile_90: extractedData.percentile_90,
          skill_premiums: extractedData.skill_premiums || {}
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing market data:', insertError);
      }

      marketData = newMarketData?.market_data;
      marketDataId = newMarketData?.id;
    }

    // Step 7: Call analyze-competitive-position
    const competitiveResponse = await supabase.functions.invoke('analyze-competitive-position', {
      body: {
        user_id: user.id,
        job_title,
        market_data: marketData
      }
    });

    if (competitiveResponse.error) {
      console.error('Competitive analysis error:', competitiveResponse.error);
    }

    const competitiveAnalysis = competitiveResponse.data || {};

    // Step 8: Generate negotiation script with Lovable AI
    const scriptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a salary negotiation expert. Create professional, data-driven negotiation scripts.'
          },
          {
            role: 'user',
            content: `Create a negotiation script for:
Job: ${job_title}
Location: ${location}
Current Offer: $${offer_details?.base_salary || 'TBD'}
Market Median: $${marketData?.extracted_data?.percentile_50 || 'N/A'}
Competitive Score: ${competitiveAnalysis.competitive_score || 'N/A'}/100

Include: Opening statement, market data reference, value proposition from achievements, counter-offer recommendation, alternative compensation discussion.`
          }
        ]
      }),
    });

    const scriptData = await scriptResponse.json();
    const negotiationScript = scriptData.choices[0]?.message?.content || '';

    // Step 9: Store salary negotiation record
    const { data: negotiation, error: negError } = await supabase
      .from('salary_negotiations')
      .insert({
        user_id: user.id,
        job_project_id: job_project_id || null,
        offer_details,
        market_data_id: marketDataId,
        competitive_score: competitiveAnalysis.competitive_score,
        competitive_analysis: competitiveAnalysis,
        negotiation_script: negotiationScript
      })
      .select()
      .single();

    if (negError) {
      console.error('Error storing negotiation:', negError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        market_data: marketData,
        competitive_analysis: competitiveAnalysis,
        negotiation_script: negotiationScript,
        negotiation_id: negotiation?.id,
        researched_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-salary-report:', error);
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
