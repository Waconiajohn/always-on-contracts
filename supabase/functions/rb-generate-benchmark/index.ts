import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

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

interface BenchmarkItem {
  text: string;
  category: "hard_skill" | "tool" | "domain" | "leadership" | "responsibility" | "metric";
  weight: number;
  section_hint: "Summary" | "Skills" | "Experience" | "Education";
}

interface BenchmarkResponse {
  benchmark_requirements: BenchmarkItem[];
  keyword_universe: string[];
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

For each item, assign:
- weight (1-5): 5 = critical differentiator, 3 = expected, 1 = nice-to-have
- section_hint: which resume section should address this

Also generate a keyword_universe: a comprehensive list of all relevant keywords, tools, methodologies, and industry terms that might appear on a strong resume.

Respond ONLY with valid JSON:
{
  "benchmark_requirements": [
    { "text": "...", "category": "hard_skill|tool|domain|leadership|responsibility|metric", "weight": 1-5, "section_hint": "Summary|Skills|Experience|Education" }
  ],
  "keyword_universe": ["keyword1", "keyword2", ...]
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

    const parseResult = extractJSON(content);
    if (!parseResult.success || !parseResult.data) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = parseResult.data as BenchmarkResponse;

    // Save benchmark requirements to database
    const benchmarksToInsert = (result.benchmark_requirements || []).map((item) => ({
      project_id,
      category: item.category,
      text: item.text,
      weight: item.weight,
      section_hint: item.section_hint || "Experience",
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
      keyword_universe: result.keyword_universe || [],
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
