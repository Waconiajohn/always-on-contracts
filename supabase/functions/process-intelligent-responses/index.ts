import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { resumeId, responses, industryStandards } = body;
    console.log('[PROCESS RESPONSES] Processing', responses.length, 'responses for Master Resume:', resumeId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Master Resume to find user_id
    const { data: resume } = await supabase
      .from('career_vault')
      .select('user_id')
      .eq('id', resumeId)
      .single();

    // Use AI to parse responses into structured resume items
    const prompt = `Parse these user responses into structured Master Resume items. Extract power phrases, skills, competencies, and soft skills.

**User Responses**: ${JSON.stringify(responses)}
**Industry Context**: ${JSON.stringify(industryStandards).substring(0, 500)}

Generate resume items as JSON:
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

    const { response, metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: 'You are an expert at extracting career intelligence. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }, 'process-intelligent-responses', resume?.user_id);

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const parseResult = extractJSON(content);

    if (!parseResult.success || !parseResult.data) {
      const logger = createLogger('process-intelligent-responses');
      logger.error('JSON parsing failed', {
        error: parseResult.error,
        content: content.substring(0, 500)
      });
      throw new Error('Failed to parse AI response');
    }

    const parsedItems = parseResult.data;

    let newItemsCreated = 0;

    // Insert power phrases
    if (parsedItems.powerPhrases?.length > 0) {
      const { error } = await supabase.from('vault_power_phrases').insert(
        parsedItems.powerPhrases.map((p: any) => ({
          vault_id: resumeId,
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
          vault_id: resumeId,
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
          vault_id: resumeId,
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
          vault_id: resumeId,
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
      vault_id: resumeId,
      responses: responses,
      processed_items: parsedItems,
      items_created: newItemsCreated
    });

    console.log('[PROCESS RESPONSES] Created', newItemsCreated, 'new resume items');

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
