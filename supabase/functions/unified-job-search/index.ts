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

// Helper function to parse boolean strings
function parseBooleanString(booleanString: string): {
  titles: string[];
  skills: string[];
  exclusions: string[];
} {
  const titles: string[] = [];
  const skills: string[] = [];
  const exclusions: string[] = [];
  
  // Extract exclusions (words after - or NOT)
  const exclusionRegex = /-["']?([^"'\s]+)["']?|NOT\s+["']?([^"'\s]+)["']?/gi;
  let match;
  while ((match = exclusionRegex.exec(booleanString)) !== null) {
    exclusions.push((match[1] || match[2]).trim());
  }
  
  // Remove exclusions from string for further parsing
  let cleanString = booleanString.replace(exclusionRegex, '');
  
  // Extract titles (typically in parentheses with OR)
  const titleRegex = /\(([^)]+)\)/g;
  while ((match = titleRegex.exec(cleanString)) !== null) {
    const orClause = match[1];
    orClause.split(/\s+OR\s+/i).forEach(title => {
      titles.push(title.replace(/['"]/g, '').trim());
    });
  }
  
  // If no parentheses found, check for OR clauses at top level
  if (titles.length === 0) {
    const parts = cleanString.split(/\s+OR\s+/i);
    if (parts.length > 1) {
      parts.forEach(part => {
        const title = part.split(/\s+AND\s+/i)[0].replace(/['"]/g, '').trim();
        if (title) titles.push(title);
      });
    }
  }
  
  // If still no titles, use the first part before AND
  if (titles.length === 0) {
    const firstPart = cleanString.split(/\s+AND\s+/i)[0].replace(/['"]/g, '').trim();
    if (firstPart) titles.push(firstPart);
  }
  
  // Extract skills (typically AND clauses)
  const skillRegex = /AND\s+["']?([^"'\s]+)["']?/gi;
  while ((match = skillRegex.exec(cleanString)) !== null) {
    const skill = match[1].trim();
    if (!titles.includes(skill)) {
      skills.push(skill);
    }
  }
  
  console.log(`[Boolean Parser] Extracted - Titles: ${titles.length}, Skills: ${skills.length}, Exclusions: ${exclusions.length}`);
  
  return { titles, skills, exclusions };
}

// Helper function to deduplicate jobs
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
      datePosted: '30d',
      contractOnly: false,
      remoteType: 'any',
      employmentType: 'any'
    };

    console.log(`[UNIFIED-SEARCH] Received filters:`, searchFilters);

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

    // Store jobs in database
    if (scoredJobs.length > 0) {
      console.log('[UNIFIED-SEARCH] Storing jobs in database...');
      
      const jobsToInsert = scoredJobs.map(job => ({
        external_id: job.id,
        source: job.source,
        job_title: job.title,
        company_name: job.company,
        company_logo_url: null,
        location: job.location,
        remote_type: job.remote_type,
        employment_type: job.employment_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: 'USD',
        salary_period: 'year',
        job_description: job.description?.substring(0, 5000),
        posted_date: job.posted_date,
        apply_url: job.apply_url,
        is_active: true,
        match_score: job.match_score,
        raw_data: {},
      }));
      
      const { error: insertError } = await supabaseClient
        .from('job_listings')
        .upsert(jobsToInsert, { 
          onConflict: 'external_id,source',
          ignoreDuplicates: false 
        });
      
      if (insertError) {
        console.error('[UNIFIED-SEARCH] Error storing jobs:', insertError);
      } else {
        console.log(`[UNIFIED-SEARCH] Stored ${jobsToInsert.length} jobs in database`);
      }
    }

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

// Determine remote type from job data
function determineRemoteType(job: any): string | null {
  const location = (job.location || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  
  if (location.includes('remote') || description.includes('fully remote')) return 'remote';
  if (location.includes('hybrid') || description.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

// Parse salary from detected_extensions
function parseSalary(salaryText?: string): { min: number | null; max: number | null; period: string } | null {
  if (!salaryText) return null;
  
  const hourlyMatch = salaryText.match(/\$(\d+(?:,\d+)?)\s*(?:–|-|to)\s*\$(\d+(?:,\d+)?)\s*(?:an?\s*hour|\/hr)/i);
  const yearlyMatch = salaryText.match(/\$(\d+(?:,\d+)?[KkMm]?)\s*(?:–|-|to)\s*\$(\d+(?:,\d+)?[KkMm]?)\s*(?:a\s*year|\/year|annually)/i);
  const singleMatch = salaryText.match(/\$(\d+(?:,\d+)?[KkMm]?)\s*(?:a\s*year|an?\s*hour)/i);
  
  const parseAmount = (str: string): number => {
    str = str.replace(/,/g, '');
    if (str.match(/k/i)) return parseFloat(str) * 1000;
    if (str.match(/m/i)) return parseFloat(str) * 1000000;
    return parseFloat(str);
  };
  
  if (yearlyMatch) {
    return {
      min: parseAmount(yearlyMatch[1]),
      max: parseAmount(yearlyMatch[2]),
      period: 'year'
    };
  }
  if (hourlyMatch) {
    return {
      min: parseAmount(hourlyMatch[1]) * 2080,
      max: parseAmount(hourlyMatch[2]) * 2080,
      period: 'year'
    };
  }
  if (singleMatch) {
    const amount = parseAmount(singleMatch[1]);
    return {
      min: amount,
      max: amount,
      period: salaryText.includes('hour') ? 'hour' : 'year'
    };
  }
  
  return null;
}

// Helper function for single title search
async function searchSingleTitle(
  query: string, 
  location: string, 
  filters: SearchFilters, 
  apiKey: string
): Promise<JobResult[]> {
  const params = new URLSearchParams({
    engine: 'google_jobs',
    q: query,
    location: location || 'United States',
    api_key: apiKey,
    num: '100'
  });

  // Fix date filter format - use chips parameter
  if (filters.datePosted && filters.datePosted !== 'any') {
    const dateMap: Record<string, string> = {
      '24h': 'today',
      '3d': '3days',
      '7d': 'week',
      '14d': 'month',
      '30d': 'month'
    };
    const mappedDate = dateMap[filters.datePosted] || 'month';
    params.set('chips', `date_posted:${mappedDate}`);
    console.log(`[Google Jobs] Date filter: ${filters.datePosted} → date_posted:${mappedDate}`);
  }

  // Add employment type filter
  if (filters.employmentType && filters.employmentType !== 'any') {
    const typeMap: Record<string, string> = {
      'full-time': 'FULLTIME',
      'contract': 'CONTRACTOR',
      'part-time': 'PARTTIME',
      'internship': 'INTERN'
    };
    const employmentChip = typeMap[filters.employmentType];
    if (employmentChip) {
      const existingChips = params.get('chips') || '';
      params.set('chips', existingChips ? `${existingChips},employment_type:${employmentChip}` : `employment_type:${employmentChip}`);
    }
  }

  const url = `https://www.searchapi.io/api/v1/search?${params}`;
  console.log(`[Google Jobs] Request URL: ${url}`);
  console.log(`[Google Jobs] Parameters:`, Object.fromEntries(params));
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Google Jobs] API Error Response:`, errorText);
    console.error(`[Google Jobs] Status: ${response.status} ${response.statusText}`);
    throw new Error(`Google Jobs API failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Google Jobs] Full API Response Sample:`, JSON.stringify(data, null, 2).substring(0, 1000));
  console.log(`[Google Jobs] Response keys:`, Object.keys(data));
  console.log(`[Google Jobs] Jobs results count:`, data.jobs_results?.length || 0);
  
  const jobs: JobResult[] = [];

  if (data.jobs_results && data.jobs_results.length > 0) {
    for (const job of data.jobs_results) {
      const postedDate = job.detected_extensions?.posted_at 
        ? parseGoogleDate(job.detected_extensions.posted_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const salary = parseSalary(job.detected_extensions?.salary);

      jobs.push({
        id: `google_${job.job_id || Math.random().toString(36).substr(2, 9)}`,
        title: job.title,
        company: job.company_name,
        location: job.location,
        description: job.description,
        posted_date: postedDate,
        apply_url: job.share_url || job.apply_options?.[0]?.link,
        source: 'Google Jobs',
        remote_type: determineRemoteType(job),
        employment_type: job.detected_extensions?.schedule || null,
        salary_min: salary?.min,
        salary_max: salary?.max
      });
    }
  }

  console.log(`[Google Jobs] Parsed ${jobs.length} jobs for "${query}"`);
  return jobs;
}

async function searchGoogleJobs(query: string, location: string, filters: SearchFilters): Promise<JobResult[]> {
  const searchApiKey = Deno.env.get('SEARCHAPI_KEY');
  if (!searchApiKey) {
    console.warn('[Google Jobs] SEARCHAPI_KEY not configured');
    return [];
  }

  let searchQuery = query;
  let parsedBoolean: { titles: string[]; skills: string[]; exclusions: string[] } | null = null;
  
  // If boolean string provided, parse it
  if (filters.booleanString?.trim()) {
    parsedBoolean = parseBooleanString(filters.booleanString);
    console.log(`[Google Jobs] Parsed boolean:`, parsedBoolean);
    
    // If we have multiple titles, make parallel searches
    if (parsedBoolean.titles.length > 1) {
      console.log(`[Google Jobs] Making ${parsedBoolean.titles.length} parallel searches`);
      const allJobs = await Promise.all(
        parsedBoolean.titles.map(title => 
          searchSingleTitle(title, location, filters, searchApiKey)
        )
      );
      
      // Combine and deduplicate
      let combinedJobs = allJobs.flat();
      console.log(`[Google Jobs] Combined ${combinedJobs.length} jobs from ${parsedBoolean.titles.length} title queries`);
      
      combinedJobs = deduplicateJobs(combinedJobs);
      console.log(`[Google Jobs] After deduplication: ${combinedJobs.length} jobs`);
      
      // Apply skill filters
      if (parsedBoolean && parsedBoolean.skills.length > 0) {
        const beforeSkillFilter = combinedJobs.length;
        combinedJobs = combinedJobs.filter(job => {
          const jobText = `${job.title} ${job.description}`.toLowerCase();
          return parsedBoolean!.skills.some(skill => 
            jobText.includes(skill.toLowerCase())
          );
        });
        console.log(`[Google Jobs] Skill filter (${parsedBoolean.skills.join(', ')}): ${beforeSkillFilter} → ${combinedJobs.length} jobs`);
      }
      
      // Apply exclusions
      if (parsedBoolean && parsedBoolean.exclusions.length > 0) {
        const beforeExclusion = combinedJobs.length;
        combinedJobs = combinedJobs.filter(job => {
          const jobText = `${job.title} ${job.description}`.toLowerCase();
          return !parsedBoolean!.exclusions.some(exclusion => 
            jobText.includes(exclusion.toLowerCase())
          );
        });
        console.log(`[Google Jobs] Exclusion filter (${parsedBoolean.exclusions.join(', ')}): ${beforeExclusion} → ${combinedJobs.length} jobs`);
      }
      
      return combinedJobs;
    } else if (parsedBoolean.titles.length === 1) {
      searchQuery = parsedBoolean.titles[0];
      console.log(`[Google Jobs] Using single title from boolean: "${searchQuery}"`);
    }
  }

  // Single search (no boolean or single title)
  return searchSingleTitle(searchQuery, location, filters, searchApiKey);
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
