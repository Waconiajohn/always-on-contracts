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

    const { requirement, vaultMatches, answers, voiceContext, jobContext, matchStatus } = await req.json();

    console.log("Generating options for:", { requirement, matchStatus, hasVoiceContext: !!voiceContext });

    // Determine number of options based on complexity
    let numOptions = 3;
    if (matchStatus === 'perfect_match') {
      numOptions = 2; // Simple case
    } else if (matchStatus === 'complete_gap' || Object.keys(answers || {}).length > 3) {
      numOptions = 4; // Complex case
    }

    const prompt = `You are a resume expert creating multiple strategic options to address a job requirement.

REQUIREMENT: ${requirement}
MATCH STATUS: ${matchStatus}
VAULT MATCHES: ${JSON.stringify(vaultMatches)}
USER ANSWERS: ${JSON.stringify(answers)}
VOICE CONTEXT: ${voiceContext || 'None provided'}
JOB CONTEXT: ${JSON.stringify(jobContext)}

Generate ${numOptions} different creative options to address this requirement. Each option should:
1. Use different strategic framing (aggregate, range, specific example, career trajectory, etc.)
2. Incorporate the user's vault data and clarification answers
3. Include relevant ATS keywords
4. Be truthful while positioning the candidate optimally
5. Be 1-3 sentences of resume-quality content

For each option, explain:
- The strategic approach (why this framing works)
- Keywords included
- What it addresses
- Any considerations/tradeoffs

Return ONLY a JSON object with this structure:
{
  "options": [
    {
      "content": "The actual resume content here...",
      "approach": "Strategic framing used (e.g., 'Aggregate Approach', 'Range with Example')",
      "reasoning": "Why this option works and what it addresses",
      "keywords": ["keyword1", "keyword2"],
      "strength": "Main strength of this approach",
      "consideration": "Any tradeoff or consideration"
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
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { options: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-requirement-options:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
