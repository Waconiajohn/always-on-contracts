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
    const { searchQuery, location, minSalary } = await req.json();
    
    console.log('[MCP-GLASSDOOR] Scraping jobs:', { searchQuery, location, minSalary });

    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY not configured');
    }

    // Build Glassdoor search URL
    let searchUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(searchQuery)}`;
    if (location) searchUrl += `&locT=C&locId=${encodeURIComponent(location)}`;
    if (minSalary) searchUrl += `&minSalary=${minSalary}`;

    // Call Apify Glassdoor scraper
    const runResponse = await fetch('https://api.apify.com/v2/acts/apify~glassdoor-scraper/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url: searchUrl }],
        maxItems: 50,
        includeReviews: false,
        proxy: { useApifyProxy: true }
      })
    });

    if (!runResponse.ok) {
      throw new Error(`Apify run failed: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for completion
    let results = null;
    let attempts = 0;
    while (!results && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
        {
          headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
        }
      );

      if (statusResponse.ok) {
        results = await statusResponse.json();
        if (results.length > 0) break;
      }
      attempts++;
    }

    console.log(`[MCP-GLASSDOOR] Found ${results?.length || 0} jobs`);

    return new Response(
      JSON.stringify({ 
        source: 'glassdoor',
        jobs: results || [],
        searchParams: { searchQuery, location, minSalary }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MCP-GLASSDOOR] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});