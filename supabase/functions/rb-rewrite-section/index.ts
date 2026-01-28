import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { SectionRewriteSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ActionSource = 
  | "tighten" 
  | "executive" 
  | "specific" 
  | "reduce_buzzwords" 
  | "match_jd" 
  | "conservative" 
  | "try_another"
  | "micro_edit"
  | "manual"
  | "initial";

interface RewriteSectionRequest {
  project_id: string;
  section_name: string;
  current_content: string;
  action_source: ActionSource;
  micro_edit_instruction?: string;
  selected_text?: string;
}

const tonePresets: Record<ActionSource, string> = {
  tighten: "Make the writing more concise. Remove filler words, redundant phrases, and unnecessary qualifiers. Keep all substantive content but express it more efficiently.",
  executive: "Elevate the language to executive-level. Use stronger action verbs, emphasize strategic impact, and frame achievements in terms of business outcomes. Maintain the same facts but present them more impressively.",
  specific: "Add more specific details where possible. Replace vague language with concrete examples, numbers, or outcomes. If specific details aren't available, ask questions to gather them.",
  reduce_buzzwords: "Remove overused corporate buzzwords and jargon. Replace with clear, direct language that conveys the same meaning. Keep industry-specific technical terms that are genuinely meaningful.",
  match_jd: "Optimize for the job description keywords and requirements. Weave in relevant terms naturally where supported by evidence. Emphasize skills and experiences that match the JD.",
  conservative: "Make minimal changes. Fix only obvious issues like grammar, awkward phrasing, or unclear statements. Preserve the candidate's voice and original structure.",
  try_another: "Generate an alternative version with a different approach. If the previous version was formal, try more dynamic. Vary sentence structure and emphasis while keeping the same facts.",
  micro_edit: "Make a targeted edit to the selected text based on the specific instruction provided.",
  manual: "Apply the user's manual edit.",
  initial: "Create the initial version based on the original resume content.",
};

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

    const { 
      project_id, 
      section_name, 
      current_content, 
      action_source,
      micro_edit_instruction,
      selected_text,
    } = await req.json() as RewriteSectionRequest;

    if (!project_id || !section_name || !current_content || !action_source) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user owns this project
    const { data: projectCheck, error: projectError } = await supabase
      .from("rb_projects")
      .select("id, user_id")
      .eq("id", project_id)
      .single();

    if (projectError || !projectCheck || projectCheck.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Project not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch evidence and requirements
    const [evidenceResult, requirementsResult, keywordDecisionsResult] = await Promise.all([
      supabase.from("rb_evidence").select("*").eq("project_id", project_id).eq("is_active", true),
      supabase.from("rb_jd_requirements").select("*").eq("project_id", project_id),
      supabase.from("rb_keyword_decisions").select("*").eq("project_id", project_id),
    ]);

    const evidence = evidenceResult.data || [];
    const requirements = requirementsResult.data || [];
    const keywordDecisions = keywordDecisionsResult.data || [];

    const suppressedKeywords = keywordDecisions
      .filter((d: { decision: string }) => d.decision === "not_true" || d.decision === "ignore")
      .map((d: { keyword: string }) => d.keyword);

    const approvedKeywords = keywordDecisions
      .filter((d: { decision: string }) => d.decision === "add")
      .map((d: { keyword: string }) => d.keyword);

    const toneInstruction = tonePresets[action_source] || tonePresets.conservative;

    const systemPrompt = `You are an expert resume writer with strict anti-hallucination controls.

CRITICAL RULES:
1. You may ONLY include claims that are supported by the provided evidence
2. You may ONLY add keywords that are in the approved_keywords list OR have clear evidence support
3. NEVER add suppressed keywords
4. If you cannot improve without fabricating, return the original with minimal changes
5. If improvement requires information you don't have, add it to the questions array

Your task: ${toneInstruction}

Respond ONLY with valid JSON:
{
  "rewritten_text": "The improved section content",
  "keywords_added": ["keyword1", "keyword2"],
  "evidence_used": ["Quote from evidence that supports changes"],
  "questions": ["Questions to ask if more information needed"]
}`;

    let userPrompt = `Rewrite this ${section_name} section.

CURRENT CONTENT:
${current_content}

VERIFIED EVIDENCE (you may reference these):
${JSON.stringify(evidence.map((e: { claim_text: string; evidence_quote: string }) => ({ claim: e.claim_text, quote: e.evidence_quote })), null, 2)}

JD REQUIREMENTS (try to address these if evidence exists):
${JSON.stringify(requirements.map((r: { text: string }) => r.text), null, 2)}

APPROVED KEYWORDS (safe to add):
${JSON.stringify(approvedKeywords)}

SUPPRESSED KEYWORDS (NEVER use these):
${JSON.stringify(suppressedKeywords)}`;

    if (action_source === "micro_edit" && selected_text && micro_edit_instruction) {
      userPrompt = `Apply this micro-edit to the ${section_name} section.

SELECTED TEXT TO EDIT:
"${selected_text}"

EDIT INSTRUCTION:
${micro_edit_instruction}

FULL CURRENT CONTENT:
${current_content}

VERIFIED EVIDENCE:
${JSON.stringify(evidence.map((e: { claim_text: string; evidence_quote: string }) => ({ claim: e.claim_text, quote: e.evidence_quote })), null, 2)}

Return the full section with the edit applied. Maintain consistency with the rest of the content.`;
    }

    const model = action_source === "micro_edit" ? LOVABLE_AI_MODELS.MINI : LOVABLE_AI_MODELS.PREMIUM;
    const temperature = action_source === "try_another" ? 0.7 : 0.3;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model,
        temperature,
        response_format: { type: "json_object" },
      },
      "rb-rewrite-section",
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
    const result = parseAndValidate(SectionRewriteSchema, content, "rb-rewrite-section");

    // Get next version number
    const { data: existingVersions } = await supabase
      .from("rb_versions")
      .select("version_number")
      .eq("project_id", project_id)
      .eq("section_name", section_name)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;

    // Set all existing versions to inactive
    await supabase
      .from("rb_versions")
      .update({ is_active: false })
      .eq("project_id", project_id)
      .eq("section_name", section_name);

    // Insert new version
    const { error: insertError } = await supabase
      .from("rb_versions")
      .insert({
        project_id,
        section_name,
        version_number: nextVersionNumber,
        content: result.rewritten_text,
        action_source,
        is_active: true,
      });

    if (insertError) {
      console.error("Error inserting version:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save version" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prune old versions - keep only the 10 most recent per section
    const MAX_VERSIONS_PER_SECTION = 10;
    const { data: allVersions } = await supabase
      .from("rb_versions")
      .select("id, version_number")
      .eq("project_id", project_id)
      .eq("section_name", section_name)
      .order("version_number", { ascending: false });

    if (allVersions && allVersions.length > MAX_VERSIONS_PER_SECTION) {
      const versionsToDelete = allVersions.slice(MAX_VERSIONS_PER_SECTION);
      const idsToDelete = versionsToDelete.map((v: { id: string }) => v.id);

      const { error: deleteError } = await supabase
        .from("rb_versions")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.warn("Failed to prune old versions:", deleteError);
        // Non-blocking - don't fail the request if pruning fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      version_number: nextVersionNumber,
      ...result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rb-rewrite-section:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
