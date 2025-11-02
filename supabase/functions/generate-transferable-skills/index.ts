import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
      .eq('phase', 'skills_translation');

    if (!vault) throw new Error('Career Vault not found');

    const prompt = `You are a career strategist identifying transferable skills with strategic precision.

Resume: ${vault.resume_raw_text}
Skills Translation Responses: ${JSON.stringify(responses)}

STRATEGIC TRANSLATION REQUIREMENTS:
- If they managed [specific tool], list 8-10 equivalent/adjacent tools they could claim
- If they worked in [industry], identify 3-5 adjacent industries where skills transfer
- Include "near-certifications": skills that are 80% of the way to a formal credential
- Think: "What could they claim to know that they don't realize they know?"
- Look for technology evolution (e.g., "data analysis 2015" = "business intelligence" today)

Identify 10-15 transferable skills mappings like:
- Salesforce experience → Zoho, HubSpot, Microsoft Dynamics, SugarCRM, any CRM platform, Pipedrive, Freshsales
- Project management in healthcare → Project management in finance/tech/manufacturing (domain transfer)
- Machine learning work → AI implementation, ML Ops, data science infrastructure (technology evolution)
- Excel VBA automation → Python automation, process improvement, RPA concepts
- Managed distributed teams → Remote team leadership, async collaboration, virtual leadership

Return JSON array:
[{
  "stated_skill": "Salesforce Administration",
  "equivalent_skills": ["Zoho CRM", "HubSpot", "Microsoft Dynamics 365", "SugarCRM", "Pipedrive", "Freshsales", "Any enterprise CRM platform", "CRM implementation"],
  "evidence": "5 years managing Salesforce includes workflow automation, custom objects, reporting, integrations - all transferable to similar platforms. Understanding of CRM architecture and business processes.",
  "confidence_score": 95
}]`;

    console.log('Generating transferable skills for Career Vault:', vaultId);
    
    const { response, metrics } = await callPerplexity({
      messages: [
        { role: 'system', content: 'You are a career strategist specializing in skills translation and career pivoting. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: PERPLEXITY_MODELS.SMALL,
      temperature: 0.2,
    }, 'generate-transferable-skills', vault.user_id);

    await logAIUsage(metrics);

    const skillsText = cleanCitations(response.choices[0].message.content).trim();
    const jsonMatch = skillsText.match(/\[[\s\S]*\]/);
    const skills = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const insertPromises = skills.map((skill: any) =>
      supabase.from('vault_transferable_skills').insert({
        vault_id: vaultId,
        user_id: vault.user_id,
        stated_skill: skill.stated_skill,
        equivalent_skills: skill.equivalent_skills,
        evidence: skill.evidence,
        confidence_score: skill.confidence_score || 75
      })
    );

    await Promise.all(insertPromises);

    return new Response(
      JSON.stringify({ success: true, count: skills.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating transferable skills:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
