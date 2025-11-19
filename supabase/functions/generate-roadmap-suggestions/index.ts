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
    const { roadmapItem, sectionKey, vaultId, currentItems } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Analyze current items to avoid duplicates
    const existingContent = currentItems.map((item: any) => 
      item.power_phrase || item.stated_skill || item.inferred_capability || item.skill_name || ''
    );

    // Create context-specific prompt
    const sectionContext = getSectionContext(sectionKey);
    const prompt = `You are helping a user improve their career vault for the "${sectionKey}" section.

Current Situation:
- Goal: ${roadmapItem.title}
- Description: ${roadmapItem.description}
- Target: Add ${roadmapItem.target - roadmapItem.current} more items
- Suggested Keywords: ${roadmapItem.suggestedActions?.join(', ') || 'None'}

Section Context: ${sectionContext}

Existing Items (avoid duplicates):
${existingContent.slice(0, 10).join('\n')}

Generate 5 specific, actionable items that:
1. Directly address the goal: "${roadmapItem.goal}"
2. Use the suggested keywords when relevant
3. Are unique from existing items
4. Aim for gold or silver quality tier
5. Include quantifiable metrics where possible

For each suggestion, provide:
- content: The actual text to add to the vault
- qualityTier: 'gold', 'silver', or 'bronze'
- reasoning: Why this helps achieve the goal (1 sentence)
- keywords: Array of 2-3 relevant keywords from the suggestion

Return a JSON object with a "suggestions" array.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a career coach helping users build their professional vault. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse JSON from response
    let suggestions;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || [];
      } else {
        suggestions = [];
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      suggestions = [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-roadmap-suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, suggestions: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getSectionContext(sectionKey: string): string {
  const contexts: Record<string, string> = {
    power_phrases: 'Quantified achievements showing specific impact with metrics and results',
    transferable_skills: 'Concrete skills applicable across roles with evidence of proficiency',
    hidden_competencies: 'Inferred capabilities demonstrated through actions and outcomes',
    soft_skills: 'Interpersonal and professional soft skills with behavioral evidence',
    leadership_philosophy: 'Leadership approach, style, and guiding principles',
    executive_presence: 'Executive-level gravitas, communication, and strategic presence',
    personality_traits: 'Professional personality characteristics affecting work style',
    work_style: 'Preferred ways of working, collaboration, and task approach',
    values_motivations: 'Core professional values and career motivators',
    behavioral_indicators: 'Observable behaviors demonstrating professional qualities'
  };
  return contexts[sectionKey] || 'Professional career content';
}
