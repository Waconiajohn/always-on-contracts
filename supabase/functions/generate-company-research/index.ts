import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

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

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are a business research analyst providing factual, current information about companies.

Your task: Research companies and provide structured intelligence for job seekers and interview preparation.

CRITICAL OUTPUT FORMAT - Return structured text with clear section headers:

**COMPANY OVERVIEW:**
[Company description, revenue sources, main products/services, industry]

**GROWTH PLANS:**
[Where the company intends to expand, innovate, or focus in the next year]

**POTENTIAL RISKS:**
[Major risks: market disruption, regulatory issues, talent gaps, etc.]

**COMPETITOR LANDSCAPE:**
[List 3-5 main competitors and what sets each apart]

Focus on recent (2024-2025) information where possible.`;

    const userPrompt = `Research ${companyName} and provide comprehensive intelligence:

REQUIRED SECTIONS:
1) COMPANY OVERVIEW: Describe the company, primary revenue sources, main products/services, and industry
2) GROWTH PLANS: Where does the company intend to expand, innovate, or focus efforts in the next year?
3) POTENTIAL RISKS: Major risks facing the business (market disruption, regulatory issues, talent gaps, etc.)
4) COMPETITOR LANDSCAPE: List 3-5 main competitors and briefly explain what sets each apart

${jobDescription ? `CONTEXT: The user is interviewing for this role:
${jobDescription.slice(0, 500)}` : ''}

Format your response with clear section headers as specified above.`;

    console.log(`[COMPANY-RESEARCH] Calling Lovable AI for: ${companyName}`);

    // PHASE 1: Get structured baseline from Lovable AI
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
      },
      'generate-company-research'
    );

    await logAIUsage(metrics);

    const researchContent = response.choices[0].message.content;
    console.log('[COMPANY-RESEARCH] Raw AI response:', researchContent.substring(0, 500));

    // PHASE 2: PERPLEXITY ENHANCEMENT - Add real-time data
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    let perplexityEnhancements = '';
    let citations: string[] = [];
    
    if (perplexityApiKey) {
      console.log('[COMPANY-RESEARCH] Fetching real-time company data from Perplexity...');
      
      const perplexityPrompt = `Provide current 2025 intelligence on ${companyName}:

1. Recent news (last 6 months) - funding, leadership changes, product launches
2. Glassdoor reviews summary and employee sentiment
3. Financial performance and growth trajectory
4. Current strategic initiatives and market positioning
5. Recent press releases or announcements

${jobDescription ? `Context: Research for interview for role: ${jobDescription.slice(0, 300)}` : ''}

Cite all sources with URLs.`;

      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: 'You are a company research analyst. Provide current, cited intelligence about companies.' },
              { role: 'user', content: perplexityPrompt }
            ],
            temperature: 0.2,
            max_tokens: 2000,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityJson = await perplexityResponse.json();
          perplexityEnhancements = perplexityJson.choices?.[0]?.message?.content || '';
          citations = perplexityJson.citations || [];
          console.log('[COMPANY-RESEARCH] ✅ Real-time data retrieved with', citations.length, 'citations');
        } else {
          console.warn('[COMPANY-RESEARCH] ⚠️ Perplexity API failed, using base research only');
        }
      } catch (error) {
        console.error('[COMPANY-RESEARCH] Perplexity error:', error);
      }
    }

    // Parse sections
    const sections = {
      overview: extractSection(researchContent, 'COMPANY OVERVIEW', 'GROWTH PLANS'),
      growth_plans: extractSection(researchContent, 'GROWTH PLANS', 'POTENTIAL RISKS'),
      risks: extractSection(researchContent, 'POTENTIAL RISKS', 'COMPETITOR LANDSCAPE'),
      competitors: extractSection(researchContent, 'COMPETITOR LANDSCAPE', null)
    };

    // EXPLICIT VALIDATION
    if (!sections.overview || sections.overview.length < 50) {
      console.error('[COMPANY-RESEARCH] Missing or insufficient overview section');
      throw new Error('AI response missing required section: COMPANY OVERVIEW');
    }
    
    if (!sections.growth_plans || sections.growth_plans.length < 20) {
      console.error('[COMPANY-RESEARCH] Missing or insufficient growth plans section');
      throw new Error('AI response missing required section: GROWTH PLANS');
    }
    
    if (!sections.risks || sections.risks.length < 20) {
      console.error('[COMPANY-RESEARCH] Missing or insufficient risks section');
      throw new Error('AI response missing required section: POTENTIAL RISKS');
    }
    
    if (!sections.competitors || sections.competitors.length < 20) {
      console.error('[COMPANY-RESEARCH] Missing or insufficient competitors section');
      throw new Error('AI response missing required section: COMPETITOR LANDSCAPE');
    }

    console.log('[COMPANY-RESEARCH] Research completed successfully', {
      overviewLength: sections.overview.length,
      growthPlansLength: sections.growth_plans.length,
      risksLength: sections.risks.length,
      competitorsLength: sections.competitors.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        research: sections,
        rawContent: researchContent,
        realTimeEnhancements: perplexityEnhancements,
        citations,
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
