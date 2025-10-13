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
    const { companyName, jobDescription } = await req.json();
    
    if (!companyName) {
      throw new Error('Company name is required');
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    console.log(`[COMPANY-RESEARCH] Researching: ${companyName}`);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a business research analyst. Provide factual, current information about companies in a structured format. Focus on recent (2024-2025) information.'
          },
          {
            role: 'user',
            content: `Research ${companyName}. Provide:

1) COMPANY OVERVIEW: Describe the company, primary revenue sources, main products/services, and industry
2) GROWTH PLANS: Where does the company intend to expand, innovate, or focus efforts in the next year?
3) POTENTIAL RISKS: Major risks facing the business (market disruption, regulatory issues, talent gaps, etc.)
4) COMPETITOR LANDSCAPE: List 3-5 main competitors and briefly explain what sets each apart

${jobDescription ? `Context: The user is interviewing for this role: ${jobDescription.slice(0, 500)}` : ''}

Format your response with clear section headers.`
          }
        ],
        temperature: 0.3,
        return_related_questions: false,
        search_recency_filter: 'month'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[COMPANY-RESEARCH] Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const researchContent = data.choices?.[0]?.message?.content || '';

    // Parse sections
    const sections = {
      overview: extractSection(researchContent, 'COMPANY OVERVIEW', 'GROWTH PLANS'),
      growth_plans: extractSection(researchContent, 'GROWTH PLANS', 'POTENTIAL RISKS'),
      risks: extractSection(researchContent, 'POTENTIAL RISKS', 'COMPETITOR LANDSCAPE'),
      competitors: extractSection(researchContent, 'COMPETITOR LANDSCAPE', null)
    };

    console.log('[COMPANY-RESEARCH] Research completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        research: sections,
        rawContent: researchContent,
        companyName,
        researchedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[COMPANY-RESEARCH] Error:', error);
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

function extractSection(content: string, startMarker: string, endMarker: string | null): string {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const contentAfterStart = content.slice(startIndex + startMarker.length);
  
  if (!endMarker) {
    return contentAfterStart.trim();
  }
  
  const endIndex = contentAfterStart.indexOf(endMarker);
  if (endIndex === -1) {
    return contentAfterStart.trim();
  }
  
  return contentAfterStart.slice(0, endIndex).trim();
}
