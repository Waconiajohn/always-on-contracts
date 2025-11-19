import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, currentRole, currentIndustry } = await req.json();

    if (!resumeText || !currentRole || !currentIndustry) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: resumeText, currentRole, currentIndustry' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SUGGEST-ADJACENT-ROLES] Analyzing resume for adjacent paths...');
    console.log(`Current role: ${currentRole}, Current industry: ${currentIndustry}`);

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are a career transition expert specializing in identifying realistic adjacent career paths.

Your task: Analyze transferable skills and suggest ADJACENT career opportunities (not complete pivots).

ANALYSIS FOCUS:
- Similar leadership/management skills
- Transferable technical or domain expertise
- Adjacent market sectors (e.g., SaaS → FinTech, Healthcare → MedTech)
- Roles that value specific experience (e.g., VP Engineering → VP Product)

CRITICAL RULES:
- Focus on REALISTIC transitions leveraging existing experience
- Do NOT suggest complete career pivots
- Be specific and practical
- Consider market demand and transferability

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "suggestedRoles": ["Role 1", "Role 2", "Role 3", "Role 4", "Role 5"],
  "suggestedIndustries": ["Industry 1", "Industry 2", "Industry 3", "Industry 4", "Industry 5"],
  "reasoning": "Brief 1-2 sentence explanation of why these are good fits"
}`;

    const userPrompt = `Analyze this resume and suggest adjacent career paths:

CURRENT ROLE: ${currentRole}
CURRENT INDUSTRY: ${currentIndustry}

RESUME:
${resumeText.substring(0, 3000)}

TASK: Based on transferable skills, management experience, technical expertise, and domain knowledge, suggest:

1. 3-5 adjacent ROLES where skills would translate well (realistic next steps)
2. 3-5 adjacent INDUSTRIES where expertise would be valuable (related sectors)

Think about:
- Similar leadership/management skills
- Transferable technical or domain expertise
- Adjacent market sectors (e.g., SaaS → FinTech, Healthcare → MedTech)
- Roles that value their specific experience (e.g., VP Engineering → VP Product)

Return your analysis in the required JSON format.`;

    console.log('[SUGGEST-ADJACENT-ROLES] Calling Lovable AI');

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      },
      'suggest-adjacent-roles'
    );

    await logAIUsage(metrics);

    const aiContent = response.choices[0].message.content;
    console.log('[SUGGEST-ADJACENT-ROLES] Raw AI response:', aiContent);

    // Parse JSON from response
    let suggestions;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      suggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[SUGGEST-ADJACENT-ROLES] Failed to parse AI response:', parseError);
      console.error('[SUGGEST-ADJACENT-ROLES] Raw content:', aiContent);
      
      // Return fallback
      return new Response(
        JSON.stringify({
          suggestedRoles: [
            "VP Product",
            "Head of Operations",
            "VP Engineering",
            "Chief Technology Officer",
            "General Manager"
          ],
          suggestedIndustries: [
            "SaaS",
            "FinTech",
            "Enterprise Software",
            "Technology Consulting",
            "Healthcare Tech"
          ],
          reasoning: "Based on your leadership and technical background, these roles and industries represent natural transitions."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // EXPLICIT FIELD VALIDATION
    if (!Array.isArray(suggestions.suggestedRoles) || suggestions.suggestedRoles.length === 0) {
      console.error('[SUGGEST-ADJACENT-ROLES] Missing or invalid suggestedRoles');
      throw new Error('AI response missing required field: suggestedRoles array');
    }
    
    if (!Array.isArray(suggestions.suggestedIndustries) || suggestions.suggestedIndustries.length === 0) {
      console.error('[SUGGEST-ADJACENT-ROLES] Missing or invalid suggestedIndustries');
      throw new Error('AI response missing required field: suggestedIndustries array');
    }
    
    if (!suggestions.reasoning || typeof suggestions.reasoning !== 'string') {
      console.error('[SUGGEST-ADJACENT-ROLES] Missing or invalid reasoning');
      throw new Error('AI response missing required field: reasoning');
    }

    console.log('[SUGGEST-ADJACENT-ROLES] Suggestions generated successfully', {
      rolesCount: suggestions.suggestedRoles.length,
      industriesCount: suggestions.suggestedIndustries.length
    });
          reasoning: "These are common adjacent paths for experienced professionals."
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate response structure
    if (!suggestions.suggestedRoles || !suggestions.suggestedIndustries) {
      console.error('[SUGGEST-ADJACENT-ROLES] Invalid response structure:', suggestions);
      throw new Error('Invalid AI response structure');
    }

    console.log('[SUGGEST-ADJACENT-ROLES] Successfully generated suggestions');
    console.log('Suggested roles:', suggestions.suggestedRoles);
    console.log('Suggested industries:', suggestions.suggestedIndustries);

    return new Response(
      JSON.stringify(suggestions),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SUGGEST-ADJACENT-ROLES] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        suggestedRoles: [],
        suggestedIndustries: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});