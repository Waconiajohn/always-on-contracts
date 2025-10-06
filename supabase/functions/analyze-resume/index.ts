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
    const { resumeText, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials not configured");
    if (!userId) throw new Error("User ID is required");

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
            content: `You are an expert resume analyzer who returns structured JSON. Always respond with valid JSON matching the tool schema exactly.`
          },
          {
            role: "user",
            content: `ROLE: You are an elite resume analysis AI specializing in executive career positioning and contract/freelance work optimization.

RESUME TEXT:
${resumeText}

EXTRACTION RULES:
1. DATES: Extract ALL employment dates in YYYY-MM format. If year-only, use YYYY-01. Mark ongoing roles as "Present".
2. ACHIEVEMENTS: Quantify everything. Extract numbers, percentages, dollar amounts, team sizes, timelines.
3. CONTRACT IDENTIFICATION: Flag any indicators of contract/freelance work (keywords: contractor, consultant, freelance, project-based, temporary, contract, 1099, W2).
4. WORK HISTORY: Identify gaps >3 months. Calculate total experience excluding gaps.
5. RATES: If hourly/daily rates mentioned, extract and convert to annual equivalent.
6. SKILLS: Separate technical skills, soft skills, and certifications/tools.
7. INDUSTRY SIGNALS: Identify primary and secondary industries from company names, role titles, and project descriptions.

MANDATORY EXTRACTION:
- Extract detailed work history for last 10-15 years minimum
- For each position: exact dates, company, title, responsibilities, achievements with metrics
- Calculate years_experience accurately from employment dates
- Identify contractor vs employee status from job type keywords
- Extract or estimate hourly rates based on role level and industry

ERROR HANDLING:
- If data is ambiguous, provide best estimate based on context
- Never leave required fields empty - use reasonable defaults
- Flag any data quality concerns

Focus on positioning experience as premium value for executive and strategic opportunities.`
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
                  analysis_summary: { type: "string" },
                  work_history: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        job_title: { type: "string" },
                        company_name: { type: "string" },
                        start_date: { type: "string" },
                        end_date: { type: "string" },
                        is_current: { type: "boolean" },
                        industry: { type: "string" },
                        key_responsibilities: {
                          type: "array",
                          items: { type: "string" }
                        },
                        achievements: {
                          type: "array",
                          items: { type: "string" }
                        },
                        technologies_used: {
                          type: "array",
                          items: { type: "string" }
                        },
                        team_size: { type: "number" },
                        budget_managed: { type: "string" }
                      }
                    }
                  }
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

    // Extract work_history separately and exclude from database insert
    const { work_history, ...analysisForDb } = analysis;

    // Process data types for database insertion
    const processedAnalysis = {
      ...analysisForDb,
      years_experience: analysisForDb.years_experience 
        ? Math.round(Number(analysisForDb.years_experience)) 
        : 0,
      target_hourly_rate_min: analysisForDb.target_hourly_rate_min 
        ? Number(analysisForDb.target_hourly_rate_min) 
        : null,
      target_hourly_rate_max: analysisForDb.target_hourly_rate_max 
        ? Number(analysisForDb.target_hourly_rate_max) 
        : null
    };

    // Store analysis in database (excluding work_history which is a nested array)
    const { error: insertError } = await supabase
      .from("resume_analysis")
      .insert({
        user_id: userId,
        resume_id: null,
        ...processedAnalysis
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
