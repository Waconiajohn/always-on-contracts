import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, industryStandards } = await req.json();
    console.log('[GAP ANALYSIS] Generating analysis for vault:', vaultId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ALL vault data across tables
    const [phrases, skills, competencies, softSkills, leadership] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId)
    ]);

    const vaultSummary = {
      powerPhrasesCount: phrases.data?.length || 0,
      skillsCount: skills.data?.length || 0,
      competenciesCount: competencies.data?.length || 0,
      softSkillsCount: softSkills.data?.length || 0,
      leadershipCount: leadership.data?.length || 0,
      topPhrases: phrases.data?.slice(0, 5).map(p => p.power_phrase) || [],
      topSkills: skills.data?.slice(0, 5).map(s => s.stated_skill) || []
    };

    // Use AI to generate comprehensive gap analysis
    const prompt = `You are an expert career advisor. Compare this user's career vault against industry standards and generate a comprehensive gap analysis.

**User's Vault Summary**:
${JSON.stringify(vaultSummary, null, 2)}

**Industry Standards**:
${JSON.stringify(industryStandards, null, 2).substring(0, 1000)}

Generate a gap analysis as JSON:
{
  "overallAnalysis": {
    "vaultStrength": 75,
    "benchmarkAlignment": 68,
    "competitivePosition": "Strong Candidate"
  },
  "strengths": [
    {
      "category": "Technical Skills",
      "userScore": 85,
      "benchmarkScore": 75,
      "status": "exceeds",
      "evidence": ["User has 15 technical skills vs. benchmark of 10"],
      "recommendations": ["Highlight these in resume header"]
    }
  ],
  "gaps": [
    {
      "category": "Quantifiable Metrics",
      "userScore": 60,
      "benchmarkScore": 85,
      "status": "below",
      "evidence": ["Only 3 power phrases with metrics vs. benchmark of 8"],
      "recommendations": ["Add specific budget amounts", "Include team size numbers"]
    }
  ],
  "opportunities": [
    {
      "category": "Leadership Philosophy",
      "userScore": 50,
      "benchmarkScore": 70,
      "status": "developing",
      "evidence": ["No leadership philosophy documented"],
      "recommendations": ["Define leadership approach", "Add examples of mentoring"]
    }
  ]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert career advisor. Provide detailed gap analysis in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const gapAnalysis = JSON.parse(aiData.choices[0].message.content);

    console.log('[GAP ANALYSIS] Analysis complete:', {
      strengths: gapAnalysis.strengths?.length || 0,
      gaps: gapAnalysis.gaps?.length || 0,
      opportunities: gapAnalysis.opportunities?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        gapAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GAP ANALYSIS] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
