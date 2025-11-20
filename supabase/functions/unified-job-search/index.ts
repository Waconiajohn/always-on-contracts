import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'any' | 'local';
  employmentType?: 'full-time' | 'contract' | 'freelance' | 'any';
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  booleanString?: string;
  nextPageToken?: string;
  radiusMiles?: number;
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
    const { query, location, radiusMiles, filters, userId, sources, nextPageToken } = await req.json();
    
    console.log('[UNIFIED-SEARCH] ========================================');
    console.log('[UNIFIED-SEARCH] REQUEST RECEIVED');
    console.log('[UNIFIED-SEARCH] Query:', query);
    console.log('[UNIFIED-SEARCH] Sources param type:', typeof sources);
    console.log('[UNIFIED-SEARCH] Sources param value:', JSON.stringify(sources));
    console.log('[UNIFIED-SEARCH] Sources is array:', Array.isArray(sources));
    console.log('[UNIFIED-SEARCH] ========================================');
    
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    const searchFilters: SearchFilters = filters || {
      datePosted: '30d',
      contractOnly: false,
      remoteType: 'any',
      employmentType: 'any',
      nextPageToken: nextPageToken
    };

    console.log(`[UNIFIED-SEARCH] Received filters:`, searchFilters);
    console.log(`[UNIFIED-SEARCH] Location: "${location || 'Any'}"`);
    console.log(`[UNIFIED-SEARCH] Radius: ${radiusMiles ? `${radiusMiles} miles` : 'not specified'}`);
    console.log(`[UNIFIED-SEARCH] Next Page Token: ${nextPageToken ? 'provided' : 'none'}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const enabledSources = sources || ['google_jobs', 'company_boards', 'usajobs', 'adzuna', 'jsearch'];
    console.log('[UNIFIED-SEARCH] Enabled sources after default:', JSON.stringify(enabledSources));
    const allJobs: JobResult[] = [];
    const sourceStats: Record<string, { count: number; status: string }> = {};
    const startTime = Date.now();

    // Search all sources in parallel
    const searchPromises = [];

    let googleJobsNextPageToken: string | undefined;
    
    console.log('[UNIFIED-SEARCH] ════════════════════════════════════════');
    console.log('[UNIFIED-SEARCH] SOURCE CHECK FOR GOOGLE_JOBS');
    console.log('[UNIFIED-SEARCH] enabledSources:', JSON.stringify(enabledSources));
    console.log('[UNIFIED-SEARCH] typeof enabledSources:', typeof enabledSources);
    console.log('[UNIFIED-SEARCH] Array.isArray(enabledSources):', Array.isArray(enabledSources));
    console.log('[UNIFIED-SEARCH] enabledSources.length:', enabledSources?.length);
    console.log('[UNIFIED-SEARCH] enabledSources content:', enabledSources);
    console.log('[UNIFIED-SEARCH] Checking includes("google_jobs"):', enabledSources.includes('google_jobs'));
    console.log('[UNIFIED-SEARCH] ════════════════════════════════════════');
    
    if (enabledSources.includes('google_jobs')) {
      console.log('[UNIFIED-SEARCH] ✅ google_jobs IS INCLUDED - Starting Google Jobs search');
      searchPromises.push(
        searchGoogleJobs(query, location, searchFilters)
          .then(result => {
            googleJobsNextPageToken = result.nextPageToken;
            sourceStats.google_jobs = { count: result.jobs.length, status: 'success' };
            // Mark source for debugging
            return result.jobs.map(job => ({ ...job, _source: 'google_jobs' }));
          })
          .catch(error => {
            console.error('[Google Jobs] ❌ CRITICAL ERROR:', error);
            console.error('[Google Jobs] Error name:', error?.name);
            console.error('[Google Jobs] Error message:', error?.message);
            console.error('[Google Jobs] Error stack:', error?.stack);
            sourceStats.google_jobs = { 
              count: 0, 
              status: `error: ${error?.message || 'unknown'}` 
            };
            return [];
          })
      );
    } else {
      console.log('[UNIFIED-SEARCH] ❌ google_jobs NOT INCLUDED - Skipping Google Jobs search');
      console.log('[UNIFIED-SEARCH] enabledSources was:', JSON.stringify(enabledSources));
    }

    // USAJobs.gov - Federal Government Jobs
    if (enabledSources.includes('usajobs')) {
      console.log('[UNIFIED-SEARCH] ✅ usajobs IS INCLUDED - Starting USAJobs.gov search');
      searchPromises.push(
        searchUSAJobs(query, location, searchFilters)
          .then(jobs => {
            sourceStats.usajobs = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('[USAJobs] ❌ ERROR:', error);
            sourceStats.usajobs = { count: 0, status: `error: ${error?.message || 'unknown'}` };
            return [];
          })
      );
    }

    // Adzuna - Job aggregator API
    if (enabledSources.includes('adzuna')) {
      console.log('[UNIFIED-SEARCH] ✅ adzuna IS INCLUDED - Starting Adzuna search');
      searchPromises.push(
        searchAdzuna(query, location, searchFilters)
          .then(jobs => {
            sourceStats.adzuna = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('[Adzuna] ❌ ERROR:', error);
            sourceStats.adzuna = { count: 0, status: `error: ${error?.message || 'unknown'}` };
            return [];
          })
      );
    }

    // JSearch - RapidAPI job aggregator (LinkedIn, Indeed, Glassdoor, ZipRecruiter, Dice)
    if (enabledSources.includes('jsearch')) {
      console.log('[UNIFIED-SEARCH] ✅ jsearch IS INCLUDED - Starting JSearch (RapidAPI) search');
      searchPromises.push(
        searchJSearch(query, location, searchFilters)
          .then(jobs => {
            sourceStats.jsearch = { count: jobs.length, status: 'success' };
            return jobs;
          })
          .catch(error => {
            console.error('[JSearch] ❌ ERROR:', error);
            sourceStats.jsearch = { count: 0, status: `error: ${error?.message || 'unknown'}` };
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

    // Apply location filter if specified (only for non-location-aware sources)
    let locationFilteredJobs = uniqueJobs;
    if (location && location.trim()) {
      const beforeLocationFilter = uniqueJobs.length;
      const locationLower = location.toLowerCase().trim();
      
      // Extract city and state from location string (e.g., "Minneapolis, MN" or "Denver Colorado")
      // Split by comma first, then try to identify city/state pattern
      let locationParts: string[] = [];
      if (locationLower.includes(',')) {
        // Standard format: "City, State"
        locationParts = locationLower.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
      } else {
        // No comma format: "Denver Colorado" - split by space and take last word as state
        const words = locationLower.split(/\s+/).filter((w: string) => w.length > 0);
        if (words.length >= 2) {
          const possibleState = words[words.length - 1];
          const possibleCity = words.slice(0, -1).join(' ');
          locationParts = [possibleCity, possibleState];
        } else {
          // Single word - treat as city or state
          locationParts = words;
        }
      }
      
      console.log(`[Location Filter] Parsed "${location}" into parts:`, locationParts);
      
      locationFilteredJobs = uniqueJobs.filter(job => {
        // If no location specified, filter out unless explicitly remote and user wants remote
        if (!job.location || job.location.trim() === '') {
          const isRemoteJob = job.remote_type && job.remote_type.toLowerCase() === 'remote';
          const userWantsRemote = !searchFilters.remoteType || 
                                  searchFilters.remoteType === 'any' || 
                                  searchFilters.remoteType === 'remote';
          return isRemoteJob && userWantsRemote;
        }
        
        const jobLocationLower = job.location.toLowerCase().trim();
        const jobRemoteTypeLower = (job.remote_type || '').toLowerCase();
        
        // Check if location field is just describing work arrangement (not an actual location)
        const isWorkArrangementOnly = /^(hybrid|remote|distributed|flexible|work from home|wfh)$/i.test(jobLocationLower) ||
                                      /^(hybrid|remote|distributed);?\s*(hybrid|remote|distributed|flexible)?$/i.test(jobLocationLower);
        
        // If location is just work arrangement description, don't filter by location
        // These jobs will be filtered by remoteType in the next filter stage
        if (isWorkArrangementOnly) {
          console.log(`[Location Filter] ✅ Keeping "${job.title}" - location is work arrangement only: "${job.location}"`);
          return true;
        }
        
        // Filter out fully remote jobs if user wants onsite/hybrid in specific location
        if (jobRemoteTypeLower === 'remote') {
          const userWantsRemote = !searchFilters.remoteType || 
                                  searchFilters.remoteType === 'any' || 
                                  searchFilters.remoteType === 'remote';
          return userWantsRemote;
        }
        
        // For onsite/hybrid jobs with actual location, verify location actually matches
        // Check if ALL location parts are present in the job location
        const locationMatches = locationParts.every((part: string) => 
          part.length > 0 && jobLocationLower.includes(part)
        );
        
        if (!locationMatches) {
          console.log(`[Location Filter] ❌ Filtered out: "${job.title}" at "${job.location}" (doesn't match "${location}")`);
        }
        
        return locationMatches;
      });
      
      console.log(`[Location Filter] Applied "${location}" filter: ${beforeLocationFilter} → ${locationFilteredJobs.length} jobs`);
    }

    // Apply remote type filter - Remote vs Local (Hybrid/Onsite)
    let remoteFilteredJobs = locationFilteredJobs;
    if (searchFilters.remoteType && searchFilters.remoteType !== 'any') {
      const beforeRemoteFilter = locationFilteredJobs.length;
      const filterRemoteType = searchFilters.remoteType.toLowerCase();
      
      remoteFilteredJobs = locationFilteredJobs.filter(job => {
        const jobRemoteType = (job.remote_type || 'onsite').toLowerCase().trim();
        
        let matches = false;
        
        if (filterRemoteType === 'remote') {
          // User wants only fully remote jobs
          matches = jobRemoteType === 'remote';
          if (!matches) {
            console.log(`[Remote Type Filter] ❌ Filtered out: "${job.title}" (${jobRemoteType} is not remote)`);
          }
        } else if (filterRemoteType === 'local' || filterRemoteType === 'onsite' || filterRemoteType === 'hybrid') {
          // User wants hybrid OR onsite jobs (anything requiring physical presence)
          // Support both new 'local' value and old 'onsite'/'hybrid' values for backward compatibility
          matches = jobRemoteType === 'hybrid' || jobRemoteType === 'onsite';
          if (!matches) {
            console.log(`[Remote Type Filter] ❌ Filtered out: "${job.title}" (${jobRemoteType} is not hybrid/onsite)`);
          }
        }
        
        return matches;
      });
      
      console.log(`[Remote Type Filter] Applied "${searchFilters.remoteType}" filter: ${beforeRemoteFilter} → ${remoteFilteredJobs.length} jobs`);
    }

    // Apply employment type filter (for all sources)
    let employmentFilteredJobs = remoteFilteredJobs;
    if (searchFilters.employmentType && searchFilters.employmentType !== 'any') {
      const beforeEmploymentFilter = remoteFilteredJobs.length;
      employmentFilteredJobs = remoteFilteredJobs.filter(job => {
        if (!job.employment_type) return false;
        
        const jobType = job.employment_type.toLowerCase();
        const filterType = searchFilters.employmentType!.toLowerCase();
        
        // Handle variations in employment type naming
        if (filterType === 'full-time') {
          return jobType.includes('full') || jobType.includes('fulltime') || jobType === 'full_time';
        }
        if (filterType === 'contract') {
          return jobType.includes('contract') || jobType.includes('contractor') || jobType.includes('freelance');
        }
        if (filterType === 'freelance') {
          return jobType.includes('freelance') || jobType.includes('contract');
        }
        
        return jobType.includes(filterType);
      });
      console.log(`[Employment Type Filter] Applied "${searchFilters.employmentType}" filter: ${beforeEmploymentFilter} → ${employmentFilteredJobs.length} jobs`);
    }

    // Score against Career Vault if userId provided
    let scoredJobs = employmentFilteredJobs;
    if (userId) {
      console.log(`[Vault Scoring] Scoring ${employmentFilteredJobs.length} FILTERED jobs against user Career Vault...`);
      scoredJobs = await scoreWithVault(employmentFilteredJobs, userId, supabaseClient);
      const scoredCount = scoredJobs.filter(j => j.match_score && j.match_score > 0).length;
      console.log(`[Vault Scoring] Successfully scored ${scoredCount} jobs`);
    } else {
      console.log(`[Vault Scoring] No userId provided, skipping vault scoring`);
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
      console.log(`[UNIFIED-SEARCH] Storing ${scoredJobs.length} FILTERED jobs in database...`);
      console.log(`[UNIFIED-SEARCH] Sample jobs being stored:`, scoredJobs.slice(0, 3).map(j => ({ title: j.title, location: j.location, remote_type: j.remote_type })));
      
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
        executionTime,
        nextPageToken: googleJobsNextPageToken
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

// Helper function for single title search with pagination support
async function searchSingleTitle(
  query: string, 
  location: string, 
  filters: SearchFilters, 
  apiKey: string
): Promise<{ jobs: JobResult[]; nextPageToken?: string }> {
  console.log('[Google Jobs] 🔄 Starting paginated search for:', query);
  
  const allJobs: JobResult[] = [];
  let currentPageToken: string | undefined = filters.nextPageToken;
  const maxPages = 5; // Fetch up to 5 pages (50 results)
  let pageCount = 0;
  
  // Overall timeout for entire pagination process (60 seconds total)
  const overallController = new AbortController();
  const overallTimeoutId = setTimeout(() => {
    console.log('[Google Jobs] ⏱️ Overall pagination timeout (60s) - returning results collected so far');
    overallController.abort();
  }, 60000);

  try {
    // Loop through pages
    while (pageCount < maxPages) {
      pageCount++;
      console.log(`[Google Jobs] 📄 Fetching page ${pageCount}/${maxPages}`);
      
      const params = new URLSearchParams({
        engine: 'google_jobs',
        q: query,
        api_key: apiKey,
        num: '100'
      });

      // Add location with proper formatting (City, State format)
      if (location && location.trim()) {
        params.set('location', location);

        // Add radius if provided (in miles)
        // SearchAPI uses 'lrad' parameter for location radius
        if (filters.radiusMiles && filters.radiusMiles > 0) {
          params.set('lrad', filters.radiusMiles.toString());
          console.log(`[Google Jobs] Setting location radius: ${filters.radiusMiles} miles`);
        }
      } else {
        params.set('location', 'United States');
      }

      // Add pagination token if we have one
      if (currentPageToken) {
        params.set('next_page_token', currentPageToken);
        console.log(`[Google Jobs] Using pagination token for page ${pageCount}`);
      }

      // Fix date filter format - use chips parameter with correct mappings
      if (filters.datePosted && filters.datePosted !== 'any') {
        const dateMap: Record<string, string> = {
          '24h': 'today',
          '3d': '3days',    // SearchAPI supports this
          '7d': 'week',
          '14d': 'week',    // Map to week (closest match)
          '30d': 'month'
        };
        const mappedDate = dateMap[filters.datePosted] || 'month';
        params.set('chips', `date_posted:${mappedDate}`);
        console.log(`[Google Jobs] Date filter: ${filters.datePosted} → ${mappedDate}`);
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

      // Add remote type filter using chips parameter (Google Jobs API)
      if (filters.remoteType && filters.remoteType !== 'any') {
        if (filters.remoteType === 'remote') {
          const existingChips = params.get('chips') || '';
          const remoteChip = 'work_from_home:1';
          params.set('chips', existingChips ? `${existingChips},${remoteChip}` : remoteChip);
        }
      }

      const url = `https://www.searchapi.io/api/v1/search?${params}`;
      console.log(`[Google Jobs] 🌐 About to fetch page ${pageCount}`);
      console.log(`[Google Jobs] URL: ${url.substring(0, 100)}...`);
      
      // Per-request timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Google Jobs] ⏱️ Page ${pageCount} timeout (30s) - moving to next page`);
        controller.abort();
      }, 30000);

      let data;
      
      try {
        console.log(`[Google Jobs] 🚀 Calling fetch for page ${pageCount}...`);
        const response = await fetch(url, { signal: controller.signal });
        console.log(`[Google Jobs] ✅ Fetch returned for page ${pageCount}, status: ${response.status}`);
        
        if (!response.ok) {
          console.log(`[Google Jobs] ❌ Response not OK for page ${pageCount}`);
          const errorText = await response.text();
          clearTimeout(timeoutId);
          console.error(`[Google Jobs] Page ${pageCount} API Error: ${response.status} - ${errorText}`);
          break; // Stop pagination on error
        }

        console.log(`[Google Jobs] 📥 Parsing JSON for page ${pageCount}...`);
        data = await response.json();
        console.log(`[Google Jobs] ✅ JSON parsed for page ${pageCount}, has ${data.jobs?.length || 0} jobs`);
        clearTimeout(timeoutId);
        
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`[Google Jobs] Page ${pageCount} timed out - continuing with results so far`);
          break; // Stop pagination on timeout
        }
        console.error(`[Google Jobs] Page ${pageCount} error:`, error);
        break; // Stop pagination on error
      }
      
      // Parse jobs from this page
      if (data.jobs && data.jobs.length > 0) {
        console.log(`[Google Jobs] Page ${pageCount} returned ${data.jobs.length} jobs`);
        
        for (const job of data.jobs) {
          const postedDate = job.detected_extensions?.posted_at 
            ? parseGoogleDate(job.detected_extensions.posted_at)
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const salary = parseSalary(job.detected_extensions?.salary);

          allJobs.push({
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
      } else {
        console.log(`[Google Jobs] Page ${pageCount} returned no jobs - stopping pagination`);
        break;
      }

      // Check if there's a next page
      currentPageToken = data.pagination?.next_page_token;
      if (!currentPageToken) {
        console.log(`[Google Jobs] No more pages available after page ${pageCount}`);
        break;
      }
      
      console.log(`[Google Jobs] Total jobs collected so far: ${allJobs.length}`);
    }
    
    clearTimeout(overallTimeoutId);
    
  } catch (error: unknown) {
    clearTimeout(overallTimeoutId);
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error(`[Google Jobs] Pagination error:`, error);
    }
  }

  console.log(`[Google Jobs] ✅ Pagination complete: ${allJobs.length} total jobs from ${pageCount} pages`);
  
  return { 
    jobs: allJobs, 
    nextPageToken: currentPageToken 
  };
}

async function searchGoogleJobs(query: string, location: string, filters: SearchFilters): Promise<{ jobs: JobResult[]; nextPageToken?: string }> {
  console.log('[Google Jobs] 🎯 FUNCTION ENTERED - Starting Google Jobs search');
  console.log('[Google Jobs] Query:', query);
  console.log('[Google Jobs] Location:', location);
  console.log('[Google Jobs] Filters:', JSON.stringify(filters));
  
  const searchApiKey = Deno.env.get('SEARCHAPI_KEY');
  console.log('[Google Jobs] API Key check:', searchApiKey ? 'PRESENT' : 'MISSING');
  
  if (!searchApiKey) {
    console.error('[Google Jobs] ❌ SEARCHAPI_KEY not configured in environment');
    console.error('[Google Jobs] Available env vars:', Object.keys(Deno.env.toObject()).join(', '));
    return { jobs: [], nextPageToken: undefined };
  }
  console.log('[Google Jobs] ✅ API key found:', searchApiKey.substring(0, 8) + '...');

  let searchQuery = query;
  let parsedBoolean: { titles: string[]; skills: string[]; exclusions: string[] } | null = null;
  
  // If boolean string provided, parse it
  if (filters.booleanString?.trim()) {
    parsedBoolean = parseBooleanString(filters.booleanString);
    console.log(`[Google Jobs] Parsed boolean:`, parsedBoolean);
    
    // If we have multiple titles, make parallel searches
    if (parsedBoolean.titles.length > 1) {
      console.log(`[Google Jobs] Making ${parsedBoolean.titles.length} parallel searches`);
      const allResults = await Promise.all(
        parsedBoolean.titles.map(title => 
          searchSingleTitle(title, location, filters, searchApiKey)
        )
      );
      
      // Combine and deduplicate jobs (note: pagination tokens are lost in multi-title search)
      let combinedJobs = allResults.flatMap(result => result.jobs);
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
      
      return { jobs: combinedJobs, nextPageToken: undefined };
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

async function searchUSAJobs(query: string, location: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[USAJobs] Starting search for query: "${query}", location: "${location}"`);
  const jobs: JobResult[] = [];

  try {
    // USAJobs.gov API - Free, requires email registration for API key
    // For now, we'll use a basic implementation without auth (public listings)
    // Production should use proper API key: https://developer.usajobs.gov/APIRequest/Index

    const params = new URLSearchParams();
    params.set('Keyword', query);

    if (location && location.trim()) {
      // USAJobs supports location code or name
      params.set('LocationName', location);
    }

    // Date filtering
    if (filters.datePosted !== 'any') {
      const now = new Date();
      const daysAgo = filters.datePosted === '24h' ? 1 :
                      filters.datePosted === '3d' ? 3 :
                      filters.datePosted === '7d' ? 7 :
                      filters.datePosted === '14d' ? 14 :
                      filters.datePosted === '30d' ? 30 : null;

      if (daysAgo) {
        const fromDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const toDate = now;
        params.set('DatePosted', '1'); // Last day
        // Note: USAJobs uses DatePosted codes: 1=24h, 2=3days, 3=7days, 4=14days, 5=30days
        const dateCode = daysAgo === 1 ? '1' :
                        daysAgo === 3 ? '2' :
                        daysAgo === 7 ? '3' :
                        daysAgo === 14 ? '4' :
                        daysAgo === 30 ? '5' : '3';
        params.set('DatePosted', dateCode);
      }
    }

    // Remote work filter
    if (filters.remoteType === 'remote') {
      params.set('RemoteIndicator', 'true');
    }

    // Results per page
    params.set('ResultsPerPage', '500'); // Max allowed by USAJobs

    const url = `https://data.usajobs.gov/api/search?${params.toString()}`;
    console.log(`[USAJobs] Fetching: ${url}`);

    // Note: In production, add proper headers:
    // headers: {
    //   'Host': 'data.usajobs.gov',
    //   'User-Agent': 'your-email@example.com',
    //   'Authorization-Key': 'YOUR_API_KEY'
    // }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'Host': 'data.usajobs.gov',
        'User-Agent': 'always-on-contracts@example.com', // Replace with actual email
      }
    });

    if (!response.ok) {
      console.log(`[USAJobs] API returned status ${response.status}`);
      return jobs;
    }

    const data = await response.json();
    console.log(`[USAJobs] Response received:`, {
      totalJobs: data.SearchResult?.SearchResultCount || 0,
      items: data.SearchResult?.SearchResultItems?.length || 0
    });

    const items = data.SearchResult?.SearchResultItems || [];

    for (const item of items) {
      const matchedJob = item.MatchedObjectDescriptor;
      if (!matchedJob) continue;

      // Parse salary
      let salaryMin = null;
      let salaryMax = null;

      if (matchedJob.PositionRemuneration && matchedJob.PositionRemuneration.length > 0) {
        const salary = matchedJob.PositionRemuneration[0];
        salaryMin = parseInt(salary.MinimumRange) || null;
        salaryMax = parseInt(salary.MaximumRange) || null;
      }

      // Parse location
      const locations = matchedJob.PositionLocation || [];
      const locationStr = locations.length > 0
        ? `${locations[0].CityName}, ${locations[0].CountrySubDivisionCode || locations[0].CountryCode}`
        : 'United States';

      // Determine if remote
      const isRemote = matchedJob.PositionOfferingType?.some((type: any) =>
        type.Name?.toLowerCase().includes('telework') ||
        type.Name?.toLowerCase().includes('remote')
      ) || false;

      jobs.push({
        id: `usajobs_${matchedJob.PositionID}`,
        title: matchedJob.PositionTitle,
        company: matchedJob.OrganizationName || 'U.S. Government',
        location: isRemote ? 'Remote' : locationStr,
        salary_min: salaryMin,
        salary_max: salaryMax,
        description: matchedJob.QualificationSummary || matchedJob.UserArea?.Details?.JobSummary || null,
        posted_date: matchedJob.PublicationStartDate || new Date().toISOString(),
        apply_url: matchedJob.PositionURI || matchedJob.ApplyURI?.[0] || null,
        source: 'USAJobs.gov',
        remote_type: isRemote ? 'remote' : 'onsite',
        employment_type: 'full-time', // Federal jobs are typically full-time
        required_skills: null
      });
    }

    console.log(`[USAJobs] Search complete: ${jobs.length} jobs found`);
    return jobs;

  } catch (error) {
    console.error('[USAJobs] Search error:', error instanceof Error ? error.message : String(error));
    return jobs;
  }
}

async function searchJSearch(query: string, location: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[JSearch] Starting search for query: "${query}", location: "${location}"`);
  const jobs: JobResult[] = [];

  try {
    // JSearch API (RapidAPI) - Aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter, Dice
    // Get API key from: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
    // SECURITY: Store in Supabase secrets, never hardcode
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || '';
    const RAPIDAPI_HOST = 'jsearch.p.rapidapi.com';

    if (!RAPIDAPI_KEY) {
      console.log('[JSearch] Missing RapidAPI key - skipping JSearch');
      console.log('[JSearch] Set RAPIDAPI_KEY in Supabase secrets');
      return jobs;
    }

    // JSearch API endpoint
    const baseUrl = 'https://jsearch.p.rapidapi.com/search';

    const params = new URLSearchParams();
    params.set('query', `${query} ${location || ''}`.trim());
    params.set('page', '1');
    params.set('num_pages', '1'); // Start with 1 page to respect rate limits

    // Date filtering - JSearch uses date_posted parameter
    if (filters.datePosted !== 'any') {
      // JSearch accepts: all, today, 3days, week, month
      const dateMap: Record<string, string> = {
        '24h': 'today',
        '3d': '3days',
        '7d': 'week',
        '14d': 'week',
        '30d': 'month'
      };
      const jsearchDate = dateMap[filters.datePosted];
      if (jsearchDate) {
        params.set('date_posted', jsearchDate);
      }
    }

    // Remote jobs filter
    if (filters.remoteType === 'remote') {
      params.set('remote_jobs_only', 'true');
    }

    // Employment type filter
    if (filters.employmentType && filters.employmentType !== 'any') {
      // JSearch accepts: FULLTIME, CONTRACTOR, PARTTIME, INTERN
      const typeMap: Record<string, string> = {
        'full-time': 'FULLTIME',
        'contract': 'CONTRACTOR',
        'freelance': 'CONTRACTOR'
      };
      const jsearchType = typeMap[filters.employmentType];
      if (jsearchType) {
        params.set('employment_types', jsearchType);
      }
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`[JSearch] Fetching from RapidAPI`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000), // 15s timeout for RapidAPI
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      console.log(`[JSearch] API returned status ${response.status}`);
      const errorText = await response.text();
      console.log(`[JSearch] Error response: ${errorText.substring(0, 200)}`);

      // Check rate limit headers
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      if (rateLimitRemaining) {
        console.log(`[JSearch] Rate limit remaining: ${rateLimitRemaining}`);
      }

      return jobs;
    }

    // Check rate limits even on success
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    if (rateLimitRemaining) {
      console.log(`[JSearch] Rate limit remaining: ${rateLimitRemaining}`);
      if (parseInt(rateLimitRemaining) < 10) {
        console.warn(`[JSearch] ⚠️ Low rate limit: only ${rateLimitRemaining} requests remaining`);
      }
    }

    const data = await response.json();
    console.log(`[JSearch] Response received:`, {
      status: data.status,
      totalJobs: data.data?.length || 0
    });

    const results = data.data || [];

    for (const job of results) {
      // Parse employment type
      const employmentTypes = job.job_employment_type ? [job.job_employment_type] : [];
      const employmentType = employmentTypes.length > 0
        ? employmentTypes[0].toLowerCase().replace('fulltime', 'full-time')
        : null;

      // Parse remote type
      let remoteType: string | null = null;
      if (job.job_is_remote) {
        remoteType = 'remote';
      } else {
        const description = (job.job_description || '').toLowerCase();
        if (description.includes('remote')) {
          remoteType = 'remote';
        } else if (description.includes('hybrid')) {
          remoteType = 'hybrid';
        } else {
          remoteType = 'onsite';
        }
      }

      // Parse salary
      let salaryMin = null;
      let salaryMax = null;
      if (job.job_min_salary && job.job_max_salary) {
        salaryMin = Math.round(job.job_min_salary);
        salaryMax = Math.round(job.job_max_salary);
      }

      // Extract required skills from highlights
      const requiredSkills: string[] = [];
      if (job.job_highlights?.Qualifications) {
        job.job_highlights.Qualifications.forEach((qual: string) => {
          // Simple skill extraction - look for common patterns
          const skillMatch = qual.match(/\b(?:experience with|knowledge of|proficiency in)\s+([^.,;]+)/i);
          if (skillMatch) {
            requiredSkills.push(skillMatch[1].trim());
          }
        });
      }

      jobs.push({
        id: `jsearch_${job.job_id}`,
        title: job.job_title || 'Untitled Position',
        company: job.employer_name || 'Company Not Listed',
        location: job.job_city && job.job_state
          ? `${job.job_city}, ${job.job_state}`
          : job.job_country || location || 'United States',
        salary_min: salaryMin,
        salary_max: salaryMax,
        description: job.job_description || null,
        posted_date: job.job_posted_at_datetime_utc || new Date().toISOString(),
        apply_url: job.job_apply_link || job.job_google_link || null,
        source: `JSearch (${job.job_publisher || 'Multiple Sources'})`,
        remote_type: remoteType,
        employment_type: employmentType,
        required_skills: requiredSkills.length > 0 ? requiredSkills : null
      });
    }

    console.log(`[JSearch] Search complete: ${jobs.length} jobs found`);
    return jobs;

  } catch (error) {
    console.error('[JSearch] Search error:', error instanceof Error ? error.message : String(error));
    return jobs;
  }
}

async function searchAdzuna(query: string, location: string, filters: SearchFilters): Promise<JobResult[]> {
  console.log(`[Adzuna] Starting search for query: "${query}", location: "${location}"`);
  const jobs: JobResult[] = [];

  try {
    // Adzuna API - Free with registration
    // Get API credentials from: https://developer.adzuna.com/
    // For production, store these in Supabase secrets
    const ADZUNA_APP_ID = Deno.env.get('ADZUNA_APP_ID') || '';
    const ADZUNA_APP_KEY = Deno.env.get('ADZUNA_APP_KEY') || '';

    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      console.log('[Adzuna] Missing API credentials - skipping Adzuna search');
      console.log('[Adzuna] Set ADZUNA_APP_ID and ADZUNA_APP_KEY in Supabase secrets');
      return jobs;
    }

    // Adzuna API endpoint for US jobs
    // Format: https://api.adzuna.com/v1/api/jobs/us/search/1
    const baseUrl = 'https://api.adzuna.com/v1/api/jobs/us/search/1';

    const params = new URLSearchParams();
    params.set('app_id', ADZUNA_APP_ID);
    params.set('app_key', ADZUNA_APP_KEY);
    params.set('results_per_page', '100'); // Max 50-100 typically
    params.set('what', query);

    if (location && location.trim()) {
      params.set('where', location);
    }

    // Date filtering - Adzuna uses 'max_days_old' parameter
    if (filters.datePosted !== 'any') {
      const daysOld = filters.datePosted === '24h' ? 1 :
                      filters.datePosted === '3d' ? 3 :
                      filters.datePosted === '7d' ? 7 :
                      filters.datePosted === '14d' ? 14 :
                      filters.datePosted === '30d' ? 30 : null;

      if (daysOld) {
        params.set('max_days_old', daysOld.toString());
      }
    }

    // Salary filtering
    if (filters.salaryMin) {
      params.set('salary_min', filters.salaryMin.toString());
    }
    if (filters.salaryMax) {
      params.set('salary_max', filters.salaryMax.toString());
    }

    // Contract/full-time filtering
    if (filters.employmentType && filters.employmentType !== 'any') {
      // Adzuna uses 'contract' or 'permanent'
      const typeMap: Record<string, string> = {
        'contract': 'contract',
        'full-time': 'permanent',
        'freelance': 'contract'
      };
      const adzunaType = typeMap[filters.employmentType];
      if (adzunaType) {
        params.set('contract_type', adzunaType);
      }
    }

    // Full-time only filter
    if (!filters.contractOnly) {
      params.set('full_time', '1');
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log(`[Adzuna] Fetching: ${url.replace(ADZUNA_APP_ID, 'APP_ID').replace(ADZUNA_APP_KEY, 'APP_KEY')}`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`[Adzuna] API returned status ${response.status}`);
      const errorText = await response.text();
      console.log(`[Adzuna] Error response: ${errorText}`);
      return jobs;
    }

    const data = await response.json();
    console.log(`[Adzuna] Response received:`, {
      count: data.count || 0,
      mean: data.mean || 0,
      results: data.results?.length || 0
    });

    const results = data.results || [];

    for (const job of results) {
      // Parse date - Adzuna returns ISO format like "2025-01-18T12:00:00Z"
      const postedDate = job.created || new Date().toISOString();

      // Parse location
      const locationDisplay = job.location?.display || location || 'United States';

      // Determine remote type
      let remoteType: string | null = null;
      const description = (job.description || '').toLowerCase();
      const title = (job.title || '').toLowerCase();
      if (description.includes('remote') || title.includes('remote')) {
        remoteType = 'remote';
      } else if (description.includes('hybrid')) {
        remoteType = 'hybrid';
      } else {
        remoteType = 'onsite';
      }

      jobs.push({
        id: `adzuna_${job.id}`,
        title: job.title || 'Untitled Position',
        company: job.company?.display_name || 'Company Not Listed',
        location: locationDisplay,
        salary_min: job.salary_min ? Math.round(job.salary_min) : null,
        salary_max: job.salary_max ? Math.round(job.salary_max) : null,
        description: job.description || null,
        posted_date: postedDate,
        apply_url: job.redirect_url || null,
        source: 'Adzuna',
        remote_type: remoteType,
        employment_type: job.contract_type || job.contract_time || null,
        required_skills: null
      });
    }

    console.log(`[Adzuna] Search complete: ${jobs.length} jobs found`);
    return jobs;

  } catch (error) {
    console.error('[Adzuna] Search error:', error instanceof Error ? error.message : String(error));
    return jobs;
  }
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
      if (targetRoles.some((role: any) => 
        typeof role === 'string' && jobText.includes(role.toLowerCase())
      )) {
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
