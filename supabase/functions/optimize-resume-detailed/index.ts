import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeOptimizationResult {
  success: boolean;
  optimizedResume: string;
  analysis: {
    skillsMatchScore: number;
    experienceMatchScore: number;
    achievementsScore: number;
    keywordDensityScore: number;
    formatScore: number;
    overallScore: number;
  };
  improvements: string[];
  missingKeywords: string[];
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { resumeText, jobDescription, provider = 'lovable' } = await req.json();

    // Validate input
    if (!resumeText || resumeText.length < 100) {
      throw new Error('Resume must be at least 100 characters');
    }
    if (!jobDescription || jobDescription.length < 50) {
      throw new Error('Job description must be at least 50 characters');
    }

    console.log('Optimizing resume for user:', user.id);

    const apiUrl = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://ai.gateway.lovable.dev/v1/chat/completions';
    
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : LOVABLE_API_KEY;
    const model = provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash';

    const requestBody: any = {
      model,
      messages: [
        {
          role: 'system',
          content: `ROLE: You are an elite resume optimization expert with 15+ years optimizing executive resumes for Fortune 500 roles and high-value contracts. You understand ATS systems, human recruiter psychology, and executive positioning.

EXPERTISE AREAS:
- ATS keyword optimization (beat 95%+ of applicant tracking systems)
- Executive presence and leadership positioning
- Achievement quantification and impact storytelling
- Industry-specific terminology and credibility signals
- Contract/consulting positioning for premium rates

ANALYSIS FRAMEWORK:
Phase 1 - ATS OPTIMIZATION (40% weight)
- Keyword density analysis (target: 8-12 critical keywords)
- Skills section alignment with job requirements
- Job title and role description matching
- Format compatibility (ATS-friendly structure)

Phase 2 - HUMAN READER IMPACT (40% weight)
- Executive summary strength (hook within 3 seconds)
- Achievement quantification (numbers, %, $, impact scale)
- Leadership indicators (team size, budget, scope)
- Industry credibility signals (company names, project scale)

Phase 3 - EXECUTIVE POSITIONING (20% weight)
- Strategic thinking evidence
- Business impact (revenue, efficiency, transformation)
- Thought leadership indicators
- Premium positioning (contractor: bill rate justification)

OUTPUT REQUIREMENTS:
1. Overall scores (0-100) for each phase
2. Top 5 specific improvements with before/after examples
3. Missing critical keywords with suggested placement
4. 3-5 concrete recommendations ranked by impact

TONE: Direct, specific, actionable. No generic advice. Return valid JSON only.`
        },
        {
          role: 'user',
          content: `Optimize this resume for maximum impact against the target role.

CURRENT RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

DELIVERABLES:
1. Comprehensive scoring across all three phases
2. Specific keyword gaps with integration strategy
3. Achievement enhancement suggestions (add metrics where missing)
4. Executive positioning improvements
5. Final recommendations prioritized by ROI

FORMAT: Return detailed JSON matching the expected schema with optimizedResume, analysis (with all score fields), improvements array, missingKeywords array, and recommendations array.`
        }
      ],
      max_tokens: 4000
    };

    // Add provider-specific parameters
    if (provider === 'openai') {
      requestBody.temperature = 0.7;
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let result;
    try {
      const content = data.choices[0].message.content || '{}';
      // Try to parse JSON from content (handles both OpenAI and Lovable AI responses)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      result = {};
    }

    const optimizationResult: ResumeOptimizationResult = {
      success: true,
      optimizedResume: result.optimizedResume || resumeText,
      analysis: result.analysis || {
        skillsMatchScore: 75,
        experienceMatchScore: 75,
        achievementsScore: 75,
        keywordDensityScore: 75,
        formatScore: 75,
        overallScore: 75
      },
      improvements: result.improvements || [],
      missingKeywords: result.missingKeywords || [],
      recommendations: result.recommendations || []
    };

    // Store optimization result as an artifact
    await supabase
      .from('artifacts')
      .insert({
        user_id: user.id,
        kind: 'rewrittenResume',
        content: optimizationResult.optimizedResume,
        metadata: {
          analysis: optimizationResult.analysis,
          improvements: optimizationResult.improvements,
          missingKeywords: optimizationResult.missingKeywords,
          recommendations: optimizationResult.recommendations
        },
        quality_score: optimizationResult.analysis.overallScore,
        ats_score: optimizationResult.analysis.keywordDensityScore,
        competitiveness_score: optimizationResult.analysis.skillsMatchScore
      });

    return new Response(
      JSON.stringify(optimizationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in optimize-resume-detailed function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
