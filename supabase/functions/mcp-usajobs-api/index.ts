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
    
    console.log('[USAJOBS-API] Searching jobs:', { query, location, maxResults });

    const USAJOBS_API_KEY = Deno.env.get('USAJOBS_API_KEY');
    const USAJOBS_EMAIL = Deno.env.get('USAJOBS_EMAIL') || 'admin@careerpro.com';
    
    if (!USAJOBS_API_KEY) {
      throw new Error('USAJobs API key not configured');
    }

    // Build USAJobs API request
    const baseUrl = 'https://data.usajobs.gov/api/search';
    const params = new URLSearchParams({
      Keyword: query,
      ResultsPerPage: Math.min(maxResults, 500).toString(),
      Page: '1'
    });

    if (location) params.append('LocationName', location);
    if (filters.remoteOnly) params.append('RemoteIndicator', 'true');
    if (filters.positionSchedule) params.append('PositionScheduleTypeCode', filters.positionSchedule);

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Host': 'data.usajobs.gov',
        'User-Agent': USAJOBS_EMAIL,
        'Authorization-Key': USAJOBS_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`USAJobs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map USAJobs results to standardized format
    const jobs = (data.SearchResult?.SearchResultItems || []).map((item: any) => {
      const job = item.MatchedObjectDescriptor;
      return {
        id: `usajobs-${job.PositionID}`,
        source: 'usajobs',
        externalId: job.PositionID,
        title: job.PositionTitle,
        company: job.OrganizationName || 'U.S. Government',
        location: job.PositionLocation?.[0]?.LocationName || null,
        description: job.UserArea?.Details?.JobSummary || job.QualificationSummary || '',
        url: job.PositionURI,
        salary: {
          min: job.PositionRemuneration?.[0]?.MinimumRange,
          max: job.PositionRemuneration?.[0]?.MaximumRange,
          currency: 'USD'
        },
        postedDate: job.PublicationStartDate,
        endDate: job.ApplicationCloseDate,
        department: job.DepartmentName,
        payPlan: job.JobGrade?.[0]?.Code,
        securityClearance: job.SecurityClearance,
        remote: job.PositionLocation?.[0]?.RemoteIndicator || false
      };
    });

    console.log(`[USAJOBS-API] Found ${jobs.length} jobs`);

    return new Response(
      JSON.stringify({ 
        source: 'usajobs',
        jobs,
        total: data.SearchResult?.SearchResultCount || jobs.length,
        searchParams: { query, location, filters }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[USAJOBS-API] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
