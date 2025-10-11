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
          name: 'search_jobs_legal',
          description: 'Search job listings using 100% legal APIs (Adzuna, USAJobs, Google Jobs)',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Job search query (e.g., "Senior React Developer")'
              },
              location: {
                type: 'string',
                description: 'Location for job search (e.g., "San Francisco, CA" or "us" for USA)'
              },
              sources: {
                type: 'array',
                items: { 
                  type: 'string',
                  enum: ['adzuna', 'usajobs', 'google_jobs', 'all']
                },
                description: 'Legal job APIs to query (default: all)'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum results per source (default: 50)'
              },
              filters: {
                type: 'object',
                description: 'Additional filters (remote, salary range, job type, etc.)'
              },
              userId: {
                type: 'string',
                description: 'User ID for tracking searches'
              }
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
          case 'search_jobs_legal':
            return await handleSearchJobsLegal(supabaseClient, args);
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

async function handleSearchJobsLegal(supabaseClient: any, args: any) {
  const { 
    query, 
    location = 'us', 
    sources = ['all'],
    maxResults = 50,
    filters = {},
    userId
  } = args;

  console.log('[MCP] Searching jobs via legal APIs:', { query, location, sources, maxResults });

  // Determine which sources to query
  const sourcesToQuery = sources.includes('all') 
    ? ['adzuna', 'usajobs', 'google_jobs']
    : sources;

  // Create search session
  const { data: session, error: sessionError } = await supabaseClient
    .from('job_search_sessions')
    .insert({
      user_id: userId || '00000000-0000-0000-0000-000000000000',
      search_query: query,
      filters: { location, sources: sourcesToQuery, ...filters },
      status: 'in_progress'
    })
    .select()
    .single();

  if (sessionError) {
    throw new Error(`Failed to create search session: ${sessionError.message}`);
  }

  const sessionId = session.id;
  const allJobs: any[] = [];

  // Query each legal API
  for (const source of sourcesToQuery) {
    try {
      let functionName = '';
      switch (source) {
        case 'adzuna':
          functionName = 'mcp-adzuna-api';
          break;
        case 'usajobs':
          functionName = 'mcp-usajobs-api';
          break;
        case 'google_jobs':
          functionName = 'mcp-searchapi-google';
          break;
        default:
          console.warn(`Unknown source: ${source}`);
          continue;
      }

      const { data, error } = await supabaseClient.functions.invoke(functionName, {
        body: { query, location, maxResults, filters }
      });

      if (error) {
        console.error(`Error querying ${source}:`, error);
        continue;
      }

      if (data?.jobs) {
        allJobs.push(...data.jobs);
        console.log(`[MCP] Retrieved ${data.jobs.length} jobs from ${source}`);
      }
    } catch (error) {
      console.error(`Exception querying ${source}:`, error);
    }
  }

  // Store jobs in database
  if (allJobs.length > 0) {
    const jobsToInsert = allJobs.map(job => ({
      search_session_id: sessionId,
      external_id: job.id,
      source: job.source,
      job_title: job.title,
      company_name: job.company,
      location: job.location,
      job_description: job.description,
      apply_url: job.url,
      posted_date: job.postedDate,
      salary_min: job.salary?.min,
      salary_max: job.salary?.max,
      salary_currency: job.salary?.currency || 'USD',
      employment_type: job.jobType || job.contractType,
      remote_type: job.remote ? 'remote' : null,
      raw_data: job,
      is_active: true
    }));

    const { error: insertError } = await supabaseClient
      .from('job_listings')
      .upsert(jobsToInsert, { 
        onConflict: 'external_id,source',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error inserting jobs:', insertError);
    }
  }

  // Update session
  await supabaseClient
    .from('job_search_sessions')
    .update({
      status: 'completed',
      results_count: allJobs.length,
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  console.log(`[MCP] Search complete: ${allJobs.length} jobs from ${sourcesToQuery.length} legal sources`);

  return new Response(JSON.stringify({
    success: true,
    jobCount: allJobs.length,
    sources: sourcesToQuery,
    sessionId: sessionId,
    legalCompliance: '100% legal - No scraping used'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleScrapeJobs(supabaseClient: any, args: any) {
  // Legacy function - redirect to legal version
  console.log('[DEPRECATED] handleScrapeJobs is deprecated. Use handleSearchJobsLegal instead.');
  return handleSearchJobsLegal(supabaseClient, args);
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
