import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
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
    const { industry, roleType, keywords } = await req.json();

    const systemPrompt = `You are an elite career intelligence analyst specializing in emerging trends, industry shifts, and market dynamics.

CRITICAL RULES:
- NEVER fabricate statistics or cite non-existent sources
- If uncertain about a trend, state confidence level (0-100)
- Distinguish between "verified data" vs. "industry consensus" vs. "emerging signals"
- Mark speculative trends clearly with confidence scores
- Cross-reference multiple signals before declaring a trend
- Provide context on sample size/data source credibility
- Flag contradictory information if found

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
- Recent job postings and skills demand
- Industry reports and whitepapers

TREND VALIDATION:
- Cross-reference multiple signals before declaring a trend
- Provide context on sample size/data source credibility
- Flag contradictory information if found
- Include "last verified" dates where applicable
- Distinguish between established facts vs. emerging patterns

EDGE CASES:
- If industry data is sparse → Focus on adjacent industries + extrapolation logic
- If roleType is vague → Provide broader trends + suggest specificity
- If keywords conflict → Prioritize most career-relevant trends
- If contradictory signals exist → Present both perspectives with context

RELEVANCE SCORING (0-100):
- Actionability (can job seeker use this?)
- Timeliness (how current is the trend?)
- Impact potential (career-changing insight?)
- Credibility of source
- Specificity (vs. generic advice)

CONFIDENCE SCORING (0-100):
- 90-100: Multiple verified sources, established pattern
- 70-89: Industry consensus, reputable sources
- 50-69: Emerging signals, limited data
- 30-49: Speculative, single source
- 0-29: Hypothetical, requires validation

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
      "confidenceScore": 0-100,
      "dataQuality": "high | medium | low | speculative",
      "targetRoles": ["Role 1", "Role 2"],
      "timeframe": "Current | Emerging (6-12mo) | Future (12-24mo)",
      "sources": ["Source 1", "Source 2"],
      "lastVerified": "2025-Q1 or specific timeframe",
      "impactLevel": "low | medium | high | critical",
      "expertQuote": "Relevant quote if available",
      "contradictorySignals": "Note any conflicting data or alternative viewpoints"
    }
  ],
  "dataLimitations": "Acknowledge what data was unavailable or uncertain",
  "trendSummary": "3-4 sentence synthesis of key themes",
  "strategicImplications": "What these trends mean collectively for job seekers"
}`;

    const userPrompt = `Research and synthesize career trends for:

INDUSTRY: ${industry || 'General/Cross-industry'}
ROLE TYPE: ${roleType || 'All roles'}
KEYWORDS: ${keywords?.join(', ') || 'Broad career trends'}

Provide 5-8 highly relevant, actionable trends with specific guidance for job seekers. Prioritize non-obvious insights over common knowledge.`;

    const { response: data, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: selectOptimalModel({
          taskType: 'research',
          complexity: 'medium',
          requiresReasoning: false
        }),
        temperature: 0.4,
      },
      'scrape-career-trends'
    );

    await logAIUsage(metrics);

    const researchResult = cleanCitations(data.choices[0].message.content);

    let parsedResult;
    try {
      const jsonMatch = researchResult.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : researchResult);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        trends: [],
        dataLimitations: "AI parsing error occurred",
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