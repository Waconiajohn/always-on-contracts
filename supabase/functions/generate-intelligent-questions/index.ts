import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert career coach. Generate intelligent, targeted questions in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
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
