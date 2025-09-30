import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, resumeId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Analyze resume using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert career advisor specializing in helping experienced professionals (45+) transition to high-value contract work. Analyze resumes to extract:
- Years of experience (calculate from dates)
- Key achievements with quantifiable results
- Industry expertise areas
- Management and leadership capabilities
- Transferable skills valuable for contract positions
- Recommended target hourly rates ($50-$150+ based on experience)
- Suitable interim executive or contract positions

Focus on positioning experience as premium value for contract work.`
          },
          {
            role: "user",
            content: `Analyze this resume and provide a structured analysis:\n\n${resumeText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_resume",
              description: "Extract structured information from a professional resume",
              parameters: {
                type: "object",
                properties: {
                  years_experience: { type: "number" },
                  key_achievements: { 
                    type: "array",
                    items: { type: "string" }
                  },
                  industry_expertise: {
                    type: "array",
                    items: { type: "string" }
                  },
                  management_capabilities: {
                    type: "array",
                    items: { type: "string" }
                  },
                  skills: {
                    type: "array",
                    items: { type: "string" }
                  },
                  target_hourly_rate_min: { type: "number" },
                  target_hourly_rate_max: { type: "number" },
                  recommended_positions: {
                    type: "array",
                    items: { type: "string" }
                  },
                  analysis_summary: { type: "string" }
                },
                required: [
                  "years_experience",
                  "key_achievements",
                  "industry_expertise",
                  "skills",
                  "target_hourly_rate_min",
                  "target_hourly_rate_max",
                  "recommended_positions",
                  "analysis_summary"
                ]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_resume" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No analysis returned from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Get user_id from the resume
    const { data: resume } = await supabase
      .from("resumes")
      .select("user_id")
      .eq("id", resumeId)
      .single();

    if (!resume) {
      throw new Error("Resume not found");
    }

    // Store analysis in database
    const { error: insertError } = await supabase
      .from("resume_analysis")
      .insert({
        resume_id: resumeId,
        user_id: resume.user_id,
        ...analysis
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
