import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { resumeAnalysis, currentPositions } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Based on this resume analysis, suggest 5 relevant job titles for contract/interim executive positions that this person should target. 

Resume Analysis:
- Years of Experience: ${resumeAnalysis.years_experience}
- Current Positions They're Targeting: ${currentPositions?.join(", ") || "None yet"}
- Skills: ${resumeAnalysis.skills?.join(", ")}
- Industry Expertise: ${resumeAnalysis.industry_expertise?.join(", ")}
- Management Capabilities: ${resumeAnalysis.management_capabilities?.join(", ")}

IMPORTANT: Only suggest NEW job titles that are NOT already in their current list. Suggest titles that are similar but different variations, related senior roles, or adjacent positions that leverage their skills.

Return ONLY a JSON array of 5 job title strings, nothing else. Example format:
["Chief Financial Officer", "Interim CFO", "VP of Finance", "Director of Financial Planning", "Controller"]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON array from the response
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error("Failed to parse job titles from AI response");
    }
    
    const titles = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ titles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-job-titles:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
