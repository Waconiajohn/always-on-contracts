import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { JDClassificationSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClassifyJDRequest {
  jd_text: string;
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

    const { jd_text } = await req.json() as ClassifyJDRequest;

    if (!jd_text || jd_text.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Job description too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a career classification expert. Analyze job descriptions to identify:
1. The exact role title (normalize to standard industry titles)
2. Seniority level (IC, Senior IC, Manager, Senior Manager, Director, Senior Director, VP, SVP, C-Level)
3. Industry and sub-industry

Respond ONLY with valid JSON matching this exact schema:
{
  "role_title": "string - the primary normalized role title",
  "role_alternates": ["string array - other valid titles for this role"],
  "seniority_level": "IC | Senior IC | Manager | Senior Manager | Director | Senior Director | VP | SVP | C-Level",
  "industry": "string - primary industry",
  "sub_industry": "string or null - specific sub-industry if applicable",
  "confidence": 0.0-1.0,
  "justification": {
    "role": "why this role title",
    "level": "why this seniority level",
    "industry": "why this industry"
  }
}

Confidence scoring:
- 0.90+ : Clear title, explicit level indicators, obvious industry
- 0.75-0.89 : Clear title with some ambiguity in level or industry
- 0.65-0.74 : Ambiguous title or unclear seniority signals
- <0.65 : Generic/vague JD requiring user confirmation`;

    const userPrompt = `Classify this job description:\n\n${jd_text}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
        response_format: { type: "json_object" },
      },
      "rb-classify-jd",
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
    const result = parseAndValidate(JDClassificationSchema, content, "rb-classify-jd");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rb-classify-jd:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
