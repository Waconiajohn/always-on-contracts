import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, resumeData, industryResearch, targetRole, targetIndustry } = await req.json();
    console.log('[INTELLIGENT QUESTIONS] Generating questions for vault:', vaultId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
      } catch (e) {
        console.log('Could not extract user for cost tracking:', e);
      }
    }

    // Get existing vault data to identify gaps
    const { data: existingPhrases } = await supabase
      .from('vault_power_phrases')
      .select('power_phrase, category')
      .eq('vault_id', vaultId);

    const { data: existingSkills } = await supabase
      .from('vault_transferable_skills')
      .select('stated_skill')
      .eq('vault_id', vaultId);

    // Generate targeted questions using AI
    const prompt = `You are an expert career coach conducting an intelligent interview. Based on the resume and industry research, generate 15-20 targeted questions organized into 3-4 batches.

**Resume Summary**: ${resumeData.resumeText.substring(0, 500)}...
**Target Role**: ${targetRole}
**Target Industry**: ${targetIndustry}
**Industry Standards**: ${JSON.stringify(industryResearch).substring(0, 800)}

**Existing Vault Data**:
- Power Phrases: ${existingPhrases?.length || 0} items
- Skills: ${existingSkills?.length || 0} items

Generate questions that:
1. Fill gaps in their career vault compared to industry standards
2. Uncover hidden achievements and metrics
3. Explore leadership philosophy and soft skills
4. Discover transferable skills they haven't mentioned

Format as JSON array of batches:
[
  {
    "category": "Quantifiable Achievements",
    "description": "Let's uncover the metrics behind your accomplishments",
    "questions": [
      {
        "text": "What was the largest budget you managed?",
        "type": "text",
        "impact": 3
      }
    ],
    "totalImpact": 15
  }
]

Each question should have:
- text: Clear, specific question
- type: "text", "number", or "multiple_choice"
- impact: 1-5 (how much this helps their vault)
- options: (only for multiple_choice)`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: 'You are an expert career coach. Generate intelligent, targeted questions in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.7,
      },
      'generate-intelligent-questions',
      userId
    );

    await logAIUsage(metrics);

    const aiData = response;
    let questionBatches;
    
    try {
      const content = aiData.choices[0].message.content;
      const parsed = JSON.parse(content);
      questionBatches = parsed.batches || parsed.questionBatches || parsed;
    } catch (parseError) {
      console.error('[INTELLIGENT QUESTIONS] Failed to parse AI response, using fallback');
      // Fallback questions
      questionBatches = generateFallbackQuestions(targetRole);
    }

    console.log('[INTELLIGENT QUESTIONS] Generated', questionBatches.length, 'question batches');

    return new Response(
      JSON.stringify({
        success: true,
        questionBatches
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[INTELLIGENT QUESTIONS] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        questionBatches: generateFallbackQuestions('Professional')
      }),
      {
        status: 200, // Still return 200 with fallback
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateFallbackQuestions(targetRole: string) {
  return [
    {
      category: "Achievements & Metrics",
      description: "Let's quantify your impact",
      questions: [
        { text: "What was your largest budget or financial responsibility?", type: "text", impact: 4 },
        { text: "How many people did you manage or influence?", type: "number", impact: 4 },
        { text: "What percentage improvements did you achieve?", type: "text", impact: 5 }
      ],
      totalImpact: 13
    },
    {
      category: "Leadership & Influence",
      description: "Understanding your leadership approach",
      questions: [
        { text: "Describe a time you led through ambiguity or change", type: "text", impact: 4 },
        { text: "What's your approach to developing team members?", type: "text", impact: 3 }
      ],
      totalImpact: 7
    }
  ];
}
