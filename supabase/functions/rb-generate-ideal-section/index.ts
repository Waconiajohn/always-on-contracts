import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { IdealSectionSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateIdealRequest {
  section_type: "summary" | "skills" | "experience_bullets" | "education";
  jd_text: string;
  industry_research: {
    keywords: Array<{ term: string; frequency: string; category: string }>;
    power_phrases: Array<{ phrase: string; impact_level: string; use_case: string }>;
    typical_qualifications: Array<{ qualification: string; importance: string; category: string }>;
    competitive_benchmarks: Array<{ area: string; top_performer: string; average: string }>;
    summary_template?: string;
    experience_focus?: string[];
  };
  role_context: {
    role_title: string;
    seniority_level: string;
    industry: string;
  };
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

    const { section_type, jd_text, industry_research, role_context } = await req.json() as GenerateIdealRequest;

    if (!section_type || !jd_text || !industry_research || !role_context) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sectionPrompts: Record<string, string> = {
      summary: `Create the IDEAL professional summary for a ${role_context.seniority_level} ${role_context.role_title} in ${role_context.industry}.

This should be a "platinum standard" - what a PERFECT candidate would write. Do NOT include any placeholder text like [X years] - use specific realistic numbers that match the seniority level.

Guidelines:
- 2-3 sentences maximum (50-75 words)
- Lead with years of experience and primary expertise
- Include 1-2 quantified achievements
- End with value proposition or key differentiator
- Use power phrases naturally
- Incorporate high-priority keywords

${industry_research.summary_template ? `Template structure: ${industry_research.summary_template}` : ''}`,

      skills: `Create the IDEAL skills section for a ${role_context.seniority_level} ${role_context.role_title} in ${role_context.industry}.

This should showcase the complete skill profile of a top-tier candidate.

Guidelines:
- Organize by category (Technical, Tools, Domain, Soft Skills)
- Prioritize keywords with "very_common" frequency
- Include 15-25 skills total
- Balance breadth and depth
- Match what the job description emphasizes`,

      experience_bullets: `Create 4-5 IDEAL experience bullets for a ${role_context.seniority_level} ${role_context.role_title} in ${role_context.industry}.

These should demonstrate what TOP PERFORMER achievements look like.

Guidelines:
- Start each bullet with a strong action verb
- Include quantified metrics (%, $, #)
- Show scope and impact
- Use industry-specific terminology
- Demonstrate competitive benchmark achievements`,

      education: `Create the IDEAL education section for a ${role_context.seniority_level} ${role_context.role_title} in ${role_context.industry}.

Guidelines:
- Include degree, institution format
- Add relevant certifications
- List any specialized training
- Match what's typically "required" or "preferred" for this level`,
    };

    const systemPrompt = `You are an expert resume writer who creates world-class resumes that get candidates hired at top companies. You are generating the IDEAL ${section_type} section - this is the "platinum standard" that represents what a perfect candidate would write.

CRITICAL: This is a TEMPLATE/EXAMPLE showing excellence. It should be:
- Specific with realistic numbers and achievements
- Using industry-standard terminology
- Incorporating the provided keywords and power phrases naturally
- Demonstrating competitive benchmark achievements

DO NOT use placeholders like [X years] or [Your Company]. Use realistic specific examples.

${sectionPrompts[section_type]}

KEYWORDS TO INCORPORATE (prioritize very_common):
${industry_research.keywords.slice(0, 15).map(k => `- ${k.term} (${k.frequency})`).join('\n')}

POWER PHRASES TO USE:
${industry_research.power_phrases.slice(0, 8).map(p => `- "${p.phrase}" - ${p.use_case}`).join('\n')}

COMPETITIVE BENCHMARKS (show top performer level):
${industry_research.competitive_benchmarks.slice(0, 6).map(b => `- ${b.area}: ${b.top_performer}`).join('\n')}

Respond with JSON:
{
  "section_type": "${section_type}",
  "ideal_content": "The complete section text",
  "structure_notes": "Why this structure works",
  "key_elements": ["element1", "element2"],
  "word_count": number,
  "keywords_included": ["keyword1", "keyword2"]
}`;

    const userPrompt = `Job Description Context:
${jd_text.substring(0, 2000)}

Generate the ideal ${section_type} section that would perfectly match this job.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        response_format: { type: "json_object" },
      },
      "rb-generate-ideal-section",
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

    const result = parseAndValidate(IdealSectionSchema, content, "rb-generate-ideal-section");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in rb-generate-ideal-section:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
