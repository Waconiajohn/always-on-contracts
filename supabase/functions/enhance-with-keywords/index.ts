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
    const { itemId, sectionKey, suggestedKeywords } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the current item
    const tableName = getTableName(sectionKey);
    const contentField = getContentField(sectionKey);
    
    const { data: item, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const currentContent = item[contentField];
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate enhanced version
    const prompt = `Enhance this Master Resume content by naturally incorporating these keywords: ${suggestedKeywords.join(', ')}

Current content: "${currentContent}"

Requirements:
1. Keep the core message and voice intact
2. Naturally integrate the suggested keywords
3. Maintain or improve quality tier
4. Keep it concise and impactful
5. Add specific metrics if keywords suggest quantification

Return ONLY the enhanced content, no explanation.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a career coach enhancing professional content. Be concise and impactful.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const enhancedContent = aiData.choices[0].message.content.trim();

    // Update the item
    // Handle confidence_score based on table type (some use integer 0-100, some use numeric 0.00-1.00)
    const integerScoreTables = ['vault_power_phrases', 'vault_transferable_skills', 'vault_hidden_competencies'];
    const useIntegerScore = integerScoreTables.includes(tableName);
    
    const currentScore = item.confidence_score || (useIntegerScore ? 70 : 0.7);
    const increment = useIntegerScore ? 10 : 0.1;
    const maxScore = useIntegerScore ? 95 : 0.95;
    const newScore = Math.min(currentScore + increment, maxScore);
    
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        [contentField]: enhancedContent,
        quality_tier: item.quality_tier === 'bronze' ? 'silver' : item.quality_tier === 'silver' ? 'gold' : item.quality_tier,
        confidence_score: newScore,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, enhancedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-with-keywords:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getTableName(section: string): string {
  const map: Record<string, string> = {
    power_phrases: 'vault_power_phrases',
    transferable_skills: 'vault_transferable_skills',
    hidden_competencies: 'vault_hidden_competencies',
    soft_skills: 'vault_soft_skills',
    leadership_philosophy: 'vault_leadership_philosophy',
    executive_presence: 'vault_executive_presence',
    personality_traits: 'vault_personality_traits',
    work_style: 'vault_work_style',
    values_motivations: 'vault_values_motivations',
    behavioral_indicators: 'vault_behavioral_indicators'
  };
  return map[section] || 'vault_power_phrases';
}

function getContentField(section: string): string {
  const map: Record<string, string> = {
    power_phrases: 'power_phrase',
    transferable_skills: 'stated_skill',
    hidden_competencies: 'inferred_capability',
    soft_skills: 'skill_name',
    leadership_philosophy: 'philosophy_statement',
    executive_presence: 'presence_indicator',
    personality_traits: 'trait_name',
    work_style: 'preference_description',
    values_motivations: 'value_name',
    behavioral_indicators: 'specific_behavior'
  };
  return map[section] || 'power_phrase';
}
