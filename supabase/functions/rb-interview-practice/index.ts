import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewPracticeRequest {
  project_id: string;
  question_type?: 'behavioral' | 'technical' | 'situational' | 'mixed';
  difficulty?: 'entry' | 'mid' | 'senior';
}

interface InterviewQuestion {
  question: string;
  type: 'behavioral' | 'technical' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  why_asked: string;
  good_answer_elements: string[];
  related_requirement?: string;
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

    const { project_id, question_type = 'mixed', difficulty = 'mid' } = await req.json() as InterviewPracticeRequest;

    if (!project_id) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch project data
    const [projectResult, requirementsResult, classificationResult, evidenceResult] = await Promise.all([
      supabase.from("rb_projects").select("*").eq("id", project_id).single(),
      supabase.from("rb_jd_requirements").select("*").eq("project_id", project_id).order("priority", { ascending: false }),
      supabase.from("rb_jd_classification").select("*").eq("project_id", project_id).single(),
      supabase.from("rb_evidence").select("*").eq("project_id", project_id).eq("is_active", true),
    ]);

    const project = projectResult.data;
    const requirements = requirementsResult.data || [];
    const classification = classificationResult.data;
    const evidence = evidenceResult.data || [];

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for AI
    const roleInfo = classification ? {
      title: classification.role_title,
      seniority: classification.seniority_level,
      industry: classification.industry,
    } : {
      title: project.target_role || "the role",
      seniority: difficulty,
      industry: "General",
    };

    const topRequirements = requirements.slice(0, 10);
    const candidateStrengths = evidence.slice(0, 8);

    const systemPrompt = `You are an expert interview coach preparing a candidate for a ${roleInfo.seniority} ${roleInfo.title} position in the ${roleInfo.industry} industry.

Generate realistic interview questions that:
1. Are commonly asked for this role and level
2. Test both technical competence and cultural fit
3. Allow the candidate to showcase their specific experience
4. Range in difficulty appropriate for ${difficulty}-level candidates

Question Types to Generate:
${question_type === 'behavioral' || question_type === 'mixed' ? '- BEHAVIORAL: "Tell me about a time when..." questions using STAR method' : ''}
${question_type === 'technical' || question_type === 'mixed' ? '- TECHNICAL: Role-specific technical knowledge and problem-solving' : ''}
${question_type === 'situational' || question_type === 'mixed' ? '- SITUATIONAL: "What would you do if..." hypothetical scenarios' : ''}

For each question, explain:
- Why interviewers ask this question
- Key elements of a strong answer

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "question": "The interview question",
      "type": "behavioral|technical|situational",
      "difficulty": "easy|medium|hard",
      "why_asked": "Why interviewers ask this",
      "good_answer_elements": ["Element 1", "Element 2", "Element 3"],
      "related_requirement": "Optional: which job requirement this tests"
    }
  ],
  "preparation_tips": ["General tips for this interview"],
  "role_context": {
    "common_interview_format": "Typical interview format for this role",
    "key_competencies_tested": ["Competency 1", "Competency 2"]
  }
}`;

    const userPrompt = `Generate 6-8 interview questions for this candidate.

ROLE DETAILS:
- Title: ${roleInfo.title}
- Seniority: ${roleInfo.seniority}
- Industry: ${roleInfo.industry}

TOP JOB REQUIREMENTS (what the employer is looking for):
${JSON.stringify(topRequirements.map((r: any) => ({
  requirement: r.requirement_text,
  category: r.category,
  priority: r.priority,
})), null, 2)}

CANDIDATE'S KEY STRENGTHS (from their resume):
${JSON.stringify(candidateStrengths.map((e: any) => ({
  claim: e.claim_text,
  evidence: e.evidence_quote,
  category: e.category,
})), null, 2)}

Generate questions that:
1. Allow the candidate to highlight their verified strengths
2. Test the critical requirements
3. Include at least one curveball/challenge question
4. Mix difficulty levels appropriately for ${difficulty}-level`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.STANDARD,
        response_format: { type: "json_object" },
      },
      "rb-interview-practice",
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

    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      role: roleInfo,
      ...result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rb-interview-practice:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
