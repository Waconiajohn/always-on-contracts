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
              name: 'remember',
              description: 'Store a memory for a persona about a user',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  persona: { type: 'string', enum: ['robert', 'sophia', 'nexus'] },
                  memoryType: { type: 'string', enum: ['fact', 'preference', 'goal', 'concern', 'progress', 'mood'] },
                  content: { type: 'string' },
                  importance: { type: 'number', minimum: 1, maximum: 10 }
                },
                required: ['userId', 'persona', 'memoryType', 'content']
              }
            },
            {
              name: 'recall',
              description: 'Retrieve memories for a persona about a user',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  persona: { type: 'string', enum: ['robert', 'sophia', 'nexus'] },
                  limit: { type: 'number', default: 20 }
                },
                required: ['userId', 'persona']
              }
            },
            {
              name: 'handoff',
              description: 'Transfer context from one persona to another',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  fromPersona: { type: 'string', enum: ['robert', 'sophia', 'nexus'] },
                  toPersona: { type: 'string', enum: ['robert', 'sophia', 'nexus'] },
                  context: { type: 'string' }
                },
                required: ['userId', 'fromPersona', 'toPersona', 'context']
              }
            },
            {
              name: 'track_progress',
              description: 'Track user progress on a specific goal',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  persona: { type: 'string', enum: ['robert', 'sophia', 'nexus'] },
                  goal: { type: 'string' },
                  progress: { type: 'number', minimum: 0, maximum: 100 },
                  notes: { type: 'string' }
                },
                required: ['userId', 'persona', 'goal', 'progress']
              }
            },
            {
              name: 'analyze_mood',
              description: 'Analyze user mood from conversation',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  persona: { type: 'string', enum: ['robert', 'sophia', 'nexus'] },
                  conversationText: { type: 'string' }
                },
                required: ['userId', 'persona', 'conversationText']
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
          case 'remember':
            return await handleRemember(supabaseClient, args);
          case 'recall':
            return await handleRecall(supabaseClient, args);
          case 'handoff':
            return await handleHandoff(supabaseClient, args);
          case 'track_progress':
            return await handleTrackProgress(supabaseClient, args);
          case 'analyze_mood':
            return await handleAnalyzeMood(supabaseClient, args);
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
    console.error('Persona Memory MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleRemember(supabaseClient: any, args: any) {
  const { userId, persona, memoryType, content, importance = 5 } = args;

  const { data, error } = await supabaseClient
    .from('persona_memories')
    .insert({
      user_id: userId,
      persona_id: persona,
      memory_type: memoryType,
      content,
      importance,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, memory: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleRecall(supabaseClient: any, args: any) {
  const { userId, persona, limit = 20 } = args;

  const { data, error } = await supabaseClient
    .from('persona_memories')
    .select('*')
    .eq('user_id', userId)
    .eq('persona_id', persona)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return new Response(JSON.stringify({ memories: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleHandoff(supabaseClient: any, args: any) {
  const { userId, fromPersona, toPersona, context } = args;

  // Store handoff context
  const { data, error } = await supabaseClient
    .from('persona_conversations')
    .insert({
      user_id: userId,
      persona_id: toPersona,
      message: `[HANDOFF from ${fromPersona}] ${context}`,
      sender: 'system',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, handoff: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTrackProgress(supabaseClient: any, args: any) {
  const { userId, persona, goal, progress, notes } = args;

  const { data, error } = await supabaseClient
    .from('persona_memories')
    .insert({
      user_id: userId,
      persona_id: persona,
      memory_type: 'progress',
      content: JSON.stringify({ goal, progress, notes }),
      importance: 8,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, progress: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAnalyzeMood(supabaseClient: any, args: any) {
  const { userId, persona, conversationText } = args;

  // Simple sentiment analysis (in production, use Lovable AI)
  const sentimentKeywords = {
    positive: ['excited', 'happy', 'confident', 'great', 'excellent', 'motivated'],
    negative: ['frustrated', 'worried', 'anxious', 'stressed', 'difficult', 'struggling'],
    neutral: ['okay', 'fine', 'alright', 'normal']
  };

  const text = conversationText.toLowerCase();
  let mood = 'neutral';
  
  if (sentimentKeywords.positive.some(word => text.includes(word))) {
    mood = 'positive';
  } else if (sentimentKeywords.negative.some(word => text.includes(word))) {
    mood = 'needs_support';
  }

  const { data, error } = await supabaseClient
    .from('persona_memories')
    .insert({
      user_id: userId,
      persona_id: persona,
      memory_type: 'mood',
      content: mood,
      importance: 7,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ mood, memory: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
