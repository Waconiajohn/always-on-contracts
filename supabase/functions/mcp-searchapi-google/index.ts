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

    // Calculate number of pages needed (Google Jobs typically returns 10 results per page)
    const resultsPerPage = 10;
    const numPages = Math.ceil(Math.min(maxResults, 100) / resultsPerPage);
    
    console.log(`[SEARCHAPI-GOOGLE] Fetching ${numPages} pages to get ${maxResults} results`);

    // Fetch multiple pages in parallel
    const pagePromises = Array.from({ length: numPages }, async (_, pageIndex) => {
      const startIndex = pageIndex * resultsPerPage;
      
      const params = new URLSearchParams({
        engine: 'google_jobs',
        api_key: SEARCHAPI_KEY,
        q: query,
        num: resultsPerPage.toString(),
        start: startIndex.toString()
      });

      if (location) params.append('location', location);
      if (filters.datePosted) params.append('chips', `date_posted:${filters.datePosted}`);
      if (filters.jobType) params.append('chips', `employment_type:${filters.jobType}`);
      if (filters.remote) params.append('lrad', '100');

      console.log(`[SEARCHAPI-GOOGLE] Fetching page ${pageIndex + 1} (start=${startIndex})`);

      const response = await fetch(`https://www.searchapi.io/api/v1/search?${params}`);
      
      if (!response.ok) {
        console.error(`[SEARCHAPI-GOOGLE] Page ${pageIndex + 1} error: ${response.status}`);
        return { jobs_results: [] };
      }

      return await response.json();
    });

    const pageResults = await Promise.all(pagePromises);
    
    // Combine all results and deduplicate by job_id
    const allJobs = pageResults.flatMap(data => data.jobs_results || []);
    const uniqueJobs = new Map();
    
    allJobs.forEach(job => {
      const jobId = job.job_id || Math.random().toString(36).substr(2, 9);
      if (!uniqueJobs.has(jobId)) {
        uniqueJobs.set(jobId, job);
      }
    });

    // Map to standardized format
    const jobs = Array.from(uniqueJobs.values()).map((job: any) => ({
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
    })).slice(0, maxResults); // Limit to maxResults

    console.log(`[SEARCHAPI-GOOGLE] Found ${jobs.length} unique jobs across ${numPages} pages`);

    return new Response(
      JSON.stringify({ 
        source: 'google_jobs',
        jobs,
        total: jobs.length,
        searchParams: { query, location, filters },
        metadata: {
          searchParameters: pageResults[0]?.search_parameters,
          pagesProcessed: numPages,
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
