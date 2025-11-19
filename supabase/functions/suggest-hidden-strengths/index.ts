import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, benchmarkData } = await req.json();

    console.log('Discovering hidden strengths for vault:', vaultId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all vault data
    const [
      { data: powerPhrases },
      { data: transferableSkills },
      { data: hiddenCompetencies }
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId)
    ]);

    // Create analysis prompt
    const systemPrompt = `You are an expert talent analyst. Return ONLY valid JSON, no additional text or explanations.

Look for patterns in their achievements to identify:
1. Skills they haven't explicitly listed
2. Leadership qualities shown through actions
3. Strategic thinking demonstrated in results
4. Technical expertise implied by projects
5. Soft skills evident in teamwork/coordination

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "hidden_strengths": [
    {
      "strength_type": "skill" | "leadership" | "strategic_impact",
      "title": "Short name",
      "description": "What you discovered",
      "evidence": "Specific examples from their vault",
      "suggested_action": "How to add this to their vault",
      "suggested_keywords": ["keyword1", "keyword2"]
    }
  ]
}`;

    const vaultSummary = {
      achievements: powerPhrases?.map((p: any) => p.power_phrase || p.phrase),
      skills: transferableSkills?.map((s: any) => s.stated_skill || s.skill),
      competencies: hiddenCompetencies?.map((c: any) => c.competency_area)
    };

    const userPrompt = `Analyze this career vault and discover hidden strengths:

Achievements (${powerPhrases?.length || 0} items):
${vaultSummary.achievements?.slice(0, 20).join('\n')}

Current Skills (${transferableSkills?.length || 0} items):
${vaultSummary.skills?.slice(0, 15).join(', ')}

Benchmark expects:
- ${benchmarkData?.layer1_foundations?.skills?.target || 25} skills
- ${benchmarkData?.layer2_intelligence?.leadership?.target || 4} leadership examples
- ${benchmarkData?.layer2_intelligence?.strategic_impact?.target || 10} strategic impact items

Find 5-8 hidden strengths they haven't explicitly documented. Include AI-suggested keywords for each.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      "suggest-hidden-strengths",
      undefined
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    console.log('Raw AI response:', rawContent.substring(0, 500));
    
    const parseResult = extractJSON(rawContent);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('JSON parse failed:', parseResult.error);
      console.error('Full response:', rawContent);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const result = parseResult.data;
    
    // Validate required fields
    if (!result.hidden_strengths || !Array.isArray(result.hidden_strengths)) {
      console.error('Missing or invalid hidden_strengths array:', result);
      throw new Error('AI response missing required field: hidden_strengths array');
    }

    return new Response(
      JSON.stringify({
        success: true,
        hidden_strengths: result.hidden_strengths
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-hidden-strengths:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
