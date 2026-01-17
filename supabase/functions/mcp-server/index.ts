import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

// MCP Protocol Types
interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

serve(async (req) => {
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(requestOrigin);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate via API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = authHeader.substring(7);

    // Validate API key and get user
    const { data: keyData, error: keyError } = await supabaseClient
      .from('user_api_keys')
      .select('user_id, is_active')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = keyData.user_id;

    // Update last_used_at
    await supabaseClient
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('api_key', apiKey);

    // Parse MCP request
    const body = await req.json();
    const { method, params } = body;

    console.log('MCP request:', method, params);

    // Handle MCP methods
    switch (method) {
      case 'initialize': {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              resources: {},
              tools: {},
            },
            serverInfo: {
              name: 'CareerIQ MCP Server',
              version: '1.0.0',
            },
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'resources/list': {
        const resources: MCPResource[] = [
          {
            uri: 'opportunity://search',
            name: 'Search Opportunities',
            description: 'Search career opportunities (permanent and contract) across 30+ job boards',
            mimeType: 'application/json',
          },
          {
            uri: 'opportunity://matches',
            name: 'My Matches',
            description: 'View AI-matched opportunities for your profile',
            mimeType: 'application/json',
          },
          {
            uri: 'opportunity://agencies',
            name: 'Staffing Agencies',
            description: 'Browse 200+ staffing agencies database',
            mimeType: 'application/json',
          },
        ];

        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: { resources },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'resources/read': {
        const { uri } = params;

        if (uri === 'opportunity://matches') {
          // Get user's matches
          const { data: matches, error } = await supabaseClient
            .from('opportunity_matches')
            .select(`
              *,
              job_opportunities (
                *,
                staffing_agencies (
                  agency_name,
                  location
                )
              )
            `)
            .eq('user_id', userId)
            .order('match_score', { ascending: false })
            .limit(20);

          if (error) throw error;

          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(matches, null, 2),
              }],
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (uri === 'opportunity://agencies') {
          const { data: agencies, error } = await supabaseClient
            .from('staffing_agencies')
            .select('*')
            .order('agency_name')
            .limit(50);

          if (error) throw error;

          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(agencies, null, 2),
              }],
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          error: { code: -32602, message: 'Unknown resource URI' },
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'tools/list': {
        const tools: MCPTool[] = [
          {
            name: 'search_opportunities',
            description: 'Search for career opportunities (permanent and contract) by skills, location, and rate',
            inputSchema: {
              type: 'object',
              properties: {
                skills: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Skills to search for (e.g., ["Operations Management", "Lean Manufacturing"])',
                },
                location: {
                  type: 'string',
                  description: 'Location filter (e.g., "Remote", "New York, NY")',
                },
                rate_min: {
                  type: 'number',
                  description: 'Minimum hourly rate',
                },
                rate_max: {
                  type: 'number',
                  description: 'Maximum hourly rate',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 20)',
                },
              },
            },
          },
          {
            name: 'get_match_details',
            description: 'Get detailed information about a specific opportunity match',
            inputSchema: {
              type: 'object',
              properties: {
                match_id: {
                  type: 'string',
                  description: 'The UUID of the opportunity match',
                },
              },
              required: ['match_id'],
            },
          },
          {
            name: 'update_match_status',
            description: 'Update the status of an opportunity match (e.g., mark as reviewing, applied, rejected)',
            inputSchema: {
              type: 'object',
              properties: {
                match_id: {
                  type: 'string',
                  description: 'The UUID of the opportunity match',
                },
                status: {
                  type: 'string',
                  description: 'New status: "new", "reviewing", "applied", "rejected", "interested"',
                  enum: ['new', 'reviewing', 'applied', 'rejected', 'interested'],
                },
              },
              required: ['match_id', 'status'],
            },
          },
          {
            name: 'apply_to_match',
            description: 'Mark an opportunity match as applied (sets status to "applied" and records applied date)',
            inputSchema: {
              type: 'object',
              properties: {
                match_id: {
                  type: 'string',
                  description: 'The UUID of the opportunity match',
                },
              },
              required: ['match_id'],
            },
          },
        ];

        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: { tools },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'tools/call': {
        const { name, arguments: args } = params;

        if (name === 'search_opportunities') {
          let query = supabaseClient
            .from('job_opportunities')
            .select(`
              *,
              staffing_agencies (
                agency_name,
                location
              )
            `)
            .eq('status', 'active');

          // Apply filters
          if (args.skills && args.skills.length > 0) {
            query = query.overlaps('required_skills', args.skills);
          }

          if (args.location) {
            query = query.ilike('location', `%${args.location}%`);
          }

          if (args.rate_min) {
            query = query.gte('hourly_rate_min', args.rate_min);
          }

          if (args.rate_max) {
            query = query.lte('hourly_rate_max', args.rate_max);
          }

          const limit = args.limit || 20;
          query = query.limit(limit);

          const { data: opportunities, error } = await query;

          if (error) throw error;

          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  found: opportunities.length,
                  opportunities,
                }, null, 2),
              }],
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (name === 'get_match_details') {
          const { data: match, error } = await supabaseClient
            .from('opportunity_matches')
            .select(`
              *,
              job_opportunities (
                *,
                staffing_agencies (
                  agency_name,
                  location,
                  contact_email,
                  contact_phone,
                  website
                )
              )
            `)
            .eq('id', args.match_id)
            .eq('user_id', userId)
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(match, null, 2),
              }],
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (name === 'update_match_status') {
          const { data: match, error } = await supabaseClient
            .from('opportunity_matches')
            .update({ status: args.status })
            .eq('id', args.match_id)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: `Match status updated to "${args.status}"`,
                  match,
                }, null, 2),
              }],
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (name === 'apply_to_match') {
          const { data: match, error } = await supabaseClient
            .from('opportunity_matches')
            .update({ 
              status: 'applied',
              applied_date: new Date().toISOString(),
            })
            .eq('id', args.match_id)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Successfully marked as applied',
                  match,
                }, null, 2),
              }],
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          error: { code: -32602, message: 'Unknown tool' },
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default: {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          error: { code: -32601, message: 'Method not found' },
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error: any) {
    console.error('MCP server error:', error);
    const requestOrigin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(requestOrigin);
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
