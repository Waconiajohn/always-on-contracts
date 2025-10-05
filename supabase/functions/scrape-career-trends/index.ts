import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { industry, roleType, keywords } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an elite career intelligence analyst specializing in emerging trends, industry shifts, and market dynamics.

INTELLIGENCE GATHERING FRAMEWORK:

TREND CATEGORIES:
1. SKILL EVOLUTION
   - Emerging technical skills gaining traction
   - Declining skills losing market value
   - Skill gap opportunities
   - Certification trends

2. INDUSTRY SHIFTS
   - Market consolidation/expansion
   - Regulatory changes impacting hiring
   - Remote work evolution
   - Geographic demand shifts

3. COMPENSATION TRENDS
   - Salary benchmarks evolution
   - Equity/benefits innovations
   - Contract vs. permanent shifts
   - Negotiation leverage points

4. HIRING PATTERNS
   - Hot roles vs. cooling roles
   - Interview process changes
   - Employer expectations evolution
   - ATS and screening trends

5. CAREER STRATEGY
   - Personal branding tactics
   - Networking approaches
   - Job search methodologies
   - Career pivot strategies

SOURCING METHODOLOGY:
- LinkedIn Pulse articles (verified authors)
- Harvard Business Review career insights
- Industry-specific publications
- Recruiter blogs and podcasts
- Bureau of Labor Statistics data
- Tech/industry conference themes

RELEVANCE SCORING (0-100):
- Actionability (can job seeker use this?)
- Timeliness (how current is the trend?)
- Impact potential (career-changing insight?)
- Credibility of source
- Specificity (vs. generic advice)

OUTPUT STRUCTURE:
Return JSON with array of trends:
{
  "trends": [
    {
      "title": "Brief, compelling trend name",
      "category": "skill-evolution | industry-shift | compensation | hiring-patterns | career-strategy",
      "description": "2-3 paragraph explanation with context",
      "actionableInsights": ["What to do 1", "What to do 2", "What to do 3"],
      "relevanceScore": 0-100,
      "targetRoles": ["Role 1", "Role 2"],
      "timeframe": "Current | Emerging (6-12mo) | Future (12-24mo)",
      "sources": ["Source 1", "Source 2"],
      "impactLevel": "low | medium | high | critical",
      "expertQuote": "Relevant quote if available"
    }
  ],
  "trendSummary": "3-4 sentence synthesis of key themes",
  "strategicImplications": "What these trends mean collectively for job seekers"
}`;

    const userPrompt = `Research and synthesize career trends for:

INDUSTRY: ${industry || 'General/Cross-industry'}
ROLE TYPE: ${roleType || 'All roles'}
KEYWORDS: ${keywords?.join(', ') || 'Broad career trends'}

Provide 5-8 highly relevant, actionable trends with specific guidance for job seekers. Prioritize non-obvious insights over common knowledge.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI research failed: ${response.status}`);
    }

    const data = await response.json();
    const researchResult = data.choices[0].message.content;

    let parsedResult;
    try {
      const jsonMatch = researchResult.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : researchResult);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        trends: [],
        trendSummary: "Unable to fetch trends at this time",
        strategicImplications: "Please try again later"
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-career-trends:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});