import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { BenchmarkGenerationSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateBenchmarkRequest {
  project_id: string;
  role_title: string;
  seniority_level: string;
  industry: string;
  sub_industry?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { project_id, role_title, seniority_level, industry, sub_industry } = 
      await req.json() as GenerateBenchmarkRequest;

    if (!project_id || !role_title || !seniority_level || !industry) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert on role benchmarks across industries.
Generate the expected profile for a ${seniority_level} ${role_title} in ${industry}${sub_industry ? ` (${sub_industry})` : ""}.

This benchmark represents what a COMPETITIVE candidate should demonstrate - not just minimum requirements.
Include:
- Hard skills expected at this level
- Tools/technologies commonly used
- Domain expertise areas
- Leadership/soft skill expectations (appropriate for seniority)
- Key responsibilities
- Metrics/outcomes that demonstrate success

For each benchmark item, assign:
- importance: "critical" | "important" | "nice_to_have"
- typical_evidence: examples of how this appears on resumes

Also generate keywords and power_phrases commonly used for this role level.

Respond ONLY with valid JSON:
{
  "role_title": "...",
  "seniority_level": "...",
  "industry": "...",
  "benchmarks": [
    { "category": "...", "description": "...", "importance": "critical|important|nice_to_have", "typical_evidence": [...] }
  ],
  "keywords": ["keyword1", "keyword2", ...],
  "power_phrases": ["phrase1", "phrase2", ...]
}`;

    const userPrompt = `Generate a competitive benchmark profile for: ${seniority_level} ${role_title} in ${industry}${sub_industry ? ` / ${sub_industry}` : ""}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.4,
        response_format: { type: "json_object" },
      },
      "rb-generate-benchmark",
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
    const result = parseAndValidate(BenchmarkGenerationSchema, content, "rb-generate-benchmark");

    // Save benchmark requirements to database
    const benchmarksToInsert = (result.benchmarks || []).map((item) => ({
      project_id,
      category: item.category,
      text: item.description,
      weight: item.importance === "critical" ? 5 : item.importance === "important" ? 3 : 1,
      section_hint: "Experience",
    }));

    if (benchmarksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("rb_benchmark_requirements")
        .insert(benchmarksToInsert);

      if (insertError) {
        console.error("Error inserting benchmarks:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save benchmarks" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      benchmark_count: benchmarksToInsert.length,
      keyword_universe: result.keywords || [],
      result 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rb-generate-benchmark:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
