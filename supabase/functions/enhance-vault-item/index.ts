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
    const systemPrompt = `You are an elite executive career coach and resume strategist. You MUST return ONLY valid JSON with no markdown formatting, no code blocks, no explanations - just the raw JSON object.

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

CRITICAL: Return ONLY raw JSON (no markdown, no code blocks), exactly this structure:
{
  "enhanced_content": "The improved version",
  "new_tier": "gold",
  "reasoning": "Why this is better (one sentence)",
  "suggested_keywords": ["keyword1", "keyword2", "keyword3"],
  "improvements_made": ["improvement1", "improvement2"],
  "analysis_steps": ["step1", "step2", "step3"]
}`;

    const userPrompt = `Current Item (${currentTier} tier):
"${currentContent}"

Item Type: ${itemType}${formatInstruction}${keywordInstruction}

${itemSubtype === 'skill' 
  ? `Enhance this SKILL name to ${targetTier} tier quality. Keep it SHORT (2-5 words max). Just refine the terminology - make it more precise, industry-standard, or impactful. DO NOT turn it into a sentence.` 
  : `Enhance this to ${targetTier} tier quality. Add strategic context, quantifiable metrics, and stronger language. Make it compelling and achievement-focused.`}

Also suggest 3-5 relevant ATS keywords.`;

    // USE GEMINI 3.0 PRO (PREMIUM)
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.7,
        max_tokens: 1000
      },
      "enhance-vault-item",
      undefined
    );

    await logAIUsage(metrics);

    // Extract content from response
    let content = response.choices[0].message.content;
    if (!content) {
      console.error('No content in response:', response);
      throw new Error('AI did not return content');
    }

    // Clean markdown code blocks if present
    content = content.trim();
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    const enhancement = JSON.parse(content);
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
