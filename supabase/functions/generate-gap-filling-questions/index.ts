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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface GapFillingRequest {
  vaultId: string;
  currentVaultData: {
    powerPhrases: any[];
    transferableSkills: any[];
    hiddenCompetencies: any[];
    softSkills: any[];
  };
  industryResearch: any;
  targetRoles: string[];
  targetIndustries: string[];
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'yes_no' | 'number' | 'text' | 'checkbox';
  category: string;
  gapType: string;
  impactScore: number; // 1-10, how much this boosts vault strength
  whyItMatters: string;
  options?: string[];
  placeholder?: string;
  validationRules?: {
    min?: number;
    max?: number;
    required?: boolean;
  };
}

interface QuestionBatch {
  batchId: string;
  title: string;
  description: string;
  questions: Question[];
  totalImpact: number;
  estimatedTime: string;
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

    const {
      vaultId,
      currentVaultData,
      industryResearch,
      targetRoles,
      targetIndustries,
    }: GapFillingRequest = await req.json();

    console.log('🎯 GENERATING GAP-FILLING QUESTIONS:', {
      vaultId,
      itemCounts: {
        powerPhrases: currentVaultData.powerPhrases?.length || 0,
        skills: currentVaultData.transferableSkills?.length || 0,
        competencies: currentVaultData.hiddenCompetencies?.length || 0,
        softSkills: currentVaultData.softSkills?.length || 0,
      },
      targetRoles,
      targetIndustries,
    });

    // Build gap analysis prompt
    const gapAnalysisPrompt = `You are an expert career analyst identifying gaps in an executive's career profile.

TARGET ROLES: ${targetRoles.join(', ')}
TARGET INDUSTRIES: ${targetIndustries.join(', ')}

INDUSTRY RESEARCH (WHAT'S EXPECTED):
${JSON.stringify(industryResearch, null, 2)}

CURRENT VAULT CONTENTS:
Power Phrases: ${currentVaultData.powerPhrases?.length || 0} items
${currentVaultData.powerPhrases?.slice(0, 5).map((p: any) => `- ${p.power_phrase || p.phrase}`).join('\n') || 'None'}

Transferable Skills: ${currentVaultData.transferableSkills?.length || 0} items
${currentVaultData.transferableSkills?.slice(0, 10).map((s: any) => `- ${s.stated_skill || s.skill}`).join('\n') || 'None'}

Hidden Competencies: ${currentVaultData.hiddenCompetencies?.length || 0} items
${currentVaultData.hiddenCompetencies?.slice(0, 5).map((c: any) => `- ${c.competency_area || c.area}`).join('\n') || 'None'}

Soft Skills: ${currentVaultData.softSkills?.length || 0} items
${currentVaultData.softSkills?.slice(0, 5).map((s: any) => `- ${s.skill_name || s.skill}`).join('\n') || 'None'}

TASK: Identify 3-5 CRITICAL GAPS and generate 10-15 targeted questions to fill them.

GAP TYPES TO LOOK FOR:
1. **Quantification Gaps**: Achievements mentioned but not quantified
2. **Leadership Scope Gaps**: No team size, budget, or P&L mentioned
3. **Industry Knowledge Gaps**: Missing certifications, compliance, or domain expertise expected in the industry
4. **Executive Presence Gaps**: No board experience, speaking engagements, or thought leadership
5. **Competitive Advantage Gaps**: Missing skills/experiences that separate top 10% from average

QUESTION GENERATION RULES:
- Each question must TARGET a specific gap
- Prioritize questions with HIGHEST IMPACT on vault completeness
- Use appropriate question types:
  * multiple_choice: For selecting from options (team size, budget ranges)
  * yes_no: For binary probes (board experience? speaking engagements?)
  * number: For specific quantities (How many direct reports?)
  * text: For open-ended details (Describe your leadership philosophy)
  * checkbox: For multi-select (Which technologies have you used?)
- Include "whyItMatters" explanation for each question
- Group into 2-3 batches by category

RETURN VALID JSON ONLY:
{
  "batches": [
    {
      "batchId": "batch_1",
      "title": "Leadership Scope Quantification",
      "description": "Let's quantify your leadership experience",
      "questions": [
        {
          "id": "q1",
          "text": "What was your largest team size managed?",
          "type": "multiple_choice",
          "category": "leadership_scope",
          "gapType": "quantification",
          "impactScore": 8,
          "whyItMatters": "Team size is a key indicator of leadership scope for VP-level roles. This helps position you accurately.",
          "options": ["1-5", "6-15", "16-30", "31-50", "51-100", "100+", "Not applicable"]
        },
        {
          "id": "q2",
          "text": "Have you managed a P&L (profit and loss)?",
          "type": "yes_no",
          "category": "leadership_scope",
          "gapType": "executive_responsibility",
          "impactScore": 9,
          "whyItMatters": "P&L responsibility is often expected at the VP level and demonstrates business ownership."
        }
      ],
      "totalImpact": 17,
      "estimatedTime": "2-3 minutes"
    }
  ],
  "totalQuestions": 12,
  "estimatedVaultStrengthBoost": 12,
  "criticalGapsIdentified": [
    "Leadership scope not quantified",
    "No board experience mentioned",
    "Missing PCI-DSS compliance (critical for FinTech)"
  ]
}

NO MARKDOWN. ONLY JSON.`;

    // Call AI to generate questions
    const aiResponse = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [{ role: 'user', content: gapAnalysisPrompt }],
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse JSON response
    let questionData;
    try {
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questionData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid JSON format');
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
