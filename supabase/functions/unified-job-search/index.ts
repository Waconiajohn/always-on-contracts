import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Simple date difference function
function differenceInDays(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchFilters {
  datePosted: '24h' | '3d' | '7d' | '14d' | '30d' | 'any';
  contractOnly: boolean;
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'any';
  employmentType?: 'full-time' | 'contract' | 'freelance' | 'any';
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  booleanString?: string;
}

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  description?: string | null;
  posted_date: string;
  apply_url: string | null;
  source: string;
  remote_type?: string | null;
  employment_type?: string | null;
  match_score?: number | null;
  required_skills?: string[] | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, filters, userId, sources } = await req.json();
    
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    const searchFilters: SearchFilters = filters || {
      datePosted: '24h',
      contractOnly: false,
      remoteType: 'any',
      employmentType: 'any'
    };

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const enabledSources = sources || ['google_jobs', 'company_boards'];
    const allJobs: JobResult[] = [];
    const sourceStats: Record<string, { count: number; status: string }> = {};
    const startTime = Date.now();

    // Search all sources in parallel
    const searchPromises = [];

    if (enabledSources.includes('google_jobs')) {
      searchPromises.push(
        searchGoogleJobs(query, location, searchFilters)
          .then(jobs => {
            sourceStats.google_jobs = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Google Jobs error:', error);
            sourceStats.google_jobs = { count: 0, status: 'error' };
            return [];
          })
      );
    }

    if (enabledSources.includes('company_boards')) {
      // Search all ATS systems in parallel
      searchPromises.push(
        searchCompanyBoards(query, searchFilters)
          .then(jobs => {
            sourceStats.greenhouse = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Greenhouse boards error:', error);
            sourceStats.greenhouse = { count: 0, status: 'error' };
            return [];
          })
      );
      
      searchPromises.push(
        searchLeverBoards(query, searchFilters)
          .then(jobs => {
            sourceStats.lever = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Lever boards error:', error);
            sourceStats.lever = { count: 0, status: 'error' };
            return [];
          })
      );
      
      searchPromises.push(
        searchWorkdayBoards(query, searchFilters)
          .then(jobs => {
            sourceStats.workday = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Workday boards error:', error);
            sourceStats.workday = { count: 0, status: 'error' };
            return [];
          })
      );
      
      searchPromises.push(
        searchRecruiteeBoards(query, searchFilters)
          .then(jobs => {
            sourceStats.recruitee = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Recruitee boards error:', error);
            sourceStats.recruitee = { count: 0, status: 'error' };
            return [];
          })
      );
      
      searchPromises.push(
        searchWorkableBoards(query, searchFilters)
          .then(jobs => {
            sourceStats.workable = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Workable boards error:', error);
            sourceStats.workable = { count: 0, status: 'error' };
            return [];
          })
      );
      
      searchPromises.push(
        searchAshbyBoards(query, searchFilters)
          .then(jobs => {
            sourceStats.ashby = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Ashby boards error:', error);
            sourceStats.ashby = { count: 0, status: 'error' };
            return [];
          })
      );
    }

    // Wait for all sources
    console.log(`[UNIFIED-SEARCH] ═══════════════════════════════════════`);
    console.log(`[UNIFIED-SEARCH] Waiting for all ${searchPromises.length} sources to complete...`);
    const results = await Promise.allSettled(searchPromises);
    
    // Collect all jobs
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value);
      }
    });

    console.log(`[UNIFIED-SEARCH] ═══════════════════════════════════════`);
    console.log(`[UNIFIED-SEARCH] SEARCH RESULTS SUMMARY`);
    console.log(`[UNIFIED-SEARCH] ───────────────────────────────────────`);
    Object.entries(sourceStats).forEach(([source, stats]) => {
      const statusIcon = stats.status === 'success' ? '✓' : '✗';
      console.log(`[UNIFIED-SEARCH] ${statusIcon} ${source.padEnd(20)}: ${stats.count} jobs`);
    });
    console.log(`[UNIFIED-SEARCH] ───────────────────────────────────────`);
    console.log(`[UNIFIED-SEARCH] Total raw jobs: ${allJobs.length}`);
    console.log(`[UNIFIED-SEARCH] ═══════════════════════════════════════`);

    // Filter by date
    let filteredJobs = filterByDate(allJobs, searchFilters.datePosted);
    console.log(`[Date Filter] Applied "${searchFilters.datePosted}" filter: ${allJobs.length} → ${filteredJobs.length} jobs`);
    
    // If date filter is too aggressive, retry with "any"
    if (filteredJobs.length === 0 && allJobs.length > 0 && searchFilters.datePosted !== 'any') {
      console.log(`[Auto-Retry] Date filter "${searchFilters.datePosted}" too restrictive. Using all jobs.`);
      filteredJobs = allJobs;
    }

    // Filter by contract type if enabled
    const contractFiltered = searchFilters.contractOnly
      ? filteredJobs.filter(job => isContractJob(job))
      : filteredJobs;

    // Deduplicate by company + title + location
    const uniqueJobs = deduplicateJobs(contractFiltered);
    console.log(`[Deduplication] Removed ${contractFiltered.length - uniqueJobs.length} duplicates: ${contractFiltered.length} → ${uniqueJobs.length} jobs`);

    // Score against Career Vault if userId provided
    let scoredJobs = uniqueJobs;
    if (userId) {
      console.log(`[Vault Scoring] Scoring ${uniqueJobs.length} jobs against user Career Vault...`);
      scoredJobs = await scoreWithVault(uniqueJobs, userId, supabaseClient);
      const scoredCount = scoredJobs.filter(j => j.match_score && j.match_score > 0).length;
      console.log(`[Vault Scoring] Successfully scored ${scoredCount} jobs`);
    }

    // Sort by match score (if available) and then by posted date
    scoredJobs.sort((a, b) => {
      if (a.match_score && b.match_score && a.match_score !== b.match_score) {
        return b.match_score - a.match_score;
      }
      return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
    });

    const executionTime = Date.now() - startTime;
    console.log(`[UNIFIED-SEARCH] ═══════════════════════════════════════`);
    console.log(`[UNIFIED-SEARCH] FINAL RESULTS: ${scoredJobs.length} jobs`);
    console.log(`[UNIFIED-SEARCH] Execution time: ${executionTime}ms`);
    console.log(`[UNIFIED-SEARCH] ═══════════════════════════════════════`);

    return new Response(
      JSON.stringify({
        jobs: scoredJobs,
        total: scoredJobs.length,
        searchParams: { query, location, filters: searchFilters },
        sources: sourceStats,
        executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unified search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function searchGoogleJobs(query: string, location: string, filters: SearchFilters): Promise<JobResult[]> {
  const searchApiKey = Deno.env.get('SEARCHAPI_KEY');
  if (!searchApiKey) {
    console.warn('[Google Jobs] SEARCHAPI_KEY not configured');
    return [];
  }

  // Use boolean string if provided, otherwise use regular query
  const searchQuery = filters.booleanString?.trim() || query;

  const params = new URLSearchParams({
    engine: 'google_jobs',
    q: searchQuery,
    location: location || 'United States',
    api_key: searchApiKey
  });

  const url = `https://www.searchapi.io/api/v1/search?${params}`;
  console.log(`[Google Jobs] Calling API with query: "${searchQuery}", location: "${location || 'United States'}"`);
  
  const response = await fetch(url);
  console.log(`[Google Jobs] API Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Google Jobs] API Error: ${errorText}`);
    throw new Error(`Google Jobs API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`[Google Jobs] Full response keys:`, Object.keys(data));
  console.log(`[Google Jobs] Jobs array length: ${data.jobs?.length || 0}`);
  
  const jobs: JobResult[] = [];

  if (data.jobs && data.jobs.length > 0) {
    for (const job of data.jobs) {
      if (!job.detected_extensions?.posted_at) continue; // Skip jobs without posting dates

      jobs.push({
        id: `google_${job.position || Math.random()}`,
        title: job.title,
        company: job.company_name,
        location: job.location,
        description: job.description,
        posted_date: parseGoogleDate(job.detected_extensions.posted_at),
        apply_url: job.apply_link,
        source: 'Google Jobs',
        remote_type: job.location?.toLowerCase().includes('remote') ? 'remote' : null,
        employment_type: job.detected_extensions?.schedule || null
      });
    }
  }

  console.log(`[Google Jobs] Parsed ${jobs.length} jobs successfully`);
  return jobs;
}

async function searchCompanyBoards(query: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[Company Boards] Starting search for query: "${query}"`);
  const jobs: JobResult[] = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  // Expanded company list: Tech + Oil & Gas + Engineering + Energy companies
  const greenhouseBoards = [
    // Tech companies
    'openai', 'anthropic', 'stripe', 'figma', 'notion', 'linear', 'vercel', 'cloudflare', 
    'databricks', 'scale', 'rippling', 'meta', 'shopify', 'gitlab', 'twilio', 'salesforce', 
    'zoom', 'slack', 'dropbox', 'atlassian',
    // Oil & Gas companies
    'shell', 'chevron', 'halliburton', 'slb', 'baker-hughes', 'weatherford', 'conocophillips',
    'exxonmobil', 'totalenergies', 'bp', 'equinor', 'eni', 'occidental',
    // Engineering firms
    'aecom', 'bechtel', 'fluor', 'jacobs', 'kbr', 'worley', 'wood',
    // Energy companies
    'nextera', 'duke-energy', 'southern-company', 'dominion', 'exelon'
  ];
  
  console.log(`[Company Boards] Searching ${greenhouseBoards.length} companies via Greenhouse API`);
  
  const greenhousePromises = greenhouseBoards.map(async (board) => {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`;
      console.log(`[Company Boards] Fetching: ${board}`);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        console.log(`[Company Boards] ${board} returned status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      const totalJobs = data.jobs?.length || 0;
      console.log(`[Company Boards] ${board} has ${totalJobs} total jobs`);
      
      const filtered = (data.jobs || [])
        .filter((job: any) => {
          if (!job.updated_at) {
            console.log(`[Company Boards] ${board} - Skipping job without updated_at: ${job.title}`);
            return false;
          }
          
          const jobText = `${job.title} ${job.content || ''}`.toLowerCase();
          
          // Strict matching: ALL search terms must be present
          const matches = searchTerms.every(term => jobText.includes(term));
          
          if (!matches) {
            console.log(`[Company Boards] ${board} - Filtered out: "${job.title}" (no match)`);
          } else {
            console.log(`[Company Boards] ${board} - Match found: "${job.title}"`);
          }
          
          return matches;
        })
        .map((job: any) => ({
          id: `greenhouse_${board}_${job.id}`,
          title: job.title,
          company: board.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          location: job.location?.name || 'Remote',
          description: job.content,
          posted_date: job.updated_at || new Date().toISOString(),
          apply_url: job.absolute_url,
          source: 'Greenhouse',
          employment_type: 'full-time'
        }));
      
      if (filtered.length > 0) {
        console.log(`[Company Boards] ${board} contributed ${filtered.length} matching jobs`);
      }
      
      return filtered;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Company Boards] Error fetching ${board}:`, errorMessage);
      return [];
    }
  });

  const results = await Promise.allSettled(greenhousePromises);
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
      jobs.push(...result.value);
    } else {
      errorCount++;
      console.error(`[Company Boards] Promise rejected for ${greenhouseBoards[index]}:`, result.reason);
    }
  });

  console.log(`[Company Boards] Search complete: ${successCount} successful, ${errorCount} failed, ${jobs.length} total matching jobs`);
  
  if (jobs.length === 0) {
    console.log(`[Company Boards] No results found. Consider:
    1. These companies may not use Greenhouse
    2. Search terms "${query}" may be too specific
    3. API timeouts or rate limiting
    4. Company board names may be different than expected`);
  }

  return jobs;
}

// Lever ATS Search
async function searchLeverBoards(query: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[Lever] Starting search for query: "${query}"`);
  const jobs: JobResult[] = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  const leverCompanies = [
    'netflix', 'shopify', 'stripe', 'squarespace', 'grammarly', 'canva',
    'reddit', 'discord', 'figma', 'miro', 'airtable', 'monday'
  ];
  
  console.log(`[Lever] Searching ${leverCompanies.length} companies`);
  
  const leverPromises = leverCompanies.map(async (company) => {
    try {
      const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
      console.log(`[Lever] Fetching: ${company}`);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        console.log(`[Lever] ${company} returned status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`[Lever] ${company} has ${data.length || 0} total jobs`);
      
      const filtered = (data || [])
        .filter((job: any) => {
          const jobText = `${job.text} ${job.description || ''}`.toLowerCase();
          const matches = searchTerms.every(term => jobText.includes(term));
          
          if (matches) {
            console.log(`[Lever] ${company} - Match: "${job.text}"`);
          }
          return matches;
        })
        .map((job: any) => ({
          id: `lever_${company}_${job.id}`,
          title: job.text,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: job.categories?.location || job.workplaceType || 'Remote',
          description: job.descriptionPlain || job.description,
          posted_date: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
          apply_url: job.hostedUrl || job.applyUrl,
          source: 'Lever',
          employment_type: job.categories?.commitment || 'full-time'
        }));
      
      return filtered;
    } catch (error) {
      console.error(`[Lever] Error fetching ${company}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  });

  const results = await Promise.allSettled(leverPromises);
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  });

  console.log(`[Lever] Search complete: ${jobs.length} matching jobs`);
  return jobs;
}

// Workday ATS Search
async function searchWorkdayBoards(query: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[Workday] Starting search for query: "${query}"`);
  const jobs: JobResult[] = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  // Major companies using Workday
  const workdayCompanies = [
    { id: 'shell', site: 'Shell_Careers' },
    { id: 'bp', site: 'bp' },
    { id: 'chevron', site: 'Chevron' },
    { id: 'conocophillips', site: 'ConocoPhillips' },
    { id: 'halliburton', site: 'Halliburton' },
    { id: 'slb', site: 'SLB' },
    { id: 'baker-hughes', site: 'BakerHughes' }
  ];
  
  console.log(`[Workday] Searching ${workdayCompanies.length} companies`);
  
  const workdayPromises = workdayCompanies.map(async ({ id, site }) => {
    try {
      // Workday job search API endpoint
      const url = `https://${id}.wd1.myworkdayjobs.com/wday/cxs/${site}/jobs`;
      console.log(`[Workday] Fetching: ${id}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          appliedFacets: {},
          limit: 20,
          offset: 0,
          searchText: query
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        console.log(`[Workday] ${id} returned status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      const totalJobs = data.jobPostings?.length || 0;
      console.log(`[Workday] ${id} has ${totalJobs} jobs for query`);
      
      const filtered = (data.jobPostings || [])
        .filter((job: any) => {
          const jobText = `${job.title} ${job.bulletFields?.join(' ') || ''}`.toLowerCase();
          const matches = searchTerms.every(term => jobText.includes(term));
          
          if (matches) {
            console.log(`[Workday] ${id} - Match: "${job.title}"`);
          }
          return matches;
        })
        .map((job: any) => ({
          id: `workday_${id}_${job.bulletFields?.[0] || Math.random()}`,
          title: job.title,
          company: id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          location: job.locationsText || 'Multiple Locations',
          description: job.bulletFields?.join('\n'),
          posted_date: job.postedOn || new Date().toISOString(),
          apply_url: `https://${id}.wd1.myworkdayjobs.com/en-US/${site}${job.externalPath}`,
          source: 'Workday',
          employment_type: 'full-time'
        }));
      
      return filtered;
    } catch (error) {
      console.error(`[Workday] Error fetching ${id}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  });

  const results = await Promise.allSettled(workdayPromises);
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  });

  console.log(`[Workday] Search complete: ${jobs.length} matching jobs`);
  return jobs;
}

// Recruitee ATS Search
async function searchRecruiteeBoards(query: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[Recruitee] Starting search for query: "${query}"`);
  const jobs: JobResult[] = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  // Tech companies and European startups using Recruitee
  const recruiteeCompanies = [
    'gitlab', 'miro', 'personio', 'contentful', 'adjust',
    'blacklane', 'deliveryhero', 'soundcloud', 'n26', 'wolt',
    'gorillas', 'tier', 'flixbus', 'celonis', 'commercetools',
    'helpling', 'orderbird', 'wooga', 'channable', 'bynder'
  ];
  
  console.log(`[Recruitee] Searching ${recruiteeCompanies.length} companies`);
  
  const recruiteePromises = recruiteeCompanies.map(async (company) => {
    try {
      const url = `https://${company}.recruitee.com/api/offers`;
      console.log(`[Recruitee] Fetching: ${company}`);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        console.log(`[Recruitee] ${company} returned status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`[Recruitee] ${company} has ${data.offers?.length || 0} total jobs`);
      
      const filtered = (data.offers || [])
        .filter((job: any) => {
          const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
          const matches = searchTerms.every(term => jobText.includes(term));
          
          if (matches) {
            console.log(`[Recruitee] ${company} - Match: "${job.title}"`);
          }
          return matches;
        })
        .map((job: any) => ({
          id: `recruitee_${company}_${job.id}`,
          title: job.title,
          company: company.charAt(0).toUpperCase() + company.slice(1).replace(/-/g, ' '),
          location: job.location || 'Remote',
          description: job.description,
          posted_date: job.created_at || new Date().toISOString(),
          apply_url: `https://${company}.recruitee.com/o/${job.slug || job.id}`,
          source: 'Recruitee',
          employment_type: job.employment_type || 'full-time'
        }));
      
      return filtered;
    } catch (error) {
      console.error(`[Recruitee] Error fetching ${company}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  });

  const results = await Promise.allSettled(recruiteePromises);
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  });

  console.log(`[Recruitee] Search complete: ${jobs.length} matching jobs`);
  return jobs;
}

// Workable ATS Search
async function searchWorkableBoards(query: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[Workable] Starting search for query: "${query}"`);
  const jobs: JobResult[] = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  // Diverse companies using Workable
  const workableCompanies = [
    'beat', 'blueground', 'epignosis', 'workable', 'taxibeat',
    'centaur', 'pollfish', 'zerogrey', 'instacar', 'skroutz',
    'plum', 'spotawheel', 'cardlink', 'citrix', 'instashop',
    'viva', 'persado', 'cognitiv', 'upstream', 'althaus',
    'hellas-direct', 'funky-buddha', 'efood', 'wolt', 'glovo',
    'box', 'deliveryhero', 'revolut', 'transferwise', 'tide'
  ];
  
  console.log(`[Workable] Searching ${workableCompanies.length} companies`);
  
  const workablePromises = workableCompanies.map(async (company) => {
    try {
      const url = `https://apply.workable.com/api/v1/widget/accounts/${company}`;
      console.log(`[Workable] Fetching: ${company}`);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        console.log(`[Workable] ${company} returned status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`[Workable] ${company} has ${data.jobs?.length || 0} total jobs`);
      
      const filtered = (data.jobs || [])
        .filter((job: any) => {
          const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
          const matches = searchTerms.every(term => jobText.includes(term));
          
          if (matches) {
            console.log(`[Workable] ${company} - Match: "${job.title}"`);
          }
          return matches;
        })
        .map((job: any) => ({
          id: `workable_${company}_${job.shortcode}`,
          title: job.title,
          company: company.charAt(0).toUpperCase() + company.slice(1).replace(/-/g, ' '),
          location: job.location?.city || job.location?.country || 'Remote',
          description: job.description,
          posted_date: job.published_on || new Date().toISOString(),
          apply_url: `https://apply.workable.com/${company}/j/${job.shortcode}/`,
          source: 'Workable',
          employment_type: job.employment_type || 'full-time'
        }));
      
      return filtered;
    } catch (error) {
      console.error(`[Workable] Error fetching ${company}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  });

  const results = await Promise.allSettled(workablePromises);
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  });

  console.log(`[Workable] Search complete: ${jobs.length} matching jobs`);
  return jobs;
}

// Ashby ATS Search
async function searchAshbyBoards(query: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[Ashby] Starting search for query: "${query}"`);
  const jobs: JobResult[] = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  const ashbyCompanies = [
    'notion', 'linear', 'ramp', 'watershed', 'vanta', 'merge', 'hex'
  ];
  
  console.log(`[Ashby] Searching ${ashbyCompanies.length} companies`);
  
  const ashbyPromises = ashbyCompanies.map(async (company) => {
    try {
      const url = `https://jobs.ashbyhq.com/${company}/jobs/api/non-user-facing-job-board`;
      console.log(`[Ashby] Fetching: ${company}`);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) {
        console.log(`[Ashby] ${company} returned status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`[Ashby] ${company} has ${data.jobs?.length || 0} total jobs`);
      
      const filtered = (data.jobs || [])
        .filter((job: any) => {
          const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
          const matches = searchTerms.every(term => jobText.includes(term));
          
          if (matches) {
            console.log(`[Ashby] ${company} - Match: "${job.title}"`);
          }
          return matches;
        })
        .map((job: any) => ({
          id: `ashby_${company}_${job.id}`,
          title: job.title,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: job.locationName || 'Remote',
          description: job.description,
          posted_date: job.publishedDate || new Date().toISOString(),
          apply_url: `https://jobs.ashbyhq.com/${company}/${job.id}`,
          source: 'Ashby',
          employment_type: job.employmentType || 'full-time'
        }));
      
      return filtered;
    } catch (error) {
      console.error(`[Ashby] Error fetching ${company}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  });

  const results = await Promise.allSettled(ashbyPromises);
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  });

  console.log(`[Ashby] Search complete: ${jobs.length} matching jobs`);
  return jobs;
}

function filterByDate(jobs: JobResult[], dateFilter: string): JobResult[] {
  if (dateFilter === 'any') return jobs;

  const now = new Date();
  const maxDays = dateFilter === '24h' ? 1 :
                  dateFilter === '3d' ? 3 :
                  dateFilter === '7d' ? 7 :
                  dateFilter === '14d' ? 14 :
                  dateFilter === '30d' ? 30 : null;

  if (!maxDays) return jobs;

  return jobs.filter(job => {
    const ageInDays = differenceInDays(now, new Date(job.posted_date));
    return ageInDays <= maxDays;
  });
}

function isContractJob(job: JobResult): boolean {
  const searchText = JSON.stringify(job).toLowerCase();
  const contractKeywords = ['contract', 'contractor', 'freelance', '1099', 'w2', 'corp-to-corp', 'c2c', 'consulting', 'consultant', 'interim', 'fractional'];
  return contractKeywords.some(keyword => searchText.includes(keyword));
}

function deduplicateJobs(jobs: JobResult[]): JobResult[] {
  const seen = new Map<string, JobResult>();
  
  for (const job of jobs) {
    const key = `${job.company.toLowerCase()}_${job.title.toLowerCase()}_${job.location}`.replace(/\s+/g, '_');
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }
  
  return Array.from(seen.values());
}

async function scoreWithVault(jobs: JobResult[], userId: string, supabaseClient: any): Promise<JobResult[]> {
  try {
    const { data: vault } = await supabaseClient
      .from('career_vault')
      .select('initial_analysis, vault_transferable_skills(stated_skill)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!vault) return jobs;

    const analysis = vault.initial_analysis as any;
    const targetRoles = analysis?.recommended_positions || [];
    const skills = vault.vault_transferable_skills?.map((s: any) => s.stated_skill.toLowerCase()) || [];

    return jobs.map(job => {
      let score = 0;
      const jobText = `${job.title} ${job.description || ''}`.toLowerCase();

      // Title match (50 points)
      if (targetRoles.some((role: string) => jobText.includes(role.toLowerCase()))) {
        score += 50;
      }

      // Skills match (5 points per skill, max 40)
      const matchingSkills = skills.filter((skill: string) => jobText.includes(skill));
      score += Math.min(matchingSkills.length * 5, 40);

      // Freshness bonus (10 points for <7 days)
      const ageInDays = differenceInDays(new Date(), new Date(job.posted_date));
      if (ageInDays <= 7) {
        score += 10;
      }

      return { ...job, match_score: score };
    });
  } catch (error) {
    console.error('Vault scoring error:', error);
    return jobs;
  }
}

function parseGoogleDate(dateStr: string): string {
  const now = new Date();
  const lowerDate = dateStr.toLowerCase();
  
  // Handle "just now", "today"
  if (lowerDate.includes('just now') || lowerDate === 'today') {
    return now.toISOString();
  }
  
  // Handle hours (e.g., "2 hours ago", "1 hour ago")
  if (lowerDate.includes('hour')) {
    const hours = parseInt(dateStr) || 1;
    return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  }
  
  // Handle days (e.g., "3 days ago", "1 day ago")
  if (lowerDate.includes('day')) {
    const days = parseInt(dateStr) || 1;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Handle weeks (e.g., "2 weeks ago", "1 week ago")
  if (lowerDate.includes('week')) {
    const weeks = parseInt(dateStr) || 1;
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Handle months (e.g., "1 month ago", "2 months ago")
  if (lowerDate.includes('month')) {
    const months = parseInt(dateStr) || 1;
    return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Default to current time if can't parse
  console.warn(`[Date Parse] Unknown format: "${dateStr}" - defaulting to now`);
  return now.toISOString();
}
