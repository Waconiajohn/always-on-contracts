import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Semantic Matching: Find hidden qualifications using AI context understanding
 * 
 * Goes beyond keyword matching to find:
 * - Similar concepts expressed differently
 * - Transferable skills from other industries
 * - Hidden qualifications user doesn't realize they have
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const {
      resumeContent,
      jobRequirements,
      jobDescription,
      industry = 'General',
      targetIndustry = 'General'
    } = await req.json();

    if (!resumeContent || !jobRequirements) {
      throw new Error("Missing required parameters");
    }

    const prompt = `You are an expert career transition analyst. Perform SEMANTIC MATCHING between resume and job requirements.

CRITICAL: Go BEYOND keyword matching. Find:
1. Similar concepts expressed with different terminology
2. Transferable skills from ${industry} to ${targetIndustry}
3. Hidden qualifications the candidate doesn't realize they have

RESUME CONTENT:
${resumeContent}

JOB REQUIREMENTS:
${jobRequirements.map((req: any, idx: number) => `${idx + 1}. ${req}`).join('\n')}

JOB DESCRIPTION CONTEXT:
${jobDescription?.substring(0, 1000) || 'Not provided'}

EXAMPLES OF SEMANTIC MATCHING:
- Job requires: "Stakeholder management"
  Resume says: "Coordinated with C-suite, board members, and external partners"
  Match: ✅ This IS stakeholder management (keyword matching would miss this)

- Job requires: "Agile methodology"
  Resume says: "Led iterative development cycles with 2-week sprints"
  Match: ✅ This demonstrates Agile understanding without using the exact term

- Job requires: "Change management"
  Resume says: "Guided organization through digital transformation affecting 500+ employees"
  Match: ✅ This is change management at scale

ANALYZE AND RETURN JSON:
{
  "semanticMatches": [
    {
      "requirement": "The exact job requirement",
      "resumeEvidence": "Where/how the resume demonstrates this",
      "matchConfidence": 0.95,
      "matchReasoning": "Why this is a semantic match",
      "isHiddenQualification": true,
      "suggestionForResume": "How to make this match more explicit in resume"
    }
  ],
  "transferableSkills": [
    {
      "skillFromResume": "Skill demonstrated in ${industry}",
      "applicableToRole": "How it transfers to ${targetIndustry}",
      "strengthOfTransfer": "high",
      "evidenceStatement": "Specific example from resume"
    }
  ],
  "missingRequirements": [
    {
      "requirement": "Requirement truly missing from resume",
      "severity": "critical",
      "canDevelop": true,
      "developmentSuggestion": "How candidate could develop this skill"
    }
  ],
  "overallMatchScore": 85,
  "matchSummary": "High-level summary of candidate fit based on semantic analysis"
}`;

    // Use smart model selection - complex reasoning task
    const model = selectOptimalModel({
      taskType: 'analysis',
      complexity: 'high',
      requiresReasoning: true,
      estimatedInputTokens: Math.ceil((resumeContent.length + jobDescription.length) / 4) + 400,
      estimatedOutputTokens: 1200
    });

    console.log(`[semantic-match-resume] Using model: ${model}`);

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: "system",
            content: "You are an expert career analyst specializing in semantic matching and transferable skills analysis. Look beyond keywords to find true capability matches. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model,
        temperature: 0.2,
        max_tokens: 2000,
        return_citations: false,
      },
      'semantic-match-resume',
      user.id
    );

    await logAIUsage(metrics);

    const content_text = cleanCitations(response.choices[0].message.content);

    console.log("AI semantic matching response:", content_text.substring(0, 500));

    // Extract JSON from response
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    const semanticAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!semanticAnalysis) {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(semanticAnalysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in semantic-match-resume:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
