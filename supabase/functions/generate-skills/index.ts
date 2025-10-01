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
    const { resumeAnalysis, currentSkills } = await req.json();

    const prompt = `Based on this resume analysis, suggest 5-8 additional core skills that would strengthen this executive profile for contract/interim positions.

Resume Details:
- Experience: ${resumeAnalysis.years_experience} years
- Current Skills: ${currentSkills?.join(", ") || "None listed"}
- Existing Resume Skills: ${resumeAnalysis.skills?.join(", ") || "Not specified"}
- Industries: ${resumeAnalysis.industry_expertise?.join(", ") || "Not specified"}
- Management Capabilities: ${resumeAnalysis.management_capabilities?.join(", ") || "Not specified"}

Requirements:
1. Skills should be relevant to executive-level contract work
2. Focus on leadership, strategic, and specialized technical skills
3. Avoid duplicating existing skills
4. Include a mix of hard and soft skills
5. Keep each skill concise (2-5 words)

Return ONLY a JSON array of skill strings, nothing else. Example format:
["Change Management", "P&L Leadership", "Digital Transformation", "M&A Integration"]`;

    console.log("Calling Lovable AI for skill suggestions...");

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
    const skills = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ skills }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-skills:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});