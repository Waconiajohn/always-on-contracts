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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { responseText, questionText, warChestId } = await req.json();

    console.log('Extracting intelligence from response:', responseText);

    const extractionPrompt = `You are an expert career intelligence analyst. Extract structured intelligence from this interview response.

QUESTION ASKED:
${questionText}

USER'S RESPONSE:
${responseText}

Extract and return JSON with these categories:

{
  "powerPhrases": [
    {
      "phrase": "Led cross-functional team of 8 to deliver dashboard redesign, increasing retention 34% in 6 months",
      "category": "leadership",
      "metrics": ["8 team members", "34% increase", "6 months"],
      "atsScore": 95
    }
  ],
  "transferableSkills": [
    {
      "skill": "Cross-functional team leadership",
      "evidence": "Coordinated team of 8 across engineering, design, and product",
      "marketDemand": "high",
      "equivalentTerms": ["Team Management", "Project Leadership", "Stakeholder Coordination"]
    }
  ],
  "hiddenCompetencies": [
    {
      "competency": "Data-driven decision making",
      "evidence": "Used RICE scoring for prioritization, established weekly metrics reviews",
      "level": "advanced"
    }
  ]
}

POWER PHRASE RULES:
- Must contain specific metrics/numbers
- Action verb + context + measurable outcome
- ATS-optimized with industry keywords
- Categories: leadership, technical, business_impact, problem_solving, innovation

TRANSFERABLE SKILL RULES:
- Skills that apply across roles/industries
- Provide specific evidence from the response
- Rate market demand (high/medium/low)
- Include 2-4 equivalent industry terms

HIDDEN COMPETENCY RULES:
- Implicit capabilities not directly stated
- Soft skills, leadership traits, strategic thinking
- Level: beginner/intermediate/advanced/expert

Return ONLY valid JSON. Extract 2-5 power phrases, 2-4 transferable skills, 1-3 hidden competencies per response.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a career intelligence extraction specialist. Return only valid JSON.' },
          { role: 'user', content: extractionPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI extraction error:', response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    let extracted;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('Failed to parse extraction:', e);
      extracted = { powerPhrases: [], transferableSkills: [], hiddenCompetencies: [] };
    }

    console.log('Extracted intelligence:', extracted);

    // Store power phrases
    const powerPhraseInserts = extracted.powerPhrases?.map((p: any) => ({
      war_chest_id: warChestId,
      phrase_text: p.phrase,
      phrase_category: p.category || 'general',
      metrics: p.metrics || [],
      ats_score: p.atsScore || 70,
      source_question: questionText,
      source_response: responseText
    })) || [];

    if (powerPhraseInserts.length > 0) {
      await supabase.from('war_chest_power_phrases').insert(powerPhraseInserts);
    }

    // Store transferable skills
    const skillInserts = extracted.transferableSkills?.map((s: any) => ({
      war_chest_id: warChestId,
      skill_name: s.skill,
      skill_evidence: s.evidence,
      market_demand_level: s.marketDemand || 'medium',
      equivalent_industry_terms: s.equivalentTerms || [],
      source_question: questionText
    })) || [];

    if (skillInserts.length > 0) {
      await supabase.from('war_chest_transferable_skills').insert(skillInserts);
    }

    // Store hidden competencies
    const competencyInserts = extracted.hiddenCompetencies?.map((c: any) => ({
      war_chest_id: warChestId,
      competency_name: c.competency,
      competency_evidence: c.evidence,
      proficiency_level: c.level || 'intermediate',
      source_question: questionText
    })) || [];

    if (competencyInserts.length > 0) {
      await supabase.from('war_chest_hidden_competencies').insert(competencyInserts);
    }

    // Update totals in career_war_chest
    const { data: phraseCounts } = await supabase
      .from('war_chest_power_phrases')
      .select('id', { count: 'exact', head: true })
      .eq('war_chest_id', warChestId);
    
    const { data: skillCounts } = await supabase
      .from('war_chest_transferable_skills')
      .select('id', { count: 'exact', head: true })
      .eq('war_chest_id', warChestId);
    
    const { data: competencyCounts } = await supabase
      .from('war_chest_hidden_competencies')
      .select('id', { count: 'exact', head: true })
      .eq('war_chest_id', warChestId);
    
    await supabase
      .from('career_war_chest')
      .update({
        total_power_phrases: (phraseCounts as any)?.count || 0,
        total_transferable_skills: (skillCounts as any)?.count || 0,
        total_hidden_competencies: (competencyCounts as any)?.count || 0,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', warChestId);

    return new Response(JSON.stringify({
      success: true,
      extracted: {
        powerPhrases: powerPhraseInserts.length,
        transferableSkills: skillInserts.length,
        hiddenCompetencies: competencyInserts.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error extracting intelligence:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
