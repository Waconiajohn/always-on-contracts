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
    const { vaultData, industryResearch, targetRoles } = requestBody;

    if (!vaultData) {
      throw new Error('vaultData is required');
    }

    // Build comprehensive gap analysis prompt
    const gapAnalysisPrompt = `
You are an expert career strategist analyzing a professional's career vault against industry standards.

## Current Vault Data:
${JSON.stringify(vaultData, null, 2)}

${industryResearch ? `## Industry Context:\n${JSON.stringify(industryResearch, null, 2)}` : ''}
${targetRoles ? `## Target Roles:\n${targetRoles.join(', ')}` : ''}

## Your Task:
Analyze the vault data and identify CRITICAL gaps that, if filled, would significantly strengthen this professional's profile.

Generate 5-15 highly targeted questions organized into logical batches. Each question should:
1. Address a SPECIFIC gap that executives/leaders typically have documented
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
      "batchTitle": "Strategic Leadership Impact",
      "batchDescription": "Questions about your transformational leadership achievements",
      "estimatedTime": "3-5 minutes",
      "impactExplanation": "These answers differentiate executive leaders from managers",
      "questions": [
        {
          "text": "Have you led a digital transformation initiative?",
          "type": "yes_no",
          "category": "strategic_leadership",
          "impactScore": 9,
          "validation": {
            "required": true
          }
        },
        {
          "text": "What was the largest team you've built from scratch?",
          "type": "multiple_choice",
          "category": "team_building",
          "impactScore": 8,
          "options": ["1-5 people", "6-15 people", "16-50 people", "50+ people", "I haven't built a team from scratch"],
          "validation": {
            "required": true
          }
        },
        {
          "text": "Which of the following domains have you worked in? (Select all that apply)",
          "type": "checkbox",
          "category": "domain_expertise",
          "impactScore": 8,
          "options": ["Banking/FinTech", "E-commerce", "Healthcare", "Cloud/SaaS products", "Industrial IoT"],
          "validation": {
            "required": false
          }
        },
        {
          "text": "Describe your most significant turnaround achievement",
          "type": "text",
          "category": "turnaround_leadership",
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
- Prioritize questions with impactScore 7-10 (game-changers for executive profiles)
- Mix question types for better user experience
- Keep batches to 3-5 questions each for psychological momentum
- NO generic questions - every question must tie to executive-level competencies

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
        max_tokens: 3000,
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
      const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questionData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', rawContent);
      throw new Error('AI returned invalid JSON format');
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
