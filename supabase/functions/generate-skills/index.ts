import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

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
1. Skills should be relevant to executive-level roles (permanent, contract, and interim positions)
2. Focus on leadership, strategic, and specialized technical skills
3. Avoid duplicating existing skills
4. Include a mix of hard and soft skills
5. Keep each skill concise (2-5 words)

Return ONLY a JSON array of skill strings, nothing else. Example format:
["Change Management", "P&L Leadership", "Digital Transformation", "M&A Integration"]`;

    console.log("Calling Perplexity for skill suggestions...");

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are an expert career coach specializing in executive skill assessment. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'low',
          requiresReasoning: false,
          outputLength: 'short'
        }),
        temperature: 0.7,
        max_tokens: 600,
        return_citations: false,
      },
      'generate-skills'
    );

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);

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
