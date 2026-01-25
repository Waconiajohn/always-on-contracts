import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { HiringManagerCritiqueSchema, safeParseWithLog } from "../_shared/rb-schemas.ts";

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
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get project with job details
    const { data: project, error: projectError } = await supabase
      .from("rb_projects")
      .select("*")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get document
    const { data: doc } = await supabase
      .from("rb_documents")
      .select("raw_text, parsed_resume")
      .eq("project_id", project_id)
      .single();

    // Get active versions for each section
    const { data: versions } = await supabase
      .from("rb_versions")
      .select("section_name, content")
      .eq("project_id", project_id)
      .eq("is_active", true);

    // Build current resume content
    let resumeContent = doc?.raw_text || "";
    if (versions && versions.length > 0) {
      const sectionUpdates = versions.map(v => `[${v.section_name}]\n${v.content}`).join("\n\n");
      resumeContent = `CURRENT RESUME SECTIONS:\n${sectionUpdates}\n\nORIGINAL RESUME:\n${resumeContent}`;
    }

    const systemPrompt = `You are a senior hiring manager with 15+ years of experience reviewing resumes for ${project.job_title || "professional"} roles in the ${project.industry || "technology"} industry.

Your task is to provide a brutally honest critique of this resume as if you were deciding whether to interview this candidate.

IMPORTANT RULES:
1. Be specific and actionable - generic advice is worthless
2. Point out claims that seem exaggerated or unverifiable
3. Identify formatting or structure issues that make scanning difficult
4. Note missing information that would be expected for this role
5. Highlight anything that would make you question the candidate's fit

Output JSON matching this schema:
{
  "overall_score": <0-100>,
  "overall_impression": "<2-3 sentence first impression>",
  "would_interview": <true|false>,
  "issues": [
    {
      "section": "<which section>",
      "issue": "<what the issue is>",
      "severity": "critical" | "warning" | "suggestion",
      "recommendation": "<how to fix it>"
    }
  ],
  "strengths": ["<specific strength 1>", "<specific strength 2>", ...],
  "improvements": ["<top improvement 1>", "<top improvement 2>", ...]
}`;

    const userPrompt = `JOB TARGET: ${project.job_title || "Not specified"}
INDUSTRY: ${project.industry || "Not specified"}
SENIORITY: ${project.seniority_level || "Not specified"}

JOB DESCRIPTION:
${project.job_description || "Not provided"}

RESUME:
${resumeContent}

Provide your hiring manager critique as JSON.`;

    console.log("Calling AI for hiring manager critique");

    const { response, metrics } = await callLovableAI(
      {
        model: LOVABLE_AI_MODELS.PREMIUM,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      },
      "rb-hiring-manager-critique",
      user.id
    );

    await logAIUsage(metrics);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse and validate using schema
    const parsed = JSON.parse(content);
    const validated = safeParseWithLog(HiringManagerCritiqueSchema, parsed, "rb-hiring-manager-critique");

    // Use validated result or fallback
    const result = validated || {
      overall_score: parsed.overall_score ?? 50,
      overall_impression: parsed.hiring_manager_impression ?? parsed.overall_impression ?? "Unable to assess",
      would_interview: parsed.would_interview ?? false,
      issues: parsed.items?.map((item: { category?: string; message?: string; severity?: string; suggestion?: string }) => ({
        section: item.category || "General",
        issue: item.message || "",
        severity: item.severity || "warning",
        recommendation: item.suggestion || "",
      })) ?? parsed.issues ?? [],
      strengths: parsed.strengths ?? [],
      improvements: parsed.improvements ?? parsed.weaknesses ?? [],
    };

    console.log("Critique generated successfully", { score: result.overall_score });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("rb-hiring-manager-critique error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "critique_failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
