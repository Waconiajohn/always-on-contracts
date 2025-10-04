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
              name: 'scrape_jobs',
              description: 'Scrape job listings from multiple sources',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  location: { type: 'string' },
                  sources: { type: 'array', items: { type: 'string' } },
                  maxResults: { type: 'number' }
                },
                required: ['query']
              }
            },
            {
              name: 'monitor_jobs',
              description: 'Set up continuous job monitoring',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  searchCriteria: { type: 'object' },
                  frequency: { type: 'string' }
                },
                required: ['userId', 'searchCriteria']
              }
            },
            {
              name: 'enrich_job',
              description: 'Enrich job posting with additional data',
              inputSchema: {
                type: 'object',
                properties: {
                  jobId: { type: 'string' },
                  companyName: { type: 'string' }
                },
                required: ['jobId']
              }
            },
            {
              name: 'deduplicate_jobs',
              description: 'Remove duplicate job postings',
              inputSchema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' }
                },
                required: ['sessionId']
              }
            },
            {
              name: 'get_scrape_status',
              description: 'Get status of scraping job',
              inputSchema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' }
                },
                required: ['sessionId']
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
          case 'scrape_jobs':
            return await handleScrapeJobs(supabaseClient, args);
          case 'monitor_jobs':
            return await handleMonitorJobs(supabaseClient, args);
          case 'enrich_job':
            return await handleEnrichJob(supabaseClient, args);
          case 'deduplicate_jobs':
            return await handleDeduplicateJobs(supabaseClient, args);
          case 'get_scrape_status':
            return await handleGetScrapeStatus(supabaseClient, args);
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
    console.error('Job Scraper MCP error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleScrapeJobs(supabaseClient: any, args: any) {
  const { query, location, sources = ['linkedin', 'indeed'], maxResults = 50 } = args;

  // Create search session
  const { data: session, error: sessionError } = await supabaseClient
    .from('job_search_sessions')
    .insert({
      user_id: args.userId || '00000000-0000-0000-0000-000000000000', // System user for automated scraping
      search_query: query,
      filters: { location, sources, maxResults },
      status: 'pending'
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  // Call existing scrape-jobs function
  const { data: scrapeResult, error: scrapeError } = await supabaseClient.functions.invoke('scrape-jobs', {
    body: { query, location, sources, maxResults, sessionId: session.id }
  });

  if (scrapeError) {
    await supabaseClient
      .from('job_search_sessions')
      .update({ 
        status: 'failed', 
        error_message: scrapeError.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id);
    
    throw scrapeError;
  }

  return new Response(JSON.stringify({ 
    success: true, 
    sessionId: session.id,
    data: scrapeResult 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleMonitorJobs(supabaseClient: any, args: any) {
  const { userId, searchCriteria, frequency = 'daily' } = args;

  // Create job alert
  const { data, error } = await supabaseClient
    .from('job_alerts')
    .insert({
      user_id: userId,
      alert_name: `${searchCriteria.query || 'Job'} Monitor`,
      search_criteria: searchCriteria,
      frequency,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleEnrichJob(supabaseClient: any, args: any) {
  const { jobId, companyName } = args;

  // Get job details
  const { data: job, error: jobError } = await supabaseClient
    .from('job_opportunities')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError) throw jobError;

  // Here we would call external APIs to enrich the job data
  // For now, just return the job with a flag indicating it's enriched
  const enrichedJob = {
    ...job,
    enriched: true,
    enriched_at: new Date().toISOString()
  };

  // Update job with enriched data
  const { data, error } = await supabaseClient
    .from('job_opportunities')
    .update({
      raw_data: { ...job.raw_data, enriched: true }
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleDeduplicateJobs(supabaseClient: any, args: any) {
  const { sessionId } = args;

  // Get all jobs from session
  const { data: jobs, error: jobsError } = await supabaseClient
    .from('job_listings')
    .select('*')
    .eq('search_session_id', sessionId);

  if (jobsError) throw jobsError;

  // Simple deduplication by external_id and job_title+company_name
  const seen = new Set();
  const duplicates = [];

  for (const job of jobs || []) {
    const key = job.external_id || `${job.job_title}_${job.company_name}`.toLowerCase();
    
    if (seen.has(key)) {
      duplicates.push(job.id);
    } else {
      seen.add(key);
    }
  }

  // Mark duplicates
  if (duplicates.length > 0) {
    await supabaseClient
      .from('job_listings')
      .update({ is_active: false })
      .in('id', duplicates);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    duplicatesRemoved: duplicates.length,
    totalJobs: jobs?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetScrapeStatus(supabaseClient: any, args: any) {
  const { sessionId } = args;

  const { data: session, error } = await supabaseClient
    .from('job_search_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;

  // Get job count for session
  const { data: jobs, error: jobsError } = await supabaseClient
    .from('job_listings')
    .select('id', { count: 'exact' })
    .eq('search_session_id', sessionId);

  return new Response(JSON.stringify({ 
    data: {
      ...session,
      jobs_found: jobs?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
