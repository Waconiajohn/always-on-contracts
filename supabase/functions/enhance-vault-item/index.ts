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
    const { itemId, itemType, currentContent, currentTier, vaultId, additionalKeywords, itemSubtype } = await req.json();

    console.log('Enhancing vault item:', { itemId, itemType, currentTier, additionalKeywords, itemSubtype });

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

    // Build format instruction based on item subtype
    const formatInstruction = itemSubtype === 'skill'
      ? `\n\nCRITICAL FORMAT REQUIREMENT: This is a SKILL (not expertise). Keep it SHORT - maximum 2-5 words. DO NOT write full sentences. Examples: "Lateral Drilling", "HPHT Operations", "Wellbore Design". Just refine the wording, don't expand it into a sentence.`
      : '';

    // Create enhancement prompt
    const systemPrompt = `You are an elite executive career coach and resume strategist.

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
5. Demonstrate impact beyond immediate role`;

    const userPrompt = `Current Item (${currentTier} tier):
"${currentContent}"

Item Type: ${itemType}${formatInstruction}${keywordInstruction}

${itemSubtype === 'skill' 
  ? `Enhance this SKILL name to ${targetTier} tier quality. Keep it SHORT (2-5 words max). Just refine the terminology - make it more precise, industry-standard, or impactful. DO NOT turn it into a sentence.` 
  : `Enhance this to ${targetTier} tier quality. Add strategic context, quantifiable metrics, and stronger language. Make it compelling and achievement-focused.`}

Also suggest 3-5 relevant ATS keywords.`;

    // USE GEMINI 2.5 FLASH (DEFAULT) with tool calling for structured output
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 1000,
        tools: [{
          type: "function",
          function: {
            name: "enhance_content",
            description: "Return the enhanced content with quality improvements",
            parameters: {
              type: "object",
              properties: {
                enhanced_content: {
                  type: "string",
                  description: "The improved version of the content"
                },
                new_tier: {
                  type: "string",
                  enum: ["gold", "silver", "bronze", "assumed"],
                  description: "The quality tier of the enhanced content"
                },
                reasoning: {
                  type: "string",
                  description: "Why this is better (one sentence)"
                },
                suggested_keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 relevant ATS keywords"
                },
                improvements_made: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of specific improvements made"
                },
                analysis_steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "Steps taken to analyze and enhance"
                }
              },
              required: ["enhanced_content", "new_tier", "reasoning", "suggested_keywords", "improvements_made", "analysis_steps"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "enhance_content" } }
      },
      "enhance-vault-item",
      undefined
    );

    await logAIUsage(metrics);

    // Extract structured output from tool call
    console.log('[enhance-vault-item] Full AI response:', JSON.stringify(response, null, 2));
    
    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('[enhance-vault-item] No tool calls in response. Message:', response.choices[0]?.message);
      throw new Error('AI did not return tool calls. This may be a model compatibility issue.');
    }
    
    if (toolCall.function.name !== "enhance_content") {
      console.error('[enhance-vault-item] Wrong tool call name:', toolCall.function.name);
      throw new Error(`AI returned wrong tool: ${toolCall.function.name}`);
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
