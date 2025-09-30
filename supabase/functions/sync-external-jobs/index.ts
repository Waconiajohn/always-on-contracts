import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalJob {
  title: string;
  company: string;
  location: string | null;
  type?: string;
  remote?: boolean;
  postedAt?: string;
  url: string;
  source: string;
  externalId: string;
  description?: string;
  skills?: string[];
  hourlyRateMin?: number;
  hourlyRateMax?: number;
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

    console.log('Starting external job sync...');
    
    const allJobs: ExternalJob[] = [];

    // Fetch from Greenhouse boards (major tech companies)
    const greenhouseBoards = [
      'openai', 'anthropic', 'stripe', 'figma', 'notion', 'linear',
      'vercel', 'cloudflare', 'databricks', 'scale', 'rippling'
    ];
    
    for (const boardToken of greenhouseBoards) {
      try {
        const jobs = await fetchGreenhouseJobs(boardToken);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from Greenhouse: ${boardToken}`);
      } catch (error) {
        console.error(`Error fetching Greenhouse jobs for ${boardToken}:`, error);
      }
    }

    // Fetch from Lever boards
    const leverBoards = [
      'doordash', 'netflix', 'uber', 'lyft', 'airbnb', 'square',
      'coinbase', 'robinhood', 'plaid', 'affirm', 'reddit'
    ];
    
    for (const boardKey of leverBoards) {
      try {
        const jobs = await fetchLeverJobs(boardKey);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from Lever: ${boardKey}`);
      } catch (error) {
        console.error(`Error fetching Lever jobs for ${boardKey}:`, error);
      }
    }

    // Fetch from Ashby boards
    const ashbyBoards = [
      'retool', 'ramp', 'vanta', 'anduril', 'secureframe',
      'census', 'hightouch', 'hex', 'modal', 'replicate'
    ];
    
    for (const orgSlug of ashbyBoards) {
      try {
        const jobs = await fetchAshbyJobs(orgSlug);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from Ashby: ${orgSlug}`);
      } catch (error) {
        console.error(`Error fetching Ashby jobs for ${orgSlug}:`, error);
      }
    }

    // Fetch from USAJOBS if API key is available
    const usajobsApiKey = Deno.env.get('USAJOBS_API_KEY');
    if (usajobsApiKey) {
      try {
        const jobs = await fetchUSAJobs(usajobsApiKey);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from USAJOBS`);
      } catch (error) {
        console.error('Error fetching USAJOBS:', error);
      }
    }

    console.log(`Total jobs fetched: ${allJobs.length}`);

    // Filter for contract-related opportunities
    const contractJobs = allJobs.filter(job => {
      const searchText = JSON.stringify(job).toLowerCase();
      return searchText.includes('contract') || 
             searchText.includes('contractor') ||
             searchText.includes('freelance') ||
             searchText.includes('temporary') ||
             searchText.includes('temp') ||
             searchText.includes('1099') ||
             job.type?.toLowerCase().includes('contract');
    });

    console.log(`Filtered to ${contractJobs.length} contract opportunities`);

    // Upsert jobs into database
    let insertedCount = 0;
    let updatedCount = 0;

    for (const job of contractJobs) {
      // Check if job already exists
      const { data: existing } = await supabaseClient
        .from('job_opportunities')
        .select('id')
        .eq('external_source', job.source)
        .eq('external_id', job.externalId)
        .single();

      const jobData = {
        job_title: job.title,
        job_description: job.description || `${job.title} at ${job.company}`,
        location: job.location,
        hourly_rate_min: job.hourlyRateMin,
        hourly_rate_max: job.hourlyRateMax,
        required_skills: job.skills || [],
        external_url: job.url,
        status: 'active',
        source: job.company,
        is_external: true,
        external_id: job.externalId,
        external_source: job.source,
        last_synced_at: new Date().toISOString(),
        raw_data: job,
        posted_date: job.postedAt || new Date().toISOString(),
      };

      if (existing) {
        await supabaseClient
          .from('job_opportunities')
          .update(jobData)
          .eq('id', existing.id);
        updatedCount++;
      } else {
        await supabaseClient
          .from('job_opportunities')
          .insert(jobData);
        insertedCount++;
      }
    }

    // Mark old external jobs as inactive (not synced in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await supabaseClient
      .from('job_opportunities')
      .update({ status: 'inactive' })
      .eq('is_external', true)
      .lt('last_synced_at', sevenDaysAgo.toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        totalFetched: allJobs.length,
        contractFiltered: contractJobs.length,
        inserted: insertedCount,
        updated: updatedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-external-jobs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchGreenhouseJobs(boardToken: string): Promise<ExternalJob[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`);
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data.jobs || []).map((j: any) => ({
    title: j.title,
    company: data.meta?.company || boardToken,
    location: j.location?.name ?? null,
    type: j.metadata?.employment_type || 'unknown',
    remote: /remote/i.test(JSON.stringify(j)),
    postedAt: j.updated_at,
    url: j.absolute_url,
    source: 'greenhouse',
    externalId: `gh-${boardToken}-${j.id}`,
    description: j.content || j.title,
  }));
}

async function fetchLeverJobs(boardKey: string): Promise<ExternalJob[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${boardKey}?mode=json`);
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data || []).map((j: any) => ({
    title: j.text,
    company: boardKey,
    location: j.categories?.location ?? null,
    type: j.categories?.commitment ?? 'unknown',
    remote: /remote/i.test(JSON.stringify(j)),
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
    url: j.hostedUrl,
    source: 'lever',
    externalId: `lv-${boardKey}-${j.id}`,
    description: j.description || j.descriptionPlain || j.text,
  }));
}

async function fetchAshbyJobs(orgSlug: string): Promise<ExternalJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  
  const data = await res.json();
  const postings = (data.jobs ?? data) || [];
  
  return postings.map((j: any) => ({
    title: j.title,
    company: orgSlug,
    location: j.location?.name ?? null,
    type: j.employmentType ?? 'unknown',
    remote: /remote/i.test(JSON.stringify(j)),
    postedAt: j.publishedAt,
    url: j.jobUrl,
    source: 'ashby',
    externalId: `ab-${orgSlug}-${j.id}`,
    description: j.description || j.title,
  }));
}

async function fetchUSAJobs(apiKey: string): Promise<ExternalJob[]> {
  const headers = {
    "Host": "data.usajobs.gov",
    "User-Agent": "contract-finder@lovable.app",
    "Authorization-Key": apiKey,
  };
  
  const params = new URLSearchParams({
    Keyword: "contract OR contractor OR temporary",
    ResultsPerPage: "500",
  });
  
  const res = await fetch(`https://data.usajobs.gov/api/Search?${params.toString()}`, { headers });
  if (!res.ok) return [];
  
  const data = await res.json();
  const items = data.SearchResult?.SearchResultItems || [];
  
  return items.map((item: any) => {
    const j = item.MatchedObjectDescriptor;
    return {
      title: j.PositionTitle,
      company: j.OrganizationName,
      location: j.PositionLocationDisplay || null,
      type: j.PositionSchedule?.[0] ?? 'unknown',
      remote: /remote/i.test(JSON.stringify(j)),
      postedAt: j.PublicationStartDate,
      url: j.PositionURI,
      source: 'usajobs',
      externalId: `usa-${j.PositionID}`,
      description: j.UserArea?.Details?.JobSummary || j.PositionTitle,
    };
  });
}
