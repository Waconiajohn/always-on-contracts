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

    const { opportunityId } = await req.json();

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

    const prompt = `You are an expert resume writer specializing in executive-level positions (permanent, contract, and interim roles). Customize this executive's resume to perfectly match the job opportunity below.

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

TASK:
1. Identify the top 8-10 keywords and phrases from the job description that should be incorporated
2. Create a tailored executive summary (3-4 sentences) that speaks directly to this role
3. List 5-7 key achievements that are most relevant to this opportunity
4. List 8-12 core competencies that match the job requirements
5. Provide 2-3 specific customization notes explaining why this executive is a strong match

Return ONLY a JSON object with this structure:
{
  "keywords": ["keyword1", "keyword2", ...],
  "executive_summary": "Tailored summary here...",
  "key_achievements": ["achievement1", "achievement2", ...],
  "core_competencies": ["competency1", "competency2", ...],
  "customization_notes": "Brief notes on why this is a strong match and what was emphasized..."
}`;

    console.log("Calling Lovable AI for resume customization...");

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

    console.log("AI response:", content);

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

    return new Response(JSON.stringify({ 
      ...customizedResume,
      keywords 
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