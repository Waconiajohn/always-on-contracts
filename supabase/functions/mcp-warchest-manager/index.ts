import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MCPToolCall {
  method: 'tools/call' | 'tools/list' | 'resources/read' | 'resources/list';
  params?: {
    name?: string;
    arguments?: Record<string, any>;
    uri?: string;
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
              name: 'create',
              description: 'Initialize war chest for user',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  resumeText: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'get',
              description: 'Retrieve war chest data',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'add_response',
              description: 'Store interview response',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  question: { type: 'string' },
                  response: { type: 'string' },
                  phase: { type: 'string' }
                },
                required: ['userId', 'question', 'response', 'phase']
              }
            },
            {
              name: 'generate_question',
              description: 'Create next contextual question',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  phase: { type: 'string' },
                  previousResponses: { type: 'array' }
                },
                required: ['userId', 'phase']
              }
            },
            {
              name: 'get_power_phrases',
              description: 'Extract achievement statements',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'get_transferable_skills',
              description: 'Identify transferable skills',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'get_hidden_competencies',
              description: 'Find implicit capabilities',
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
          case 'create':
            return await handleCreate(supabaseClient, args);
          case 'get':
            return await handleGet(supabaseClient, args);
          case 'add_response':
            return await handleAddResponse(supabaseClient, args);
          case 'get_power_phrases':
            return await handleGetPowerPhrases(supabaseClient, args);
          case 'get_transferable_skills':
            return await handleGetTransferableSkills(supabaseClient, args);
          case 'get_hidden_competencies':
            return await handleGetHiddenCompetencies(supabaseClient, args);
          default:
            return new Response(JSON.stringify({ error: 'Unknown tool' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

      case 'resources/list':
        return new Response(JSON.stringify({
          resources: [
            {
              uri: 'warchest://user/{userId}/data',
              name: 'War Chest Data',
              description: 'Full war chest JSON for user'
            },
            {
              uri: 'warchest://user/{userId}/responses',
              name: 'Interview Responses',
              description: 'All interview responses'
            },
            {
              uri: 'warchest://user/{userId}/strength_score',
              name: 'Strength Score',
              description: 'Calculated overall strength score'
            }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Unknown method' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('War Chest MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleCreate(supabaseClient: any, args: any) {
  const { userId, resumeText } = args;

  const { data, error } = await supabaseClient
    .from('career_war_chest')
    .insert({
      user_id: userId,
      resume_raw_text: resumeText,
      overall_strength_score: 0,
      interview_completion_percentage: 0
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGet(supabaseClient: any, args: any) {
  const { userId } = args;

  const { data, error } = await supabaseClient
    .from('career_war_chest')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAddResponse(supabaseClient: any, args: any) {
  const { userId, question, response, phase } = args;

  // Get war chest
  const { data: warChest } = await supabaseClient
    .from('career_war_chest')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!warChest) {
    throw new Error('War chest not found');
  }

  const { data, error } = await supabaseClient
    .from('war_chest_interview_responses')
    .insert({
      user_id: userId,
      war_chest_id: warChest.id,
      question,
      response,
      phase
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetPowerPhrases(supabaseClient: any, args: any) {
  const { userId } = args;

  const { data, error } = await supabaseClient
    .from('war_chest_power_phrases')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetTransferableSkills(supabaseClient: any, args: any) {
  const { userId } = args;

  const { data, error } = await supabaseClient
    .from('war_chest_transferable_skills')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetHiddenCompetencies(supabaseClient: any, args: any) {
  const { userId } = args;

  const { data, error } = await supabaseClient
    .from('war_chest_hidden_competencies')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
