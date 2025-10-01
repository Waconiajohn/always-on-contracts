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
    const { resumeAnalysis, currentAchievements } = await req.json();

    const prompt = `Based on this resume analysis, suggest 3-5 additional key achievements that would be compelling for contract/interim executive positions.

Resume Details:
- Experience: ${resumeAnalysis.years_experience} years
- Current Achievements: ${currentAchievements?.join(", ") || "None listed"}
- Skills: ${resumeAnalysis.skills?.join(", ") || "Not specified"}
- Industries: ${resumeAnalysis.industry_expertise?.join(", ") || "Not specified"}
- Management Capabilities: ${resumeAnalysis.management_capabilities?.join(", ") || "Not specified"}

Requirements:
1. Achievements should be specific, quantifiable, and impressive
2. Focus on leadership impact, transformation, and business results
3. Avoid duplicating existing achievements
4. Make them relevant to contract/interim executive roles
5. Each achievement should be 1-2 sentences maximum

Return ONLY a JSON array of achievement strings, nothing else. Example format:
["Led $50M digital transformation resulting in 40% efficiency gain", "Restructured global operations across 12 countries, reducing costs by $15M annually"]`;

    console.log("Calling Lovable AI for achievement suggestions...");

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

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const achievements = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ achievements }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-achievements:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});