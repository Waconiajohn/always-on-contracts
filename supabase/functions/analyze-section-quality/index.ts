import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, PERPLEXITY_MODELS, cleanCitations } from '../_shared/ai-config.ts';
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

    const {
      content,
      requirements = [],
      atsKeywords = { critical: [], important: [], nice_to_have: [] },
      seniority = 'mid-level',
      industry = 'General',
      jobTitle = ''
    } = await req.json();

    if (!content) {
      throw new Error("Missing content parameter");
    }

    const prompt = `You are a Certified Professional Resume Writer analyzing a resume section.

SECTION CONTENT:
${content}

JOB REQUIREMENTS:
${requirements.slice(0, 15).join('\n- ')}

ATS KEYWORDS:
Critical (MUST include): ${atsKeywords.critical.join(', ')}
Important: ${atsKeywords.important.join(', ')}
Nice-to-have: ${atsKeywords.nice_to_have?.join(', ') || 'None'}

CANDIDATE PROFILE:
Seniority: ${seniority}
Industry: ${industry}
Target Role: ${jobTitle}

ANALYZE THE SECTION FOR:
1. **ATS Keyword Coverage**: Does it include critical keywords naturally? Are they used in context (not keyword stuffing)?
2. **Quantified Achievements**: Numbers, percentages, dollar amounts, team sizes, timeframes that demonstrate impact
3. **Impact Language**: Results-oriented phrases, business outcomes, value creation
4. **Action Verb Strength**: Industry-appropriate language that conveys authority and expertise
5. **Competitive Positioning**: What makes this candidate stand out from others with similar backgrounds?

CRITICAL INSTRUCTIONS:
- DO NOT use hardcoded word lists or pattern matching
- Understand CONTEXT: "Stewarded $350MM budget" = management experience (oil & gas industry)
- "Guided drilling operations" = leadership (not just "led" or "managed")
- Evaluate based on INDUSTRY STANDARDS for ${industry}
- ${seniority} professionals use different language than entry-level candidates
- Focus on AUTHENTICITY and BUSINESS IMPACT, not arbitrary rules

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": 85,
  "atsMatchPercentage": 90,
  "requirementsCoverage": 80,
  "competitiveStrength": 4,
  "strengths": [
    "Specific strength with example from the content",
    "Another strength with quantified evidence"
  ],
  "weaknesses": [
    "Specific weakness with improvement suggestion",
    "Another weakness with actionable fix"
  ],
  "keywordsMatched": ["keyword1", "keyword2"],
  "keywordsMissing": ["keyword3", "keyword4"],
  "aiReasoning": "Detailed explanation of why this score was given, focusing on industry context and competitive positioning",
  "industryContext": "How this compares to industry standards for ${industry} ${seniority} professionals"
}`;

    // Use smart model selection
    const model = selectOptimalModel({
      taskType: 'analysis',
      complexity: 'medium',
      requiresReasoning: true,
      estimatedInputTokens: Math.ceil(content.length / 4) + 300,
      estimatedOutputTokens: 600
    });

    console.log(`[analyze-section-quality] Using model: ${model}`);

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are a Certified Professional Resume Writer with expertise in ATS optimization and executive career positioning. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model,
        temperature: 0.2,
        max_tokens: 1200,
        return_citations: false,
      },
      'analyze-section-quality',
      user.id
    );

    await logAIUsage(metrics);

    const content_text = cleanCitations(response.choices[0].message.content);

    console.log("AI response:", content_text);

    // Extract JSON from response
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    const scoring = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!scoring) {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(scoring), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-section-quality:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
