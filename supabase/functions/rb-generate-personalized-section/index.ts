import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { PersonalizedSectionSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PersonalizeRequest {
  section_type: "summary" | "skills" | "experience_bullets" | "education";
  ideal_content: string;
  user_evidence: Array<{
    claim_id?: string;
    claim_text: string;
    evidence_quote: string;
    category: string;
    confidence: string;
  }>;
  role_context: {
    role_title: string;
    seniority_level: string;
    industry: string;
  };
  jd_requirements?: Array<{
    text: string;
    weight: number;
    section_hint: string;
  }>;
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

    const { section_type, ideal_content, user_evidence, role_context, jd_requirements } = await req.json() as PersonalizeRequest;

    if (!section_type || !ideal_content || !user_evidence || !role_context) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter evidence relevant to this section
    const sectionCategories: Record<string, string[]> = {
      summary: ["skill", "domain", "leadership", "metric"],
      skills: ["skill", "tool", "domain"],
      experience_bullets: ["responsibility", "metric", "leadership"],
      education: ["domain"],
    };

    const relevantEvidence = user_evidence.filter(e => 
      sectionCategories[section_type]?.includes(e.category) || e.confidence === "high"
    );

    const systemPrompt = `You are an expert resume writer who creates personalized, evidence-backed resumes. You are taking an IDEAL ${section_type} section and adapting it with the user's REAL experience and evidence.

CRITICAL ANTI-HALLUCINATION RULES:
1. ONLY use facts from the provided user evidence
2. NEVER invent metrics, numbers, or achievements
3. If evidence is missing for an area, note it as a gap
4. Maintain the STRUCTURE of the ideal section but replace content with real evidence
5. Keep industry-standard language and keywords

IDEAL SECTION (your structural template):
${ideal_content}

USER'S VERIFIED EVIDENCE (use ONLY these facts):
${relevantEvidence.map((e, i) => `${i + 1}. [${e.category.toUpperCase()}] ${e.claim_text}
   Evidence: "${e.evidence_quote}"
   Confidence: ${e.confidence}`).join('\n\n')}

${jd_requirements ? `
JOB REQUIREMENTS TO ADDRESS:
${jd_requirements.slice(0, 10).map(r => `- ${r.text} (Priority: ${r.weight}/5)`).join('\n')}
` : ''}

YOUR TASK:
1. Keep the structure and format of the ideal section
2. Replace generic content with user's specific evidence
3. Use user's actual numbers and metrics (do NOT inflate)
4. Where evidence is missing, identify gaps
5. Generate questions for areas needing more information

Respond with JSON:
{
  "section_type": "${section_type}",
  "personalized_content": "The personalized section text using real evidence",
  "ideal_elements_preserved": ["structural elements kept from ideal"],
  "evidence_incorporated": [
    {
      "claim_id": "optional",
      "evidence_text": "the user evidence used",
      "how_used": "how it was incorporated"
    }
  ],
  "gaps_identified": ["areas where user lacks evidence"],
  "questions_for_user": ["questions to gather missing information"],
  "similarity_to_ideal": 0-100
}`;

    const userPrompt = `Create the personalized ${section_type} section for a ${role_context.seniority_level} ${role_context.role_title} in ${role_context.industry}.

Use ONLY the user's verified evidence. Identify gaps and generate questions where evidence is missing.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.PREMIUM, // Use GPT-5 for careful evidence handling
        response_format: { type: "json_object" },
      },
      "rb-generate-personalized-section",
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

    const result = parseAndValidate(PersonalizedSectionSchema, content, "rb-generate-personalized-section");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in rb-generate-personalized-section:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
