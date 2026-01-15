// =====================================================
// GENERATE GAP-FILLING QUESTIONS - Master Resume 2.0
// =====================================================
// INTELLIGENT GAP ANALYSIS
//
// This function identifies gaps by comparing Master Resume contents
// against industry benchmarks and generates TARGETED questions
// that will have the highest impact on resume strength.
//
// UNIQUE VALUE:
// - Only asks questions that ADD value (not just filling forms)
// - Each question shows expected impact on resume strength
// - Prioritized by importance to target role/industry
// - Multi-format questions (multiple choice, yes/no, text)
//
// MARKETING MESSAGE:
// "We identify exactly what's missing from your profile by
// comparing against industry standards—then ask precise
// questions to close those gaps. 5-15 minutes for +10-15%
// resume strength."
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Question type interfaces
interface Question {
  text: string;
  type: 'multiple_choice' | 'checkbox' | 'yes_no' | 'text' | 'scale';
  category: string;
  impactScore: number;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    required: boolean;
  };
}

interface QuestionBatch {
  batchTitle: string;
  batchDescription: string;
  questions: Question[];
  estimatedTime: string;
  impactExplanation: string;
}

interface GapFillingRequest {
  resumeId?: string;
  resumeData?: any;
  industryResearch?: any;
  targetRoles?: string[];
  resumeText?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[generate-gap-filling-questions] Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log(`[generate-gap-filling-questions] User: ${user.id}`);

    // Parse request
    const requestBody: GapFillingRequest = await req.json();
    const { resumeId, resumeData, industryResearch, targetRoles, resumeText } = requestBody;

    if (!resumeData) {
      throw new Error('resumeData is required');
    }

    // ===== PHASE 1: GET CACHED CAREER CONTEXT & AI-POWERED GAP ANALYSIS =====
    console.log('[GAP QUESTIONS] Phase 1: Fetching cached career context and AI gap analysis...');

    let careerContext: any;
    const verifiedAreas: string[] = [];
    const gapAreas: string[] = [];
    let benchmarkGaps: any[] = [];

    // Fetch AI-powered gap analysis (stored in benchmark_comparison table)
    const { data: benchmarkData, error: benchmarkError } = await supabase
      .from('vault_benchmark_comparison')
      .select('*')
      .eq('vault_id', resumeId)
      .single();

    if (benchmarkData && !benchmarkError) {
      console.log('[GAP QUESTIONS] ✅ AI gap analysis found');
      benchmarkGaps = benchmarkData.gaps_requiring_questions || [];
      console.log(`[GAP QUESTIONS] Found ${benchmarkGaps.length} AI-identified gaps`);

      // CRITICAL FIX: Filter out gaps for fields that are already verified with high confidence
      // This prevents asking "Do you have a degree in Mechanical Engineering?" when we already know they do
      const confirmedData = benchmarkData.confirmed_data || {};

      // Build list of confirmed high-confidence fields to EXCLUDE from questions
      const highConfidenceFields: string[] = [];

      if (confirmedData.educationLevel && confirmedData.educationField) {
        highConfidenceFields.push('education');
        highConfidenceFields.push('education_level');
        highConfidenceFields.push('education_field');
        highConfidenceFields.push('degree');
        console.log(`[GAP QUESTIONS] ✅ Education confirmed: ${confirmedData.educationLevel} in ${confirmedData.educationField} - WILL NOT ask about education`);
      }

      if (confirmedData.hasManagementExperience && confirmedData.managementDetails) {
        highConfidenceFields.push('management');
        highConfidenceFields.push('team');
        console.log(`[GAP QUESTIONS] ✅ Management confirmed - WILL NOT ask about management experience`);
      }

      if (confirmedData.hasBudgetOwnership && confirmedData.budgetDetails) {
        highConfidenceFields.push('budget');
        console.log(`[GAP QUESTIONS] ✅ Budget confirmed - WILL NOT ask about budget ownership`);
      }

      if (confirmedData.hasExecutiveExposure && confirmedData.executiveDetails) {
        highConfidenceFields.push('executive');
        console.log(`[GAP QUESTIONS] ✅ Executive exposure confirmed - WILL NOT ask about executive interactions`);
      }

      // Filter benchmark gaps to remove confirmed fields
      const originalGapCount = benchmarkGaps.length;
      benchmarkGaps = benchmarkGaps.filter((gap: any) => {
        const field = (gap.field || '').toLowerCase();
        const isConfirmed = highConfidenceFields.some(confirmedField =>
          field.includes(confirmedField.toLowerCase())
        );

        if (isConfirmed) {
          console.log(`[GAP QUESTIONS] 🚫 FILTERED OUT: "${gap.question}" - field "${gap.field}" is already confirmed`);
          return false;
        }
        return true;
      });

      console.log(`[GAP QUESTIONS] ✅ Filtered ${originalGapCount - benchmarkGaps.length} confirmed fields. ${benchmarkGaps.length} gaps remain.`);

      // Add remaining gaps to gapAreas
      if (benchmarkGaps.length > 0) {
        benchmarkGaps.forEach((gap: any) => {
          gapAreas.push(`${gap.field}: ${gap.context} (${gap.expectedAnswer})`);
        });
        console.log('[GAP QUESTIONS] Using AI-filtered gaps for targeted questions');
      }
    } else {
      console.log('[GAP QUESTIONS] ⚠️ No AI gap analysis found - will generate generic gaps');
    }
    
    const { data: cachedContext, error: contextError } = await supabase
      .from('vault_career_context')
      .select('*')
      .eq('vault_id', resumeId)
      .single();

    if (cachedContext && !contextError) {
      console.log('[GAP QUESTIONS] ✅ Cache hit - using verified career context');
      console.log('[GAP QUESTIONS] 📊 Full Cache Data Retrieved:', {
        resumeId: cachedContext.vault_id, // DB column still named vault_id for backward compatibility
        hasManagement: cachedContext.has_management_experience,
        managementDetails: cachedContext.management_details,
        teamSizes: cachedContext.team_sizes_managed,
        hasBudget: cachedContext.has_budget_ownership,
        budgetAmount: cachedContext.budget_amount,
        hasExecutive: cachedContext.has_executive_exposure,
        educationLevel: cachedContext.education_level,
        educationField: cachedContext.education_field,
        certifications: cachedContext.certifications,
        inferredSeniority: cachedContext.inferred_seniority,
        yearsOfExperience: cachedContext.years_of_experience,
        identifiedGaps: cachedContext.identified_gaps?.length || 0
      });
      
      careerContext = {
        hasManagementExperience: cachedContext.has_management_experience,
        managementDetails: cachedContext.management_details,
        teamSizesManaged: cachedContext.team_sizes_managed || [],
        hasBudgetOwnership: cachedContext.has_budget_ownership,
        budgetDetails: cachedContext.budget_details,
        budgetSizesManaged: cachedContext.budget_sizes_managed || [],
        budgetAmount: cachedContext.budget_amount,
        hasExecutiveExposure: cachedContext.has_executive_exposure,
        inferredSeniority: cachedContext.inferred_seniority,
        yearsOfExperience: cachedContext.years_of_experience,
        careerArchetype: cachedContext.career_archetype,
        technicalDepth: cachedContext.technical_depth,
        leadershipDepth: cachedContext.leadership_depth,
        strategicDepth: cachedContext.strategic_depth,
        // EDUCATION FIELDS (FIX: These were missing!)
        educationLevel: cachedContext.education_level,
        educationField: cachedContext.education_field,
        certifications: cachedContext.certifications || [],
        identifiedGaps: cachedContext.identified_gaps || []
      };

      // Build verified areas list
      if (cachedContext.has_management_experience && cachedContext.management_details) {
        verifiedAreas.push(`Management experience: ${cachedContext.management_details}`);
        console.log('[GAP QUESTIONS] ✓ Management verified:', cachedContext.management_details.substring(0, 100));
      }
      if (cachedContext.has_budget_ownership && cachedContext.budget_details) {
        verifiedAreas.push(`Budget ownership: ${cachedContext.budget_details}`);
        console.log('[GAP QUESTIONS] ✓ Budget verified:', cachedContext.budget_details);
      }
      if (cachedContext.has_executive_exposure && cachedContext.executive_details) {
        verifiedAreas.push(`Executive exposure: ${cachedContext.executive_details}`);
        console.log('[GAP QUESTIONS] ✓ Executive verified:', cachedContext.executive_details);
      }
      // ADD EDUCATION TO VERIFIED AREAS
      if (cachedContext.education_level && cachedContext.education_field) {
        verifiedAreas.push(`Education: ${cachedContext.education_level} in ${cachedContext.education_field}`);
        console.log('[GAP QUESTIONS] ✓ Education verified:', `${cachedContext.education_level} in ${cachedContext.education_field}`);
      } else {
        console.log('[GAP QUESTIONS] ⚠ Education NOT verified - may trigger degree questions');
      }
      
      // Extract gaps
      if (cachedContext.identified_gaps && Array.isArray(cachedContext.identified_gaps)) {
        cachedContext.identified_gaps.forEach((gap: any) => {
          gapAreas.push(`${gap.area}: ${gap.reason}`);
        });
      }
      
      console.log('[GAP QUESTIONS] 📋 Verified Areas Summary:');
      verifiedAreas.forEach(area => console.log(`  ✓ ${area}`));
      console.log('[GAP QUESTIONS] 📋 Gap Areas Summary:');
      gapAreas.forEach(gap => console.log(`  ⚠ ${gap}`));
      console.log('[GAP QUESTIONS] ✅ Using cached career context with', verifiedAreas.length, 'verified areas and', gapAreas.length, 'gaps');
    } else {
      console.warn('[GAP QUESTIONS] ⚠️ Cache miss - resume may need re-extraction');
      console.warn('[GAP QUESTIONS] 🔍 Debug Info:', {
        resumeIdProvided: resumeId,
        contextError: contextError,
        errorCode: contextError?.code,
        errorMessage: contextError?.message,
        cacheQueryResult: cachedContext
      });
      console.warn('[GAP QUESTIONS] ⚠️ This will result in verification questions instead of enhancement questions');
      careerContext = {
        hasManagementExperience: false,
        managementDetails: 'Context not yet analyzed',
        teamSizesManaged: [],
        hasBudgetOwnership: false,
        budgetDetails: '',
        budgetSizesManaged: [],
        hasExecutiveExposure: false,
        inferredSeniority: 'Mid-Level IC',
        yearsOfExperience: 5,
        careerArchetype: 'Unknown',
        technicalDepth: 50,
        leadershipDepth: 30,
        strategicDepth: 40,
        identifiedGaps: []
      };
    }

    console.log('[GAP QUESTIONS] 🎯 Final Career Context for AI Prompt:', { 
      hasManagement: careerContext.hasManagementExperience, 
      hasBudget: careerContext.hasBudgetOwnership,
      hasEducation: !!(careerContext.educationLevel && careerContext.educationField),
      educationLevel: careerContext.educationLevel,
      educationField: careerContext.educationField,
      inferredSeniority: careerContext.inferredSeniority,
      yearsOfExperience: careerContext.yearsOfExperience,
      cached: !!cachedContext,
      verifiedAreasCount: verifiedAreas.length,
      gapAreasCount: gapAreas.length
    });
    
    console.log('[GAP QUESTIONS] 📝 AI Prompt Will Include:');
    console.log('[GAP QUESTIONS]   - Verified Areas:', verifiedAreas.length > 0 ? verifiedAreas : 'None');
    console.log('[GAP QUESTIONS]   - Gap Areas:', gapAreas.length > 0 ? gapAreas : 'None');
    
    // ===== PHASE 2: GAP DETECTION (USING CAREER CONTEXT + RESUME) =====
    console.log('[generate-gap-filling-questions] Phase 2: Generating gap questions based on career context and existing data...');
    
    // Prepare industry context (minimal)
    const industryInsights = industryResearch ? {
      keyCompetencies: industryResearch.required_competencies?.slice(0, 5) || [],
      commonCertifications: industryResearch.certifications?.slice(0, 3) || [],
      marketTrends: industryResearch.trends?.slice(0, 3) || []
    } : null;
    
    // Build gap analysis prompt using AI-detected career context AND resume text
    const gapAnalysisPrompt = `
You are an expert career strategist analyzing a professional's career profile to identify CRITICAL gaps.

## VERIFIED AREAS (DO NOT ASK ABOUT THESE):
${verifiedAreas.length > 0 ? verifiedAreas.map(v => `✓ ${v}`).join('\n') : 'None verified yet'}

## BENCHMARK-DRIVEN GAPS (PRIORITY - ASK THESE FIRST):
${benchmarkGaps.length > 0 ? benchmarkGaps.map((g: any) => `🎯 ${g.field}: ${g.question}\n   Context: ${g.context}\n   Expected: ${g.expectedAnswer}`).join('\n\n') : 'None - use resume analysis to identify gaps'}

## IDENTIFIED GAPS (ASK ONLY IF NOT COVERED BY BENCHMARK GAPS):
${gapAreas.length > 0 ? gapAreas.map(g => `⚠ ${g}`).join('\n') : 'No specific gaps identified - use resume to find areas needing clarification'}

## RESUME CONTENT (WHAT WE ALREADY KNOW):
${resumeText ? `
Resume Text (first 3000 chars):
${resumeText.substring(0, 3000)}

IMPORTANT: The resume above contains their background. DO NOT ask questions about information that's clearly stated in their resume.
` : 'Resume text not provided.'}

## CAREER CONTEXT (AI-DETECTED FROM RESUME):
Inferred Career Level: ${careerContext.inferredSeniority}
Years of Experience: ${careerContext.yearsOfExperience}

Management Experience: ${careerContext.hasManagementExperience ? 'YES ✓ - ' + careerContext.managementDetails : 'NO'}
${careerContext.hasBudgetOwnership && careerContext.budgetAmount ? `Budget Responsibility: $${careerContext.budgetAmount?.toLocaleString()} ✓` : ''}
${careerContext.educationLevel && careerContext.educationField ? `Education: ${careerContext.educationLevel} in ${careerContext.educationField} ✓` : ''}
${careerContext.certifications && careerContext.certifications.length > 0 ? `Certifications: ${careerContext.certifications.join(', ')} ✓` : ''}

Executive Exposure: ${careerContext.hasExecutiveExposure ? 'YES ✓' : 'NO'}
Career Archetype: ${careerContext.careerArchetype}

## PROFESSIONAL IDENTITY:
Current Title: ${resumeData.professional_identity?.current_title || 'Unknown'}
Industry: ${resumeData.professional_identity?.industry || 'Unknown'}
Years of Experience: ${resumeData.professional_identity?.years_of_experience || careerContext.yearsOfExperience}
Target Roles: ${resumeData.professional_identity?.target_roles?.join(', ') || targetRoles?.join(', ') || 'Not specified'}

## MASTER RESUME STRENGTH:
Overall Strength: ${resumeData.overall_strength_score || 0}%
Completion: ${resumeData.review_completion_percentage || 0}%

${industryInsights ? `## INDUSTRY CONTEXT:
Expected Competencies: ${industryInsights.keyCompetencies.join(', ')}
Standard Certifications: ${industryInsights.commonCertifications.join(', ')}
Market Trends: ${industryInsights.marketTrends.join(', ')}` : ''}

${targetRoles && targetRoles.length > 0 ? `## TARGET ROLES: ${targetRoles.join(', ')}` : ''}

## Your Task:

Generate gap-filling questions that address information NOT found in the resume or career context above.

CRITICAL RULES FOR QUESTION GENERATION:

1. **PRIORITIZE BENCHMARK GAPS:**
   - If "BENCHMARK-DRIVEN GAPS" are present above, generate questions for those FIRST
   - Benchmark gaps are role-specific and high-impact - they should be your primary focus
   - Only add additional questions if you identify other critical gaps not covered by benchmarks

2. **NEVER ASK ABOUT VERIFIED AREAS:**
   - Review the "VERIFIED AREAS" section above - these are CONFIRMED, do NOT ask about them
   - If education is verified (e.g., "Bachelor's in Mechanical Engineering") → DO NOT ask "Do you have a degree?"
   - If management is verified (e.g., "Supervised 3-4 rigs") → DO NOT ask "Have you managed teams?"
   - If budget responsibility is verified → DO NOT ask about budget experience
   - ONLY ask about the "BENCHMARK GAPS" or "IDENTIFIED GAPS" areas

3. **Career Level Matching:**
   - Questions must match their ACTUAL career level (${careerContext.inferredSeniority})
   - ${['Manager', 'Senior Manager', 'Director', 'VP', 'C-Level'].includes(careerContext.inferredSeniority) ? 
     'Focus on strategic impact, cross-functional leadership, and scaling operations' : 
     'Focus on building foundational skills and documenting technical achievements'}

3. **Industry Specificity:**
   - Use terminology from THEIR industry (${resumeData.professional_identity?.industry || 'their field'})
   - Ask about gaps that are REALISTIC for someone in their specific role
   - NO generic questions that could apply to anyone

Generate 5-15 highly targeted questions organized into logical batches. Each question should:
1. Address a SPECIFIC gap that someone in THEIR EXACT role would realistically have
2. Have measurable impact on vault strength (rate 1-10)
3. Be answerable in <2 minutes
4. Use the most appropriate question format (multiple choice, yes/no, text, scale)

## Output Format (strict JSON):
{
  "criticalGapsIdentified": ["gap 1", "gap 2", "gap 3"],
  "totalQuestions": 10,
  "estimatedVaultStrengthBoost": 15,
  "batches": [
    {
      "batchTitle": "[Role-Appropriate Title]",
      "batchDescription": "[Description matching their field]",
      "estimatedTime": "3-5 minutes",
      "impactExplanation": "[Explanation relevant to their career level and industry]",
      "questions": [
        {
          "text": "[Question text tailored to their actual role]",
          "type": "yes_no",
          "category": "[category]",
          "impactScore": 9,
          "validation": {
            "required": true
          }
        },
        {
          "text": "[Another role-appropriate question]",
          "type": "multiple_choice",
          "category": "[category]",
          "impactScore": 8,
          "options": ["[Option 1]", "[Option 2]", "[Option 3]", "[Option 4]"],
          "validation": {
            "required": true
          }
        },
        {
          "text": "[Multi-select question] (Select all that apply)",
          "type": "checkbox",
          "category": "[category]",
          "impactScore": 8,
          "options": ["[Option 1]", "[Option 2]", "[Option 3]", "[Option 4]"],
          "validation": {
            "required": false
          }
        },
        {
          "text": "[Open-ended question for narrative]",
          "type": "text",
          "category": "[category]",
          "impactScore": 10,
          "validation": {
            "minLength": 50,
            "maxLength": 500,
            "required": false
          }
        }
      ]
    }
  ]
}

CRITICAL TYPE SELECTION RULES:
- If the question text includes "Select all that apply" OR "Which of the following" (plural) → MUST use "type": "checkbox"
- If asking for a single choice from options → use "type": "multiple_choice"
- If asking yes/no → use "type": "yes_no"
- If asking for free text → use "type": "text"
- If asking for a number → use "type": "number"

IMPORTANT:
- Only ask questions where the answer is clearly MISSING or WEAK in the vault
- Prioritize questions with impactScore 7-10 (game-changers for THIS PERSON'S career level and field)
- Mix question types for better user experience
- Keep batches to 3-5 questions each for psychological momentum
- NO generic questions - every question must tie to competencies relevant to THEIR specific role and industry

QUESTION TYPE GUIDELINES:
- Use "multiple_choice" for single-selection questions (e.g., "What was the size of...")
- Use "checkbox" for multi-selection questions - ALWAYS include "(Select all that apply)" in the question text
- Use "yes_no" for binary questions
- Use "text" for open-ended narrative questions
- Use "scale" for rating/scoring questions
`;

    console.log('[generate-gap-filling-questions] Calling Lovable AI...');

    // Call Lovable AI
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert career advisor analyzing professional profiles to identify growth opportunities. Always return valid JSON.'
          },
          {
            role: 'user',
            content: gapAnalysisPrompt
          }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      },
      'generate-gap-filling-questions',
      user.id
    );

    // Log usage for cost tracking
    await logAIUsage(metrics);

    console.log('[generate-gap-filling-questions] AI response received');

    // Parse response
    const rawContent = response.choices[0].message.content;
    
    let questionData;
    try {
      // Remove markdown code blocks and trim
      let cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON if response contains extra text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      questionData = JSON.parse(cleanedContent);
      
      // Validate the response has required structure
      if (!questionData.batches || !Array.isArray(questionData.batches)) {
        console.error('Invalid response structure - missing batches array');
        questionData = {
          criticalGapsIdentified: [],
          totalQuestions: 0,
          estimatedVaultStrengthBoost: 0,
          batches: []
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      console.error('Raw content (first 500 chars):', rawContent.substring(0, 500));
      
      // Return empty but valid structure instead of throwing
      questionData = {
        criticalGapsIdentified: [],
        totalQuestions: 0,
        estimatedVaultStrengthBoost: 0,
        batches: []
      };
    }

    // Auto-fix type mismatches (post-processing validation)
    if (questionData.batches) {
      questionData.batches = questionData.batches.map((batch: any) => ({
        ...batch,
        questions: batch.questions.map((q: any) => {
          // If question text indicates multi-select but type is wrong, fix it
          const textLower = q.text.toLowerCase();
          if ((textLower.includes('select all that apply') || 
               textLower.includes('which of the following')) && 
              q.type === 'multiple_choice') {
            console.log(`[AUTO-FIX] Changed question type from multiple_choice to checkbox: "${q.text}"`);
            return { ...q, type: 'checkbox' };
          }
          return q;
        })
      }));
    }

    console.log('✅ [GAP QUESTIONS] Generated gap-filling questions:', {
      batches: questionData.batches?.length || 0,
      totalQuestions: questionData.totalQuestions || 0,
      estimatedBoost: questionData.estimatedVaultStrengthBoost || 0,
      criticalGaps: questionData.criticalGapsIdentified || []
    });
    
    console.log('📊 [GAP QUESTIONS] Question Categories Generated:');
    questionData.batches?.forEach((batch: any, idx: number) => {
      console.log(`  Batch ${idx + 1}: ${batch.batchTitle} (${batch.questions?.length || 0} questions)`);
    });

    // Return with marketing messaging
    return new Response(
      JSON.stringify({
        success: true,
        data: questionData,
        meta: {
          message: `🎯 Identified ${questionData.criticalGapsIdentified?.length || 0} critical gaps with ${questionData.totalQuestions || 0} targeted questions.`,
          uniqueValue: `Our AI compared your vault against industry standards to identify EXACTLY what's missing. Each question is designed to fill a specific gap—no generic forms or wasted time.`,
          impactEstimate: `Answering these questions could boost your vault strength by approximately ${questionData.estimatedVaultStrengthBoost || 10}%. This is the difference between "good" and "exceptional" profiles.`,
          timeEstimate: `Estimated completion: 5-15 minutes to reach 85%+ vault strength.`,
          skipNote: `You can skip this step, but industry leaders typically achieve 85-95% vault strength—and these questions are the fastest path there.`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-gap-filling-questions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'We encountered an issue generating questions. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
