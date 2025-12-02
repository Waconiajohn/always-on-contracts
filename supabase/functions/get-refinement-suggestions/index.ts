/**
 * Get Refinement Suggestions Edge Function
 * Provides sophisticated editing suggestions for resume bullets
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      bulletText,
      jobDescription,
      resumeContext,
      confidence,
      originalText,
      userId
    } = await req.json();

    console.log('🔍 Getting refinement suggestions for bullet');

    const prompt = `You are an expert resume optimizer. Analyze this resume bullet and provide sophisticated refinement suggestions.

CURRENT BULLET:
"${bulletText}"

CONFIDENCE LEVEL: ${confidence}
${originalText ? `ORIGINAL RESUME TEXT: "${originalText}"` : ''}

JOB DESCRIPTION (key requirements):
${jobDescription.substring(0, 1500)}

${resumeContext ? `CANDIDATE'S FULL BACKGROUND:
${resumeContext.substring(0, 1000)}` : ''}

PROVIDE:

1. MISSING KEYWORDS: What critical keywords from the job description should be added?
2. LIKE-KIND EXPERIENCE: Can we leverage similar experience they have to address gaps?
   Example: "They have HubSpot experience but job wants Salesforce. Suggest: 'Expert in HubSpot CRM with strong foundation for Salesforce adoption'"
3. ALTERNATIVE VERSIONS: Provide 3 versions:
   - Conservative: Minor improvements
   - Moderate: Keyword optimization
   - Aggressive: Maximum ATS impact
4. COMPARISON: Show original vs enhanced side-by-side
5. GAP FILLING GUIDANCE: If confidence is "invented", explain how to personalize it

Return JSON:
{
  "keywordsToAdd": [
    { "keyword": "Python", "relevance": "critical", "context": "where it fits naturally", "prevalence": "mentioned 5 times in JD" }
  ],
  "likeKindSuggestions": [
    {
      "candidateHas": "HubSpot CRM",
      "jobRequires": "Salesforce",
      "suggestion": "Expert in HubSpot CRM, providing strong foundation for Salesforce adoption",
      "reasoning": "Both enterprise CRM platforms with similar workflows"
    }
  ],
  "alternativeVersions": {
    "conservative": "Slightly improved version...",
    "moderate": "Keyword-optimized version...",
    "aggressive": "Maximum ATS optimized version..."
  },
  "comparison": {
    "original": "What they originally had",
    "enhanced": "Current AI version",
    "differences": ["Added metrics", "Stronger action verb", "Included keywords"]
  },
  "gapFillingGuidance": "If invented: How to personalize this with real details...",
  "metricsToAdd": ["Specific numbers to strengthen impact"]
}`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.FAST,
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    }, 'get-refinement-suggestions', userId);

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    let suggestions;
    
    try {
      suggestions = JSON.parse(rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch (parseError) {
      console.error('Failed to parse suggestions:', parseError);
      throw new Error('Failed to parse refinement suggestions');
    }

    console.log('✅ Refinement suggestions generated');

    return new Response(
      JSON.stringify({
        success: true,
        suggestions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in get-refinement-suggestions:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
