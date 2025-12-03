import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface QuickGlanceRequest {
  summary: string;
  accomplishments: string[];
  firstJobBullets: string[];
  jobDescription: string;
  topRequirements?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { summary, accomplishments, firstJobBullets, jobDescription, topRequirements } = await req.json() as QuickGlanceRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert resume reviewer with 19 years of executive coaching experience. You understand how hiring managers scan resumes in the first 8-10 seconds.

Your task is to analyze the "above-the-fold" content of a resume (Summary, Selected Accomplishments, and first job bullets) and determine:
1. Whether it effectively addresses the TOP 3 job requirements
2. What a hiring manager would "see" in an 8-10 second scan
3. Specific suggestions to improve requirement coverage in the glance zone

Return JSON in this exact format:
{
  "score": 7,
  "topRequirements": ["requirement 1", "requirement 2", "requirement 3"],
  "coverageAnalysis": [
    {
      "requirementId": "req1",
      "requirementText": "10+ years leadership experience",
      "coveredIn": ["summary", "first_job"],
      "strength": "strong"
    }
  ],
  "scanSimulation": {
    "summaryHighlights": ["15+ years", "revenue growth", "team leadership"],
    "accomplishmentHighlights": ["$2.4M revenue", "8 direct reports"],
    "firstJobHighlights": ["VP of Operations", "Fortune 500"]
  },
  "suggestions": [
    {
      "section": "accomplishments",
      "current": "Managed team projects",
      "suggested": "Led cross-functional team of 12, delivering $1.8M cost savings through process optimization",
      "reason": "Adds missing 'stakeholder management' requirement with quantified impact"
    }
  ],
  "optimizedContent": {
    "summary": "Optimized summary text if needed",
    "accomplishments": ["Optimized bullet 1", "Optimized bullet 2", "Optimized bullet 3"],
    "firstJobBullets": ["Optimized first job bullet 1"]
  }
}

Strength levels:
- "strong": Requirement is clearly addressed with metrics/evidence
- "weak": Requirement is mentioned but lacks impact/evidence
- "missing": Requirement is not addressed in the glance zone`;

    const userPrompt = `Analyze this resume's "Quick Glance Zone" against the job requirements:

## JOB DESCRIPTION:
${jobDescription}

${topRequirements ? `## TOP REQUIREMENTS (pre-identified):
${topRequirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : ''}

## RESUME - QUICK GLANCE ZONE:

### SUMMARY:
${summary}

### SELECTED ACCOMPLISHMENTS:
${accomplishments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

### FIRST JOB BULLETS:
${firstJobBullets.map((b, i) => `• ${b}`).join('\n')}

Analyze the 8-10 second scan effectiveness and provide optimization suggestions.`;

    console.log("Calling Lovable AI for quick glance optimization...");
    
    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      let cleaned = content.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
      result = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a default result
      result = {
        score: 5,
        topRequirements: topRequirements || [],
        coverageAnalysis: [],
        scanSimulation: {
          summaryHighlights: [],
          accomplishmentHighlights: [],
          firstJobHighlights: []
        },
        suggestions: [],
        optimizedContent: null
      };
    }

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in quick-glance-optimize:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
