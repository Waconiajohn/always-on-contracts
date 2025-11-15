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

    const prompt = `You are a career transition expert. Analyze this resume and suggest ADJACENT career paths.

Current Role: ${currentRole}
Current Industry: ${currentIndustry}

Resume:
${resumeText.substring(0, 3000)}

Based on this person's transferable skills, management experience, technical expertise, and domain knowledge, suggest:

1. 3-5 adjacent ROLES where their skills would translate well (not complete career pivots, but realistic next steps)
2. 3-5 adjacent INDUSTRIES where their expertise would be valuable (related sectors, not unrelated fields)

Focus on REALISTIC transitions that leverage existing experience. Think about:
- Similar leadership/management skills
- Transferable technical or domain expertise
- Adjacent market sectors (e.g., SaaS → FinTech, Healthcare → MedTech)
- Roles that value their specific experience (e.g., VP Engineering → VP Product)

Return ONLY a JSON object with this structure:
{
  "suggestedRoles": ["Role 1", "Role 2", "Role 3", "Role 4", "Role 5"],
  "suggestedIndustries": ["Industry 1", "Industry 2", "Industry 3", "Industry 4", "Industry 5"],
  "reasoning": "Brief 1-2 sentence explanation of why these are good fits"
}

Be specific and realistic. Do not suggest complete career pivots.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: 'You are a career transition expert who helps people identify realistic adjacent career paths based on transferable skills. Always return valid JSON.' },
          { role: 'user', content: prompt }
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
      // Try to extract JSON from markdown code blocks if present
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