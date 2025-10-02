import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sessionId, query, filters } = await req.json();

    console.log('Starting job search:', { sessionId, query, filters });

    // Update session status
    await supabase
      .from('job_search_sessions')
      .update({ status: 'in_progress' })
      .eq('id', sessionId);

    let allJobs: any[] = [];

    // LinkedIn scraping (using Apify if available, otherwise mock data)
    if (filters.sources.includes('linkedin')) {
      if (apifyApiKey) {
        try {
          const linkedinJobs = await scrapeLinkedInJobs(query, filters, apifyApiKey);
          allJobs.push(...linkedinJobs);
        } catch (error) {
          console.error('LinkedIn scraping error:', error);
        }
      } else {
        console.log('No Apify API key, using mock LinkedIn data');
        allJobs.push(...getMockLinkedInJobs(query));
      }
    }

    // Indeed scraping
    if (filters.sources.includes('indeed')) {
      console.log('Indeed scraping coming soon');
      // TODO: Implement Indeed scraping
    }

    // Glassdoor scraping
    if (filters.sources.includes('glassdoor')) {
      console.log('Glassdoor scraping coming soon');
      // TODO: Implement Glassdoor scraping
    }

    // Store jobs in database
    const jobsToInsert = allJobs.map(job => ({
      search_session_id: sessionId,
      external_id: job.id,
      source: job.source,
      job_title: job.title,
      company_name: job.company,
      company_logo_url: job.logo,
      location: job.location,
      remote_type: job.remoteType,
      employment_type: job.employmentType,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      salary_period: job.salaryPeriod,
      job_description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      posted_date: job.postedDate,
      apply_url: job.applyUrl,
      company_url: job.companyUrl,
      raw_data: job.raw,
    }));

    const { error: insertError } = await supabase
      .from('job_listings')
      .upsert(jobsToInsert, { 
        onConflict: 'external_id,source',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error inserting jobs:', insertError);
      throw insertError;
    }

    // Update session with results
    await supabase
      .from('job_search_sessions')
      .update({ 
        status: 'completed',
        results_count: allJobs.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    console.log(`Successfully scraped ${allJobs.length} jobs`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: allJobs.length,
        jobs: allJobs 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Job scraping error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function scrapeLinkedInJobs(query: string, filters: any, apiKey: string) {
  console.log('Scraping LinkedIn with Apify');
  
  // Use Apify's LinkedIn Jobs Scraper
  const response = await fetch('https://api.apify.com/v2/acts/voyager~linkedin-jobs-scraper/run-sync?token=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queries: [query],
      maxResults: 50,
      location: filters.locations?.[0] || '',
      datePosted: 'anyTime',
      employmentType: filters.employment_types || [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return (data.defaultDatasetId ? 
    await fetchApifyDataset(data.defaultDatasetId, apiKey) : 
    []
  ).map((job: any) => ({
    id: job.jobId || job.id,
    source: 'linkedin',
    title: job.title,
    company: job.company,
    logo: job.companyLogo,
    location: job.location,
    remoteType: job.workType || 'onsite',
    employmentType: job.employmentType || 'full-time',
    salaryMin: job.salary?.min,
    salaryMax: job.salary?.max,
    salaryPeriod: 'annual',
    description: job.description,
    requirements: [],
    benefits: [],
    postedDate: job.postedDate,
    applyUrl: job.jobUrl,
    companyUrl: job.companyUrl,
    raw: job,
  }));
}

async function fetchApifyDataset(datasetId: string, apiKey: string) {
  const response = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch Apify dataset');
  }
  
  return await response.json();
}

function getMockLinkedInJobs(query: string): any[] {
  // Mock data for development/testing
  return [
    {
      id: 'mock-1',
      source: 'linkedin',
      title: `Senior ${query}`,
      company: 'Tech Corp',
      logo: null,
      location: 'San Francisco, CA',
      remoteType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 120000,
      salaryMax: 180000,
      salaryPeriod: 'annual',
      description: `Exciting opportunity for a Senior ${query} at a leading tech company. Work on cutting-edge projects with a talented team.`,
      requirements: ['5+ years experience', 'Strong technical skills', 'Team player'],
      benefits: ['Health insurance', '401k', 'Remote work'],
      postedDate: new Date().toISOString(),
      applyUrl: 'https://linkedin.com/jobs/mock-1',
      companyUrl: 'https://techcorp.com',
      raw: {},
    },
    {
      id: 'mock-2',
      source: 'linkedin',
      title: `${query} Manager`,
      company: 'Innovation Labs',
      logo: null,
      location: 'New York, NY',
      remoteType: 'remote',
      employmentType: 'full-time',
      salaryMin: 140000,
      salaryMax: 200000,
      salaryPeriod: 'annual',
      description: `Lead our ${query} team and drive strategic initiatives. Competitive compensation and benefits package.`,
      requirements: ['7+ years experience', 'Leadership skills', 'Strategic thinking'],
      benefits: ['Unlimited PTO', 'Stock options', 'Remote first'],
      postedDate: new Date(Date.now() - 86400000).toISOString(),
      applyUrl: 'https://linkedin.com/jobs/mock-2',
      companyUrl: 'https://innovationlabs.com',
      raw: {},
    },
  ];
}
