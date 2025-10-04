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
              name: 'generate_questions',
              description: 'Generate interview questions based on job and user profile',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  jobDescription: { type: 'string' },
                  interviewType: { type: 'string' }
                },
                required: ['userId', 'jobDescription']
              }
            },
            {
              name: 'validate_response',
              description: 'Validate and score user interview response',
              inputSchema: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  response: { type: 'string' },
                  context: { type: 'object' }
                },
                required: ['question', 'response']
              }
            },
            {
              name: 'build_star_story',
              description: 'Help user build a STAR story',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  situation: { type: 'string' },
                  task: { type: 'string' },
                  action: { type: 'string' },
                  result: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'get_star_stories',
              description: 'Get user STAR stories',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'mock_interview',
              description: 'Conduct mock interview session',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  jobDescription: { type: 'string' },
                  sessionType: { type: 'string' }
                },
                required: ['userId', 'jobDescription']
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
          case 'generate_questions':
            return await handleGenerateQuestions(supabaseClient, args);
          case 'validate_response':
            return await handleValidateResponse(supabaseClient, args);
          case 'build_star_story':
            return await handleBuildStarStory(supabaseClient, args);
          case 'get_star_stories':
            return await handleGetStarStories(supabaseClient, args);
          case 'mock_interview':
            return await handleMockInterview(supabaseClient, args);
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
    console.error('Interview Prep MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleGenerateQuestions(supabaseClient: any, args: any) {
  const { userId, jobDescription, interviewType = 'behavioral' } = args;

  // Call generate-interview-question function
  const { data, error } = await supabaseClient.functions.invoke('generate-interview-question', {
    body: { userId, jobDescription, interviewType }
  });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleValidateResponse(supabaseClient: any, args: any) {
  const { question, response, context } = args;

  // Call validate-interview-response function
  const { data, error } = await supabaseClient.functions.invoke('validate-interview-response', {
    body: { question, response, context }
  });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleBuildStarStory(supabaseClient: any, args: any) {
  const { userId, situation, task, action, result } = args;

  if (situation && task && action && result) {
    // Save complete STAR story
    const { data, error } = await supabaseClient
      .from('star_stories')
      .insert({
        user_id: userId,
        situation,
        task,
        action,
        result,
        title: `${task.substring(0, 50)}...`
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } else {
    // Generate STAR story using AI
    const { data, error } = await supabaseClient.functions.invoke('generate-star-story', {
      body: { userId, situation, task, action, result }
    });

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetStarStories(supabaseClient: any, args: any) {
  const { userId } = args;

  const { data, error } = await supabaseClient
    .from('star_stories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleMockInterview(supabaseClient: any, args: any) {
  const { userId, jobDescription, sessionType = 'comprehensive' } = args;

  // This would orchestrate a full mock interview session
  // For now, return a structured session plan
  const session = {
    sessionId: crypto.randomUUID(),
    userId,
    sessionType,
    questions: [],
    status: 'initialized',
    created_at: new Date().toISOString()
  };

  return new Response(JSON.stringify({ data: session }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
