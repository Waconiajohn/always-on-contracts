import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, PERPLEXITY_MODELS, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { keywords, resumeContent } = await req.json();

    if (!keywords || !resumeContent) {
      throw new Error("Missing required parameters");
    }

    const prompt = `Analyze this resume content against the required keywords and provide a detailed scoring:

REQUIRED KEYWORDS: ${keywords.join(", ")}

RESUME CONTENT:
Executive Summary: ${resumeContent.executive_summary || ""}
Key Achievements: ${resumeContent.key_achievements?.join("; ") || ""}
Core Competencies: ${resumeContent.core_competencies?.join(", ") || ""}

TASK:
1. Check which keywords appear in the resume (exact match or close variants)
2. Calculate coverage percentage
3. Identify missing critical keywords
4. Provide specific suggestions for improvement

Return ONLY a JSON object with this structure:
{
  "coverage_score": 85,
  "keywords_found": ["keyword1", "keyword2"],
  "keywords_missing": ["keyword3", "keyword4"],
  "keyword_coverage": {
    "keyword1": {"found": true, "context": "where it was found"},
    "keyword2": {"found": false, "suggestion": "how to add it"}
  },
  "improvement_suggestions": [
    "Specific suggestion 1",
    "Specific suggestion 2"
  ]
}`;

    console.log("Calling Perplexity for resume scoring...");

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.2,
        max_tokens: 2000,
        return_citations: false,
      },
      'score-resume-match',
      user.id
    );

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);

    console.log("AI response:", content);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const scoring = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!scoring) {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(scoring), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in score-resume-match:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
