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
    const { query, location = "us", maxResults = 50, filters = {} } = await req.json();
    
    console.log('[ADZUNA-API] Searching jobs:', { query, location, maxResults });

    const ADZUNA_APP_ID = Deno.env.get('ADZUNA_APP_ID');
    const ADZUNA_API_KEY = Deno.env.get('ADZUNA_API_KEY');
    
    if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
      throw new Error('Adzuna API credentials not configured');
    }

    // Build Adzuna API URL
    const baseUrl = `https://api.adzuna.com/v1/api/jobs/${location}/search/1`;
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_API_KEY,
      what: query,
      results_per_page: maxResults.toString()
    });

    if (filters.location) params.append('where', filters.location);
    if (filters.remote) params.append('what', `${query} remote`);
    if (filters.salaryMin) params.append('salary_min', filters.salaryMin);
    if (filters.salaryMax) params.append('salary_max', filters.salaryMax);

    const response = await fetch(`${baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map Adzuna results to standardized format
    const jobs = (data.results || []).map((job: any) => ({
      id: `adzuna-${job.id}`,
      source: 'adzuna',
      externalId: job.id,
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || null,
      description: job.description || '',
      url: job.redirect_url,
      salary: {
        min: job.salary_min,
        max: job.salary_max,
        currency: 'USD'
      },
      postedDate: job.created,
      contractType: job.contract_type || null,
      category: job.category?.label || null
    }));

    console.log(`[ADZUNA-API] Found ${jobs.length} jobs`);

    return new Response(
      JSON.stringify({ 
        source: 'adzuna',
        jobs,
        total: data.count || jobs.length,
        searchParams: { query, location, filters }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ADZUNA-API] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
