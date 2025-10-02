import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface GapAnalysisResult {
  overallFit: number;
  strengths: Array<{
    category: string;
    description: string;
    evidence: string[];
  }>;
  gaps: Array<{
    category: string;
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    recommendations: string[];
  }>;
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    coverage: number;
  };
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

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

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    console.log('Performing gap analysis for user:', user.id);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing candidate-job fit. Perform a comprehensive gap analysis between the candidate's resume and the job requirements.

Analyze:
1. Technical skills match
2. Experience level alignment
3. Leadership/management experience
4. Industry knowledge
5. Cultural fit indicators
6. Keyword coverage

Provide a detailed JSON response with:
- overallFit: Score 0-100
- strengths: Array of candidate strengths with evidence (each with category, description, and evidence array)
- gaps: Array of gaps with severity ('critical', 'moderate', or 'minor'), description, and recommendations
- keywordAnalysis: Object with matched (array), missing (array), and coverage (percentage 0-100)
- recommendations: Array of strategic recommendations to address gaps`
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nCandidate Resume:\n${resumeText}`
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content || '{}');

    const gapAnalysisResult: GapAnalysisResult = {
      overallFit: result.overallFit || 0,
      strengths: result.strengths || [],
      gaps: result.gaps || [],
      keywordAnalysis: result.keywordAnalysis || {
        matched: [],
        missing: [],
        coverage: 0
      },
      recommendations: result.recommendations || []
    };

    // Store gap analysis as an artifact
    await supabase
      .from('artifacts')
      .insert({
        user_id: user.id,
        kind: 'gapAnalysis',
        content: JSON.stringify(gapAnalysisResult),
        metadata: {
          overallFit: gapAnalysisResult.overallFit,
          gapCount: gapAnalysisResult.gaps.length,
          strengthCount: gapAnalysisResult.strengths.length,
          keywordCoverage: gapAnalysisResult.keywordAnalysis.coverage
        },
        quality_score: gapAnalysisResult.overallFit,
        competitiveness_score: gapAnalysisResult.keywordAnalysis.coverage
      });

    return new Response(
      JSON.stringify(gapAnalysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in gap-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
