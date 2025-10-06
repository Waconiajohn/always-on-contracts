import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { opportunityId, persona } = await req.json();

    console.log('[CUSTOMIZE-RESUME] Starting for user:', user.id, 'opportunity:', opportunityId);

    // Fetch War Chest intelligence
    const { data: intelligenceData, error: intelligenceError } = await supabase.functions.invoke(
      'get-war-chest-intelligence',
      { headers: { Authorization: authHeader } }
    );

    const intelligence = intelligenceError ? null : intelligenceData?.intelligence;
    
    if (intelligence) {
      console.log('[CUSTOMIZE-RESUME] War Chest intelligence loaded:', {
        powerPhrases: intelligence.counts.powerPhrases,
        businessImpacts: intelligence.counts.businessImpacts,
        leadershipExamples: intelligence.counts.leadershipExamples,
        technicalSkills: intelligence.counts.technicalSkills,
        projects: intelligence.counts.projects
      });
    } else {
      console.log('[CUSTOMIZE-RESUME] No War Chest intelligence available, using fallback mode');
    }

    // Fetch opportunity details
    const { data: opportunity, error: oppError } = await supabase
      .from("job_opportunities")
      .select("*, staffing_agencies(*)")
      .eq("id", opportunityId)
      .single();

    if (oppError || !opportunity) {
      throw new Error("Opportunity not found");
    }

    // Fetch user's resume analysis and profile
    const { data: analysis, error: analysisError } = await supabase
      .from("resume_analysis")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (analysisError || !analysis) {
      throw new Error("Resume analysis not found");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Persona-specific instructions
    const personaInstructions = {
      executive: "Write in a commanding, strategic tone. Focus on P&L responsibility, board-level impact, organizational transformation. Use power words like 'orchestrated', 'spearheaded', 'architected'. Emphasize vision and scalability.",
      technical: "Use technical precision and specificity. Include architecture patterns, methodologies, tech stacks. Quantify performance improvements. Balance technical depth with business outcomes. Use terms like 'engineered', 'optimized', 'designed'.",
      transitioner: "Emphasize transferable skills and adaptability. Bridge past experience to new industry/role. Focus on learning agility, quick ramp-up examples, and universal competencies. Highlight versatility."
    };

    const personaStyle = persona ? personaInstructions[persona as keyof typeof personaInstructions] : personaInstructions.executive;

    // Build War Chest context for prompt
    let warChestContext = '';
    if (intelligence) {
      const topPowerPhrases = intelligence.powerPhrases.slice(0, 8).map((p: any) => 
        `- ${p.phrase} (${p.context || 'proven achievement'})`
      ).join('\n');

      const topBusinessImpacts = intelligence.businessImpacts.slice(0, 5).map((b: any) => 
        `- ${b.metric_type}: ${b.metric_value} (${b.context || 'quantified result'})`
      ).join('\n');

      const leadershipHighlights = intelligence.leadershipEvidence.slice(0, 4).map((l: any) => 
        `- ${l.evidence_type}: ${l.description}`
      ).join('\n');

      const technicalSkills = intelligence.technicalDepth.slice(0, 6).map((t: any) => 
        `- ${t.skill_name} (${t.proficiency_level}): ${t.years_experience || 'experienced'}`
      ).join('\n');

      const projectHighlights = intelligence.projects.slice(0, 4).map((p: any) => 
        `- ${p.project_name}: ${p.impact || p.outcome || 'successful delivery'}`
      ).join('\n');

      const industryExpertise = intelligence.industryExpertise.slice(0, 5).map((i: any) => 
        `- ${i.industry_name} (${i.depth_level}): ${i.key_areas?.join(', ') || 'expert knowledge'}`
      ).join('\n');

      warChestContext = `
CAREER INTELLIGENCE DATABASE (Verified achievements from War Chest):

PROVEN POWER PHRASES (${intelligence.counts.powerPhrases} total, top 8):
${topPowerPhrases}

QUANTIFIED BUSINESS IMPACTS (${intelligence.counts.businessImpacts} total, top 5):
${topBusinessImpacts}

LEADERSHIP EVIDENCE (${intelligence.counts.leadershipExamples} total, top 4):
${leadershipHighlights}

TECHNICAL DEPTH (${intelligence.counts.technicalSkills} total, top 6):
${technicalSkills}

PROJECT PORTFOLIO (${intelligence.counts.projects} total, top 4):
${projectHighlights}

INDUSTRY EXPERTISE (${intelligence.counts.industryExpertise} areas):
${industryExpertise}

COMPETITIVE ADVANTAGES:
${intelligence.competitiveAdvantages.slice(0, 3).map((a: any) => `- ${a.advantage_description}`).join('\n')}

**INSTRUCTION: Prioritize these verified achievements and quantified metrics in your customization. These are proven, real accomplishments - use them directly.**
`;
    }

    const prompt = `You are an expert resume writer specializing in executive-level positions (permanent, contract, and interim roles). Customize this executive's resume to perfectly match the job opportunity below.

PERSONA STYLE: ${personaStyle}

JOB OPPORTUNITY:
Title: ${opportunity.job_title}
Description: ${opportunity.job_description || "Not provided"}
Required Skills: ${opportunity.required_skills?.join(", ") || "Not specified"}
Location: ${opportunity.location || "Not specified"}
Rate: $${opportunity.hourly_rate_min || "TBD"}-${opportunity.hourly_rate_max || "TBD"}/hour

EXECUTIVE PROFILE:
Experience: ${analysis.years_experience} years
Current Skills: ${analysis.skills?.join(", ") || "Not specified"}
Key Achievements: ${profile?.key_achievements?.join("; ") || analysis.key_achievements?.join("; ") || "Not specified"}
Industries: ${analysis.industry_expertise?.join(", ") || "Not specified"}
Leadership: ${analysis.management_capabilities?.join(", ") || "Not specified"}
Executive Summary: ${analysis.analysis_summary || "Not provided"}

${warChestContext}

TASK:
1. Identify the top 8-10 keywords and phrases from the job description that should be incorporated
2. Create a tailored executive summary (3-4 sentences) that speaks directly to this role, using verified achievements from the War Chest when available
3. List 5-7 key achievements that are most relevant to this opportunity - PRIORITIZE quantified achievements from the Business Impacts database
4. List 8-12 core competencies that match the job requirements - reference confirmed Technical Depth and Leadership Evidence
5. Provide 2-3 specific customization notes explaining why this executive is a strong match, citing specific War Chest intelligence

CRITICAL REQUIREMENTS:
- Use exact power phrases from the War Chest database when they align with job requirements
- Include specific metrics and numbers from Business Impacts (percentages, dollar amounts, scale)
- Reference real projects from Project Portfolio when relevant to the role
- Leverage Industry Expertise to establish domain credibility
- Maintain consistency with established Career Narrative
- Ensure competitive advantages are prominently featured

Return ONLY a JSON object with this structure:
{
  "keywords": ["keyword1", "keyword2", ...],
  "executive_summary": "Tailored summary here...",
  "key_achievements": ["achievement1", "achievement2", ...],
  "core_competencies": ["competency1", "competency2", ...],
  "customization_notes": "Brief notes on why this is a strong match and what was emphasized..."
}`;

    console.log("[CUSTOMIZE-RESUME] Calling Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("[CUSTOMIZE-RESUME] AI response received");

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const customizedResume = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!customizedResume) {
      throw new Error("Failed to parse AI response");
    }

    // Extract keywords from job description for scoring
    const keywords = Array.from(new Set([
      ...(opportunity.required_skills || []),
      ...customizedResume.keywords
    ]));

    console.log("[CUSTOMIZE-RESUME] Customization complete with", keywords.length, "keywords");

    return new Response(JSON.stringify({ 
      ...customizedResume,
      keywords,
      warChestUsed: !!intelligence
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in customize-resume:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
