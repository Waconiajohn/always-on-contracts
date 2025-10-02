import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { warChestId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: warChest } = await supabase
      .from('career_war_chest')
      .select('*')
      .eq('id', warChestId)
      .single();

    const { data: responses } = await supabase
      .from('war_chest_interview_responses')
      .select('*')
      .eq('war_chest_id', warChestId)
      .eq('phase', 'skills_translation');

    if (!warChest) throw new Error('War chest not found');

    const prompt = `You are a career strategist identifying transferable skills. 

Resume: ${warChest.resume_raw_text}
Skills Translation Responses: ${JSON.stringify(responses)}

Identify 10-15 transferable skills mappings like:
- Salesforce experience → Zoho, HubSpot, any CRM platform
- Project management in healthcare → Project management in finance (domain transfer)
- Machine learning work → AI implementation (technology evolution)

Return JSON array:
[{
  "stated_skill": "Salesforce Administration",
  "equivalent_skills": ["Zoho CRM", "HubSpot", "Microsoft Dynamics", "SugarCRM", "Any enterprise CRM"],
  "evidence": "5 years managing Salesforce includes workflow automation, custom objects, reporting - all transferable to similar platforms",
  "confidence_score": 95
}]`;

    const response = await fetch('https://lovable.app/api/ai/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are a career strategist. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1500
      }),
    });

    if (!response.ok) throw new Error('Failed to generate transferable skills');

    const aiResponse = await response.json();
    const skillsText = aiResponse.choices[0].message.content.trim();
    const jsonMatch = skillsText.match(/\[[\s\S]*\]/);
    const skills = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const insertPromises = skills.map((skill: any) =>
      supabase.from('war_chest_transferable_skills').insert({
        war_chest_id: warChestId,
        user_id: warChest.user_id,
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
