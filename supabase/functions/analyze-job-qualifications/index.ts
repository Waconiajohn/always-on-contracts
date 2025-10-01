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
      .select("*")
      .eq("id", opportunityId)
      .single();

    if (oppError || !opportunity) {
      throw new Error("Opportunity not found");
    }

    const prompt = `Analyze this job opportunity and extract the most critical information for resume customization:

JOB TITLE: ${opportunity.job_title}
DESCRIPTION: ${opportunity.job_description || "Not provided"}
REQUIRED SKILLS: ${opportunity.required_skills?.join(", ") || "Not specified"}
LOCATION: ${opportunity.location || "Not specified"}
RATE: $${opportunity.hourly_rate_min || "TBD"}-${opportunity.hourly_rate_max || "TBD"}/hour

TASK:
1. Extract ALL important keywords and phrases (15-25 keywords) that should appear in the resume
2. Identify the 3-5 MOST CRITICAL qualifications that will determine if candidate gets the role
3. Create 3-5 targeted questions to ask the candidate about their experience with these critical qualifications
4. Calculate keyword categories (technical skills, soft skills, certifications, tools, methodologies)

Return ONLY a JSON object with this structure:
{
  "keywords": ["keyword1", "keyword2", ...],
  "critical_qualifications": [
    {
      "qualification": "Specific qualification description",
      "importance": "why this matters for the role",
      "question": "Question to ask the candidate about this qualification"
    }
  ],
  "keyword_categories": {
    "technical_skills": ["skill1", "skill2"],
    "soft_skills": ["skill1", "skill2"],
    "certifications": ["cert1", "cert2"],
    "tools": ["tool1", "tool2"],
    "methodologies": ["method1", "method2"]
  }
}`;

    console.log("Calling Lovable AI for job qualification analysis...");

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
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!analysis) {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-job-qualifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
