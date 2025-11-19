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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { createLogger } from '../_shared/logger.ts';

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { resumeText, vaultId }: InitialAnalysisRequest = await req.json();

    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Resume text is too short or missing');
    }

    console.log('🔍 Starting initial resume analysis for user:', user.id);

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          {
            role: 'system',
            content: `You are an elite executive career analyst with deep expertise across all industries. Return ONLY valid JSON, no additional text or explanations.

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

CRITICAL: Return ONLY this exact JSON structure, nothing else:
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
  "executiveSummary": "2-3 sentence summary"
}`
          },
          {
            role: 'user',
            content: `Analyze this resume:\n\n${resumeText}`
          }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      'analyze-resume-initial',
      user.id
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    console.log('[analyze-resume-initial] Raw AI response:', rawContent.substring(0, 500));

    const parseResult = extractJSON(rawContent);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[analyze-resume-initial] JSON parse failed:', parseResult.error);
      console.error('[analyze-resume-initial] Full response:', rawContent);
      const logger = createLogger('analyze-resume-initial');
      logger.error('JSON parsing failed', {
        error: parseResult.error,
        content: rawContent.substring(0, 500)
      });
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const analysisResult: InitialAnalysisResponse = parseResult.data;

    // Validate required fields
    if (!analysisResult.detectedRole || 
        !analysisResult.detectedIndustry || 
        typeof analysisResult.yearsExperience !== 'number' ||
        !analysisResult.seniorityLevel ||
        !Array.isArray(analysisResult.keyAchievements)) {
      console.error('[analyze-resume-initial] Missing required fields:', analysisResult);
      throw new Error('AI response missing required fields');
    }

    console.log('[analyze-resume-initial] Analysis complete:', {
      role: analysisResult.detectedRole,
      industry: analysisResult.detectedIndustry,
      seniority: analysisResult.seniorityLevel,
      achievements: analysisResult.keyAchievements.length
    });

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
      }
    }

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
        error: error instanceof Error ? error.message : String(error),
        userMessage: 'We encountered an issue analyzing your resume. Please try again or contact support.',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
