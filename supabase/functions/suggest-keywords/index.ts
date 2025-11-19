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
    const { content, itemType, industry, targetRole } = await req.json();

    console.log('Generating AI keyword suggestions for:', itemType);

    // Create keyword suggestion prompt
    const systemPrompt = `You are an ATS (Applicant Tracking System) expert and recruiter. Return ONLY valid JSON, no additional text or explanations.

Generate keywords that are:
1. Industry-relevant and current
2. ATS-friendly (commonly searched terms)
3. Action-oriented and impact-focused
4. Specific to the candidate's achievements
5. Aligned with target role requirements

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "primary_keywords": ["most important 3-5 keywords"],
  "secondary_keywords": ["supporting 3-5 keywords"],
  "skill_keywords": ["technical/tool keywords"],
  "action_keywords": ["power verbs and phrases"],
  "reasoning": "Why these keywords are effective"
}`;

    const userPrompt = `Suggest ATS-optimized keywords for this career item:

Content: "${content}"

Item Type: ${itemType}
Industry: ${industry || 'General'}
Target Role: ${targetRole || 'Not specified'}

Provide 10-15 total keywords across categories that will:
1. Match what recruiters search for
2. Highlight technical expertise
3. Emphasize leadership and impact
4. Use current industry terminology
5. Avoid buzzwords that lack substance

Focus on specificity and measurability.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      },
      "suggest-keywords",
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

    const keywords = parseResult.data;
    
    // Validate required fields
    if (!keywords.primary_keywords || !Array.isArray(keywords.primary_keywords)) {
      console.error('Missing or invalid primary_keywords:', keywords);
      throw new Error('AI response missing required field: primary_keywords array');
    }

    return new Response(
      JSON.stringify({
        success: true,
        keywords
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-keywords:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Keyword suggestion failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
