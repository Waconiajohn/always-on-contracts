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

    // Get war chest and interview responses
    const { data: warChest } = await supabase
      .from('career_war_chest')
      .select('*')
      .eq('id', warChestId)
      .single();

    const { data: responses } = await supabase
      .from('war_chest_interview_responses')
      .select('*')
      .eq('war_chest_id', warChestId);

    if (!warChest) throw new Error('War chest not found');

    // Use Lovable AI to generate power phrases
    const prompt = `You are an expert resume writer. Convert weak resume statements into powerful, quantified achievement statements.

Resume Text: ${warChest.resume_raw_text}

Interview Insights: ${JSON.stringify(responses)}

Generate 15-20 power phrases following these rules:
1. Start with strong action verbs (Led, Architected, Optimized, Spearheaded)
2. Include quantifiable metrics whenever possible
3. Show impact and results
4. Be specific and concrete
5. Categorize each phrase (leadership, technical, quantitative_achievement, strategic, operational)

Return JSON array with format:
[{
  "category": "leadership",
  "original_text": "Managed team",
  "power_phrase": "Led cross-functional team of 12 engineers to deliver $2M project 3 weeks ahead of schedule",
  "impact_metrics": {"team_size": 12, "value": "$2M", "time_saved": "3 weeks"},
  "keywords": ["leadership", "project management", "team building"],
  "confidence_score": 90
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
          { role: 'system', content: 'You are an expert resume writer. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) throw new Error('Failed to generate power phrases');

    const aiResponse = await response.json();
    const powerPhrasesText = aiResponse.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = powerPhrasesText.match(/\[[\s\S]*\]/);
    const powerPhrases = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Insert power phrases into database
    const insertPromises = powerPhrases.map((phrase: any) =>
      supabase.from('war_chest_power_phrases').insert({
        war_chest_id: warChestId,
        user_id: warChest.user_id,
        category: phrase.category,
        original_text: phrase.original_text || null,
        power_phrase: phrase.power_phrase,
        impact_metrics: phrase.impact_metrics || {},
        keywords: phrase.keywords || [],
        confidence_score: phrase.confidence_score || 80,
        source: 'resume'
      })
    );

    await Promise.all(insertPromises);

    return new Response(
      JSON.stringify({ success: true, count: powerPhrases.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating power phrases:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
