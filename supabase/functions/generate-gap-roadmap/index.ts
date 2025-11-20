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
    const systemPrompt = `You are an intelligent career vault coach integrated into an AI-powered platform. Return ONLY valid JSON, no additional text or explanations.

CONTEXT: This platform has AI-powered tools to analyze resumes, extract skills, and intelligently suggest content. Users don't need to manually research job descriptions or create spreadsheets - the AI does that for them.

Create a personalized action roadmap focused on REFLECTIVE QUESTIONS that help users remember and articulate their existing experience, NOT manual research tasks.

For each priority item, provide:
1. Reflective questions that trigger memory recall
2. Specific examples of what to look for in their own experience
3. Realistic time estimates (5-15 minutes for most tasks)
4. Clear success criteria

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "roadmap": [
    {
      "priority": 1,
      "title": "Short action title focused on recalling/articulating",
      "description": "What to reflect on or articulate from your experience",
      "goal": "Specific target (e.g., 'Add 5 quantified achievements')",
      "impact": "How this strengthens your vault",
      "estimatedTime": "10-15 min",
      "current": 5,
      "target": 10,
      "suggestedActions": ["Reflective question 1", "Reflective question 2", "Reflective question 3"],
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

Generate 2-3 prioritized action items to close this gap. Each action should:
- Use REFLECTIVE QUESTIONS that help users remember their own experience
- NOT suggest manual research, browsing job boards, or creating spreadsheets
- Focus on articulating existing experience they may have forgotten
- Include realistic time estimates (most tasks: 10-15 minutes)
- Provide 2-3 keywords relevant to this vault section

Examples of GOOD suggestedActions:
✅ "Think of a time you reduced costs or saved time - how much exactly?"
✅ "What's the largest team or budget you've managed? Estimate the dollar amount."
✅ "List 3 technical tools you use weekly that aren't in your vault yet"

Examples of BAD suggestedActions (NEVER use these):
❌ "Browse 10-15 job descriptions on LinkedIn"
❌ "Create a spreadsheet to track skills"
❌ "Research company career pages"
❌ "Review 12 job descriptions to identify emerging technologies"

Focus on quick, reflective actions that help users articulate what they already know.`;

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
