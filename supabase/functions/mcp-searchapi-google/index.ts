import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, maxResults = 50, filters = {} } = await req.json();
    
    console.log('[SEARCHAPI-GOOGLE] Searching jobs:', { query, location, maxResults });

    const SEARCHAPI_KEY = Deno.env.get('SEARCHAPI_KEY');
    
    if (!SEARCHAPI_KEY) {
      throw new Error('SearchAPI key not configured');
    }

    // Build SearchAPI Google Jobs request
    const params = new URLSearchParams({
      engine: 'google_jobs',
      api_key: SEARCHAPI_KEY,
      q: query,
      num: Math.min(maxResults, 100).toString()
    });

    if (location) params.append('location', location);
    if (filters.datePosted) params.append('chips', `date_posted:${filters.datePosted}`);
    if (filters.jobType) params.append('chips', `employment_type:${filters.jobType}`);
    if (filters.remote) params.append('lrad', '100'); // 100 mile radius for remote

    const response = await fetch(`https://www.searchapi.io/api/v1/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`SearchAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map Google Jobs results to standardized format
    const jobs = (data.jobs_results || []).map((job: any) => ({
      id: `google-${job.job_id || Math.random().toString(36).substr(2, 9)}`,
      source: 'google_jobs',
      externalId: job.job_id,
      title: job.title,
      company: job.company_name || 'Unknown',
      location: job.location || null,
      description: job.description || '',
      url: job.share_url || job.related_links?.[0]?.link,
      salary: job.detected_extensions?.salary ? {
        text: job.detected_extensions.salary,
        min: null,
        max: null,
        currency: 'USD'
      } : null,
      postedDate: job.detected_extensions?.posted_at,
      jobType: job.detected_extensions?.employment_type || null,
      thumbnail: job.thumbnail,
      extensions: job.extensions || [],
      via: job.via,
      highlights: job.job_highlights
    }));

    console.log(`[SEARCHAPI-GOOGLE] Found ${jobs.length} jobs`);

    return new Response(
      JSON.stringify({ 
        source: 'google_jobs',
        jobs,
        total: jobs.length,
        searchParams: { query, location, filters },
        metadata: {
          searchParameters: data.search_parameters,
          legalShield: 'SearchAPI with Legal Shield protection'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SEARCHAPI-GOOGLE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
