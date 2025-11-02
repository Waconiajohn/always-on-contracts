import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    // LinkedIn algorithm expert persona
    const systemPrompt = `You are a LinkedIn algorithm expert and viral content analyst with deep understanding of 2025 engagement mechanics.

SCORING FRAMEWORK (100 points total):

1. HOOK STRENGTH (0-25 points):
   - First 150 characters analysis
   - Pattern interruption effectiveness
   - Scroll-stopping power
   - Clarity vs. curiosity balance
   
2. VALUE DENSITY (0-25 points):
   - Actionable insights per 100 words
   - Specificity and concreteness
   - Practical applicability
   - Depth of expertise demonstrated

3. READABILITY (0-20 points):
   - Paragraph length (1-2 sentences ideal)
   - White space utilization
   - Sentence structure variety
   - Visual scannability

4. CTA EFFECTIVENESS (0-15 points):
   - Specificity of question/ask
   - Engagement invitation quality
   - Value proposition clarity
   - Conversion potential

5. HASHTAG RELEVANCE (0-15 points):
   - Quantity (3-5 optimal)
   - Mix of popular + niche
   - Industry relevance
   - Search optimization

ENGAGEMENT PREDICTION ALGORITHM:
- Calculate weighted score across dimensions
- Factor in content length appropriateness
- Consider audience targeting clarity
- Assess shareability quotient

OUTPUT REQUIREMENTS:
Return JSON with:
{
  "overallScore": 0-100,
  "hookStrength": { "score": 0-25, "feedback": "Specific assessment" },
  "valueDensity": { "score": 0-25, "feedback": "Specific assessment" },
  "readability": { "score": 0-20, "feedback": "Specific assessment" },
  "ctaEffectiveness": { "score": 0-15, "feedback": "Specific assessment" },
  "hashtagRelevance": { "score": 0-15, "feedback": "Specific assessment" },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": [
    { "priority": "high|medium|low", "suggestion": "Specific actionable fix", "impact": "Expected improvement" }
  ],
  "predictedReach": "Estimated impressions and reasoning",
  "viralPotential": "low | medium | high | exceptional with justification",
  "rewriteSuggestions": {
    "improvedHook": "Rewritten first 150 chars",
    "strongerCTA": "Rewritten ending"
  }
}`;

    const userPrompt = `Analyze this LinkedIn post for engagement potential:

POST CONTENT:
${content}

Provide comprehensive scoring across all dimensions with specific, actionable feedback.`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 1500,
        return_citations: false,
      },
      'analyze-linkedin-content'
    );

    await logAIUsage(metrics);

    const analysisResult = cleanCitations(response.choices[0].message.content);

    // Parse JSON from response
    let parsedAnalysis;
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      parsedAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResult);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      parsedAnalysis = {
        overallScore: 50,
        hookStrength: { score: 12, feedback: "Analysis unavailable" },
        valueDensity: { score: 12, feedback: "Analysis unavailable" },
        readability: { score: 10, feedback: "Analysis unavailable" },
        ctaEffectiveness: { score: 8, feedback: "Analysis unavailable" },
        hashtagRelevance: { score: 8, feedback: "Analysis unavailable" },
        strengths: [],
        improvements: [],
        predictedReach: "Unable to estimate",
        viralPotential: "medium"
      };
    }

    return new Response(JSON.stringify(parsedAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-linkedin-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
