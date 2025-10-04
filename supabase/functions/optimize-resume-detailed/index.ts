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
          content: `You are an expert resume optimizer and career coach. Your task is to optimize resumes to better match job descriptions while maintaining authenticity and accuracy.

IMPORTANT GUIDELINES:
1. Only enhance and rephrase existing experiences - never fabricate new ones
2. Use strong action verbs and quantify achievements where possible
3. Align language with job description keywords naturally
4. Maintain professional tone and formatting
5. Ensure ATS compatibility

Respond with a JSON object containing:
- optimizedResume: The improved resume text
- analysis: Object with scores (0-100) for skillsMatchScore, experienceMatchScore, achievementsScore, keywordDensityScore, formatScore, and overallScore
- improvements: Array of specific improvements made
- missingKeywords: Array of important keywords from job description not in resume
- recommendations: Array of strategic recommendations for the candidate`
        },
        {
          role: 'user',
          content: `Job Description:\n${jobDescription}\n\nOriginal Resume:\n${resumeText}`
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
