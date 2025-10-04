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
              name: 'match_agencies',
              description: 'Match user profile with relevant staffing agencies',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  targetRoles: { type: 'array' },
                  industries: { type: 'array' },
                  location: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'get_agency_insights',
              description: 'Get insights about specific agency',
              inputSchema: {
                type: 'object',
                properties: {
                  agencyId: { type: 'string' }
                },
                required: ['agencyId']
              }
            },
            {
              name: 'track_outreach',
              description: 'Track outreach to agency',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  agencyId: { type: 'string' },
                  outreachType: { type: 'string' },
                  notes: { type: 'string' }
                },
                required: ['userId', 'agencyId', 'outreachType']
              }
            },
            {
              name: 'get_outreach_history',
              description: 'Get outreach history for user',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'rate_agency',
              description: 'Submit agency rating',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  agencyId: { type: 'string' },
                  rating: { type: 'number' },
                  reviewText: { type: 'string' }
                },
                required: ['userId', 'agencyId', 'rating']
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
          case 'match_agencies':
            return await handleMatchAgencies(supabaseClient, args);
          case 'get_agency_insights':
            return await handleGetAgencyInsights(supabaseClient, args);
          case 'track_outreach':
            return await handleTrackOutreach(supabaseClient, args);
          case 'get_outreach_history':
            return await handleGetOutreachHistory(supabaseClient, args);
          case 'rate_agency':
            return await handleRateAgency(supabaseClient, args);
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
    console.error('Agency Matcher MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleMatchAgencies(supabaseClient: any, args: any) {
  const { userId, targetRoles = [], industries = [], location } = args;

  // Get user profile
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get all agencies
  const { data: agencies, error } = await supabaseClient
    .from('staffing_agencies')
    .select('*');

  if (error) throw error;

  // Simple matching logic - can be enhanced with AI
  const matches = agencies?.map((agency: any) => {
    let score = 0;
    
    // Match specialization
    if (agency.specialization) {
      const matchingSpecializations = agency.specialization.filter((spec: string) => 
        industries.includes(spec) || targetRoles.some((role: string) => spec.toLowerCase().includes(role.toLowerCase()))
      );
      score += matchingSpecializations.length * 10;
    }

    // Location match
    if (location && agency.location?.includes(location)) {
      score += 20;
    }

    return {
      ...agency,
      match_score: score
    };
  }).sort((a: any, b: any) => b.match_score - a.match_score);

  return new Response(JSON.stringify({ data: matches }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetAgencyInsights(supabaseClient: any, args: any) {
  const { agencyId } = args;

  // Get agency details
  const { data: agency, error: agencyError } = await supabaseClient
    .from('staffing_agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  if (agencyError) throw agencyError;

  // Get ratings
  const { data: ratings, error: ratingsError } = await supabaseClient
    .from('agency_ratings')
    .select('*')
    .eq('agency_id', agencyId);

  if (ratingsError) throw ratingsError;

  const averageRating = ratings?.length 
    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
    : 0;

  return new Response(JSON.stringify({ 
    data: {
      ...agency,
      average_rating: averageRating,
      total_ratings: ratings?.length || 0,
      ratings
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTrackOutreach(supabaseClient: any, args: any) {
  const { userId, agencyId, outreachType, notes } = args;

  const { data, error } = await supabaseClient
    .from('outreach_tracking')
    .insert({
      user_id: userId,
      agency_id: agencyId,
      outreach_type: outreachType,
      notes,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetOutreachHistory(supabaseClient: any, args: any) {
  const { userId } = args;

  const { data, error } = await supabaseClient
    .from('outreach_tracking')
    .select(`
      *,
      staffing_agencies (
        agency_name,
        specialization
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleRateAgency(supabaseClient: any, args: any) {
  const { userId, agencyId, rating, reviewText } = args;

  const { data, error } = await supabaseClient
    .from('agency_ratings')
    .upsert({
      user_id: userId,
      agency_id: agencyId,
      rating,
      review_text: reviewText
    }, {
      onConflict: 'user_id,agency_id'
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
