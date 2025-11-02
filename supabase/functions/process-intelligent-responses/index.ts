import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, PERPLEXITY_MODELS, cleanCitations } from '../_shared/ai-config.ts';
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
    const { vaultId, responses, industryStandards } = await req.json();
    console.log('[PROCESS RESPONSES] Processing', responses.length, 'responses for vault:', vaultId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get vault to find user_id
    const { data: vault } = await supabase
      .from('career_vault')
      .select('user_id')
      .eq('id', vaultId)
      .single();

    // Use AI to parse responses into structured vault items
    const prompt = `Parse these user responses into structured career vault items. Extract power phrases, skills, competencies, and soft skills.

**User Responses**: ${JSON.stringify(responses)}
**Industry Context**: ${JSON.stringify(industryStandards).substring(0, 500)}

Generate vault items as JSON:
{
  "powerPhrases": [
    { "category": "Achievement", "phrase": "Led $2M budget optimization", "metrics": {"amount": 2000000}, "confidence": 0.9 }
  ],
  "skills": [
    { "skill": "Budget Management", "evidence": "Managed $2M budget", "confidence": 0.85 }
  ],
  "softSkills": [
    { "skill": "Leadership", "example": "Mentored 5 team members", "impact": "Increased team productivity by 30%", "proficiency": "advanced" }
  ],
  "competencies": [
    { "area": "Strategic Planning", "capability": "Long-term vision and execution", "evidence": ["Led 3-year transformation"] }
  ]
}`;

    const { response, metrics } = await callPerplexity({
      messages: [
        { role: 'system', content: 'You are an expert at extracting career intelligence. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      model: PERPLEXITY_MODELS.SMALL,
      temperature: 0.3,
    }, 'process-intelligent-responses', vault?.user_id);

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);
    const parsedItems = JSON.parse(content);

    let newItemsCreated = 0;

    // Insert power phrases
    if (parsedItems.powerPhrases?.length > 0) {
      const { error } = await supabase.from('vault_power_phrases').insert(
        parsedItems.powerPhrases.map((p: any) => ({
          vault_id: vaultId,
          category: p.category || 'Achievement',
          power_phrase: p.phrase,
          impact_metrics: p.metrics,
          confidence_score: p.confidence || 0.8,
          quality_tier: 'gold',
          source: 'intelligent_interview'
        }))
      );
      if (!error) newItemsCreated += parsedItems.powerPhrases.length;
    }

    // Insert transferable skills
    if (parsedItems.skills?.length > 0) {
      const { error } = await supabase.from('vault_transferable_skills').insert(
        parsedItems.skills.map((s: any) => ({
          vault_id: vaultId,
          stated_skill: s.skill,
          evidence: s.evidence,
          confidence_score: s.confidence || 0.8,
          quality_tier: 'gold',
          source: 'intelligent_interview'
        }))
      );
      if (!error) newItemsCreated += parsedItems.skills.length;
    }

    // Insert soft skills
    if (parsedItems.softSkills?.length > 0) {
      const { error } = await supabase.from('vault_soft_skills').insert(
        parsedItems.softSkills.map((s: any) => ({
          vault_id: vaultId,
          skill_name: s.skill,
          examples: s.example,
          impact: s.impact,
          proficiency_level: s.proficiency || 'intermediate',
          quality_tier: 'gold',
          inferred_from: 'intelligent_interview'
        }))
      );
      if (!error) newItemsCreated += parsedItems.softSkills.length;
    }

    // Insert hidden competencies
    if (parsedItems.competencies?.length > 0) {
      const { error } = await supabase.from('vault_hidden_competencies').insert(
        parsedItems.competencies.map((c: any) => ({
          vault_id: vaultId,
          competency_area: c.area,
          inferred_capability: c.capability,
          supporting_evidence: c.evidence,
          confidence_score: 0.85,
          quality_tier: 'gold',
          source: 'intelligent_interview'
        }))
      );
      if (!error) newItemsCreated += parsedItems.competencies.length;
    }

    // Store raw responses
    await supabase.from('career_vault_intelligent_responses').insert({
      vault_id: vaultId,
      responses: responses,
      processed_items: parsedItems,
      items_created: newItemsCreated
    });

    console.log('[PROCESS RESPONSES] Created', newItemsCreated, 'new vault items');

    return new Response(
      JSON.stringify({
        success: true,
        newItemsCreated,
        parsedItems
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PROCESS RESPONSES] Error:', error);
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
