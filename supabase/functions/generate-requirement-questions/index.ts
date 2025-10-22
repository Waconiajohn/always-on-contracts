import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    const { requirement, vaultMatches, matchStatus, jobContext } = await req.json();

    console.log("Generating clarifying questions for:", { requirement, matchStatus });

    // If perfect match, return minimal or no questions
    if (matchStatus === 'perfect_match') {
      return new Response(
        JSON.stringify({
          questions: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a resume expert helping generate clarifying questions.

REQUIREMENT: ${requirement}
MATCH STATUS: ${matchStatus}
VAULT MATCHES: ${JSON.stringify(vaultMatches)}
JOB CONTEXT: ${JSON.stringify(jobContext)}

Generate 2-4 multiple choice questions to help the user provide context for this requirement.
Questions should be quick to answer and help bridge the gap between what they have and what's needed.

For each question:
1. Make it specific and actionable
2. Provide 3-4 realistic multiple choice options
3. Include a "Let me explain..." option for voice input
4. Focus on quantifiable details (amounts, scope, timeframes)

Return ONLY a JSON object with this structure:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text here?",
      "type": "multiple_choice",
      "options": [
        {"value": "option1", "label": "Detailed option 1"},
        {"value": "option2", "label": "Detailed option 2"},
        {"value": "option3", "label": "Detailed option 3"},
        {"value": "voice", "label": "Let me explain in my own words"}
      ]
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("AI response:", content);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-requirement-questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
