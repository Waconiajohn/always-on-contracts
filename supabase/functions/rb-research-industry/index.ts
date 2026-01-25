import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { IndustryResearchSchema, parseAndValidate } from '../_shared/rb-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResearchRequest {
  role_title: string;
  seniority_level: string;
  industry: string;
  force_refresh?: boolean;
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

    const { role_title, seniority_level, industry, force_refresh } = await req.json() as ResearchRequest;

    if (!role_title || !seniority_level || !industry) {
      return new Response(JSON.stringify({ error: "Missing required fields: role_title, seniority_level, industry" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize inputs for cache lookup
    const normalizedRole = role_title.toLowerCase().trim();
    const normalizedLevel = seniority_level.toLowerCase().trim();
    const normalizedIndustry = industry.toLowerCase().trim();

    // Check cache first (unless force_refresh)
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from("rb_industry_research")
        .select("*")
        .eq("role_title", normalizedRole)
        .eq("seniority_level", normalizedLevel)
        .eq("industry", normalizedIndustry)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached) {
        console.log(`[rb-research-industry] Cache hit for ${normalizedRole}/${normalizedLevel}/${normalizedIndustry}`);
        return new Response(JSON.stringify({
          ...cached.research_data,
          cached: true,
          cache_id: cached.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`[rb-research-industry] Generating research for ${role_title}/${seniority_level}/${industry}`);

    const systemPrompt = `You are an expert career strategist and resume optimization specialist with deep knowledge of hiring trends across all industries. Your task is to provide comprehensive industry research that will help create world-class resumes.

Analyze the given role/seniority/industry combination and provide:
1. **Keywords**: The exact terms ATS systems and recruiters look for
2. **Power Phrases**: High-impact language that signals excellence
3. **Qualifications**: What's expected at this level (education, certs, experience)
4. **Competitive Benchmarks**: What separates top performers from average candidates
5. **Summary Template**: The ideal structure for a professional summary
6. **Experience Focus**: Key areas to emphasize in work history

Be specific to the seniority level - a Director needs different keywords than an IC.
Be specific to the industry - tech differs from healthcare differs from finance.

Respond ONLY with valid JSON matching this schema:
{
  "role_title": "string",
  "seniority_level": "string",
  "industry": "string",
  "keywords": [
    {
      "term": "string",
      "frequency": "very_common | common | occasional",
      "category": "hard_skill | tool | methodology | certification | domain"
    }
  ],
  "power_phrases": [
    {
      "phrase": "string - e.g., 'Drove $XM in revenue growth'",
      "impact_level": "high | medium",
      "use_case": "string - when to use this phrase"
    }
  ],
  "typical_qualifications": [
    {
      "qualification": "string",
      "importance": "required | preferred | bonus",
      "category": "education | certification | experience | skill"
    }
  ],
  "competitive_benchmarks": [
    {
      "area": "string - what's being measured",
      "top_performer": "string - what elite candidates show",
      "average": "string - what typical candidates show"
    }
  ],
  "summary_template": "string - ideal structure for professional summary",
  "experience_focus": ["string array - key areas to emphasize"]
}

Provide at least:
- 15 keywords
- 8 power phrases
- 10 qualifications
- 6 competitive benchmarks`;

    const userPrompt = `Generate comprehensive industry research for:
Role: ${role_title}
Seniority: ${seniority_level}
Industry: ${industry}

Focus on 2025 hiring trends and what makes candidates stand out in competitive markets.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: LOVABLE_AI_MODELS.PREMIUM, // Use GPT-5 for high-quality research
        response_format: { type: "json_object" },
      },
      "rb-research-industry",
      user.id,
      60000 // 60 second timeout for comprehensive research
    );

    await logAIUsage(metrics);

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate response
    const result = parseAndValidate(IndustryResearchSchema, content, "rb-research-industry");

    // Cache the result (upsert to handle conflicts)
    const { data: cached, error: cacheError } = await supabase
      .from("rb_industry_research")
      .upsert({
        role_title: normalizedRole,
        seniority_level: normalizedLevel,
        industry: normalizedIndustry,
        research_data: result,
        keywords: result.keywords,
        power_phrases: result.power_phrases,
        typical_qualifications: result.typical_qualifications,
        competitive_benchmarks: result.competitive_benchmarks,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }, {
        onConflict: 'role_title,seniority_level,industry',
      })
      .select()
      .single();

    if (cacheError) {
      console.warn("[rb-research-industry] Failed to cache result:", cacheError);
    }

    return new Response(JSON.stringify({
      ...result,
      cached: false,
      cache_id: cached?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in rb-research-industry:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
