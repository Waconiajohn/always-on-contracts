import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractArray } from '../_shared/json-parser.ts';
import { HiddenCompetencySchema } from '../_shared/ai-response-schemas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const startTime = Date.now();
  const logger = createLogger('discover-hidden-competencies');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: vault } = await supabase
      .from('career_vault')
      .select('*')
      .eq('id', vaultId)
      .single();

    const { data: responses } = await supabase
      .from('vault_interview_responses')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('phase', 'hidden_gems');

    if (!vault) throw new Error('Master Resume not found');

    const systemPrompt = `You are an expert at discovering hidden competencies and reframing experience with modern terminology. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY a JSON array with this exact structure, nothing else:
[{
  "competency_area": "string - the hidden competency name",
  "supporting_evidence": ["array of strings - specific evidence from resume"],
  "inferred_capability": "string - the broader capability this implies",
  "confidence_score": "number (0-100) - confidence in this inference",
  "certification_equivalent": "string (optional) - certifications they could pass"
}]`;

    const userPrompt = `Discover hidden competencies from this career data.

Resume: ${vault.resume_raw_text}
Hidden Gems Interview: ${JSON.stringify(responses)}

DEEP DISCOVERY REQUIREMENTS:
- Reframe old experience with modern terminology (e.g., "Excel reporting" → "Business Intelligence & Analytics")
- Identify implicit leadership (mentored team, drove adoption, championed initiative = leadership capability)
- Spot domain expertise they don't call expertise (e.g., "worked on medical devices 5 years" = "Healthcare Domain Expert")
- Find certifications they're qualified for but don't have (e.g., "PMP-eligible", "Could pass AWS Solutions Architect")
- Look for technology adjacency (e.g., "Built APIs" + "Managed servers" = "DevOps capabilities")
- Uncover soft skills demonstrated through actions (e.g., "Coordinated 3 departments" = "Cross-functional collaboration expert")

Discover 8-12 hidden competencies like:
- Worked on large language models in 2018 → Can implement modern AI solutions, Understands ML infrastructure (even without "AI Engineer" title)
- Trained in Kaizen in Japan → Six Sigma Black Belt equivalent knowledge, Process optimization expert (even without certification)
- Managed IT infrastructure projects → Qualified to lead cloud migration, DevOps transformation, AI implementation (knows engineering, project management, IT)
- Created Excel macros for 10 years → RPA candidate, Python automation ready, process improvement expert
- "Coordinated between sales and engineering" → Product management capable, stakeholder management expert`;

    console.log('Discovering hidden competencies for Master Resume:', vaultId);

    const { response, metrics } = await retryWithBackoff(
      async () => await callLovableAI(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: LOVABLE_AI_MODELS.PREMIUM,
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        },
        'discover-hidden-competencies',
        undefined
      ),
      3,
      (attempt, error) => {
        logger.warn(`Retry attempt ${attempt}`, { error: error.message });
      }
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content || '{}';
    console.log('[discover-hidden-competencies] Raw AI response:', rawContent.substring(0, 500));

    const result = extractArray(rawContent, HiddenCompetencySchema);

    if (!result.success || !result.data) {
      console.error('[discover-hidden-competencies] JSON parse failed:', result.error);
      console.error('[discover-hidden-competencies] Full response:', rawContent);
      logger.error('JSON parsing failed', {
        error: result.error,
        content: rawContent.substring(0, 500)
      });
      throw new Error(`Invalid AI response: ${result.error}`);
    }

    // Validate array has items
    if (!Array.isArray(result.data) || result.data.length === 0) {
      console.error('[discover-hidden-competencies] Empty or invalid competencies array');
      throw new Error('AI response returned no competencies');
    }

    console.log('[discover-hidden-competencies] Discovery complete:', {
      competenciesFound: result.data.length
    });

    const competencies = result.data;

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    const insertPromises = (competencies || []).map((comp: any) =>
      supabase.from('vault_hidden_competencies').insert({
        vault_id: vaultId,
        user_id: vault.user_id,
        competency_area: comp.competency_area,
        supporting_evidence: comp.supporting_evidence,
        inferred_capability: comp.inferred_capability,
        confidence_score: comp.confidence_score || 70,
        certification_equivalent: comp.certification_equivalent || null
      })
    );

    await Promise.all(insertPromises);

    return new Response(
      JSON.stringify({ success: true, count: competencies?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Request failed', {
      error: error.message,
      latencyMs: Date.now() - startTime
    });

    const errorResponse = handlePerplexityError(error);
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: errorResponse.statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
