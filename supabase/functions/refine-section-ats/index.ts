import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger("refine-section-ats");

  try {
    const body = await req.json();
    const {
      jobTitle,
      jobDescription,
      sectionTitle,
      sectionType,
      currentBullets,
      missingMustHaveKeywords,
      industry,
    } = body;

    if (!sectionTitle || !Array.isArray(currentBullets) || !jobDescription) {
      logger.error("Invalid input", { body });
      return new Response(
        JSON.stringify({ error: "invalid_input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `
You are an ATS-aware resume editor.

Task:
- You receive a job title, job description, the title of a specific resume section, the section type, the current bullet points in that section, and a list of missing MUST-HAVE keywords for this section.
- Your job is to produce an ATS-optimized version of that section's bullets.

Rules:
- You MUST preserve the candidate's intent (no fabricating employers, titles, or achievements).
- You MAY rephrase bullets to naturally include the missing keywords.
- If a keyword truly does not fit the section, you can skip it, but prioritize including as many as possible.
- Use concise, impact-focused bullets.
- Output JSON only, matching the supplied schema.
`;

    const userPrompt = `
JOB TITLE: ${jobTitle}
INDUSTRY: ${industry || "Unknown"}

JOB DESCRIPTION:
${jobDescription}

SECTION:
- Title: ${sectionTitle}
- Type: ${sectionType}

CURRENT BULLETS:
${currentBullets.map((b: string) => `- ${b}`).join("\n")}

MISSING MUST-HAVE KEYWORDS FOR THIS SECTION:
${missingMustHaveKeywords.map((k: string) => `- ${k}`).join("\n")}

Respond with a JSON object:

{
  "source": "ats_optimized",
  "label": "ATS-optimized version",
  "bullets": [ "bullet 1", "bullet 2", ... ],
  "rationale": "short explanation of how you improved keyword coverage"
}
`;

    logger.info("Calling Lovable AI for ATS refinement", {
      sectionTitle,
      missingKeywordCount: missingMustHaveKeywords.length,
    });

    const { response, metrics } = await callLovableAI(
      {
        model: LOVABLE_AI_MODELS.FAST,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      },
      "refine-section-ats"
    );

    await logAIUsage(metrics);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const json = JSON.parse(content);

    const result = {
      source: "ats_optimized",
      label: json.label || "ATS-optimized version",
      bullets: json.bullets || [],
      rationale:
        json.rationale ||
        "Optimized to include more must-have keywords from the job description.",
    };

    logger.info("ATS refinement complete", {
      bulletCount: result.bullets.length,
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    logger.error("refine-section-ats failed", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "AI_GENERATION_FAILED" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
