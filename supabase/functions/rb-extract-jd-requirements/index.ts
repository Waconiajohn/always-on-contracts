import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { RequirementsExtractionSchema, parseAndValidate, type RequirementsExtraction } from '../_shared/rb-schemas.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

interface ExtractRequirementsRequest {
  project_id: string;
  jd_text: string;
  role_title: string;
  seniority_level: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(origin);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id, jd_text, role_title, seniority_level } = await req.json() as ExtractRequirementsRequest;

    if (!project_id || !jd_text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from("rb_projects")
      .select("id, user_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Project not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert at extracting requirements from job descriptions.
Extract the TOP 20 most important requirements and categorize them. For each requirement:
- Assign a weight (1-5): 5 = explicitly required/must-have, 3 = preferred/nice-to-have, 1 = implied
- Extract 1-2 SHORT exact phrases (max 50 characters each)
- Suggest 2-3 synonyms/variations (single words or short phrases)
- Indicate which resume section should address it

IMPORTANT: Keep all text fields SHORT (under 50 chars). Do not extract full sentences.

Respond ONLY with valid JSON:
{
  "hard_skills": [{ "text": "...", "weight": 1-5, "exact_phrases": [...], "synonyms": [...], "section_hint": "Skills|Experience|Summary|Education" }],
  "tools_tech": [...],
  "domain_knowledge": [...],
  "responsibilities": [...],
  "outcomes_metrics": [...],
  "education_certs": [...],
  "titles_seniority": [...],
  "soft_skills": [...]
}

LIMIT: Extract max 20 total requirements across all categories. Prioritize must-have skills.`;

    const userPrompt = `Extract requirements from this ${seniority_level} ${role_title} job description:\n\n${jd_text}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.2,
        response_format: { type: "json_object" },
      },
      "rb-extract-jd-requirements",
      user.id
    );

    await logAIUsage(metrics);

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use centralized schema validation
    const result = parseAndValidate(RequirementsExtractionSchema, content, "rb-extract-jd-requirements");

    // Save requirements to database
    const categoryMapping: Record<keyof RequirementsExtraction, string> = {
      hard_skills: "hard_skill",
      tools_tech: "tool",
      domain_knowledge: "domain",
      responsibilities: "responsibility",
      outcomes_metrics: "outcome",
      education_certs: "education",
      titles_seniority: "title",
      soft_skills: "soft_skill",
    };

    const requirementsToInsert: {
      project_id: string;
      category: string;
      text: string;
      weight: number;
      exact_phrases: string[];
      synonyms: string[];
      section_hint: string;
    }[] = [];

    for (const [key, category] of Object.entries(categoryMapping)) {
      const items = result[key as keyof RequirementsExtraction] || [];
      for (const item of items) {
        requirementsToInsert.push({
          project_id,
          category,
          text: item.text,
          weight: item.weight,
          exact_phrases: item.exact_phrases || [],
          synonyms: item.synonyms || [],
          section_hint: item.section_hint || "Experience",
        });
      }
    }

    if (requirementsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("rb_jd_requirements")
        .insert(requirementsToInsert);

      if (insertError) {
        console.error("Error inserting requirements:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save requirements" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      requirements_count: requirementsToInsert.length,
      result 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rb-extract-jd-requirements:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
