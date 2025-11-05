import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('analyze-linkedin-writing');
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { content, seniority = 'mid-level', industry = 'General' } = await req.json();

    if (!content) {
      throw new Error("Missing content parameter");
    }

    const prompt = `You are a LinkedIn engagement expert analyzing post quality for ${seniority} professionals in ${industry}.

CONTENT TO ANALYZE:
${content}

ANALYZE FOR EXECUTIVE-LEVEL LINKEDIN POSTS:
1. **Authenticity**: Does this sound human and genuine, or corporate/robotic? Context matters!
2. **Engagement Potential**: Likely to get comments/shares? Is there a conversation starter?
3. **Clarity**: One clear idea per sentence? Easy to skim and understand?
4. **Professional Tone**: Appropriate for ${seniority} ${industry} professionals?
5. **Call-to-Action Effectiveness**: Does it encourage interaction?

CRITICAL INSTRUCTIONS:
- DO NOT use hardcoded "forbidden word" lists
- "Leverage," "synergy," "holistic" are NOT automatically bad
- Oil & Gas executives use different language than tech founders
- Judge based on AUDIENCE ENGAGEMENT POTENTIAL and industry norms
- Consider CONTEXT: Professional terms are appropriate when used authentically
- ${seniority} professionals have different tone expectations than junior staff

SCORING GUIDELINES:
- 85-100: Highly engaging, authentic, clear call-to-action
- 70-84: Good but could improve engagement or clarity
- 50-69: Needs work on authenticity or structure
- Below 50: Major issues with tone, clarity, or engagement

Return ONLY a valid JSON object:
{
  "overallScore": 85,
  "authenticity": {
    "score": 90,
    "reasoning": "Sounds authentic because... OR feels robotic because..."
  },
  "clarity": {
    "score": 80,
    "issues": ["Sentence 2 tries to convey 3 ideas at once"],
    "suggestions": ["Break into: Idea 1. Then Idea 2. Finally Idea 3."]
  },
  "engagement": {
    "score": 85,
    "hasCTA": true,
    "ctaQuality": "Question is specific and thought-provoking"
  },
  "tone": {
    "score": 90,
    "appropriate": true,
    "reasoning": "Matches ${seniority} professional standards for ${industry}"
  },
  "improvements": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2"
  ],
  "industryContext": "How this compares to high-performing posts in ${industry}"
}`;

    // Use smart model selection - this is a simple task
    const model = selectOptimalModel({
      taskType: 'analysis',
      complexity: 'low',
      requiresReasoning: false,
      estimatedInputTokens: Math.ceil(content.length / 4) + 200,
      estimatedOutputTokens: 500
    });

    console.log(`[analyze-linkedin-writing] Using model: ${model}`);

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are a LinkedIn engagement expert. Analyze content based on engagement potential and authenticity, not arbitrary word bans. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model,
        temperature: 0.3,
        max_tokens: 800,
        return_citations: false,
      },
      'analyze-linkedin-writing',
      user.id
    );

    await logAIUsage(metrics);

    const content_text = cleanCitations(response.choices[0].message.content);

    console.log("AI LinkedIn analysis:", content_text);

    // Extract JSON from response
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!analysis) {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-linkedin-writing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
