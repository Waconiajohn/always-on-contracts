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
              name: 'analyze_resume',
              description: 'Deep analysis of resume content',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  resumeText: { type: 'string' }
                },
                required: ['userId', 'resumeText']
              }
            },
            {
              name: 'match_to_job',
              description: 'Match resume to specific job posting',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  jobDescription: { type: 'string' }
                },
                required: ['userId', 'jobDescription']
              }
            },
            {
              name: 'optimize_keywords',
              description: 'Optimize resume keywords for ATS',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  targetRole: { type: 'string' },
                  industry: { type: 'string' }
                },
                required: ['userId', 'targetRole']
              }
            },
            {
              name: 'generate_variants',
              description: 'Generate tailored resume variants',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  targetJobs: { type: 'array' }
                },
                required: ['userId', 'targetJobs']
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
          case 'analyze_resume':
            return await handleAnalyzeResume(supabaseClient, args);
          case 'match_to_job':
            return await handleMatchToJob(supabaseClient, args);
          case 'optimize_keywords':
            return await handleOptimizeKeywords(supabaseClient, args);
          case 'generate_variants':
            return await handleGenerateVariants(supabaseClient, args);
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
    console.error('Resume Intelligence MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleAnalyzeResume(supabaseClient: any, args: any) {
  const { userId, resumeText } = args;

  // Call existing parse-resume function
  const { data: parseResult, error: parseError } = await supabaseClient.functions.invoke('parse-resume', {
    body: { resumeText }
  });

  if (parseError) throw parseError;

  // Store or update analysis
  const { data, error } = await supabaseClient
    .from('career_war_chest')
    .upsert({
      user_id: userId,
      resume_raw_text: resumeText,
      initial_analysis: parseResult,
      last_updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data, analysis: parseResult }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleMatchToJob(supabaseClient: any, args: any) {
  const { userId, jobDescription } = args;

  // Get user's resume
  const { data: warChest } = await supabaseClient
    .from('career_war_chest')
    .select('resume_raw_text')
    .eq('user_id', userId)
    .single();

  if (!warChest?.resume_raw_text) {
    throw new Error('No resume found for user');
  }

  // Call score-resume-match function
  const { data: matchResult, error: matchError } = await supabaseClient.functions.invoke('score-resume-match', {
    body: { 
      resumeText: warChest.resume_raw_text,
      jobDescription 
    }
  });

  if (matchError) throw matchError;

  return new Response(JSON.stringify({ data: matchResult }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleOptimizeKeywords(supabaseClient: any, args: any) {
  const { userId, targetRole, industry } = args;

  // Call optimize-resume-detailed function
  const { data: optimizationResult, error: optimizationError } = await supabaseClient.functions.invoke('optimize-resume-detailed', {
    body: { 
      userId,
      targetRole,
      industry
    }
  });

  if (optimizationError) throw optimizationError;

  return new Response(JSON.stringify({ data: optimizationResult }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGenerateVariants(supabaseClient: any, args: any) {
  const { userId, targetJobs } = args;

  const variants = [];

  for (const job of targetJobs) {
    const { data: customizedResume, error } = await supabaseClient.functions.invoke('customize-resume', {
      body: {
        userId,
        jobDescription: job.description,
        jobTitle: job.title
      }
    });

    if (!error && customizedResume) {
      variants.push({
        jobId: job.id,
        customizedContent: customizedResume
      });
    }
  }

  return new Response(JSON.stringify({ success: true, variants }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
