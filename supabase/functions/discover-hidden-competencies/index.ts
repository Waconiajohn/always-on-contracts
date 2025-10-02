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
      .eq('phase', 'hidden_gems');

    if (!warChest) throw new Error('War chest not found');

    const prompt = `You are an expert at discovering hidden competencies people don't realize they have.

Resume: ${warChest.resume_raw_text}
Hidden Gems Interview: ${JSON.stringify(responses)}

Discover 8-12 hidden competencies like:
- Worked on large language models in 2018 → Can implement modern AI solutions (even without "AI experience" title)
- Trained in Kaizen in Japan → Six Sigma Black Belt equivalent knowledge (even without certification)
- Managed IT infrastructure projects → Qualified to lead AI implementation (knows engineering, project management, IT)

Return JSON array:
[{
  "competency_area": "AI Implementation",
  "supporting_evidence": ["Worked on large language models 2018-2020", "Led ML infrastructure projects", "Managed data science teams"],
  "inferred_capability": "Qualified to lead enterprise AI transformation initiatives despite not having explicit 'AI experience' job title",
  "confidence_score": 85,
  "certification_equivalent": "AI/ML Professional (practical experience)"
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
          { role: 'system', content: 'You are an expert career analyst. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1800
      }),
    });

    if (!response.ok) throw new Error('Failed to discover hidden competencies');

    const aiResponse = await response.json();
    const competenciesText = aiResponse.choices[0].message.content.trim();
    const jsonMatch = competenciesText.match(/\[[\s\S]*\]/);
    const competencies = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const insertPromises = competencies.map((comp: any) =>
      supabase.from('war_chest_hidden_competencies').insert({
        war_chest_id: warChestId,
        user_id: warChest.user_id,
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
