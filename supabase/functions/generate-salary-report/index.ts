import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { SalaryReportSchema } from '../_shared/ai-response-schemas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const startTime = Date.now();
  const logger = createLogger('generate-salary-report');

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

      // Step 3.5: PERPLEXITY LAYER - Get real-time salary data with citations
      const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
      let perplexityData = null;
      let citations: string[] = [];

      if (perplexityApiKey) {
        console.log('Fetching real-time salary data from Perplexity...');
        
        const perplexityPrompt = `Provide current 2025 salary data for ${job_title} in ${location} with ${years_experience} years experience.

Include:
1. Salary ranges from Glassdoor, Levels.fyi, LinkedIn Salary, Indeed
2. 25th, 50th, 75th, 90th percentile compensation
3. Total compensation breakdown (base, bonus, equity, benefits)
4. Cost of living adjustments for ${location}
5. Skills that command premium salaries
6. Recent salary trends (last 6 months)

Cite ALL sources with URLs.`;

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
                { role: 'system', content: 'You are a salary research expert. Provide data-driven salary analysis with citations.' },
                { role: 'user', content: perplexityPrompt }
              ],
              temperature: 0.2,
              max_tokens: 2000,
            }),
          });

          if (perplexityResponse.ok) {
            const perplexityJson = await perplexityResponse.json();
            perplexityData = perplexityJson.choices?.[0]?.message?.content || '';
            citations = perplexityJson.citations || [];
            console.log('✅ Perplexity salary data retrieved with', citations.length, 'citations');
          } else {
            console.warn('⚠️ Perplexity API failed, falling back to Lovable AI');
          }
        } catch (error) {
          console.error('Perplexity error:', error);
        }
      }

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are an expert salary research specialist providing comprehensive market data analysis.

Your task: Synthesize salary data and provide accurate, structured output.

${perplexityData ? `REAL-TIME MARKET DATA (use this as primary source):
${perplexityData}

CITATIONS: ${citations.join(', ')}` : ''}

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "market_research": "Comprehensive analysis with cited sources",
  "percentiles": {
    "p25": number,
    "p50": number,
    "p75": number,
    "p90": number
  },
  "total_compensation": "Details including bonus, equity, benefits",
  "regional_adjustments": "Cost of living considerations",
  "in_demand_skills": ["skill1", "skill2"],
  "recent_trends": "Salary trends from last 6 months",
  "sources_cited": ["https://url1", "https://url2"]
}`;

    const userPrompt = `${perplexityData ? 'Synthesize the real-time data above into structured format.' : `Provide detailed salary data for:

POSITION: ${job_title}
LOCATION: ${location}
EXPERIENCE: ${years_experience} years

REQUIRED ANALYSIS:
1. Salary ranges from Glassdoor, Levels.fyi, LinkedIn Salary, Indeed
2. 25th, 50th, 75th, and 90th percentile salaries
3. Total compensation including bonus, equity, benefits
4. Regional cost of living adjustments
5. In-demand skills that command premium pay
6. Recent salary trends (last 6 months)`}

${rateHistory && rateHistory.length > 0 ? `INTERNAL RATE HISTORY DATA:
${JSON.stringify(rateHistory.slice(0, 10), null, 2)}` : ''}

${jobOpps && jobOpps.length > 0 ? `RECENT JOB POSTINGS DATA:
${JSON.stringify(jobOpps.slice(0, 10), null, 2)}` : ''}

Return your analysis in the required JSON format.`;

    logger.info('Calling Lovable AI for market research synthesis');
    const { response: aiResponse, metrics: aiMetrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.2,
          max_tokens: 2000,
        },
        'generate-salary-report',
        user.id
      );

      await logAIUsage(aiMetrics);

      const researchResults = aiResponse.choices[0].message.content;

      // Step 5: Use AI to extract structured salary data
      const extractionPrompt = `Extract from this research:

${researchResults}

Internal data: ${JSON.stringify({ rateHistory, jobOpps })}

Return JSON with:
{
  "percentile_25": number,
  "percentile_50": number,
  "percentile_75": number,
  "percentile_90": number,
  "average_total_comp": number,
  "skill_premiums": { "skill_name": premium_dollars },
  "regional_adjustment": number,
  "data_sources": ["source1", "source2"]
}`;

      const { response: extractionResponse, metrics: extractionMetrics } = await retryWithBackoff(
        async () => await callLovableAI(
          {
            messages: [
              {
                role: 'system',
                content: 'You are a data extraction specialist. Return only valid JSON with salary data.'
              },
              {
                role: 'user',
                content: extractionPrompt
              }
            ],
            model: LOVABLE_AI_MODELS.DEFAULT,
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
          },
          'generate-salary-report-extraction',
          user.id
        ),
        3,
        (attempt, error) => {
          logger.warn(`Extraction retry attempt ${attempt}`, { error: error.message });
        }
      );

      await logAIUsage(extractionMetrics);

      const extractedText = extractionResponse.choices[0].message.content;
      const extractResult = extractJSON(extractedText, SalaryReportSchema);

      if (!extractResult.success) {
        logger.error('Extraction JSON parsing failed', {
          error: extractResult.error,
          content: extractedText.substring(0, 500)
        });
        throw new Error(`Invalid extraction response: ${extractResult.error}`);
      }

      const extractedData = extractResult.data;

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
          percentile_25: extractedData?.marketRate?.min || 0,
          percentile_50: extractedData?.marketRate?.median || 0,
          percentile_75: extractedData?.marketRate?.max || 0,
          percentile_90: extractedData?.marketRate?.max || 0,
          skill_premiums: {}
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

    // Step 8: Generate negotiation script with Perplexity
    const scriptPrompt = `Create a negotiation script for:
Job: ${job_title}
Location: ${location}
Current Offer: $${offer_details?.base_salary || 'TBD'}
Market Median: $${marketData?.extracted_data?.percentile_50 || 'N/A'}
Competitive Score: ${competitiveAnalysis.competitive_score || 'N/A'}/100

Include: Opening statement, market data reference, value proposition from achievements, counter-offer recommendation, alternative compensation discussion.`;

    const { response: scriptResponse, metrics: scriptMetrics } = await callLovableAI(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a salary negotiation expert. Create professional, data-driven negotiation scripts.'
          },
          {
            role: 'user',
            content: scriptPrompt
          }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      },
      'generate-salary-report-script',
      user.id
    );

    await logAIUsage(scriptMetrics);

    const negotiationScript = scriptResponse.choices[0].message.content;

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

    logger.logAICall({
      model: 'multi-step',
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startTime,
      cost: 0,
      success: true
    });

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
    logger.error('Request failed', error, {
      latencyMs: Date.now() - startTime
    });

    const aiError = handlePerplexityError(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: aiError.userMessage || aiError.message
      }),
      {
        status: aiError.statusCode || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
