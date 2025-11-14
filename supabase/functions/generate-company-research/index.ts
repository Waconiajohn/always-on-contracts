import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

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

    console.log(`[COMPANY-RESEARCH] Researching: ${companyName}`);

    const { response, metrics } = await callPerplexity(
      {
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
        model: selectOptimalModel({
          taskType: 'research',
          complexity: 'medium',
          requiresResearch: true,
          estimatedInputTokens: 600,
          estimatedOutputTokens: 800
        }),
        temperature: 0.3,
        return_citations: false,
        search_recency_filter: 'month',
      },
      'generate-company-research'
    );

    await logAIUsage(metrics);

    const researchContent = response.choices[0].message.content;

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
