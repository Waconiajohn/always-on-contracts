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
    const { vaultId, resumeId: bodyResumeId, benchmarkData } = await req.json();
    // Support both resumeId and vaultId for backward compatibility
    const resumeId = bodyResumeId || vaultId;

    console.log('Discovering hidden strengths for resume:', resumeId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all Master Resume data
    const [
      { data: powerPhrases },
      { data: transferableSkills },
      { data: hiddenCompetencies }
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', resumeId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', resumeId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', resumeId)
    ]);

    console.log('[suggest-hidden-strengths] Building analysis prompt');

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are an expert talent analyst specializing in uncovering hidden strengths from career data.

Your task: Identify implicit skills, leadership qualities, and strategic impact that candidates haven't explicitly documented.

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "hidden_strengths": [
    {
      "strength_type": "skill | leadership | strategic_impact",
      "title": "Concise name of hidden strength",
      "description": "What you discovered and why it matters",
      "evidence": "Specific examples from their vault data",
      "suggested_action": "How to add this to their Master Resume",
      "suggested_keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Analysis Guidelines:
1. Look for patterns across multiple achievements
2. Identify skills implied by projects but not explicitly stated
3. Spot leadership qualities demonstrated through actions
4. Recognize strategic thinking shown in results
5. Detect soft skills evident in collaboration/coordination
6. Focus on transferable strengths valuable across roles`;

    const resumeSummary = {
      achievements: powerPhrases?.map((p: any) => p.power_phrase || p.phrase) || [],
      skills: transferableSkills?.map((s: any) => s.stated_skill || s.skill) || [],
      competencies: hiddenCompetencies?.map((c: any) => c.competency_area) || []
    };

    // STANDARDIZED USER PROMPT
    const userPrompt = `Analyze this Master Resume to discover hidden strengths:

CURRENT MASTER RESUME DATA:

Documented Achievements (${resumeSummary.achievements.length} items):
${resumeSummary.achievements.slice(0, 20).join('\n') || 'None documented'}

Explicit Skills (${resumeSummary.skills.length} items):
${resumeSummary.skills.slice(0, 15).join(', ') || 'None documented'}

Competency Areas (${resumeSummary.competencies.length} items):
${resumeSummary.competencies.join(', ') || 'None documented'}

BENCHMARK TARGETS:
- Skills: ${benchmarkData?.layer1_foundations?.skills?.target || 25}
- Leadership Examples: ${benchmarkData?.layer2_intelligence?.leadership?.target || 4}
- Strategic Impact Items: ${benchmarkData?.layer2_intelligence?.strategic_impact?.target || 10}

TASK: Find 5-8 hidden strengths by:
1. Reading between the lines of their achievements
2. Identifying skills they use but haven't named
3. Spotting leadership patterns in their actions
4. Recognizing strategic thinking in their results
5. Detecting soft skills shown in their work

For each hidden strength, provide:
- Clear evidence from their Master Resume
- Specific action they can take to document it
- 2-3 ATS-optimized keywords

Return your analysis in the required JSON format.`;

    console.log('[suggest-hidden-strengths] Calling Lovable AI with PREMIUM model');

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
    console.log('[suggest-hidden-strengths] Raw AI response:', rawContent.substring(0, 500));
    
    const parseResult = extractJSON(rawContent);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[suggest-hidden-strengths] JSON parse failed:', parseResult.error);
      console.error('[suggest-hidden-strengths] Full response:', rawContent);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const result = parseResult.data;
    
    // EXPLICIT FIELD VALIDATION
    if (!result.hidden_strengths || !Array.isArray(result.hidden_strengths)) {
      console.error('[suggest-hidden-strengths] Missing or invalid hidden_strengths array:', result);
      throw new Error('AI response missing required field: hidden_strengths array');
    }
    
    // Validate each hidden strength object
    result.hidden_strengths.forEach((strength: any, index: number) => {
      if (!strength.strength_type || !['skill', 'leadership', 'strategic_impact'].includes(strength.strength_type)) {
        console.error(`[suggest-hidden-strengths] Invalid strength_type at index ${index}:`, strength);
        throw new Error(`Hidden strength ${index} has invalid strength_type`);
      }
      
      if (!strength.title || typeof strength.title !== 'string') {
        console.error(`[suggest-hidden-strengths] Missing title at index ${index}:`, strength);
        throw new Error(`Hidden strength ${index} missing required field: title`);
      }
      
      if (!strength.description || typeof strength.description !== 'string') {
        console.error(`[suggest-hidden-strengths] Missing description at index ${index}:`, strength);
        throw new Error(`Hidden strength ${index} missing required field: description`);
      }
      
      if (!strength.evidence || typeof strength.evidence !== 'string') {
        console.error(`[suggest-hidden-strengths] Missing evidence at index ${index}:`, strength);
        throw new Error(`Hidden strength ${index} missing required field: evidence`);
      }
      
      if (!Array.isArray(strength.suggested_keywords)) {
        console.error(`[suggest-hidden-strengths] Invalid suggested_keywords at index ${index}:`, strength);
        throw new Error(`Hidden strength ${index} missing required field: suggested_keywords array`);
      }
    });

    console.log('[suggest-hidden-strengths] Successfully found hidden strengths:', {
      count: result.hidden_strengths.length,
      types: result.hidden_strengths.map((s: any) => s.strength_type)
    });

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
