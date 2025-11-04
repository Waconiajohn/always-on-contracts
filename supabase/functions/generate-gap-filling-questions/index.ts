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
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
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

    // Build comprehensive gap analysis prompt with ACTUAL resume content
    const gapAnalysisPrompt = `
You are an expert career strategist analyzing a professional's resume and career vault to generate targeted questions.

## RESUME CONTENT (Primary Source - Analyze This First):
${resumeText ? resumeText.substring(0, 8000) : 'No resume text available - use vault data instead'}

## Current Vault Data (Already Extracted):
${JSON.stringify(vaultData, null, 2)}

${industryResearch ? `## Industry Context:\n${JSON.stringify(industryResearch, null, 2)}` : ''}
${targetRoles ? `## Target Roles:\n${targetRoles.join(', ')}` : ''}

## Your Task:

STEP 1 - ANALYZE THE RESUME:
Read the resume carefully and determine:
- What is their ACTUAL job title(s) and role(s)? (e.g., "Drilling Engineer", "Software Architect", "Registered Nurse")
- What industry/field do they work in? (e.g., "Oil & Gas", "Healthcare", "Technology")
- What is their career level? (entry-level, mid-level, senior, leadership, executive)
- What are their core technical skills and domain expertise?
- What projects, achievements, or experiences do they mention?

STEP 2 - IDENTIFY GAPS:
Based on their ACTUAL role and industry (not a generic template), identify what's MISSING that would strengthen their profile:
- What certifications or qualifications are standard in their field but not mentioned?
- What types of projects or achievements might they have done but haven't documented?
- What technical skills or tools are common in their role but not listed?
- What leadership or team experiences might be relevant to their level?
- What industry-specific accomplishments would be valuable to document?

STEP 3 - GENERATE ROLE-SPECIFIC QUESTIONS:
Create 5-15 questions that are HIGHLY SPECIFIC to their actual job, industry, and career level.

CRITICAL RULES:
- Questions MUST match their actual job (if they're a drilling engineer, ask about drilling operations, NOT digital transformation)
- Use terminology and concepts from THEIR industry (e.g., oil & gas professionals: "wellbore", "completions", "BOP"; not "SaaS", "API", "CI/CD")
- Match sophistication to their career level (senior engineer vs. entry-level technician)
- Ask about gaps that are REALISTIC for someone in their specific role
- NO generic business/executive questions unless they're actually in executive roles

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
        model: PERPLEXITY_MODELS.DEFAULT,
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
