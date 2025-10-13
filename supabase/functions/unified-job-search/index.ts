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
      searchPromises.push(
        searchCompanyBoards(query, searchFilters)
          .then(jobs => {
            sourceStats.company_boards = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('Company boards error:', error);
            sourceStats.company_boards = { count: 0, status: 'error' };
            return [];
          })
      );
    }

    // Wait for all sources
    const results = await Promise.allSettled(searchPromises);
    
    // Collect all jobs
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value);
      }
    });

    // Filter by date
    console.log(`[Search Pipeline] Raw jobs from all sources: ${allJobs.length}`);
    let filteredJobs = filterByDate(allJobs, searchFilters.datePosted);
    console.log(`[Date Filter] "${searchFilters.datePosted}" -> ${filteredJobs.length} jobs`);
    
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
    console.log(`[Dedup] ${contractFiltered.length} -> ${uniqueJobs.length} jobs after deduplication`);

    // Score against Career Vault if userId provided
    let scoredJobs = uniqueJobs;
    if (userId) {
      scoredJobs = await scoreWithVault(uniqueJobs, userId, supabaseClient);
    }

    // Sort by match score (if available) and then by posted date
    scoredJobs.sort((a, b) => {
      if (a.match_score && b.match_score && a.match_score !== b.match_score) {
        return b.match_score - a.match_score;
      }
      return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
    });

    const executionTime = Date.now() - startTime;

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
    console.warn('SEARCHAPI_KEY not configured');
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

  const response = await fetch(`https://www.searchapi.io/api/v1/search?${params}`);
      if (!response.ok) throw new Error('Google Jobs API failed');

  const data = await response.json();
  const jobs: JobResult[] = [];
  
  console.log(`[Google Jobs] Raw API response: ${data.jobs_results?.length || 0} jobs`);

  if (data.jobs_results) {
    for (const job of data.jobs_results) {
      if (!job.detected_extensions?.posted_at) continue; // Skip jobs without posting dates

      jobs.push({
        id: `google_${job.job_id || Math.random()}`,
        title: job.title,
        company: job.company_name,
        location: job.location,
        description: job.description,
        posted_date: parseGoogleDate(job.detected_extensions.posted_at),
        apply_url: job.apply_options?.[0]?.link || job.share_url,
        source: 'Google Jobs',
        remote_type: job.location?.toLowerCase().includes('remote') ? 'remote' : null,
        employment_type: job.detected_extensions?.schedule_type || null
      });
    }
  }

  return jobs;
}

async function searchCompanyBoards(query: string, filters: SearchFilters): Promise<JobResult[]> {
  const jobs: JobResult[] = [];
  const searchTerm = query.toLowerCase();
  
  // Greenhouse boards - top 20 for speed
  const greenhouseBoards = ['openai', 'anthropic', 'stripe', 'figma', 'notion', 'linear', 'vercel', 'cloudflare', 'databricks', 'scale', 'rippling', 'meta', 'shopify', 'gitlab', 'twilio', 'salesforce', 'zoom', 'slack', 'dropbox', 'atlassian'];
  
  const greenhousePromises = greenhouseBoards.map(async (board) => {
    try {
      const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.jobs || [])
        .filter((job: any) => {
          if (!job.updated_at) return false;
          const jobText = `${job.title} ${job.content}`.toLowerCase();
          return jobText.includes(searchTerm);
        })
        .map((job: any) => ({
          id: `greenhouse_${board}_${job.id}`,
          title: job.title,
          company: board.charAt(0).toUpperCase() + board.slice(1),
          location: job.location?.name || 'Remote',
          description: job.content,
          posted_date: job.updated_at,
          apply_url: job.absolute_url,
          source: 'Greenhouse',
          employment_type: 'full-time'
        }));
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(greenhousePromises);
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value);
    }
  });

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
