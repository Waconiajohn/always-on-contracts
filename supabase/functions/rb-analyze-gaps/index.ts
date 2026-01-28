import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { GapAnalysisSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeGapsRequest {
  project_id: string;
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

    const { project_id } = await req.json() as AnalyzeGapsRequest;

    if (!project_id) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all data needed for gap analysis
    const [requirementsResult, benchmarksResult, evidenceResult, keywordDecisionsResult] = await Promise.all([
      supabase.from("rb_jd_requirements").select("*").eq("project_id", project_id),
      supabase.from("rb_benchmark_requirements").select("*").eq("project_id", project_id),
      supabase.from("rb_evidence").select("*").eq("project_id", project_id).eq("is_active", true),
      supabase.from("rb_keyword_decisions").select("*").eq("project_id", project_id),
    ]);

    const requirements = requirementsResult.data || [];
    const benchmarks = benchmarksResult.data || [];
    const evidence = evidenceResult.data || [];
    const keywordDecisions = keywordDecisionsResult.data || [];

    // Build suppressed keywords list
    const suppressedKeywords = keywordDecisions
      .filter((d: { decision: string }) => d.decision === "not_true" || d.decision === "ignore")
      .map((d: { keyword: string }) => d.keyword);

    const systemPrompt = `You are an expert resume analyst using SEMANTIC MATCHING to compare a candidate's evidence against job requirements.

SEMANTIC MATCHING RULES (go beyond exact keywords):
1. "Managed a team of 5 engineers" MATCHES "leadership experience" or "team management"
2. "Reduced costs by 30%" MATCHES "cost optimization" or "budget management"
3. "Built REST APIs" MATCHES "API development" or "backend development"
4. "Collaborated with stakeholders" MATCHES "cross-functional collaboration"
5. Look for EQUIVALENT MEANING, not just identical words

MATCHING CRITERIA:
1. MET = Evidence clearly demonstrates the requirement (exact OR semantic match)
2. PARTIAL = Evidence shows related experience but lacks specificity or scope
3. UNMET = No evidence supports this requirement even semantically

CRITICAL RULES:
- Use semantic understanding: "Python scripting" matches "programming experience"
- Consider transferable skills: "managed $2M budget" matches "financial oversight"
- Respect suppressed keywords - do not suggest adding them
- NEVER fabricate or assume skills not demonstrated in evidence

For unmet requirements, recommend:
- "add_keyword": Candidate likely has this (semantic evidence suggests it)
- "ask_user": Need to verify - evidence is ambiguous
- "ignore": Clearly outside candidate's background

Include semantic_match_reason when a match is NOT exact keyword but semantic.

Respond ONLY with valid JSON:
{
  "met": [{ "requirement_text": "...", "evidence_quote": "...", "weight": 1-5, "match_type": "exact|semantic", "semantic_match_reason": "optional explanation if semantic" }],
  "partial": [{ "requirement_text": "...", "what_is_missing": "...", "evidence_quote": "...|null", "weight": 1-5 }],
  "unmet": [{ "requirement_text": "...", "recommended_action": "add_keyword|ask_user|ignore", "weight": 1-5 }],
  "questions": ["Question to ask candidate about their experience with X..."],
  "safe_keyword_insertions": ["keyword1", "keyword2"],
  "semantic_suggestions": [{ "resume_phrase": "what they wrote", "jd_term": "what JD wants", "suggestion": "how to bridge" }],
  "score_breakdown": {
    "met_weight": total weight of met requirements,
    "partial_weight": total weight of partial requirements (count at 50%),
    "unmet_weight": total weight of unmet requirements,
    "total_weight": sum of all requirement weights
  }
}`;

    // Build the comparison context
    const allRequirements = [
      ...requirements.map((r: { text: string; weight: number; category: string }) => ({ ...r, source: "jd" })),
      ...benchmarks.map((b: { text: string; weight: number; category: string }) => ({ text: b.text, weight: b.weight, category: b.category, source: "benchmark" })),
    ];

    const userPrompt = `Compare the candidate's evidence against these requirements.

REQUIREMENTS (from JD and benchmark):
${JSON.stringify(allRequirements, null, 2)}

CANDIDATE'S VERIFIED EVIDENCE:
${JSON.stringify(evidence.map((e: { claim_text: string; evidence_quote: string; category: string }) => ({ claim: e.claim_text, quote: e.evidence_quote, category: e.category })), null, 2)}

SUPPRESSED KEYWORDS (do not suggest these):
${JSON.stringify(suppressedKeywords)}

Perform the gap analysis.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        response_format: { type: "json_object" },
      },
      "rb-analyze-gaps",
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
    const result = parseAndValidate(GapAnalysisSchema, content, "rb-analyze-gaps");

    // Calculate score
    const breakdown = result.score_breakdown || {
      met_weight: 0,
      partial_weight: 0,
      unmet_weight: 0,
      total_weight: 1,
    };

    const effectiveScore = breakdown.met_weight + (breakdown.partial_weight * 0.5);
    const score = Math.round((effectiveScore / breakdown.total_weight) * 100);

    // Update project score
    const { error: updateError } = await supabase
      .from("rb_projects")
      .update({
        current_score: score,
        original_score: score, // First time, set both
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", project_id);

    if (updateError) {
      console.error("Error updating project score:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      score,
      gap_analysis: result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rb-analyze-gaps:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
