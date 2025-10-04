import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MCPToolCall {
  method: 'tools/call' | 'tools/list';
  params?: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { method, params }: MCPToolCall = await req.json();

    switch (method) {
      case 'tools/list':
        return new Response(JSON.stringify({
          tools: [
            {
              name: 'get_market_rates',
              description: 'Get market rate data for role and location',
              inputSchema: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  location: { type: 'string' },
                  yearsExperience: { type: 'number' }
                },
                required: ['role']
              }
            },
            {
              name: 'analyze_trends',
              description: 'Analyze job market trends',
              inputSchema: {
                type: 'object',
                properties: {
                  industry: { type: 'string' },
                  timeframe: { type: 'string' },
                  metrics: { type: 'array' }
                },
                required: ['industry']
              }
            },
            {
              name: 'get_salary_insights',
              description: 'Get detailed salary insights',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  targetRole: { type: 'string' },
                  targetIndustry: { type: 'string' }
                },
                required: ['userId', 'targetRole']
              }
            },
            {
              name: 'compare_offers',
              description: 'Compare multiple job offers',
              inputSchema: {
                type: 'object',
                properties: {
                  offers: { type: 'array' }
                },
                required: ['offers']
              }
            },
            {
              name: 'get_competitive_position',
              description: 'Analyze competitive position in market',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' }
                },
                required: ['userId']
              }
            }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'tools/call':
        const toolName = params?.name;
        const args = params?.arguments || {};

        switch (toolName) {
          case 'get_market_rates':
            return await handleGetMarketRates(supabaseClient, args);
          case 'analyze_trends':
            return await handleAnalyzeTrends(supabaseClient, args);
          case 'get_salary_insights':
            return await handleGetSalaryInsights(supabaseClient, args);
          case 'compare_offers':
            return await handleCompareOffers(supabaseClient, args);
          case 'get_competitive_position':
            return await handleGetCompetitivePosition(supabaseClient, args);
          default:
            return new Response(JSON.stringify({ error: 'Unknown tool' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

      default:
        return new Response(JSON.stringify({ error: 'Unknown method' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Market Intelligence MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleGetMarketRates(supabaseClient: any, args: any) {
  const { role, location, yearsExperience } = args;

  // Query rate_history table
  const { data: historicalRates, error } = await supabaseClient
    .from('rate_history')
    .select('*')
    .ilike('position_title', `%${role}%`)
    .order('recorded_date', { ascending: false })
    .limit(100);

  if (error) throw error;

  // Calculate statistics
  const rates = historicalRates?.map((r: any) => r.hourly_rate).filter(Boolean) || [];
  const avg = rates.length ? rates.reduce((a: number, b: number) => a + b, 0) / rates.length : 0;
  const sorted = rates.sort((a: number, b: number) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  return new Response(JSON.stringify({ 
    data: {
      role,
      location,
      averageRate: avg,
      medianRate: median,
      minRate: Math.min(...rates) || 0,
      maxRate: Math.max(...rates) || 0,
      sampleSize: rates.length,
      historicalData: historicalRates
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAnalyzeTrends(supabaseClient: any, args: any) {
  const { industry, timeframe = '90days', metrics = ['rate', 'volume'] } = args;

  // Get recent job opportunities
  const daysAgo = parseInt(timeframe.replace('days', '')) || 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const { data: opportunities, error } = await supabaseClient
    .from('job_opportunities')
    .select('*')
    .gte('posted_date', cutoffDate.toISOString())
    .order('posted_date', { ascending: false });

  if (error) throw error;

  const trends = {
    totalOpportunities: opportunities?.length || 0,
    averageRate: 0,
    contractTypes: {} as Record<string, number>,
    locations: {} as Record<string, number>
  };

  opportunities?.forEach((opp: any) => {
    // Count contract types
    if (opp.contract_type) {
      trends.contractTypes[opp.contract_type] = (trends.contractTypes[opp.contract_type] || 0) + 1;
    }
    
    // Count locations
    if (opp.location) {
      trends.locations[opp.location] = (trends.locations[opp.location] || 0) + 1;
    }
  });

  return new Response(JSON.stringify({ data: trends }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetSalaryInsights(supabaseClient: any, args: any) {
  const { userId, targetRole, targetIndustry } = args;

  // Get user profile
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get market rates for target role
  const marketData = await handleGetMarketRates(supabaseClient, { 
    role: targetRole, 
    location: profile?.preferred_location 
  });

  const marketRates = JSON.parse(await marketData.text()).data;

  return new Response(JSON.stringify({ 
    data: {
      targetRole,
      targetIndustry,
      marketRates,
      userExperience: profile?.years_experience,
      recommendations: {
        minimumRate: marketRates.medianRate * 0.9,
        targetRate: marketRates.medianRate,
        stretchRate: marketRates.maxRate * 0.9
      }
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleCompareOffers(supabaseClient: any, args: any) {
  const { offers } = args;

  const comparison = offers.map((offer: any) => {
    const totalCompensation = offer.salary + (offer.bonus || 0) + (offer.benefits || 0);
    
    return {
      ...offer,
      totalCompensation,
      hourlyEquivalent: totalCompensation / 2080, // Assuming 2080 work hours/year
      score: 0 // Would calculate based on various factors
    };
  });

  return new Response(JSON.stringify({ data: comparison }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetCompetitivePosition(supabaseClient: any, args: any) {
  const { userId } = args;

  // Get user profile
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get resume analysis
  const { data: analysis } = await supabaseClient
    .from('resume_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const position = {
    experienceLevel: profile?.years_experience || 0,
    skillCount: analysis?.skills?.length || 0,
    competitiveScore: 0, // Would calculate based on various factors
    strengths: [],
    improvementAreas: []
  };

  return new Response(JSON.stringify({ data: position }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
