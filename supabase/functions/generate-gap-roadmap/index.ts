import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, sectionKey, benchmarkData, currentItems } = await req.json();

    console.log('Generating gap roadmap for:', sectionKey);

    // Create roadmap prompt
    const systemPrompt = `You are a career development strategist. Return ONLY valid JSON, no additional text or explanations.

Create a personalized action roadmap to help users close gaps between their current career vault and benchmark standards.

For each priority item, provide:
1. Specific, actionable steps
2. Estimated time to complete
3. Impact on benchmark score
4. Clear success criteria

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "roadmap": [
    {
      "priority": 1,
      "title": "Short action title",
      "description": "What this involves",
      "goal": "Specific target",
      "impact": "How this helps",
      "estimatedTime": "2-4 hours",
      "current": 5,
      "target": 10,
      "suggestedActions": ["action1", "action2", "action3"],
      "suggested_keywords": ["keyword1", "keyword2"]
    }
  ]
}`;

    const gap = benchmarkData.target - benchmarkData.current;
    const percentage = benchmarkData.percentage;

    const userPrompt = `Create a personalized roadmap for ${sectionKey}:

Current Status:
- You have: ${benchmarkData.current} items
- Benchmark: ${benchmarkData.target} items
- Gap: ${gap} items needed
- Progress: ${percentage}%

Section: ${sectionKey}

Generate 3-5 prioritized action items to close this gap. Each action should include:
- Specific steps to take
- Suggested questions to help discover hidden content
- Time estimate
- Impact on overall score
- 2-3 AI-suggested keywords for each action

Focus on quick wins and high-impact actions first.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.8,
        max_tokens: 2000,
        response_mime_type: "application/json"
      },
      "generate-gap-roadmap",
      undefined
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    console.log('Raw AI response:', rawContent.substring(0, 500));
    
    const parseResult = extractJSON(rawContent);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('JSON parse failed:', parseResult.error);
      console.error('Full response:', rawContent);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const result = parseResult.data;
    
    // Validate required fields
    if (!result.roadmap || !Array.isArray(result.roadmap)) {
      console.error('Missing or invalid roadmap array:', result);
      throw new Error('AI response missing required field: roadmap array');
    }

    return new Response(
      JSON.stringify({
        success: true,
        roadmap: result.roadmap
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gap-roadmap:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Roadmap generation failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
