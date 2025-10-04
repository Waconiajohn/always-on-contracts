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
              name: 'generate_email',
              description: 'Generate personalized networking email',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  recipientRole: { type: 'string' },
                  context: { type: 'string' },
                  templateType: { type: 'string' }
                },
                required: ['userId', 'recipientRole', 'context']
              }
            },
            {
              name: 'schedule_follow_up',
              description: 'Schedule follow-up reminder',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  contactInfo: { type: 'object' },
                  followUpDate: { type: 'string' },
                  notes: { type: 'string' }
                },
                required: ['userId', 'contactInfo', 'followUpDate']
              }
            },
            {
              name: 'track_interaction',
              description: 'Track networking interaction',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  contactName: { type: 'string' },
                  interactionType: { type: 'string' },
                  notes: { type: 'string' },
                  outcome: { type: 'string' }
                },
                required: ['userId', 'contactName', 'interactionType']
              }
            },
            {
              name: 'get_templates',
              description: 'Get communication templates',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  templateType: { type: 'string' }
                },
                required: ['userId']
              }
            },
            {
              name: 'save_template',
              description: 'Save custom communication template',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  templateName: { type: 'string' },
                  templateType: { type: 'string' },
                  content: { type: 'string' }
                },
                required: ['userId', 'templateName', 'templateType', 'content']
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
          case 'generate_email':
            return await handleGenerateEmail(supabaseClient, args);
          case 'schedule_follow_up':
            return await handleScheduleFollowUp(supabaseClient, args);
          case 'track_interaction':
            return await handleTrackInteraction(supabaseClient, args);
          case 'get_templates':
            return await handleGetTemplates(supabaseClient, args);
          case 'save_template':
            return await handleSaveTemplate(supabaseClient, args);
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
    console.error('Networking Orchestrator MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleGenerateEmail(supabaseClient: any, args: any) {
  const { userId, recipientRole, context, templateType = 'introduction' } = args;

  // Get user profile for personalization
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Here we would use Lovable AI to generate personalized email
  // For now, return a template structure
  const emailTemplate = {
    subject: `Regarding ${context}`,
    body: `Hi,\n\nI hope this message finds you well.\n\n[Personalized content based on ${templateType}]\n\nBest regards,\n${profile?.full_name || 'Your name'}`,
    suggested_cta: 'Would you be open to a brief call to discuss this further?'
  };

  return new Response(JSON.stringify({ data: emailTemplate }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleScheduleFollowUp(supabaseClient: any, args: any) {
  const { userId, contactInfo, followUpDate, notes } = args;

  // Store follow-up in outreach_tracking
  const { data, error } = await supabaseClient
    .from('outreach_tracking')
    .insert({
      user_id: userId,
      agency_id: contactInfo.agencyId, // If applicable
      outreach_type: 'follow_up',
      next_follow_up_date: followUpDate,
      notes,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTrackInteraction(supabaseClient: any, args: any) {
  const { userId, contactName, interactionType, notes, outcome } = args;

  // Log interaction
  const interaction = {
    userId,
    contactName,
    interactionType,
    notes,
    outcome,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify({ success: true, data: interaction }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetTemplates(supabaseClient: any, args: any) {
  const { userId, templateType } = args;

  let query = supabaseClient
    .from('communication_templates')
    .select('*')
    .eq('user_id', userId);

  if (templateType) {
    query = query.eq('template_type', templateType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleSaveTemplate(supabaseClient: any, args: any) {
  const { userId, templateName, templateType, content } = args;

  const { data, error } = await supabaseClient
    .from('communication_templates')
    .insert({
      user_id: userId,
      template_name: templateName,
      template_type: templateType,
      body_content: content
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
