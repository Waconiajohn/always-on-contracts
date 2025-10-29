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
    const { vaultId, industryStandards, currentVaultData } = await req.json();

    console.log('[GAP-ANALYSIS] Generating gap analysis for vault:', vaultId);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate comprehensive gap analysis using AI
    const prompt = `
You are analyzing a career profile against industry standards.

INDUSTRY STANDARDS:
${JSON.stringify(industryStandards, null, 2)}

CURRENT CAREER VAULT DATA:
${JSON.stringify(currentVaultData, null, 2)}

Generate a comprehensive gap analysis in JSON format:
{
  "strengths": [
    {
      "category": "regulatory_compliance",
      "score": 95,
      "benchmark": 90,
      "status": "exceeds",
      "evidence": ["PCI-DSS experience", "SOC 2 certified"],
      "message": "You exceed industry standards in this area"
    }
  ],
  "opportunities": [
    {
      "category": "board_experience",
      "score": 70,
      "benchmark": 75,
      "status": "matches",
      "gap": 5,
      "evidence": ["3 board presentations"],
      "message": "You match expectations but could highlight more",
      "recommendations": [
        "Quantify the impact of board presentations",
        "Mention any advisory board roles"
      ]
    }
  ],
  "gaps": [
    {
      "category": "leadership_scope",
      "score": 60,
      "benchmark": 80,
      "status": "below",
      "gap": 20,
      "severity": "medium",
      "evidence": ["Team size: 30, Benchmark: 45"],
      "message": "Your scope is below typical for this role",
      "recommendations": [
        "Highlight trajectory: grew team from X to 30",
        "Mention indirect reports or cross-functional leadership",
        "Add budget management details"
      ],
      "quickFix": {
        "action": "add_to_vault",
        "items": [
          "Led cross-functional initiatives impacting 100+ people",
          "Managed $5M engineering budget with 15% YoY efficiency improvement"
        ]
      }
    }
  ],
  "overallAnalysis": {
    "vaultStrength": 72,
    "benchmarkAlignment": 85,
    "competitivePosition": "Strong candidate with opportunity areas",
    "topStrengths": ["regulatory_compliance", "technical_depth"],
    "topGaps": ["leadership_scope", "industry_networking"],
    "readiness": "Interview-ready with gap mitigation"
  },
  "recommendations": [
    {
      "priority": "high",
      "category": "leadership_scope",
      "action": "Add quantified leadership metrics",
      "impact": 15,
      "items": ["Budget size", "Growth trajectory", "Cross-functional impact"]
    }
  ]
}

Be specific and actionable. Focus on what hiring managers look for.
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a career analyst comparing candidates against industry benchmarks. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisContent = aiData.choices[0]?.message?.content || '{}';
    
    let gapAnalysis;
    try {
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisContent;
      gapAnalysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[GAP-ANALYSIS] Parse error:', parseError);
      gapAnalysis = { strengths: [], opportunities: [], gaps: [], overallAnalysis: {} };
    }

    // Store gap analysis in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await fetch(`${supabaseUrl}/rest/v1/career_vault?id=eq.${vaultId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gap_analysis: gapAnalysis,
        benchmark_comparison: {
          strengths: gapAnalysis.strengths || [],
          gaps: gapAnalysis.gaps || [],
          overall: gapAnalysis.overallAnalysis || {}
        }
      })
    });

    // Store as research record
    await fetch(`${supabaseUrl}/rest/v1/career_vault_industry_research`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vault_id: vaultId,
        research_type: 'gap_analysis',
        target_role: industryStandards.targetRole || 'Not specified',
        target_industry: industryStandards.targetIndustry || 'Not specified',
        research_results: gapAnalysis,
        confidence_score: 90
      })
    });

    console.log('[GAP-ANALYSIS] Analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        gapAnalysis,
        summary: {
          strengthsCount: gapAnalysis.strengths?.length || 0,
          gapsCount: gapAnalysis.gaps?.length || 0,
          overallStrength: gapAnalysis.overallAnalysis?.vaultStrength || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GAP-ANALYSIS] Error:', error);
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
