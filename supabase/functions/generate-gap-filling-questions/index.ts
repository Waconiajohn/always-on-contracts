// =====================================================
// GENERATE GAP-FILLING QUESTIONS - Career Vault 2.0
// =====================================================
// INTELLIGENT GAP ANALYSIS
//
// This function identifies gaps by comparing vault contents
// against industry benchmarks and generates TARGETED questions
// that will have the highest impact on vault strength.
//
// UNIQUE VALUE:
// - Only asks questions that ADD value (not just filling forms)
// - Each question shows expected impact on vault strength
// - Prioritized by importance to target role/industry
// - Multi-format questions (multiple choice, yes/no, text)
//
// MARKETING MESSAGE:
// "We identify exactly what's missing from your profile by
// comparing against industry standards—then ask precise
// questions to close those gaps. 5-15 minutes for +10-15%
// vault strength."
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

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
  vaultData: any;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`[generate-gap-filling-questions] User: ${user.id}`);

    // Parse request
    const requestBody: GapFillingRequest = await req.json();
    const { vaultData, industryResearch, targetRoles, resumeText } = requestBody;

    if (!vaultData) {
      throw new Error('vaultData is required');
    }

    // ===== PHASE 1: CAREER CONTEXT ANALYSIS (AI-POWERED) =====
    // Use AI to analyze FULL resume and vault data to detect management experience
    
    console.log('[generate-gap-filling-questions] Phase 1: Analyzing career context with AI...');
    
    // Prepare FULL resume text (no truncation)
    const fullResumeText = resumeText || 'No resume provided';
    
    // Extract ALL vault power phrases and achievements for context
    const allPowerPhrases = vaultData.power_phrases?.map((pp: any) => pp.power_phrase || pp.phrase).filter(Boolean) || [];
    const allAchievements = vaultData.achievements?.map((a: any) => a.description).filter(Boolean) || [];
    
    const careerAnalysisPrompt = `
Analyze this professional's career to detect management and leadership experience.

FULL RESUME TEXT:
${fullResumeText}

VAULT POWER PHRASES (ALL):
${allPowerPhrases.join('\n')}

VAULT ACHIEVEMENTS (ALL):
${allAchievements.join('\n')}

TASK: Return a career context analysis in this exact JSON format:
{
  "hasManagementExperience": boolean,
  "managementEvidence": [
    "Evidence item 1 (e.g., job title)",
    "Evidence item 2 (e.g., team scope)",
    "Evidence item 3 (e.g., budget authority)"
  ],
  "teamSizesDetected": [3, 4, 12],
  "budgetAmountsDetected": [350000000],
  "careerLevel": "Manager" | "Director" | "VP" | "Senior IC" | "Mid IC" | "Entry IC",
  "leadershipScope": "Brief description of leadership scope",
  "confidenceScore": 0.95
}

Look for:
- Job titles: supervisor, manager, director, VP, head, chief, lead
- Team indicators: "team of X", "X engineers", "guided X people", "managed X rigs", "direct reports"
- Budget indicators: "$XM", "$XMM", "$XB", "budget", "P&L"
- Leadership verbs: led, managed, directed, supervised, guided, oversaw, coordinated
- Scope indicators: multi-location, regional, global, cross-functional

Return ONLY the JSON object, no additional text.
`;

    // Call AI for career context analysis
    const { response: careerResponse, metrics: careerMetrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert career analyst. Extract management and leadership indicators from resumes. Return only valid JSON.'
          },
          {
            role: 'user',
            content: careerAnalysisPrompt
          }
        ],
        model: selectOptimalModel({
          taskType: 'analysis',
          complexity: 'high',
          requiresReasoning: true,
          outputLength: 'short'
        }),
        temperature: 0.1,
        max_tokens: 2000,
        return_citations: false,
      },
      'generate-gap-filling-questions-phase1',
      user.id
    );

    await logAIUsage(careerMetrics);

    // Parse career context
    let careerContext;
    try {
      const rawCareerContent = cleanCitations(careerResponse.choices[0].message.content);
      let cleanedCareerContent = rawCareerContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanedCareerContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedCareerContent = jsonMatch[0];
      }
      careerContext = JSON.parse(cleanedCareerContent);
      
      console.log('[generate-gap-filling-questions] Phase 1 complete:', {
        hasManagementExperience: careerContext.hasManagementExperience,
        careerLevel: careerContext.careerLevel,
        confidenceScore: careerContext.confidenceScore
      });
    } catch (parseError) {
      console.error('Failed to parse career context:', parseError);
      // Fallback to empty context
      careerContext = {
        hasManagementExperience: false,
        managementEvidence: [],
        teamSizesDetected: [],
        budgetAmountsDetected: [],
        careerLevel: 'Mid IC',
        leadershipScope: 'Unable to determine',
        confidenceScore: 0.0
      };
    }
    
    // ===== PHASE 2: GAP DETECTION (USING CAREER CONTEXT) =====
    console.log('[generate-gap-filling-questions] Phase 2: Generating gap questions based on career context...');
    
    // Prepare industry context (minimal)
    const industryInsights = industryResearch ? {
      keyCompetencies: industryResearch.required_competencies?.slice(0, 5) || [],
      commonCertifications: industryResearch.certifications?.slice(0, 3) || [],
      marketTrends: industryResearch.trends?.slice(0, 3) || []
    } : null;
    
    // Build gap analysis prompt using AI-detected career context
    const gapAnalysisPrompt = `
You are an expert career strategist analyzing a professional's career profile to identify CRITICAL gaps.

## CAREER CONTEXT (AI-DETECTED):
Management Experience: ${careerContext.hasManagementExperience ? 'YES ✓' : 'NO'}
${careerContext.hasManagementExperience ? `
Evidence Found:
${careerContext.managementEvidence.map((e: string) => `- ${e}`).join('\n')}

Team Sizes Managed: ${careerContext.teamSizesDetected.join(', ')}
Budget Amounts: ${careerContext.budgetAmountsDetected.map((b: number) => `$${(b/1000000).toFixed(0)}MM`).join(', ')}
Leadership Scope: ${careerContext.leadershipScope}
` : 'No management experience detected in resume or vault.'}

Career Level: ${careerContext.careerLevel}
AI Confidence: ${(careerContext.confidenceScore * 100).toFixed(0)}%

## PROFESSIONAL IDENTITY:
Current Title: ${vaultData.professional_identity?.current_title || 'Unknown'}
Industry: ${vaultData.professional_identity?.industry || 'Unknown'}
Years of Experience: ${vaultData.professional_identity?.years_of_experience || 0}
Target Roles: ${vaultData.professional_identity?.target_roles?.join(', ') || 'Not specified'}

## VAULT STRENGTH:
Overall Strength: ${vaultData.overall_strength_score || 0}%
Completion: ${vaultData.review_completion_percentage || 0}%

${industryInsights ? `## INDUSTRY CONTEXT:
Expected Competencies: ${industryInsights.keyCompetencies.join(', ')}
Standard Certifications: ${industryInsights.commonCertifications.join(', ')}
Market Trends: ${industryInsights.marketTrends.join(', ')}` : ''}

${targetRoles && targetRoles.length > 0 ? `## TARGET ROLES: ${targetRoles.join(', ')}` : ''}

## Your Task:

Based on the ACTUAL career context above (AI-analyzed, not assumptions), generate gap-filling questions.

CRITICAL RULES FOR QUESTION GENERATION:

1. **Management Experience Questions:**
   - If hasManagementExperience = true: Ask about ADVANCING management scope (larger teams, bigger budgets, strategic leadership)
   - If hasManagementExperience = false: First ask if they have undocumented management experience, then ask about acquiring it
   - DO NOT say "zero management experience" if evidence shows otherwise

2. **Career Level Matching:**
   - Questions must match their ACTUAL career level (${careerContext.careerLevel})
   - ${careerContext.careerLevel === 'Manager' || careerContext.careerLevel === 'Director' || careerContext.careerLevel === 'VP' ? 
     'Focus on strategic impact, cross-functional leadership, and scaling operations' : 
     'Focus on building foundational skills and documenting technical achievements'}

3. **Industry Specificity:**
   - Use terminology from THEIR industry (${vaultData.professional_identity?.industry || 'their field'})
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

    console.log('[generate-gap-filling-questions] Calling Perplexity...');

    // Call Perplexity via centralized config
    const { response, metrics } = await callPerplexity(
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
        model: selectOptimalModel({
          taskType: 'analysis',
          complexity: 'medium',
          requiresReasoning: true,
          outputLength: 'long'
        }),
        temperature: 0.5,
        max_tokens: 4000,
        return_citations: false,
      },
      'generate-gap-filling-questions',
      user.id
    );

    // Log usage for cost tracking
    await logAIUsage(metrics);

    console.log('[generate-gap-filling-questions] Perplexity response received');

    // Clean and parse response
    const rawContent = cleanCitations(response.choices[0].message.content);
    
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

    console.log('✅ Generated gap-filling questions:', {
      batches: questionData.batches?.length || 0,
      totalQuestions: questionData.totalQuestions || 0,
      estimatedBoost: questionData.estimatedVaultStrengthBoost || 0,
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
        error: error.message,
        userMessage: 'We encountered an issue generating questions. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
