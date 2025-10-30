// =====================================================
// ANALYZE RESUME INITIAL - Career Vault 2.0
// =====================================================
// This function performs the FIRST AI analysis of a user's resume
// providing instant insights that no other platform offers.
//
// UNIQUE VALUE PROPOSITION:
// - Detects role, industry, and seniority in <5 seconds
// - Extracts top achievements automatically
// - Identifies career trajectory and growth patterns
// - Sets intelligent defaults for the entire onboarding
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface InitialAnalysisRequest {
  resumeText: string;
  vaultId?: string;
}

interface InitialAnalysisResponse {
  detectedRole: string;
  detectedIndustry: string;
  yearsExperience: number;
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'executive';
  keyAchievements: string[];
  previousRoles: Array<{
    title: string;
    company: string;
    years: number;
  }>;
  educationHighlights: string[];
  careerTrajectory: 'steady_growth' | 'rapid_advancement' | 'specialist' | 'career_change';
  executiveSummary: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { resumeText, vaultId }: InitialAnalysisRequest = await req.json();

    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Resume text is too short or missing');
    }

    console.log('🔍 Starting initial resume analysis for user:', user.id);

    // Call Lovable AI for analysis
    const aiResponse = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content: `You are an elite executive career analyst with deep expertise across all industries.

Your task is to perform INSTANT, INTELLIGENT analysis of resumes to extract:
1. Current/most recent role and industry
2. Total years of professional experience
3. Seniority level (entry/mid/senior/executive)
4. Top 5-7 most impressive achievements
5. Career trajectory pattern
6. Education highlights

CRITICAL INSTRUCTIONS:
- Be PRECISE: Don't guess if information isn't clear
- Be EXECUTIVE-FOCUSED: Prioritize leadership, impact, scale
- Be ACHIEVEMENT-ORIENTED: Extract quantified results
- Be PATTERN-AWARE: Identify career growth trajectory

Return ONLY valid JSON with this exact structure:
{
  "detectedRole": "string (most recent job title)",
  "detectedIndustry": "string (primary industry)",
  "yearsExperience": number (total professional years),
  "seniorityLevel": "entry" | "mid" | "senior" | "executive",
  "keyAchievements": ["achievement 1", "achievement 2", ...],
  "previousRoles": [
    { "title": "string", "company": "string", "years": number }
  ],
  "educationHighlights": ["degree/cert 1", "degree/cert 2"],
  "careerTrajectory": "steady_growth" | "rapid_advancement" | "specialist" | "career_change",
  "executiveSummary": "2-3 sentence summary of their career story"
}

SENIORITY GUIDELINES:
- entry: 0-3 years, junior/associate titles
- mid: 3-8 years, manager/senior titles
- senior: 8-15 years, director/senior manager titles
- executive: 15+ years OR VP/C-suite titles

CAREER TRAJECTORY:
- steady_growth: Consistent progression within industry
- rapid_advancement: Quick promotions, early leadership
- specialist: Deep expertise in specific domain
- career_change: Major industry/role shifts

NO MARKDOWN. NO EXPLANATIONS. ONLY JSON.`,
          },
          {
            role: 'user',
            content: `Analyze this resume and extract the key information:\n\n${resumeText}`,
          },
        ],
        temperature: 0.3, // Low temperature for consistent extraction
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse JSON response
    let analysisResult: InitialAnalysisResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate required fields
    if (!analysisResult.detectedRole || !analysisResult.detectedIndustry) {
      throw new Error('AI failed to detect role or industry');
    }

    console.log('✅ Analysis complete:', {
      role: analysisResult.detectedRole,
      industry: analysisResult.detectedIndustry,
      seniority: analysisResult.seniorityLevel,
      achievements: analysisResult.keyAchievements.length,
    });

    // If vaultId provided, update the vault record
    if (vaultId) {
      const { error: updateError } = await supabaseClient
        .from('career_vault')
        .update({
          initial_analysis: analysisResult,
          onboarding_step: 'analysis_complete',
        })
        .eq('id', vaultId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update vault:', updateError);
        // Don't throw - analysis succeeded, just log the error
      }
    }

    // Return analysis with marketing message
    return new Response(
      JSON.stringify({
        success: true,
        data: analysisResult,
        meta: {
          message: '🎯 Analysis complete! Your resume has been processed with AI-powered intelligence that identifies patterns most recruiters miss.',
          uniqueInsight: `We've detected your ${analysisResult.seniorityLevel}-level ${analysisResult.detectedRole} background and identified ${analysisResult.keyAchievements.length} key achievements. This level of instant intelligence is unique to our platform.`,
          nextStep: 'Now let\'s research what separates top performers in your field...',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-resume-initial:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        userMessage: 'We encountered an issue analyzing your resume. Please try again or contact support.',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
