import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roadmapItem, sectionKey, resumeId, currentItems } = await req.json();

    // Analyze current items to avoid duplicates
    const existingContent = currentItems.map((item: any) => 
      item.power_phrase || item.stated_skill || item.inferred_capability || item.skill_name || ''
    );

    // Create context-specific prompt
    const sectionContext = getSectionContext(sectionKey);
    const systemPrompt = `You are a career coach helping users build their professional Master Resume. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanations - just the raw JSON object.`;
    
    const userPrompt = `You are helping a user improve their Master Resume for the "${sectionKey}" section.

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

CRITICAL: Return ONLY raw JSON (no markdown, no code blocks), exactly this structure:
{
  "suggestions": [
    {
      "content": "text",
      "qualityTier": "gold",
      "reasoning": "text",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 2000
      },
      "generate-roadmap-suggestions",
      undefined
    );

    await logAIUsage(metrics);

    let content = response.choices[0].message.content;
    if (!content) {
      throw new Error('AI did not return content');
    }
    
    // Parse JSON from response, handle markdown code blocks
    content = content.trim();
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }
    
    let suggestions;
    try {
      const parsed = JSON.parse(content);
      suggestions = parsed.suggestions || [];
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
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
