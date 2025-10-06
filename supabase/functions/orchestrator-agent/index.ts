import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MCPRequest {
  action: string;
  params: Record<string, any>;
  userId?: string;
}

interface MCPServerConfig {
  url: string;
  type: 'custom' | 'external';
  apiKey?: string;
}

const MCP_SERVERS: Record<string, MCPServerConfig> = {
  'vault': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-vault-manager`,
    type: 'custom'
  },
  'persona-memory': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-persona-memory`,
    type: 'custom'
  },
  'research': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-research-agent`,
    type: 'custom'
  },
  'resume': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-resume-intelligence`,
    type: 'custom'
  },
  'application': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-application-automation`,
    type: 'custom'
  },
  'interview': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-interview-prep`,
    type: 'custom'
  },
  'agency': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-agency-matcher`,
    type: 'custom'
  },
  'networking': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-networking-orchestrator`,
    type: 'custom'
  },
  'market': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-market-intelligence`,
    type: 'custom'
  },
  'jobs': {
    url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-job-scraper`,
    type: 'custom'
  },
  'apify-jobs': {
    url: 'https://api.apify.com/v2/acts',
    type: 'external',
    apiKey: Deno.env.get('APIFY_API_KEY')
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, params }: MCPRequest = await req.json();
    console.log(`Orchestrator received action: ${action}`);

    // Route action to appropriate MCP server
    const [serverName, toolName] = action.split('.');
    const serverConfig = MCP_SERVERS[serverName];

    if (!serverConfig) {
      return new Response(JSON.stringify({ error: `Unknown MCP server: ${serverName}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call MCP server
    const mcpResponse = await callMCPTool(serverConfig, toolName, { ...params, userId: user.id });

    return new Response(JSON.stringify(mcpResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Orchestrator error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function callMCPTool(
  serverConfig: MCPServerConfig,
  toolName: string,
  params: Record<string, any>
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (serverConfig.type === 'custom') {
    headers['Authorization'] = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;
  } else if (serverConfig.apiKey) {
    headers['Authorization'] = `Bearer ${serverConfig.apiKey}`;
  }

  const response = await fetch(serverConfig.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MCP call failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}
