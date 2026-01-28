import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { ClaimsExtractionSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractClaimsRequest {
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

    const { project_id } = await req.json() as ExtractClaimsRequest;

    if (!project_id) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), {
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

    // Get the resume document
    const { data: document, error: docError } = await supabase
      .from("rb_documents")
      .select("*")
      .eq("project_id", project_id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: "Resume document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeText = document.raw_text || "";
    const parsedJson = document.parsed_json as Record<string, unknown> | null;

    if (!resumeText && !parsedJson) {
      return new Response(JSON.stringify({ error: "No resume content found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert at extracting factual claims from resumes.
CRITICAL: You must ONLY extract claims that are explicitly stated in the resume.
DO NOT infer, assume, or fabricate any claims.

For each claim:
1. Extract the EXACT quote from the resume that supports it
2. Categorize it: skill, tool, domain, responsibility, metric, leadership
3. Rate confidence:
   - high: Explicitly stated with context
   - medium: Stated but lacks specific detail

Respond ONLY with valid JSON:
{
  "claims": [
    {
      "claim_text": "Clear statement of what the candidate can do/has done",
      "category": "skill|tool|domain|responsibility|metric|leadership",
      "evidence_quote": "EXACT text from resume supporting this claim",
      "confidence": "high|medium",
      "span_location": {
        "section": "summary|skills|experience|education|other",
        "jobIndex": 0-based if in experience,
        "bulletIndex": 0-based if specific bullet
      }
    }
  ]
}

Be EXHAUSTIVE - extract every provable claim. But NEVER include anything not explicitly in the resume.`;

    // Build resume content for AI
    let resumeContent = "";
    if (parsedJson) {
      resumeContent = JSON.stringify(parsedJson, null, 2);
    } else {
      resumeContent = resumeText;
    }

    const userPrompt = `Extract all factual claims from this resume:\n\n${resumeContent}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        response_format: { type: "json_object" },
      },
      "rb-extract-resume-claims",
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
    const result = parseAndValidate(ClaimsExtractionSchema, content, "rb-extract-resume-claims");

    // Save claims as evidence
    const evidenceToInsert = (result.claims || []).map((claim) => ({
      project_id,
      claim_text: claim.claim_text,
      evidence_quote: claim.evidence_quote,
      category: claim.category,
      source: "extracted" as const,
      span_location: claim.span_location || null,
      confidence: claim.confidence,
      is_active: true,
    }));

    if (evidenceToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("rb_evidence")
        .insert(evidenceToInsert);

      if (insertError) {
        console.error("Error inserting evidence:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save evidence" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      claims_count: evidenceToInsert.length,
      claims: result.claims 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rb-extract-resume-claims:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
