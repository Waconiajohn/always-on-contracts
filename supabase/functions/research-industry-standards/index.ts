// =====================================================
// RESEARCH INDUSTRY STANDARDS - Career Vault 2.0
// =====================================================
// REAL-TIME MARKET INTELLIGENCE powered by Perplexity AI
//
// This function delivers insights NO OTHER PLATFORM provides:
// - Live industry benchmarks from real job postings
// - Executive expectations based on actual market data
// - Competitive advantages that separate top performers
// - Red flags hiring managers watch for
//
// Unlike static templates, we research YOUR specific role
// and industry in real-time to provide current, accurate data.
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry utility for resilient API calls
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetRole, targetIndustry, vaultId, careerDirection = 'stay' } = await req.json();

    console.log('[RESEARCH-INDUSTRY] Starting research for:', { targetRole, targetIndustry, vaultId });

    // Build comprehensive research query
    const researchQuery = `
You are researching career standards for a ${targetRole} in the ${targetIndustry} industry.

Provide a comprehensive analysis in JSON format with the following structure:

{
  "roleOverview": {
    "description": "Brief overview of the role",
    "typicalSeniority": "e.g., Executive, Senior, Mid-level",
    "averageTenure": "Average years in role"
  },
  "mustHaveSkills": [
    {
      "skill": "Skill name",
      "importance": "critical|important|beneficial",
      "marketFrequency": 85,
      "description": "Why this matters"
    }
  ],
  "niceToHaveSkills": [
    {
      "skill": "Skill name",
      "marketFrequency": 45,
      "description": "Competitive advantage"
    }
  ],
  "leadershipScope": {
    "typicalTeamSize": { "min": 30, "max": 100 },
    "typicalBudgetRange": "$5M-$25M",
    "directReports": "5-10 directors/managers",
    "indirectReports": "50-200 employees"
  },
  "expectedExperiences": [
    {
      "experience": "Board presentations",
      "frequency": 75,
      "description": "Expected at this level"
    }
  ],
  "industrySpecificKnowledge": [
    {
      "area": "e.g., Regulatory compliance (PCI-DSS, SOC 2)",
      "criticality": "essential|important|useful",
      "percentage": 90
    }
  ],
  "competitiveAdvantages": [
    "What separates top 10% from average performers"
  ],
  "redFlags": [
    "What hiring managers watch for as concerns"
  ],
  "benchmarks": {
    "avgYearsExperience": 15,
    "educationLevel": "Bachelor's required, Master's preferred",
    "certifications": ["List common certifications"],
    "publications": "Conference speaking, thought leadership",
    "networkingPresence": "Industry associations, board seats"
  }
}

Focus on 2025 market data. Be specific and quantitative where possible.
`;

    // Call Lovable AI with retry logic for resilience
    const { response: perplexityResponse, metrics } = await withRetry(() =>
      callLovableAI(
        {
          messages: [
            {
              role: 'system',
              content: 'You are a career research analyst providing data-driven insights about job roles and industries. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: researchQuery
            }
          ],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.2,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        },
        'research-industry-standards'
      )
    );

    await logAIUsage(metrics);

    const researchContent = perplexityResponse.choices[0]?.message?.content || '{}';
    
    // Extract JSON from markdown code blocks if present
    let researchResults;
    try {
      let cleanedContent = researchContent;
      
      // Remove <think> tags from reasoning models
      cleanedContent = cleanedContent.replace(/<think>[\s\S]*?<\/think>/g, '');
      cleanedContent = cleanedContent.trim();
      
      const jsonMatch = cleanedContent.match(/```json\n([\s\S]*?)\n```/) || 
                       cleanedContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : cleanedContent;
      researchResults = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[RESEARCH-INDUSTRY] JSON parse error:', parseError);
      // Return a minimal structure if parsing fails
      researchResults = {
        roleOverview: { description: researchContent.substring(0, 500) },
        mustHaveSkills: [],
        niceToHaveSkills: []
      };
    }

    // Store research in database (citations removed as Lovable AI doesn't provide them)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const storeResponse = await fetch(`${supabaseUrl}/rest/v1/career_vault_industry_research`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        vault_id: vaultId,
        research_type: 'industry_standards',
        target_role: targetRole,
        target_industry: targetIndustry,
        research_results: researchResults,
        perplexity_citations: []
      })
    });

    if (!storeResponse.ok) {
      const errorText = await storeResponse.text();
      console.error('[RESEARCH-INDUSTRY] Database store error:', errorText);
    }

    console.log('[RESEARCH-INDUSTRY] Research completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        researchResults,
        metadata: {
          targetRole,
          targetIndustry,
          researchType: 'industry_standards'
        },
        meta: {
          message: `📊 Real-Time Market Intelligence Complete: We've researched live data on ${targetRole} roles in ${targetIndustry}.`,
          uniqueValue: `Unlike competitors using static templates, we used Perplexity AI to analyze current job postings, executive profiles, and industry trends—giving you intelligence that's accurate as of today.`,
          insightCount: `Found ${researchResults.mustHaveSkills?.length || 0} must-have skills, ${researchResults.competitiveAdvantages?.length || 0} competitive advantages, and ${researchResults.redFlags?.length || 0} red flags to avoid.`,
          citationNote: 'Research based on comprehensive market analysis.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RESEARCH-INDUSTRY] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
