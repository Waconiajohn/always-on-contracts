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
              name: 'evaluate_opportunity',
              description: 'Evaluate if opportunity should be auto-applied or queued',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  opportunityId: { type: 'string' },
                  matchScore: { type: 'number' }
                },
                required: ['userId', 'opportunityId', 'matchScore']
              }
            },
            {
              name: 'auto_apply',
              description: 'Automatically submit application',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  opportunityId: { type: 'string' },
                  customizedResumeUrl: { type: 'string' }
                },
                required: ['userId', 'opportunityId']
              }
            },
            {
              name: 'add_to_queue',
              description: 'Add opportunity to review queue',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  opportunityId: { type: 'string' },
                  matchScore: { type: 'number' },
                  aiNotes: { type: 'string' }
                },
                required: ['userId', 'opportunityId', 'matchScore']
              }
            },
            {
              name: 'track_application',
              description: 'Track application status',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  opportunityId: { type: 'string' },
                  status: { type: 'string' }
                },
                required: ['userId', 'opportunityId', 'status']
              }
            },
            {
              name: 'get_daily_stats',
              description: 'Get daily application statistics',
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
          case 'evaluate_opportunity':
            return await handleEvaluateOpportunity(supabaseClient, args);
          case 'auto_apply':
            return await handleAutoApply(supabaseClient, args);
          case 'add_to_queue':
            return await handleAddToQueue(supabaseClient, args);
          case 'track_application':
            return await handleTrackApplication(supabaseClient, args);
          case 'get_daily_stats':
            return await handleGetDailyStats(supabaseClient, args);
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
    console.error('Application Automation MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleEvaluateOpportunity(supabaseClient: any, args: any) {
  const { userId, opportunityId, matchScore } = args;

  // Get user's automation settings
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('automation_mode, match_threshold_auto_apply, match_threshold_queue, max_daily_applications')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  let decision = 'review'; // default
  
  if (profile.automation_mode === 'auto' && matchScore >= profile.match_threshold_auto_apply) {
    decision = 'auto_apply';
  } else if (matchScore >= profile.match_threshold_queue) {
    decision = 'queue';
  }

  return new Response(JSON.stringify({ 
    decision,
    matchScore,
    thresholds: {
      auto_apply: profile.match_threshold_auto_apply,
      queue: profile.match_threshold_queue
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAutoApply(supabaseClient: any, args: any) {
  const { userId, opportunityId, customizedResumeUrl } = args;

  // Check daily application limit
  const today = new Date().toISOString().split('T')[0];
  const { data: todayApps, error: countError } = await supabaseClient
    .from('application_tracking')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('submitted_at', today);

  if (countError) throw countError;

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('max_daily_applications')
    .eq('user_id', userId)
    .single();

  if (todayApps && todayApps.length >= (profile?.max_daily_applications || 5)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Daily application limit reached',
      limit_reached: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Create application tracking record
  const { data, error } = await supabaseClient
    .from('application_tracking')
    .insert({
      user_id: userId,
      opportunity_id: opportunityId,
      customized_resume_url: customizedResumeUrl,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      application_method: 'automated'
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAddToQueue(supabaseClient: any, args: any) {
  const { userId, opportunityId, matchScore, aiNotes } = args;

  const { data, error } = await supabaseClient
    .from('application_queue')
    .insert({
      user_id: userId,
      opportunity_id: opportunityId,
      match_score: matchScore,
      ai_customization_notes: aiNotes,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTrackApplication(supabaseClient: any, args: any) {
  const { userId, opportunityId, status } = args;

  const { data, error } = await supabaseClient
    .from('application_tracking')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetDailyStats(supabaseClient: any, args: any) {
  const { userId } = args;

  const today = new Date().toISOString().split('T')[0];
  
  const { data: applications, error } = await supabaseClient
    .from('application_tracking')
    .select('status')
    .eq('user_id', userId)
    .gte('submitted_at', today);

  if (error) throw error;

  const stats = {
    total_today: applications?.length || 0,
    by_status: applications?.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {}) || {}
  };

  return new Response(JSON.stringify({ data: stats }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
