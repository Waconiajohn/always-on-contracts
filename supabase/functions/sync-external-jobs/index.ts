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

    // Fetch from Greenhouse boards (major tech companies + contractors)
    const greenhouseBoards = [
      'openai', 'anthropic', 'stripe', 'figma', 'notion', 'linear',
      'vercel', 'cloudflare', 'databricks', 'scale', 'rippling',
      'meta', 'adobe', 'palantir', 'shopify', 'gitlab', 'docusign',
      'twilio', 'salesforce', 'zoom', 'slack', 'dropbox', 'atlassian',
      'pinterest', 'snap', 'reddit', 'discord', 'instacart', 'doordash',
      'postmates', 'grubhub', 'wayfair', 'etsy', 'wayfair', 'peloton',
      'robinhood', 'chime', 'nubank', 'revolut', 'wise', 'checkout',
      'brex', 'deel', 'remote', 'lattice', 'workday', 'servicenow',
      'datadog', 'elastic', 'confluent', 'snowflake', 'mongodb',
      'redis', 'cockroach', 'planetscale', 'neon', 'supabase'
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
      'coinbase', 'robinhood', 'plaid', 'affirm', 'reddit',
      'spotify', 'coursera', 'udemy', 'duolingo', 'canva', 'miro',
      'figma', 'airtable', 'zapier', 'hubspot', 'mailchimp', 'sendgrid',
      'twitch', 'roblox', 'unity', 'epic', 'riot', 'blizzard',
      'booking', 'expedia', 'kayak', 'tripadvisor', 'hopper',
      'indeed', 'glassdoor', 'ziprecruiter', 'greenhouse', 'lever'
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
      'census', 'hightouch', 'hex', 'modal', 'replicate',
      'anthropic', 'perplexity', 'mistral', 'cohere', 'together',
      'runway', 'midjourney', 'stability', 'huggingface', 'weights-biases',
      'scale', 'labelbox', 'snorkel', 'roboflow', 'landing',
      'mercury', 'column', 'unit', 'increase', 'modern-treasury'
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

    // Fetch from RemoteOK (public JSON API)
    try {
      const jobs = await fetchRemoteOK();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from RemoteOK`);
    } catch (error) {
      console.error('Error fetching RemoteOK:', error);
    }

    // Fetch from We Work Remotely RSS feed
    try {
      const jobs = await fetchWeWorkRemotely();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from We Work Remotely`);
    } catch (error) {
      console.error('Error fetching We Work Remotely:', error);
    }

    // Fetch from Remotive API
    try {
      const jobs = await fetchRemotive();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Remotive`);
    } catch (error) {
      console.error('Error fetching Remotive:', error);
    }

    // Fetch from SAM.gov (Government contracts)
    const samApiKey = Deno.env.get('SAM_GOV_API_KEY');
    if (samApiKey) {
      try {
        const jobs = await fetchSAMGov(samApiKey);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from SAM.gov`);
      } catch (error) {
        console.error('Error fetching SAM.gov:', error);
      }
    }

    // Fetch from TheirStack
    const theirStackApiKey = Deno.env.get('THEIRSTACK_API_KEY');
    if (theirStackApiKey) {
      try {
        const jobs = await fetchTheirStack(theirStackApiKey);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from TheirStack`);
      } catch (error) {
        console.error('Error fetching TheirStack:', error);
      }
    }

    // Fetch from Indeed
    const indeedApiKey = Deno.env.get('INDEED_API_KEY');
    if (indeedApiKey) {
      try {
        const jobs = await fetchIndeed(indeedApiKey);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from Indeed`);
      } catch (error) {
        console.error('Error fetching Indeed:', error);
      }
    }

    // Fetch from FlexJobs RSS
    try {
      const jobs = await fetchFlexJobs();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from FlexJobs`);
    } catch (error) {
      console.error('Error fetching FlexJobs:', error);
    }

    // Phase 3: Niche Contract Platforms
    
    // Toptal (via RSS/scraping - no official API)
    try {
      const jobs = await fetchToptal();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Toptal`);
    } catch (error) {
      console.error('Error fetching Toptal:', error);
    }

    // Gun.io (public job board)
    try {
      const jobs = await fetchGunio();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Gun.io`);
    } catch (error) {
      console.error('Error fetching Gun.io:', error);
    }

    // Braintrust (blockchain-based freelance platform)
    try {
      const jobs = await fetchBraintrust();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Braintrust`);
    } catch (error) {
      console.error('Error fetching Braintrust:', error);
    }

    // Catalant (enterprise consulting marketplace)
    try {
      const jobs = await fetchCatalant();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Catalant`);
    } catch (error) {
      console.error('Error fetching Catalant:', error);
    }

    // Phase 4: Industry-Specific Sources
    
    // AngelList (startup jobs)
    try {
      const jobs = await fetchAngelList();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from AngelList`);
    } catch (error) {
      console.error('Error fetching AngelList:', error);
    }

    // Built In (tech hub jobs - NYC, SF, Austin, etc.)
    const builtInCities = ['national', 'newyork', 'sanfrancisco', 'austin', 'boston', 'chicago', 'colorado', 'la', 'seattle'];
    for (const city of builtInCities) {
      try {
        const jobs = await fetchBuiltIn(city);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from Built In ${city}`);
      } catch (error) {
        console.error(`Error fetching Built In ${city}:`, error);
      }
    }

    // Dice (tech job board)
    try {
      const jobs = await fetchDice();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Dice`);
    } catch (error) {
      console.error('Error fetching Dice:', error);
    }

    // Stack Overflow Jobs (tech-focused)
    try {
      const jobs = await fetchStackOverflow();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Stack Overflow`);
    } catch (error) {
      console.error('Error fetching Stack Overflow:', error);
    }

    // Authentic Jobs (design/dev jobs)
    try {
      const jobs = await fetchAuthenticJobs();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Authentic Jobs`);
    } catch (error) {
      console.error('Error fetching Authentic Jobs:', error);
    }

    // Krop (creative/design jobs)
    try {
      const jobs = await fetchKrop();
      allJobs.push(...jobs);
      console.log(`Fetched ${jobs.length} jobs from Krop`);
    } catch (error) {
      console.error('Error fetching Krop:', error);
    }

    // Fetch from LinkedIn via Apify
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    if (apifyApiKey) {
      try {
        const jobs = await fetchLinkedInViaApify(apifyApiKey);
        allJobs.push(...jobs);
        console.log(`Fetched ${jobs.length} jobs from LinkedIn (Apify)`);
      } catch (error) {
        console.error('Error fetching LinkedIn via Apify:', error);
      }
    } else {
      console.log('APIFY_API_KEY not configured, skipping LinkedIn scraping');
    }

    console.log(`Total jobs fetched: ${allJobs.length}`);

    // Enhanced filter for contract-related opportunities
    const contractJobs = allJobs.filter(job => {
      const searchText = JSON.stringify(job).toLowerCase();
      const contractKeywords = [
        'contract', 'contractor', 'freelance', 'freelancer',
        'temporary', 'temp', '1099', 'w2', 'corp-to-corp', 'c2c',
        'consulting', 'consultant', 'project-based', 'project based',
        'interim', 'fractional', 'part-time', 'part time',
        'hourly', 'per diem', 'independent', 'gig',
        'short-term', 'short term', 'term position', 'seasonal'
      ];
      
      return contractKeywords.some(keyword => searchText.includes(keyword)) ||
             job.type?.toLowerCase().includes('contract') ||
             job.type?.toLowerCase().includes('freelance') ||
             job.type?.toLowerCase().includes('temporary');
    });

    console.log(`Filtered to ${contractJobs.length} contract opportunities`);

    // Deduplicate jobs by external_source and external_id
    const uniqueJobs = new Map();
    for (const job of contractJobs) {
      const key = `${job.source}_${job.externalId}`;
      if (!uniqueJobs.has(key)) {
        uniqueJobs.set(key, job);
      }
    }
    
    // Batch upsert jobs into database using Supabase upsert
    const jobsToUpsert = Array.from(uniqueJobs.values()).map(job => ({
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
    }));

    console.log(`Deduped to ${jobsToUpsert.length} unique jobs`);

    // Upsert in batches of 100 to avoid payload limits
    const batchSize = 100;
    let totalUpserted = 0;
    
    for (let i = 0; i < jobsToUpsert.length; i += batchSize) {
      const batch = jobsToUpsert.slice(i, i + batchSize);
      const { error } = await supabaseClient
        .from('job_opportunities')
        .upsert(batch, {
          onConflict: 'external_source,external_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error(`Error upserting batch ${i / batchSize + 1}:`, error);
      } else {
        totalUpserted += batch.length;
        console.log(`Upserted batch ${i / batchSize + 1}: ${batch.length} jobs`);
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
        upserted: totalUpserted,
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
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`, {
    headers: { 'Accept': 'application/json; charset=utf-8' }
  });
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data.jobs || []).map((j: any) => ({
    title: cleanText(j.title),
    company: cleanText(data.meta?.company || boardToken),
    location: cleanText(j.location?.name) ?? null,
    type: j.metadata?.employment_type || 'unknown',
    remote: /remote/i.test(JSON.stringify(j)),
    postedAt: j.updated_at,
    url: j.absolute_url,
    source: 'greenhouse',
    externalId: `gh-${boardToken}-${j.id}`,
    description: cleanText(j.content) || cleanText(j.title),
  }));
}

async function fetchLeverJobs(boardKey: string): Promise<ExternalJob[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${boardKey}?mode=json`, {
    headers: { 'Accept': 'application/json; charset=utf-8' }
  });
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data || []).map((j: any) => ({
    title: cleanText(j.text),
    company: cleanText(boardKey),
    location: cleanText(j.categories?.location) ?? null,
    type: j.categories?.commitment ?? 'unknown',
    remote: /remote/i.test(JSON.stringify(j)),
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
    url: j.hostedUrl,
    source: 'lever',
    externalId: `lv-${boardKey}-${j.id}`,
    description: cleanText(j.description || j.descriptionPlain || j.text),
  }));
}

async function fetchAshbyJobs(orgSlug: string): Promise<ExternalJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json; charset=utf-8' }
  });
  if (!res.ok) return [];
  
  const data = await res.json();
  const postings = (data.jobs ?? data) || [];
  
  return postings.map((j: any) => ({
    title: cleanText(j.title),
    company: cleanText(orgSlug),
    location: cleanText(j.location?.name) ?? null,
    type: j.employmentType ?? 'unknown',
    remote: /remote/i.test(JSON.stringify(j)),
    postedAt: j.publishedAt,
    url: j.jobUrl,
    source: 'ashby',
    externalId: `ab-${orgSlug}-${j.id}`,
    description: cleanText(j.description) || cleanText(j.title),
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

// Helper function to fix UTF-8 mojibake and clean text
function cleanText(text: string): string {
  if (!text) return text;
  try {
    // Fix UTF-8 mojibake (when UTF-8 is interpreted as Latin-1)
    // Convert string back to bytes treating each char as Latin-1, then decode as UTF-8
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i) & 0xFF; // Get the byte value
    }
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let decoded = decoder.decode(bytes);
    
    // If decoding made it worse or didn't help, use original
    if (decoded.includes('�') || decoded.length === 0) {
      decoded = text;
    }
    
    // Remove any HTML tags and decode HTML entities
    decoded = decoded
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&auml;/g, 'ä')
      .replace(/&ouml;/g, 'ö')
      .replace(/&uuml;/g, 'ü')
      .replace(/&Auml;/g, 'Ä')
      .replace(/&Ouml;/g, 'Ö')
      .replace(/&Uuml;/g, 'Ü')
      .replace(/&szlig;/g, 'ß')
      .replace(/\s+/g, ' ')
      .trim();
    
    return decoded;
  } catch (e) {
    console.error('Error cleaning text:', e);
    return text;
  }
}

async function fetchRemoteOK(): Promise<ExternalJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'Accept': 'application/json; charset=utf-8' }
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    // First item is metadata, skip it
    const jobs = data.slice(1);
    
    return jobs.map((j: any) => ({
      title: cleanText(j.position),
      company: cleanText(j.company),
      location: cleanText(j.location) || 'Remote',
      type: 'contract',
      remote: true,
      postedAt: j.date ? new Date(j.date).toISOString() : undefined,
      url: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
      source: 'remoteok',
      externalId: `rok-${j.id}`,
      description: cleanText(j.description) || cleanText(j.position),
      skills: j.tags || [],
    }));
  } catch (error) {
    console.error('RemoteOK fetch error:', error);
    return [];
  }
}

async function fetchWeWorkRemotely(): Promise<ExternalJob[]> {
  try {
    // We Work Remotely has category-based feeds
    const categories = ['programming', 'devops', 'product', 'design', 'customer-support', 'marketing', 'sales'];
    const allJobs: ExternalJob[] = [];
    
    for (const category of categories) {
      const res = await fetch(`https://weworkremotely.com/categories/remote-${category}-jobs.rss`, {
        headers: { 'Accept': 'application/rss+xml; charset=utf-8' }
      });
      if (!res.ok) continue;
      
      // Explicitly decode as UTF-8
      const arrayBuffer = await res.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      
      // Basic RSS parsing
      const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const item of items) {
        const title = cleanText(item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '');
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const description = cleanText(item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '');
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        
        if (title && link) {
          allJobs.push({
            title,
            company: title.split(':')[0]?.trim() || 'Unknown',
            location: 'Remote',
            type: 'contract',
            remote: true,
            postedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
            url: link,
            source: 'weworkremotely',
            externalId: `wwr-${link.split('/').pop()}`,
            description,
          });
        }
      }
    }
    
    return allJobs;
  } catch (error) {
    console.error('We Work Remotely fetch error:', error);
    return [];
  }
}

async function fetchRemotive(): Promise<ExternalJob[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev', {
      headers: { 'Accept': 'application/json; charset=utf-8' }
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    const jobs = data.jobs || [];
    
    return jobs.map((j: any) => ({
      title: cleanText(j.title),
      company: cleanText(j.company_name),
      location: 'Remote',
      type: j.job_type || 'contract',
      remote: true,
      postedAt: j.publication_date,
      url: j.url,
      source: 'remotive',
      externalId: `rem-${j.id}`,
      description: cleanText(j.description) || cleanText(j.title),
      skills: j.tags || [],
    }));
  } catch (error) {
    console.error('Remotive fetch error:', error);
    return [];
  }
}

async function fetchSAMGov(apiKey: string): Promise<ExternalJob[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${apiKey}&postedFrom=${thirtyDaysAgo}&limit=1000&ptype=o,k`;
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      console.error(`SAM.gov API error: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    const opportunities = data.opportunitiesData || [];
    
    return opportunities.map((opp: any) => ({
      title: opp.title,
      company: opp.department || opp.subtier || 'Federal Government',
      location: opp.placeOfPerformance?.city?.name || 'Various Locations',
      type: 'contract',
      remote: false,
      postedAt: opp.postedDate,
      url: `https://sam.gov/opp/${opp.noticeId}/view`,
      source: 'sam.gov',
      externalId: `sam-${opp.noticeId}`,
      description: opp.description || opp.title,
      skills: opp.naicsCode ? [`NAICS: ${opp.naicsCode}`] : [],
    }));
  } catch (error) {
    console.error('SAM.gov fetch error:', error);
    return [];
  }
}

async function fetchTheirStack(apiKey: string): Promise<ExternalJob[]> {
  try {
    const res = await fetch('https://api.theirstack.com/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_types: ['contract', 'freelance', 'temporary'],
        limit: 1000,
      }),
    });
    
    if (!res.ok) {
      console.error(`TheirStack API error: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    const jobs = data.data || [];
    
    return jobs.map((j: any) => ({
      title: j.title,
      company: j.company?.name || 'Unknown Company',
      location: j.location || 'Remote',
      type: 'contract',
      remote: j.remote_allowed || false,
      postedAt: j.posted_at,
      url: j.url || j.apply_url,
      source: 'theirstack',
      externalId: `ts-${j.id}`,
      description: j.description || j.title,
      skills: j.skills || [],
      hourlyRateMin: j.salary_min ? Math.round(j.salary_min / 2080) : undefined,
      hourlyRateMax: j.salary_max ? Math.round(j.salary_max / 2080) : undefined,
    }));
  } catch (error) {
    console.error('TheirStack fetch error:', error);
    return [];
  }
}

async function fetchIndeed(apiKey: string): Promise<ExternalJob[]> {
  try {
    const url = `https://api.indeed.com/ads/apisearch?publisher=${apiKey}&q=contract&jt=contract&limit=1000&format=json&v=2`;
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      console.error(`Indeed API error: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    const results = data.results || [];
    
    return results.map((j: any) => ({
      title: j.jobtitle,
      company: j.company,
      location: j.formattedLocation || 'Unknown',
      type: 'contract',
      remote: /remote/i.test(JSON.stringify(j)),
      postedAt: j.date,
      url: j.url,
      source: 'indeed',
      externalId: `ind-${j.jobkey}`,
      description: j.snippet || j.jobtitle,
      skills: [],
    }));
  } catch (error) {
    console.error('Indeed fetch error:', error);
    return [];
  }
}

async function fetchFlexJobs(): Promise<ExternalJob[]> {
  try {
    const res = await fetch('https://www.flexjobs.com/jobs.rss');
    if (!res.ok) return [];
    
    const text = await res.text();
    const jobs: ExternalJob[] = [];
    
    // Simple RSS parsing
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const descMatch = item.match(descRegex);
      const dateMatch = item.match(dateRegex);
      
      if (titleMatch && linkMatch) {
        const jobId = linkMatch[1].split('/').pop() || Math.random().toString(36).substring(7);
        jobs.push({
          title: titleMatch[1],
          company: 'FlexJobs Listing',
          location: 'Remote',
          type: 'contract',
          remote: true,
          postedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          url: linkMatch[1],
          source: 'flexjobs',
          externalId: `fj-${jobId}`,
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : titleMatch[1],
          skills: [],
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('FlexJobs fetch error:', error);
    return [];
  }
}

// Phase 3: Niche Contract Platforms

async function fetchToptal(): Promise<ExternalJob[]> {
  try {
    // Toptal doesn't have a public API, using RSS feed approach
    const res = await fetch('https://www.toptal.com/jobs.rss');
    if (!res.ok) return [];
    
    const text = await res.text();
    const jobs: ExternalJob[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const descMatch = item.match(descRegex);
      const dateMatch = item.match(dateRegex);
      
      if (titleMatch && linkMatch) {
        const jobId = linkMatch[1].split('/').pop() || Math.random().toString(36).substring(7);
        jobs.push({
          title: titleMatch[1],
          company: 'Toptal Client',
          location: 'Remote',
          type: 'contract',
          remote: true,
          postedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          url: linkMatch[1],
          source: 'toptal',
          externalId: `tt-${jobId}`,
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : titleMatch[1],
          skills: [],
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Toptal fetch error:', error);
    return [];
  }
}

async function fetchGunio(): Promise<ExternalJob[]> {
  try {
    // Gun.io job board scraping (they have a public jobs page)
    const res = await fetch('https://gun.io/find-work/');
    if (!res.ok) return [];
    
    // For now, return empty array as Gun.io requires specific scraping
    // In production, this would parse their HTML job listings
    return [];
  } catch (error) {
    console.error('Gun.io fetch error:', error);
    return [];
  }
}

async function fetchBraintrust(): Promise<ExternalJob[]> {
  try {
    // Braintrust public job board
    const res = await fetch('https://app.usebraintrust.com/api/jobs');
    if (!res.ok) return [];
    
    const data = await res.json();
    const jobs = data.jobs || [];
    
    return jobs.map((j: any) => ({
      title: j.title || j.name,
      company: j.company || 'Braintrust Client',
      location: j.location || 'Remote',
      type: 'contract',
      remote: true,
      postedAt: j.created_at || j.posted_date,
      url: `https://app.usebraintrust.com/jobs/${j.id}`,
      source: 'braintrust',
      externalId: `bt-${j.id}`,
      description: j.description || j.title,
      skills: j.skills || [],
      hourlyRateMin: j.min_rate,
      hourlyRateMax: j.max_rate,
    }));
  } catch (error) {
    console.error('Braintrust fetch error:', error);
    return [];
  }
}

async function fetchCatalant(): Promise<ExternalJob[]> {
  try {
    // Catalant (formerly HourlyNerd) - enterprise consulting
    // No public API available, would require scraping or partnership
    return [];
  } catch (error) {
    console.error('Catalant fetch error:', error);
    return [];
  }
}

// Phase 4: Industry-Specific Sources

async function fetchAngelList(): Promise<ExternalJob[]> {
  try {
    // AngelList (Wellfound) jobs API
    const res = await fetch('https://api.wellfound.com/v1/jobs?contract=true', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const jobs = data.jobs || [];
    
    return jobs.map((j: any) => ({
      title: j.title,
      company: j.company?.name || 'Startup',
      location: j.location || 'Remote',
      type: 'contract',
      remote: j.remote || false,
      postedAt: j.created_at,
      url: j.url || `https://wellfound.com/jobs/${j.id}`,
      source: 'angellist',
      externalId: `al-${j.id}`,
      description: j.description || j.title,
      skills: j.skills || [],
    }));
  } catch (error) {
    console.error('AngelList fetch error:', error);
    return [];
  }
}

async function fetchBuiltIn(city: string): Promise<ExternalJob[]> {
  try {
    // Built In tech hub job boards
    const res = await fetch(`https://builtin.com/api/jobs?location=${city}&contract=true`);
    if (!res.ok) return [];
    
    const data = await res.json();
    const jobs = data.jobs || [];
    
    return jobs.map((j: any) => ({
      title: j.title,
      company: j.company_name || 'Unknown',
      location: j.location || city,
      type: 'contract',
      remote: j.remote || false,
      postedAt: j.posted_date,
      url: j.url || `https://builtin.com/${city}/job/${j.id}`,
      source: `builtin-${city}`,
      externalId: `bi-${city}-${j.id}`,
      description: j.description || j.title,
      skills: j.skills || [],
    }));
  } catch (error) {
    console.error(`Built In ${city} fetch error:`, error);
    return [];
  }
}

async function fetchDice(): Promise<ExternalJob[]> {
  try {
    // Dice tech job board - RSS feed
    const res = await fetch('https://www.dice.com/jobs/rss?q=contract');
    if (!res.ok) return [];
    
    const text = await res.text();
    const jobs: ExternalJob[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const descMatch = item.match(descRegex);
      const dateMatch = item.match(dateRegex);
      
      if (titleMatch && linkMatch) {
        const jobId = linkMatch[1].split('/').pop() || Math.random().toString(36).substring(7);
        jobs.push({
          title: titleMatch[1],
          company: 'Dice Listing',
          location: 'Various',
          type: 'contract',
          remote: /remote/i.test(item),
          postedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          url: linkMatch[1],
          source: 'dice',
          externalId: `dc-${jobId}`,
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : titleMatch[1],
          skills: [],
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Dice fetch error:', error);
    return [];
  }
}

async function fetchStackOverflow(): Promise<ExternalJob[]> {
  try {
    // Stack Overflow Jobs RSS feed
    const res = await fetch('https://stackoverflow.com/jobs/feed?q=contract');
    if (!res.ok) return [];
    
    const text = await res.text();
    const jobs: ExternalJob[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const descMatch = item.match(descRegex);
      const dateMatch = item.match(dateRegex);
      
      if (titleMatch && linkMatch) {
        const jobId = linkMatch[1].split('/').pop() || Math.random().toString(36).substring(7);
        jobs.push({
          title: titleMatch[1],
          company: 'Stack Overflow Listing',
          location: 'Various',
          type: 'contract',
          remote: /remote/i.test(item),
          postedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          url: linkMatch[1],
          source: 'stackoverflow',
          externalId: `so-${jobId}`,
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : titleMatch[1],
          skills: [],
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Stack Overflow fetch error:', error);
    return [];
  }
}

async function fetchAuthenticJobs(): Promise<ExternalJob[]> {
  try {
    // Authentic Jobs - design and development jobs
    const res = await fetch('https://authenticjobs.com/rss/custom.php?contract=1');
    if (!res.ok) return [];
    
    const text = await res.text();
    const jobs: ExternalJob[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const descMatch = item.match(descRegex);
      const dateMatch = item.match(dateRegex);
      
      if (titleMatch && linkMatch) {
        const jobId = linkMatch[1].split('/').pop() || Math.random().toString(36).substring(7);
        jobs.push({
          title: titleMatch[1],
          company: 'Authentic Jobs Listing',
          location: 'Various',
          type: 'contract',
          remote: /remote/i.test(item),
          postedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          url: linkMatch[1],
          source: 'authenticjobs',
          externalId: `aj-${jobId}`,
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : titleMatch[1],
          skills: [],
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Authentic Jobs fetch error:', error);
    return [];
  }
}

async function fetchKrop(): Promise<ExternalJob[]> {
  try {
    // Krop - creative and design jobs
    const res = await fetch('https://www.krop.com/creative-jobs/feeds/jobs.rss?contract=true');
    if (!res.ok) return [];
    
    const text = await res.text();
    const jobs: ExternalJob[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const descMatch = item.match(descRegex);
      const dateMatch = item.match(dateRegex);
      
      if (titleMatch && linkMatch) {
        const jobId = linkMatch[1].split('/').pop() || Math.random().toString(36).substring(7);
        jobs.push({
          title: titleMatch[1],
          company: 'Krop Listing',
          location: 'Various',
          type: 'contract',
          remote: /remote/i.test(item),
          postedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          url: linkMatch[1],
          source: 'krop',
          externalId: `kr-${jobId}`,
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '') : titleMatch[1],
          skills: [],
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Krop fetch error:', error);
    return [];
  }
}

async function fetchLinkedInViaApify(apiKey: string): Promise<ExternalJob[]> {
  try {
    console.log('Starting LinkedIn job scrape via Apify...');
    
    // Configure the Apify actor for LinkedIn job scraping
    const actorInput = {
      keywords: ['contract', 'freelance', 'consultant'],
      jobType: 'Contract',
      maxResults: 100,
    };

    // Start the Apify actor (using ramman/linkedin-jobs-scraper)
    const runResponse = await fetch('https://api.apify.com/v2/acts/ramman~linkedin-jobs-scraper/runs?token=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorInput),
    });

    if (!runResponse.ok) {
      console.error('Failed to start Apify actor:', runResponse.status, await runResponse.text());
      return [];
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('Apify run started:', runId);

    // Poll for completion (with timeout)
    const maxWaitTime = 120000; // 2 minutes
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();

    let runStatus;
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/voyager~linkedin-jobs-scraper/runs/${runId}?token=${apiKey}`);
      if (!statusResponse.ok) continue;
      
      runStatus = await statusResponse.json();
      const status = runStatus.data.status;
      
      console.log('Apify run status:', status);
      
      if (status === 'SUCCEEDED') break;
      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error('Apify run failed with status:', status);
        return [];
      }
    }

    if (!runStatus || runStatus.data.status !== 'SUCCEEDED') {
      console.error('Apify run did not complete in time');
      return [];
    }

    // Fetch the results
    const datasetId = runStatus.data.defaultDatasetId;
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`);
    
    if (!resultsResponse.ok) {
      console.error('Failed to fetch Apify results:', resultsResponse.status);
      return [];
    }

    const results = await resultsResponse.json();
    console.log(`Retrieved ${results.length} LinkedIn jobs from Apify`);

    // Transform Apify results to our format
    return results.map((job: any) => {
      const jobId = job.jobId || job.id || Math.random().toString(36).substring(7);
      const skills = job.skills || job.requiredSkills || [];
      
      return {
        title: cleanText(job.title || job.jobTitle || 'Untitled Position'),
        company: cleanText(job.company || job.companyName || 'Unknown Company'),
        location: cleanText(job.location || job.jobLocation) || 'Remote',
        type: 'contract',
        remote: /remote/i.test(JSON.stringify(job)),
        postedAt: job.postedAt || job.listedAt || new Date().toISOString(),
        url: job.url || job.jobUrl || `https://www.linkedin.com/jobs/view/${jobId}`,
        source: 'linkedin-apify',
        externalId: `li-${jobId}`,
        description: cleanText(job.description || job.jobDescription || job.title),
        skills: Array.isArray(skills) ? skills.map((s: any) => typeof s === 'string' ? s : s.name || s.title) : [],
        hourlyRateMin: job.salary?.min || undefined,
        hourlyRateMax: job.salary?.max || undefined,
      };
    });
  } catch (error) {
    console.error('LinkedIn Apify fetch error:', error);
    return [];
  }
}
