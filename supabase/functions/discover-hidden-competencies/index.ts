import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
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

    if (!vault) throw new Error('Career Vault not found');

    const prompt = `You are an expert at discovering hidden competencies and reframing experience with modern terminology.

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
- "Coordinated between sales and engineering" → Product management capable, stakeholder management expert

Return JSON array:
[{
  "competency_area": "AI Implementation Leadership",
  "supporting_evidence": ["Worked on large language models 2018-2020", "Led ML infrastructure projects", "Managed data science teams", "Understands model deployment and scaling"],
  "inferred_capability": "Qualified to lead enterprise AI transformation initiatives despite not having explicit 'AI experience' job title. Understands both technical and business aspects of AI.",
  "confidence_score": 85,
  "certification_equivalent": "AI/ML Professional (practical experience) - could pass AI certifications"
}]`;

    console.log('Discovering hidden competencies for career vault:', vaultId);

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: 'You are an expert career analyst specializing in discovering hidden capabilities and reframing experience. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.6,
        max_tokens: 2000,
        return_citations: false,
      },
      'discover-hidden-competencies'
    );

    await logAIUsage(metrics);

    const competenciesText = cleanCitations(response.choices[0].message.content.trim());
    const jsonMatch = competenciesText.match(/\[[\s\S]*\]/);
    const competencies = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const insertPromises = competencies.map((comp: any) =>
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
      JSON.stringify({ success: true, count: competencies.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error discovering hidden competencies:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
