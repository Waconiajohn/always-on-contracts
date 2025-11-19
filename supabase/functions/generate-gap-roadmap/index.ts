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
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.8,
        max_tokens: 2000,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_roadmap",
              description: "Generate a personalized action roadmap to close gaps",
              parameters: {
                type: "object",
                properties: {
                  roadmap: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "number" },
                        title: { type: "string" },
                        description: { type: "string" },
                        goal: { type: "string" },
                        impact: { type: "string" },
                        estimatedTime: { type: "string" },
                        current: { type: "number" },
                        target: { type: "number" },
                        suggestedActions: { type: "array", items: { type: "string" } },
                        suggested_keywords: { type: "array", items: { type: "string" } }
                      },
                      required: ["priority", "title", "description", "goal", "impact", "estimatedTime", "current", "target", "suggestedActions", "suggested_keywords"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["roadmap"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_roadmap" } }
      },
      "generate-gap-roadmap",
      undefined
    );

    await logAIUsage(metrics);

    // Extract from tool call response
    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', response);
      throw new Error('AI did not return a tool call response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('[generate-gap-roadmap] Parsed roadmap:', result);
    
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
