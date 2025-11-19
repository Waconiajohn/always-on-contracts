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
    const { itemId, itemType, currentContent, currentTier, vaultId, additionalKeywords } = await req.json();

    console.log('Enhancing vault item:', { itemId, itemType, currentTier, additionalKeywords });

    // Determine target tier
    const tierProgression: Record<string, string> = {
      'assumed': 'bronze',
      'bronze': 'silver',
      'silver': 'gold',
      'gold': 'gold'
    };
    const targetTier = tierProgression[currentTier || 'assumed'];

    // Build keyword instruction
    const keywordInstruction = additionalKeywords && additionalKeywords.length > 0
      ? `\n\nIMPORTANT: Incorporate these specific keywords naturally: ${additionalKeywords.join(', ')}`
      : '';

    // Create enhancement prompt
    const systemPrompt = `You are an expert career coach and resume writer. Return ONLY valid JSON, no additional text or explanations.

Quality Tiers:
- GOLD: Includes strategic context, measurable impact metrics, and strong action verbs. Shows enterprise-wide influence.
- SILVER: Good quality with clear achievements, but could add more context or quantification.
- BRONZE: Basic statement that lacks metrics or strategic context.
- ASSUMED: Unverified or vague content that needs validation.

Guidelines for Enhancement:
1. Add specific metrics and percentages where possible
2. Include strategic business context (cost savings, efficiency gains, etc.)
3. Use strong action verbs (Led, Drove, Optimized, etc.)
4. Show scope and scale (team size, project budget, geographic reach)
5. Demonstrate impact beyond immediate role

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "enhanced_content": "The improved version",
  "new_tier": "gold" | "silver" | "bronze",
  "reasoning": "Why this is better (one sentence)",
  "suggested_keywords": ["keyword1", "keyword2", "keyword3"],
  "improvements_made": ["improvement1", "improvement2"]
}`;

    const userPrompt = `Current Item (${currentTier} tier):
"${currentContent}"

Item Type: ${itemType}${keywordInstruction}

Enhance this to ${targetTier} tier quality. Add strategic context, quantifiable metrics, and stronger language. Make it compelling and achievement-focused. Also suggest 3-5 relevant ATS keywords.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.BALANCED,
        temperature: 0.7,
        max_tokens: 1000,
        tools: [
          {
            type: "function",
            function: {
              name: "enhance_vault_item",
              description: "Return the enhanced vault item with improvements",
              parameters: {
                type: "object",
                properties: {
                  enhanced_content: { type: "string" },
                  new_tier: { type: "string", enum: ["gold", "silver", "bronze"] },
                  reasoning: { type: "string" },
                  suggested_keywords: { type: "array", items: { type: "string" } },
                  improvements_made: { type: "array", items: { type: "string" } }
                },
                required: ["enhanced_content", "new_tier", "reasoning", "suggested_keywords", "improvements_made"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "enhance_vault_item" } }
      },
      "enhance-vault-item",
      undefined
    );

    await logAIUsage(metrics);

    // Extract from tool call response
    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', response);
      throw new Error('AI did not return a tool call response');
    }

    const enhancement = JSON.parse(toolCall.function.arguments);
    console.log('[enhance-vault-item] Parsed enhancement:', enhancement);
    
    // Validate required fields
    if (!enhancement.enhanced_content || !enhancement.new_tier) {
      console.error('Missing required fields in enhancement:', enhancement);
      throw new Error('AI response missing required fields: enhanced_content or new_tier');
    }

    return new Response(
      JSON.stringify({
        success: true,
        enhancement
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-vault-item:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Enhancement failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
