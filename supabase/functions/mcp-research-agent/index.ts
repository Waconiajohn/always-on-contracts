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
              name: 'scan_sources',
              description: 'Scan job search advice sources for new insights',
              inputSchema: {
                type: 'object',
                properties: {
                  sources: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'URLs to scan'
                  }
                },
                required: []
              }
            },
            {
              name: 'analyze_trends',
              description: 'Analyze research findings for patterns and trends',
              inputSchema: {
                type: 'object',
                properties: {
                  timeframe: { type: 'string', description: 'Timeframe to analyze (e.g., "30days")' },
                  category: { type: 'string' }
                },
                required: []
              }
            },
            {
              name: 'create_experiment',
              description: 'Create a new A/B experiment for testing strategies',
              inputSchema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  hypothesis: { type: 'string' },
                  control_variant: { type: 'string' },
                  test_variant: { type: 'string' }
                },
                required: ['name', 'description', 'hypothesis', 'control_variant', 'test_variant']
              }
            },
            {
              name: 'track_results',
              description: 'Track experiment results and outcomes',
              inputSchema: {
                type: 'object',
                properties: {
                  experimentId: { type: 'string' },
                  userId: { type: 'string' },
                  outcome: { type: 'object' }
                },
                required: ['experimentId', 'userId', 'outcome']
              }
            },
            {
              name: 'get_active_experiments',
              description: 'Get all active experiments',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
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
          case 'scan_sources':
            return await handleScanSources(supabaseClient, args);
          case 'analyze_trends':
            return await handleAnalyzeTrends(supabaseClient, args);
          case 'create_experiment':
            return await handleCreateExperiment(supabaseClient, args);
          case 'track_results':
            return await handleTrackResults(supabaseClient, args);
          case 'get_active_experiments':
            return await handleGetActiveExperiments(supabaseClient, args);
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
    console.error('Research Agent MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleScanSources(supabaseClient: any, args: any) {
  const { sources = [] } = args;
  
  // Placeholder for actual web scraping logic
  // In production, this would use the Lovable AI to analyze content
  
  return new Response(JSON.stringify({ 
    success: true, 
    scanned: sources.length,
    message: 'Source scanning initiated'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAnalyzeTrends(supabaseClient: any, args: any) {
  const { timeframe = '30days', category } = args;
  
  const { data: findings, error } = await supabaseClient
    .from('research_findings')
    .select('*')
    .eq('is_verified', true)
    .order('discovered_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return new Response(JSON.stringify({ 
    data: findings,
    trends_analyzed: findings?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleCreateExperiment(supabaseClient: any, args: any) {
  const { name, description, hypothesis, control_variant, test_variant } = args;

  const featureFlag = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const { data, error } = await supabaseClient
    .from('experiments')
    .insert({
      experiment_name: name,
      description,
      hypothesis,
      feature_flag: featureFlag,
      control_variant,
      test_variant,
      status: 'draft'
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTrackResults(supabaseClient: any, args: any) {
  const { experimentId, userId, outcome } = args;

  const { data, error } = await supabaseClient
    .from('user_experiments')
    .update({
      outcome_data: outcome
    })
    .eq('experiment_id', experimentId)
    .eq('user_id', userId)
    .select();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetActiveExperiments(supabaseClient: any, args: any) {
  const { data, error } = await supabaseClient
    .from('experiments')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
